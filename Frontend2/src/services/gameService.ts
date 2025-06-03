import fetchRequest from '../utils/fetchRequest';
import getCurrentDate from '../utils/getCurrentDate';

import type { Game } from '../types/game';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

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