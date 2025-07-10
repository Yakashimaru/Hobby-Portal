import type { Game } from '../types/game';

export const checkForUpdate = (game: Game): boolean => {
    try {
        // Parse DD/MM/YYYY format
        const parseDate = (dateStr?: string) => {
            if (!dateStr) return null;
            const [day, month, year] = dateStr.split('/');
            return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        };
        
        const lastUpdated = parseDate(game.last_updated);
        const lastPlayed = parseDate(game.last_played);

        if (!lastUpdated || !lastPlayed) {
            return false;  // Missing dates
        }
        
        return lastUpdated > lastPlayed;
    } catch {
        return false;
    }
};