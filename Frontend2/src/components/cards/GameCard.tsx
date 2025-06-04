import React, { useState } from 'react';
import DisplayImage from '../DisplayImage';
import type { Game } from 'types/game';
import { Star, Calendar, RefreshCw, Check, Play } from 'lucide-react';
import { checkForUpdate } from '../../utils/checkForUpdate';
import Card from './Card';
import { formatUnderscoreName, removeSpecialCharacters } from '../../utils/formatting';
import { gameService } from '../../services/gameService';

interface GameCardProps {
    game: Game;
    onGameClick: (game: Game) => void;
    currentTab: string;
    statusColor: string;
    onSilentRefetch?: () => void; // Optional callback for refetching data
}

const GameCard = ({ game, onGameClick, currentTab, statusColor, onSilentRefetch }: GameCardProps) => {
    const [isHovered, setIsHovered] = useState(false);

    const imagePath = "../assets/images/visual_novel/";
    const formattedGameName = formatUnderscoreName(removeSpecialCharacters(game.game));
    
    const handleCardClick = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent event bubbling
        onGameClick(game);
    };
    
    return (
        <Card 
            onClick={handleCardClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="relative">
                <DisplayImage 
                    imageTitle={formattedGameName}
                    path={imagePath}
                    className="w-full h-34 object-contain group-hover:scale-105 transition-transform duration-200"
                    alt={game.game}
                />
                {/* Only show rating for games that have been rated (not Watchlist) */}
                {game.status !== 'Watchlist' && game.rating && (
                    <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-sm flex items-center">
                        <Star className="w-3 h-3 mr-1 fill-yellow-400 text-yellow-400" />
                        {game.rating}
                    </div>
                )}
                <div className="absolute top-2 left-2 flex items-center gap-1">
                    <div className={`px-2 py-1 rounded text-xs font-medium ${statusColor}`}>
                        {game.status.replace('-', ' ')}
                    </div>
                    {/* NEW! indicator - only show if last_updated > last_played */}
                    {checkForUpdate(game) && (
                        <div className="bg-red-500 text-white px-1 py-1 rounded text-xs font-bold animate-pulse">
                            NEW!
                        </div>
                    )}
                </div>

                {/* Floating buttons on hover - Option 4 */}
                {isHovered && game.status !== 'Dropped' && (
                    <div className="absolute bottom-2 right-2 flex gap-1">
                        <button 
                            className="bg-blue-500 hover:bg-blue-600 text-white w-8 h-8 rounded-full shadow-lg transition-all duration-200 flex items-center justify-center"
                            onClick={async (e) => {
                                e.stopPropagation();
                                try {
                                    await gameService.markAsPlayed(game);
                                    onSilentRefetch?.(); // Refresh data if callback provided
                                } catch (error) {
                                    console.error('Failed to mark game as played:', error);
                                }
                            }}
                            title="Mark as Played"
                        >
                            <Check className="w-4 h-4" />
                        </button>
                        <button 
                            className="bg-green-500 hover:bg-green-600 text-white w-8 h-8 rounded-full shadow-lg transition-all duration-200 flex items-center justify-center"
                            onClick={(e) => {
                                e.stopPropagation();
                                console.log('Check for updates:', game.game);
                            }}
                            title="Check for Updates"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>
            
            <div className="p-4 space-y-2">
                <div>
                    <h3 className="font-semibold text-base mb-1 line-clamp-2 h-7">{game.game}</h3>
                    <p className="text-gray-600 text-sm mb-2">{game.developer}</p>
                </div>
                
                <div className="text-xs text-gray-600 flex items-center space-x-4">
                    {/* Last Played */}
                    <div className="flex items-center">
                        <Play className="w-3 h-3 mr-1 text-blue-500" />
                        <span className="mr-1">Played:</span>
                        <span className="font-bold text-blue-600 mr-1">{game.last_played_ver || 'N/A'}</span>
                    </div>
                    
                    <div className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1 text-green-500" />
                        <span className="mr-1">Latest:</span>
                        <span className="font-bold text-green-600 mr-1">{game.last_updated_ver || 'N/A'}</span>
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default GameCard;