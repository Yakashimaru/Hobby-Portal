import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Bell, List, Grid3X3, ArrowRight } from 'lucide-react';
import DisplayImage from './DisplayImage';
import { formatUnderscoreName, removeSpecialCharacters } from '../utils/formatting';
import type { Game } from '../types/game';

interface UpdatesSectionProps {
    gamesWithUpdates: Game[];
    onGameClick?: (game: Game) => void;
}

const UpdatesSection: React.FC<UpdatesSectionProps> = ({ gamesWithUpdates, onGameClick }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [viewMode, setViewMode] = useState<'list' | 'circles'>('list');

    // Sort games by weighted score (days since update × rating modifier)
    const getSortedGamesByPriority = (games: Game[]) => {
        const today = new Date();
        
        return games
            .map(game => {
                // Parse last_updated date (DD/MM/YYYY format)
                const parseDate = (dateStr?: string) => {
                    if (!dateStr) return new Date();
                    const [day, month, year] = dateStr.split('/');
                    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                };
                
                const lastUpdated = parseDate(game.last_updated);
                const daysSinceUpdate = Math.floor((today.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24));
                
                // Weight by rating (higher rating = higher priority)
                const ratingMultiplier = (game.rating || 5) / 10;
                const score = daysSinceUpdate * ratingMultiplier;
                
                return { ...game, score, daysSinceUpdate };
            })
            .sort((a, b) => b.score - a.score); // Higher score = higher priority
    };

    // Calculate max visible games based on available space
    const getMaxVisibleGames = () => {
        if (typeof window === 'undefined') return 4;
        const width = window.innerWidth;
        // More generous calculation - fit as many as possible
        if (width >= 1800) return 10; // Ultra-wide
        if (width >= 1600) return 9;  // Wide
        if (width >= 1400) return 8;  // Large
        if (width >= 1200) return 7;  // Medium-large
        if (width >= 1024) return 6;  // Medium
        if (width >= 768) return 5;   // Small-medium
        return 4; // Small
    };

    const [maxVisibleGames, setMaxVisibleGames] = useState(getMaxVisibleGames());

    // Update max visible games on window resize
    useEffect(() => {
        const handleResize = () => setMaxVisibleGames(getMaxVisibleGames());
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const sortedGames = getSortedGamesByPriority(gamesWithUpdates);

    const getImageTitle = (game: Game) => {
        const formattedGameName = formatUnderscoreName(removeSpecialCharacters(game.game));
        if (game.fav_1) {
            const formattedFav = formatUnderscoreName(removeSpecialCharacters(game.fav_1));
            return `${formattedGameName}_${formattedFav}`;
        }
        return formattedGameName;
    };

    if (gamesWithUpdates.length === 0) {
        return null;
    }

    return (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg mb-6 shadow-sm">
            {/* Header - Clickable to expand/collapse */}
            <div 
                className="bg-gradient-to-r from-blue-100 to-indigo-100 px-4 py-3 rounded-t-lg flex items-center justify-between cursor-pointer hover:from-blue-200 hover:to-indigo-200 transition-all"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center">
                    <div className="relative">
                        <Bell className="w-5 h-5 mr-3 text-blue-700" />
                    </div>
                    <span className="font-bold text-blue-900">
                        {gamesWithUpdates.length} Updates Available
                    </span>
                </div>
                <div className="flex items-center space-x-3">
                    {/* View mode toggle */}
                    {isExpanded && (
                        <div className="flex bg-white/60 backdrop-blur-sm rounded-lg p-1 border border-blue-200">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setViewMode('list');
                                }}
                                className={`p-2 rounded-md transition-all ${
                                    viewMode === 'list' 
                                        ? 'bg-white shadow-sm text-blue-700' 
                                        : 'text-blue-600 hover:bg-white/50'
                                }`}
                            >
                                <List className="w-4 h-4" />
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setViewMode('circles');
                                }}
                                className={`p-2 rounded-md transition-all ${
                                    viewMode === 'circles' 
                                        ? 'bg-white shadow-sm text-blue-700' 
                                        : 'text-blue-600 hover:bg-white/50'
                                }`}
                            >
                                <Grid3X3 className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                    <div className="text-sm text-blue-700 font-medium px-3 py-2 bg-white/60 backdrop-blur-sm rounded-lg border border-blue-200 flex items-center">
                        {isExpanded ? (
                            <>Hide <ChevronUp className="w-4 h-4 ml-1" /></>
                        ) : (
                            <>View <ChevronDown className="w-4 h-4 ml-1" /></>
                        )}
                    </div>
                </div>
            </div>

            {/* Compact preview - adaptive */}
            <div className="px-4 py-3 bg-white/70 backdrop-blur-sm">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="font-medium text-gray-700">Updates:</span>
                    {sortedGames.slice(0, maxVisibleGames).map((game, index) => (
                        <div key={game.id} className="flex items-center">
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                                {game.game.split(' ').slice(0, 2).join(' ')}
                            </span>
                            {index < sortedGames.slice(0, maxVisibleGames).length - 1 && (
                                <span className="text-gray-300 mx-2">•</span>
                            )}
                        </div>
                    ))}
                    {gamesWithUpdates.length > maxVisibleGames && (
                        <span className="text-gray-500 bg-gray-100 px-2 py-1 rounded-full text-xs">
                            +{gamesWithUpdates.length - maxVisibleGames} more
                        </span>
                    )}
                </div>
            </div>

            {/* Expandable content */}
            {isExpanded && (
                <div className="border-t border-blue-200">
                    {viewMode === 'list' ? (
                        // Triple columns with responsive layout
                        <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 max-h-80 overflow-y-auto">
                            {sortedGames.map((game) => (
                                <div 
                                    key={game.id} 
                                    className="bg-white/80 backdrop-blur-sm rounded-lg p-3 border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
                                    onClick={() => onGameClick?.(game)}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                            <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 shadow-sm">
                                                <DisplayImage
                                                    imageTitle={getImageTitle(game)}
                                                    path="visual_novel/"
                                                    className="w-full h-full object-cover"
                                                    alt={game.game}
                                                    fallbackText={game.game.substring(0, 1)}
                                                />
                                            </div>
                                            <span className="font-medium text-gray-800 truncate">{game.game}</span>
                                        </div>
                                        <div className="text-sm flex-shrink-0">
                                            <span className="text-orange-600">{game.last_played_ver || 'New'}</span>
                                            <span className="mx-1 text-gray-400">→</span>
                                            <span className="text-green-600 font-bold">{game.last_updated_ver}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        // Enhanced circles view
                        <div className="p-4">
                            <div className="grid grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-4">
                                {gamesWithUpdates.map((game) => (
                                    <div 
                                        key={game.id} 
                                        className="text-center group cursor-pointer relative"
                                        onClick={() => onGameClick?.(game)}
                                    >
                                        <div className="relative">
                                            <div className="w-14 h-14 rounded-full overflow-hidden shadow-lg group-hover:scale-110 transition-transform border-2 border-white">
                                                <DisplayImage
                                                    imageTitle={getImageTitle(game)}
                                                    path="visual_novel/"
                                                    className="w-full h-full object-cover"
                                                    alt={game.game}
                                                    fallbackText={game.game.substring(0, 2)}
                                                />
                                            </div>
                                            <div className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs font-bold animate-pulse shadow-md">
                                                !
                                            </div>
                                        </div>
                                        <p className="text-xs font-medium mt-2 max-w-14 truncate text-gray-700" title={game.game}>
                                            {game.game.split(' ')[0]}
                                        </p>

                                        {/* Enhanced hover tooltip */}
                                        <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-20 scale-90 group-hover:scale-100">
                                            <div className="bg-gray-900 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap shadow-xl border border-gray-700">
                                                <div className="font-medium text-blue-300">{game.game}</div>
                                                <div className="text-xs mt-1 flex items-center justify-center space-x-1">
                                                    <span className="text-orange-300">{game.last_played_ver || 'N/A'}</span>
                                                    <ArrowRight className="w-3 h-3" />
                                                    <span className="text-green-300 font-bold">{game.last_updated_ver || 'N/A'}</span>
                                                </div>
                                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900"></div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default UpdatesSection;