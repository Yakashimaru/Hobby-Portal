import type { Game, GameCategory } from 'types/game';
import { RATING_CATEGORIES, getRatingCategory } from '../constants/gameConstants';

export const getActiveGames = (games: Game[]) => {
    return games.filter(game => 
        game.status === 'Ongoing' || game.status === 'Watchlist'
    );
};

export const getOngoingGames = (games: Game[]) => {
    return games.filter(game => game.status === 'Ongoing');
};

export const getWatchlistGames = (games: Game[]) => {
    return games.filter(game => game.status === 'Watchlist');
};

export const getCompletedGames = (games: Game[]) => {
    return games.filter(game => 
        game.status === 'Completed'
    ).sort((a, b) => b.rating - a.rating);
};

export const getDroppedGames = (games: Game[]) => {
    return games.filter(game => 
        game.status === 'Dropped' || game.status === 'Abandoned'
    ).sort((a, b) => b.rating - a.rating);
};

export const getArchiveGames = (games: Game[], archiveFilter: String) => {
    if (archiveFilter === 'completed') return getCompletedGames(games);
    if (archiveFilter === 'dropped') return getDroppedGames(games);
    return [...getCompletedGames(games), ...getDroppedGames(games)];
};

export const categorizeOngoingGamesByRating = (games: Game[]): GameCategory[] => {
    const ongoingGames = games.filter(game => game.status === 'Ongoing');

    // const categories: Record<string, GameCategory> = {
    //     tier_0: { range: '10 - 8.5', games: [], label: 'S+ Tier', key: 't0' },
    //     tier_1: { range: '8 - 7', games: [], label: 'S Tier', key: 't1' },
    //     tier_2: { range: '6.5 - 5', games: [], label: 'A Tier', key: 't2' },
    //     tier_3: { range: '< 5', games: [], label: 'B Tier', key: 't3' }
    // };

    // ongoingGames.forEach(game => {
    //     if (game.rating >= 8.5) {
    //         categories.tier_0.games.push(game);
    //     } else if (game.rating >= 7.0) {
    //         categories.tier_1.games.push(game);
    //     } else if (game.rating >= 5.0) {
    //         categories.tier_2.games.push(game);
    //     } else {
    //         categories.tier_3.games.push(game);
    //     }
    // });

    const categories: Record<string, GameCategory> = {};
    Object.values(RATING_CATEGORIES).forEach(config => {
        categories[config.key] = {
            range: config.range,
            games: [],
            label: config.label,
            key: config.key
        };
    });
    
    // Categorize using the helper function
    ongoingGames.forEach(game => {
        const category = getRatingCategory(game.rating);
        categories[category.key].games.push(game);
    });

    return Object.values(categories).filter(category => category.games.length > 0);
};