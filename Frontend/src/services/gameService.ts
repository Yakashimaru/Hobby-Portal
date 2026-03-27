import fetchRequest from '../utils/fetchRequest';
import getCurrentDate from '../utils/getCurrentDate';
import { removeSpecialCharacters } from '../utils/formatting';

import type { Game } from '../types/game';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const VITE_API_SCRAPPER_URL = import.meta.env.VITE_API_SCRAPPER_URL;
const VITE_API_LOGGER_URL = import.meta.env.VITE_API_LOGGER_URL;

export interface UpdateResult {
    gameId: number;
    gameName: string;
    success: boolean;
    error?: string;
    method?: string; // Track which scraping method works (for fallback)
    data?: {
        last_updated: string;
        version: string;
        game: string;
        developer: string;
    };
}

export interface UpdateAllProgress {
    total: number;
    completed: number;
    current: string;
    results: UpdateResult[];
}

export const updateService = {
    generateUrl(gameName: string): string {
        const baseUrl = import.meta.env.VITE_SITE_D;
        const formatted = gameName.toLowerCase().replace(/\s+/g, '-');
        
        return `${baseUrl}/${formatted}`;
    },

    generateUrlF(ID: string | undefined): string {
        if (!ID){
            return '';
        }

        const baseUrl = import.meta.env.VITE_SITE_F;
        
        return `${baseUrl}/${ID}`;
    },

    // Log successful scraping sources to JSON file
    async logSuccessfulSource(gameName: string, sourceName: string) {
        try {
            let logValue: string;
            
            if (sourceName === 'Primary Site') {
                logValue = 'primary';
            } else if (sourceName === 'src f') {
                logValue = 'src_f';
            } else if (sourceName === 'Failed') {
                logValue = 'Failed';
            } else {
                logValue = sourceName; // For future sources
            }

            const logData = {
                [gameName]: logValue,
                timestamp: new Date().toISOString()
            };

            // Send to backend to save to file
            await fetchRequest(`${VITE_API_LOGGER_URL}/logScrapper`, 'POST', logData);
        } catch (error) {
            console.warn('Failed to log successful source:', error);
            // Don't let logging failure break the main update process
        }
    },

    // Update function with fallback logic
    async updateGameWithFallbacks(game: Game): Promise<UpdateResult>{
        // Helper function to check if a URL is valid and not empty
        const isValidUrl = (url: string | null | undefined): boolean => {
            return !!(url && url.trim() && url.trim() !== '');
        };

        const allScrapingMethods = [
            {
                name: 'Src_f',
                url: this.generateUrlF(game.src_f),
                condition: isValidUrl(game.src_f)
            },
            {
                name: 'Primary',
                url: this.generateUrl(removeSpecialCharacters(game.game)),
                condition: true
            }
            // Add more if needed... {}
        ];

        // Filter to only include sources that have valid URLs
        const scrapingMethods = allScrapingMethods.filter(method => method.condition);

        console.log(`Will try ${scrapingMethods.length} sources for ${game.game}: ${scrapingMethods.map(m => m.name).join(', ')}`);

        // Try each method until one succeeds
        for (const method of scrapingMethods) {
            try {
                console.log(`Trying ${method.name} for ${game.game}...`);
                
                const scrapeResult = await fetchRequest(`${VITE_API_SCRAPPER_URL}/getVNDate`, 'POST', {
                    url: method.url,
                    limiter_low: 3,
                    limiter_high: 8
                });
                
                if (scrapeResult.last_updated) {
                    // Success! Update database & stop trying other sources
                    const updateData: any = {
                        developer: scrapeResult.developer,
                        last_updated: scrapeResult.last_updated,
                        last_updated_ver: scrapeResult.version
                    };
                    
                    if (scrapeResult.year) { // Build update data - conditionally include year if available
                        updateData.year = scrapeResult.year;
                    }
                    
                    // Success! Update database & stop trying other sources
                    await fetchRequest(`${API_BASE_URL}/updateVN/${game.id}`, 'PUT', updateData);
                    
                    console.log(`✅ ${method.name} succeeded for ${game.game} - stopping here`);
                    return { 
                        gameId: game.id, 
                        gameName: game.game, 
                        success: true, 
                        data: scrapeResult,
                        method: method.name 
                    };
                }

                console.log(`${method.name} returned no data for ${game.game} - trying next source`);
            } catch (error) {
                console.log(`${method.name} failed for ${game.game}:`, error);
                // Continue to next method
            }
        }
        
        // All methods failed
        return { 
            gameId: game.id, 
            gameName: game.game, 
            success: false, 
            error: 'All scraping methods failed' 
        };
    },

    async updateAllGames(games: Game[], onProgress: (progress: any) => void) {
        const results = [];
        const logData: Record<string, string> = {}; // Collect all results for batch logging

        for (let i = 0; i < games.length; i++) {
            const game = games[i];
            
            // Show progress
            onProgress({
                current: game.game,
                completed: i,
                total: games.length
            });
            
            const result = await this.updateGameWithFallbacks(game);
            results.push(result);

            // Collect for batch logging
            if (result.success && result.method) {
                if (result.method === 'Primary Site') {
                    logData[game.game] = 'primary';
                } else if (result.method === 'src f') {
                    logData[game.game] = 'src_f';
                } else {
                    logData[game.game] = result.method;
                }
            } else {
                logData[game.game] = 'Failed';
            }
            
            // Sleep between games (2 seconds)
            if (i < games.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }

        // Batch log all results at once (overwrites previous log)
        try {
            await fetchRequest(`${VITE_API_LOGGER_URL}/logScrapper`, 'POST', {
                batchData: logData,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.warn('Failed to log batch results:', error);
        }

        return results;
    }
};

export const gameService = {
    async markAsPlayed(game:Game){
        const current_date = getCurrentDate();

        const data = {
            last_played_ver: game.last_updated_ver,
            last_played: current_date,
        }
        
        const final_url = API_BASE_URL + "/updateVN/" + game.id;
        return await fetchRequest(final_url, 'PUT', data)
    },

    async updateSingleGame(game: Game): Promise<UpdateResult> {
        const result = await updateService.updateGameWithFallbacks(game);
        
        // Log single game result
        try {
            let logValue: string;
            
            if (result.success && result.method) {
                if (result.method === 'Primary Site') {
                    logValue = 'primary';
                } else if (result.method === 'src f') {
                    logValue = 'src_f';
                } else {
                    logValue = result.method;
                }
            } else {
                logValue = 'Failed';
            }

            await fetchRequest(`${VITE_API_LOGGER_URL}/logScrapper`, 'POST', {
                [game.game]: logValue,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.warn('Failed to log single game result:', error);
        }
        
        return result;
    }
}