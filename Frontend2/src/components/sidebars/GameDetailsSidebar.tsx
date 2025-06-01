import React from 'react';
import { Star, Heart, Calendar } from 'lucide-react';

import DisplayImage from '../DisplayImage';
import type { Game } from 'types/game';

import Sidebar from './Sidebar';

import { formatUnderscoreName, removeSpecialCharacters } from '../../utils/formatting';

interface GameDetailsSidebarProps {
    game: Game | null;
    isVisible: boolean;
    onClose: () => void;
    statusColor: string;
}

const GameDetailsSidebar: React.FC<GameDetailsSidebarProps> = ({ game, isVisible, onClose, statusColor }) => {  
    if (!game) return null;

    const favorites = [game.fav_1, game.fav_2, game.fav_3].filter(Boolean);

    const imagePath = "../assets/images/visual_novel/";
    const formattedGameName = formatUnderscoreName(removeSpecialCharacters(game.game));
    
     return (
        <Sidebar 
            isVisible={isVisible}
            onClose={onClose}
            title={game.game}
            subtitle={game.developer}
            year={game.year}
            rating={game.rating}
            status={game.status}
            statusColor={statusColor}
        >
            <div className="p-4 space-y-2">
                {/* Individual Ratings - Compact Pills */}
                {(game.story || game.renders || game.animations || game.scenes) && (
                    <div className="flex flex-wrap gap-1 justify-center">
                        {game.story && (
                            <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap">
                                Story: {game.story}
                            </div>
                        )}
                        {game.renders && (
                            <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap">
                                Renders: {game.renders}
                            </div>
                        )}
                        {game.animations && (
                            <div className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap">
                                Anim: {game.animations}
                            </div>
                        )}
                        {game.scenes && (
                            <div className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap">
                                Scenes: {game.scenes}
                            </div>
                        )}
                    </div>
                )}

                {/* Favorite Characters - Main Focus */}
                {favorites.length > 0 && (
                    <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center justify-center">
                            <Heart className="w-5 h-5 mr-2 text-red-500" />
                            Favorites
                        </h4>
                        <div className="space-y-4">
                            {favorites.map((favorite, index) => {
                                // Generate gradient colors for each favorite
                                const gradients = [
                                    'from-pink-300 to-purple-300',
                                    'from-blue-300 to-green-300',
                                    'from-yellow-300 to-orange-300'
                                ];
                                
                                return (
                                    <div key={index} className="text-center">
                                        <div className={`w-full h-40 bg-gradient-to-br ${gradients[index]} rounded-lg flex items-center justify-center mb-2 shadow-sm overflow-hidden`}>
                                            <DisplayImage 
                                                imageTitle={formattedGameName + '_' + formatUnderscoreName(removeSpecialCharacters(favorite || ''))}
                                                path={imagePath}
                                                className="w-full h-full object-cover"
                                                alt={favorite || ''}
                                                fallbackText={favorite}
                                            />
                                        </div>
                                        <p className="font-semibold text-gray-900 text-center">{favorite}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Version Tracking - Minimal */}
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <h4 className="font-medium text-gray-800 mb-2 flex items-center justify-center text-sm">
                        <Calendar className="w-4 h-4 mr-2 text-gray-600" />
                        Version Tracking
                    </h4>
                    <div className="space-y-2 text-xs">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Played:</span>
                            <span className="font-semibold text-blue-600">{game.last_played_ver || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Latest:</span>
                            <span className="font-semibold text-green-600">{game.last_updated_ver || 'N/A'}</span>
                        </div>
                    </div>
                </div>
            </div>
        </Sidebar>
    );
};

export default GameDetailsSidebar;