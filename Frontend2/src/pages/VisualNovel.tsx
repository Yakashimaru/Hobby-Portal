import React, { useState, useEffect } from 'react';
// import axios from 'axios';
import { Star, Calendar, Play, ChevronDown, ChevronUp } from 'lucide-react';

////////// Utils //////////
import {formatUnderscoreName, removeSpecialCharacters} from "../utils/formatting";

const VisualNovel = () => {
    
    const [collapsedSections, setCollapsedSections] = useState({});
    const [cardsPerRow, setCardsPerRow] = useState(4);    
    const [games, setGames] = useState<Game[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [apiUrl, setApiUrl] = useState('');
    const [selectedGame, setSelectedGame] = useState(null);

    type Game = {
        id: number;
        game: string;
        developer: string;
        rating: number;
        status: string;
        progress: number;
        last_played?: string;
        lastPlayed?: string;
        hoursPlayed?: number;
        completedRoutes?: number;
        fav1?: string;
        fav2?: string;
        fav3?: string;
        notes?: string;
        // Add any other properties your game objects may have
    };

    // Get game data from the API
    const fetchGames = async () => {
        setLoading(true);
        setError(null);

        try{
            const response = await fetch(apiUrl);
      
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Validate that data is an array
            if (!Array.isArray(data)) {
                throw new Error('API response is not an array');
            }
            
            setGames(data);
        } catch (err) {
            console.error('Failed to fetch games:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

     // Fetch games on component mount
    useEffect(() => {
        fetchGames();
    }, [apiUrl]);


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

    const ratingRangeColors = {
        'excellent': 'border-green-400 bg-green-50',
        'good': 'border-blue-400 bg-blue-50',
        'average': 'border-yellow-400 bg-yellow-50',
        'poor': 'border-red-400 bg-red-50'
    };

    const getRatingRangeColor = (range: keyof typeof ratingRangeColors): string => {
        return ratingRangeColors[range] || 'border-gray-400 bg-gray-50';
    };

    const categorizeGamesByRating = () => {
        const activeGames = games.filter(game=> 
            game.status !== 'Completed' && game.status !== 'Dropped' && game.status !== 'Abandoned'
        );
        const archiveGames = games.filter(game => 
            game.status === 'Completed' || game.status === 'Dropped' || game.status === 'Abandoned'
        );

        const categories = {
            excellent: { range: '8.0 - 10.0', games: [], label: 'Excellent', key: 'excellent' },
            good: { range: '5.0 - 7.9', games: [], label: 'Good', key: 'good' },
            average: { range: '3.0 - 4.9', games: [], label: 'Average', key: 'average' },
            poor: { range: '< 3.0', games: [], label: 'Poor', key: 'poor' }
        };

        games.forEach(game => {
            if (game.rating >= 8.0) {
            categories.excellent.games.push(game);
            } else if (game.rating >= 5.0) {
            categories.good.games.push(game);
            } else if (game.rating >= 3.0) {
            categories.average.games.push(game);
            } else {
            categories.poor.games.push(game);
            }
        });

        return Object.values(categories).filter(category => category.games.length > 0);
    };

    const toggleSection = (sectionKey) => {
        setCollapsedSections(prev => ({
            ...prev,
            [sectionKey]: !prev[sectionKey]
        }));
    };

    const GameImage = ({ gameTitle, className, alt }) => {
        const formattedGameTitle = formatUnderscoreName(removeSpecialCharacters(gameTitle));

        const jpgSrc = new URL(`../assets/visual_novel/${formattedGameTitle}.jpg`, import.meta.url).href;
        const pngSrc = new URL(`../assets/visual_novel/${formattedGameTitle}.png`, import.meta.url).href;

        const [currentSrc, setCurrentSrc] = useState(jpgSrc);
        const [hasError, setHasError] = useState(false);

        const handleError = () => {
            if (currentSrc === jpgSrc) {
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

    const GameCard = ({ game }) => (
        <div 
            className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden group cursor-pointer"
            onClick={() => setSelectedGame(game)}
        >
            <div className="relative">
                <GameImage 
                    gameTitle={game.game}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-200"
                    alt={game.game}
                />
                <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-sm flex items-center">
                    <Star className="w-3 h-3 mr-1 fill-yellow-400 text-yellow-400" />
                    {game.rating}
                </div>
                <div className={`absolute top-2 left-2 px-2 py-1 rounded text-xs font-medium ${getStatusColor(game.status)}`}>
                    {game.status.replace('-', ' ')}
                </div>
            </div>
            
            <div className="p-4">
                <h3 className="font-semibold text-base mb-1 line-clamp-2 h-12">{game.game}</h3>
                <p className="text-gray-600 text-sm mb-2">{game.developer}</p>
                
                {game.progress > 0 && game.progress < 100 && (
                    <div className="mb-2">
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                            <span>Progress</span>
                            <span>{game.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div 
                                className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                                style={{ width: `${game.progress}%` }}
                            ></div>
                        </div>
                    </div>
                )}
                
                <div className="flex items-center text-xs text-gray-500">
                    <Play className="w-3 h-3 mr-1" />
                    {game.last_played ? new Date(game.last_played).toLocaleDateString() : 'Not played'}
                </div>
            </div>
        </div>
    );

    const GameDetailsSidebar = ({ game, onClose }) => {
        const favorites = [game.fav1, game.fav2, game.fav3].filter(Boolean);
        
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
                            <img 
                                src={getImagePath(game.game)} 
                                alt={game.game}
                                className="w-full max-w-xs mx-auto rounded-lg shadow-md"
                                onError={(e) => {
                                    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjI0MCIgdmlld0JveD0iMCAwIDIwMCAyNDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjQwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik04NS4zMzMzIDgwSDExNC42NjdWMTEySDE1LjMzMzNWODBaIiBmaWxsPSIjOUNBM0FGIi8+CjxwYXRoIGQ9Ik02Ni42NjY3IDE2MEgxMzMuMzMzVjE3MC42NjdINjYuNjY2N1YxNjBaIiBmaWxsPSIjOUNBM0FGIi8+Cjwvc3ZnPgo=';
                                }}
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

                            {/* Progress Bar */}
                            {game.progress > 0 && (
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-medium text-gray-700">Progress</span>
                                        <span className="text-sm text-gray-600">{game.progress}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div 
                                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${game.progress}%` }}
                                        ></div>
                                    </div>
                                </div>
                            )}

                            {/* Additional Info */}
                            <div className="space-y-3">
                                {game.lastPlayed && (
                                    <div className="flex items-center text-gray-600">
                                        <Calendar className="w-4 h-4 mr-3" />
                                        <span className="text-sm">Last played: {new Date(game.lastPlayed).toLocaleDateString()}</span>
                                    </div>
                                )}
                                
                                {game.hoursPlayed && (
                                    <div className="flex items-center text-gray-600">
                                        <Clock className="w-4 h-4 mr-3" />
                                        <span className="text-sm">Hours played: {game.hoursPlayed}</span>
                                    </div>
                                )}

                                {game.completedRoutes && (
                                    <div className="flex items-center text-gray-600">
                                        <Trophy className="w-4 h-4 mr-3" />
                                        <span className="text-sm">Completed routes: {game.completedRoutes}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Favorite Characters */}
                        {favorites.length > 0 && (
                            <div>
                                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                    <User className="w-5 h-5 mr-2" />
                                    Favorite Characters
                                </h4>
                                <div className="space-y-3">
                                    {favorites.map((favorite, index) => (
                                        <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                                            <img 
                                                src={getFavoriteImagePath(game.game, favorite)}
                                                alt={favorite}
                                                className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                                                onError={(e) => {
                                                    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjQiIGN5PSIyNCIgcj0iMjQiIGZpbGw9IiNGM0Y0RjYiLz4KPHA+PC9wPgo8Y2lyY2xlIGN4PSIyNCIgY3k9IjIwIiByPSI2IiBmaWxsPSIjOUNBM0FGIi8+CjxwYXRoIGQ9Ik0xMiAzNkMxMiAzMC40NzcyIDE2LjQ3NzIgMjYgMjIgMjZIMjZDMzEuNTIyOCAyNiAzNiAzMC40NzcyIDM2IDM2VjQwSDEyVjM2WiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K';
                                                }}
                                            />
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

    const categories = categorizeGamesByRating();

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">Visual Novel Collection</h1>
                </div>

                <div className="space-y-8">
                    {categories.map((category, index) => {
                        const isCollapsed = collapsedSections[category.key];
                        const gridCols = {
                            3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
                            4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
                            5: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5',
                            6: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6'
                        };

                        return (
                            <div key={category.key} className={`border-2 rounded-lg p-6 ${getRatingRangeColor(category.key)}`}>
                                <div 
                                    className="flex items-center justify-between mb-6 cursor-pointer"
                                    onClick={() => toggleSection(category.key)}
                                >
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                                            {category.label}
                                            <span className="ml-3 text-lg font-normal text-gray-600">
                                                ({category.range})
                                            </span>
                                            <span className="ml-2 bg-white bg-opacity-70 text-gray-700 px-2 py-1 rounded-full text-sm font-medium">
                                                {category.games.length} games
                                            </span>
                                        </h2>
                                    </div>
                                    <button className="p-2 hover:bg-white hover:bg-opacity-50 rounded-full transition-colors">
                                        {isCollapsed ? (
                                            <ChevronDown className="w-6 h-6 text-gray-600" />
                                        ) : (
                                            <ChevronUp className="w-6 h-6 text-gray-600" />
                                        )}
                                    </button>
                                </div>

                                {!isCollapsed && (
                                    <div className={`grid ${gridCols[cardsPerRow]} gap-6`}>
                                        {category.games.map(game => (
                                            <GameCard key={game.id} game={game} />
                                        ))}
                                    </div>
                                )}

                                {isCollapsed && (
                                    <p className="text-gray-600 text-center py-4">
                                        Click to expand {category.games.length} {category.games.length === 1 ? 'game' : 'games'}
                                    </p>
                                )}
                            </div>
                        );
                    })}
                </div>

                {categories.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-gray-500 text-lg">No games found. Add some games to your collection!</p>
                    </div>
                )}
            </div>

            {/* Game Details Sidebar */}
            {selectedGame && (
                <GameDetailsSidebar 
                    game={selectedGame} 
                    onClose={() => setSelectedGame(null)} 
                />
            )}
        </div>
    );
};

export default VisualNovel;