import React from 'react';
import { Star, Calendar, RefreshCw, X } from 'lucide-react';

////////// Utils //////////
import { formatUnderscoreName, removeSpecialCharacters } from "../utils/formatting";

import type { Game } from 'types/game';

interface GameDetailsSidebarProps {
    game: Game;
    onClose: () => void;
}

const GameImage = ({ gameTitle, className, alt }: { gameTitle: string; className: string; alt: string }) => {
    const [currentSrc, setCurrentSrc] = React.useState(() => {
        const formattedGameTitle = formatUnderscoreName(removeSpecialCharacters(gameTitle));
        return new URL(`../assets/images/visual_novel/${formattedGameTitle}.jpg`, import.meta.url).href;
    });
    const [hasError, setHasError] = React.useState(false);

    const handleError = () => {
        if (currentSrc.includes('.jpg')) {
            const formattedGameTitle = formatUnderscoreName(removeSpecialCharacters(gameTitle));
            const pngSrc = new URL(`../assets/images/visual_novel/${formattedGameTitle}.png`, import.meta.url).href;
            setCurrentSrc(pngSrc);
        } else {
            setHasError(true);
        }
    };

    if (hasError) {
        return (
            <div className={`${className} bg-gray-200 flex items-center justify-center`}>
                <span className="text-gray-500 text-sm">No Image</span>
            </div>
        );
    }

    return (
        <img 
            src={currentSrc}
            alt={alt}
            className={className}
            onError={handleError}
        />
    );
};

const GameDetailsSidebar: React.FC<GameDetailsSidebarProps> = ({ game, onClose }) => {
    const statusColors = {
        'Completed': 'bg-green-100 text-green-800',
        'Ongoing': 'bg-blue-100 text-blue-800',
        'Soon': 'bg-yellow-100 text-yellow-800',
        'Abandoned': 'bg-gray-100 text-gray-800',
        'Dropped': 'bg-red-100 text-red-800'
    } as const;

    const getStatusColor = (status: keyof typeof statusColors): string => {
        return statusColors[status] || 'bg-gray-100 text-gray-800';
    };

    const favorites = [game.fav_1, game.fav_2, game.fav_3].filter(Boolean);
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end">
            <div className="bg-white w-full max-w-md h-full overflow-y-auto shadow-2xl">
                <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-900">Game Details</h2>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="p-6 space-y-6">
                    {/* Game Image */}
                    <div className="text-center">
                        <GameImage 
                            gameTitle={game.game}
                            className="w-full max-w-xs mx-auto rounded-lg shadow-md"
                            alt={game.game}
                        />
                    </div>

                    {/* Basic Info */}
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">{game.game}</h3>
                            <p className="text-gray-600 text-lg">{game.developer}</p>
                        </div>

                        {/* Rating and Status */}
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center bg-gray-100 px-3 py-2 rounded-lg">
                                <Star className="w-4 h-4 mr-2 fill-yellow-400 text-yellow-400" />
                                <span className="font-semibold">{game.rating}</span>
                            </div>
                            <div className={`px-3 py-2 rounded-lg text-sm font-medium ${getStatusColor(game.status)}`}>
                                {game.status.replace('-', ' ')}
                            </div>
                        </div>

                        {/* Version Info */}
                        <div className="space-y-3">
                            {game.last_played && (
                                <div className="flex items-center text-gray-600">
                                    <Calendar className="w-4 h-4 mr-3" />
                                    <span className="text-sm">Last played: {game.last_played} ({game.last_played_ver})</span>
                                </div>
                            )}
                            
                            {game.last_updated && (
                                <div className="flex items-center text-gray-600">
                                    <RefreshCw className="w-4 h-4 mr-3" />
                                    <span className="text-sm">Last updated: {game.last_updated} ({game.last_updated_ver})</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Favorite Characters */}
                    {favorites.length > 0 && (
                        <div>
                            <h4 className="text-lg font-semibold text-gray-900 mb-4">Favorite Characters</h4>
                            <div className="space-y-2">
                                {favorites.map((favorite, index) => (
                                    <div key={index} className="p-3 bg-gray-50 rounded-lg">
                                        <span className="font-medium text-gray-900">{favorite}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Notes section if available */}
                    {game.notes && (
                        <div>
                            <h4 className="text-lg font-semibold text-gray-900 mb-3">Notes</h4>
                            <div className="bg-gray-50 rounded-lg p-4">
                                <p className="text-gray-700 text-sm leading-relaxed">{game.notes}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GameDetailsSidebar;