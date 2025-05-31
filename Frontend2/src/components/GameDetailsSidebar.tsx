import React from 'react';
import { Star, Calendar, RefreshCw, X } from 'lucide-react';

import GameImage from './GameImage';
import type { Game } from 'types/game';

import { useClickOutside } from '../hooks/useClickOutside';

interface GameDetailsSidebarProps {
    game: Game | null;
    isVisible: boolean;
    onClose: () => void;
    statusColor: string;
}

const GameDetailsSidebar: React.FC<GameDetailsSidebarProps> = ({ game, isVisible, onClose, statusColor }) => {  
    const sidebarRef = useClickOutside(() => {
        if (isVisible) onClose();
    });
    
    if (!game) return null;

    const favorites = [game.fav_1, game.fav_2, game.fav_3].filter(Boolean);
    
     return (
        <div 
            ref={sidebarRef}
            className={`fixed top-16 right-0 h-[calc(100vh-4rem)] w-80 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-40 overflow-y-auto ${
                isVisible ? 'translate-x-0' : 'translate-x-full'
            }`}
        >
            <div className="bg-white border-b p-4 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">Game Details</h2>
                <button 
                    onClick={onClose}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>
            
            <div className="transition-opacity duration-200">
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
                            {game.rating && (
                                <div className="flex items-center bg-gray-100 px-3 py-2 rounded-lg">
                                    <Star className="w-4 h-4 mr-2 fill-yellow-400 text-yellow-400" />
                                    <span className="font-semibold">{game.rating}</span>
                                </div>
                            )}
                            <div className={`px-3 py-2 rounded-lg text-sm font-medium ${statusColor}`}>
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

                    {/* Game Metrics (if available) */}
                    {(game.story || game.renders || game.animations || game.scenes) && (
                        <div>
                            <h4 className="text-lg font-semibold text-gray-900 mb-4">Game Ratings</h4>
                            <div className="grid grid-cols-2 gap-3">
                                {game.story && (
                                    <div className="p-3 bg-gray-50 rounded-lg">
                                        <div className="text-sm text-gray-600">Story</div>
                                        <div className="font-semibold">{game.story}/10</div>
                                    </div>
                                )}
                                {game.renders && (
                                    <div className="p-3 bg-gray-50 rounded-lg">
                                        <div className="text-sm text-gray-600">Renders</div>
                                        <div className="font-semibold">{game.renders}/10</div>
                                    </div>
                                )}
                                {game.animations && (
                                    <div className="p-3 bg-gray-50 rounded-lg">
                                        <div className="text-sm text-gray-600">Animations</div>
                                        <div className="font-semibold">{game.animations}/10</div>
                                    </div>
                                )}
                                {game.scenes && (
                                    <div className="p-3 bg-gray-50 rounded-lg">
                                        <div className="text-sm text-gray-600">Scenes</div>
                                        <div className="font-semibold">{game.scenes}/10</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Additional Info */}
                    {game.year && (
                        <div>
                            <h4 className="text-lg font-semibold text-gray-900 mb-3">Additional Info</h4>
                            <div className="bg-gray-50 rounded-lg p-4">
                                <div className="text-sm text-gray-600">Release Year</div>
                                <div className="font-medium">{game.year}</div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GameDetailsSidebar;