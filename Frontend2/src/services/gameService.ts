import fetchRequest from '../utils/fetchRequest';
import getCurrentDate from '../utils/getCurrentDate';
import { removeSpecialCharacters } from '../utils/formatting';

import type { Game } from '../types/game';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const VITE_API_SCRAPPER_URL = import.meta.env.VITE_API_SCRAPPER_URL;

export interface UpdateResult {
    gameId: number;
    gameName: string;
    success: boolean;
    error?: string;
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

    async updateAllGames(games: Game[], onProgress: (progress: any) => void) {
        const results = [];

        for (let i = 0; i < games.length; i++) {
            const game = games[i];
            
            // Show progress
            onProgress({
                current: game.game,
                completed: i,
                total: games.length
            });
            
            try {
                // 1. Scrape the game
                const scrapeResult = await fetchRequest(`${VITE_API_SCRAPPER_URL}/getVNDate`, 'POST', {
                    url: this.generateUrl(removeSpecialCharacters(game.game)),
                    limiter_low: 3,
                    limiter_high: 8
                });
                
                // 2. Update database if successful
                if (scrapeResult.last_updated) {
                    await fetchRequest(`${API_BASE_URL}/updateVN/${game.id}`, 'PUT', {
                        developer: scrapeResult.developer,
                        last_updated: scrapeResult.last_updated,
                        last_updated_ver: scrapeResult.version
                    });
                    
                    results.push({ game: game.game, success: true });
                } else {
                    results.push({ game: game.game, success: false, error: 'No data' });
                }
            
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                results.push({ 
                    game: game.game, 
                    success: false, 
                    error: errorMessage
                });
            }
            
            // Sleep between games (2 seconds)
            if (i < games.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            }
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
    }
}