export interface Game {
    id: number;
    game: string;
    developer: string;
    rating: number;
    status: 'Ongoing' | 'Completed' | 'Watchlist' | 'Dropped' | 'Abandoned';
    year?: number;
    
    // Version tracking
    last_played?: string;
    last_updated?: string;
    last_played_ver?: string;
    last_updated_ver?: string;
    
    // Game ratings/scores
    story?: number;
    renders?: number;
    animations?: number;
    scenes?: number;
    
    // User preferences
    fav_1?: string;
    fav_2?: string;
    fav_3?: string;
    
    // Additional metadata
    genre_1?: string;
    genre_2?: string;
    src_f?: string;
}

export interface GameCategory {
    range: string;
    games: Game[];
    label: string;
    key: string;
}