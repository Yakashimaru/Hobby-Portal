// Rating categories configuration
export const RATING_CATEGORIES = {
    tier_ss: {
        key: 'tier_ss',
        label: 'S+',
        range: '10 - 8.5',
        minRating: 8.5,
        color: 'border-purple-400 bg-purple-50'
    },
    tier_s: {
        key: 'tier_s', 
        label: 'S',
        range: '8.4 - 7',
        minRating: 7,
        color: 'border-green-400 bg-green-50'
    },
    tier_a: {
        key: 'tier_a',
        label: 'A', 
        range: '6.9 - 6',
        minRating: 6,
        color: 'border-blue-400 bg-blue-50'
    },
    tier_b: {
        key: 'tier_b',
        label: 'B',
        range: '5.9 - 5', 
        minRating: 5,
        color: 'border-yellow-400 bg-yellow-50'
    },
    tier_c: {
        key: 'tier_c',
        label: 'C',
        range: '< 5',
        minRating: 0,
        color: 'border-red-400 bg-red-50'
    }
} as const;

// Status configuration
export const GAME_STATUSES = {
    'Completed': {
        color: 'bg-green-100 text-green-800',
        label: 'Completed'
    },
    'Ongoing': {
        color: 'bg-blue-100 text-blue-800', 
        label: 'Ongoing'
    },
    'Watchlist': {
        color: 'bg-yellow-100 text-yellow-800',
        label: 'Watchlist'
    },
    'Abandoned': {
        color: 'bg-gray-100 text-gray-800',
        label: 'Abandoned'
    },
    'Dropped': {
        color: 'bg-red-100 text-red-800',
        label: 'Dropped'
    }
} as const;

// Helper functions to use the constants
export const getRatingCategory = (rating: number) => {
    const categories = Object.values(RATING_CATEGORIES);
    
    // Find the appropriate category based on rating
    for (const category of categories) {
        if (rating >= category.minRating) {
            return category;
        }
    }
    
    // Fallback to lowest tier
    return RATING_CATEGORIES.tier_c;
};

export const getStatusColor = (status: string) => {
    return GAME_STATUSES[status as keyof typeof GAME_STATUSES]?.color || 'bg-gray-100 text-gray-800';
};

// Extract just the colors for easy mapping
export const ratingRangeColors = Object.fromEntries(
    Object.entries(RATING_CATEGORIES).map(([key, config]) => [key, config.color])
);

// Extract just the labels
export const ratingLabels = Object.fromEntries(
    Object.entries(RATING_CATEGORIES).map(([key, config]) => [key, config.label])
);