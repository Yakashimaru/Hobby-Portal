import React, { useState, useMemo, useCallback } from 'react';
import { Play, ChevronDown, ChevronUp, Check, RefreshCw, Gamepad2, Archive, X, Eye } from 'lucide-react';

////////// Types //////////
import type { Game } from 'types/game';

////////// Hooks //////////
import { getGameData } from '../hooks/getGameData';

////////// Constants //////////
import { ratingRangeColors, getStatusColor } from '../constants/gameConstants';

////////// Utils //////////
import { 
    getActiveGames, 
    getCompletedGames, 
    getDroppedGames, 
    getOngoingGames, 
    getWatchlistGames,
    getArchiveGames,
    categorizeOngoingGamesByRating 
} from '../utils/gameFilters';

////////// Components //////////
import GameDetailsSidebar from "../components/sidebars/GameDetailsSidebar";
import GameCard from '../components/cards/GameCard';

// Types for better type safety
type ArchiveFilter = 'all' | 'completed' | 'dropped';
type ActiveFilter = 'all' | 'ongoing' | 'watchlist';
type CurrentTab = 'active' | 'archive';
type CardsPerRow = 3 | 4 | 5 | 6;
type CollapsedSections = Record<string, boolean>;

const VisualNovel = () => {
    const [archiveFilter, setArchiveFilter] = useState<ArchiveFilter>('all');
    const [activeFilter, setActiveFilter] = useState<ActiveFilter>('all');
    const [collapsedSections, setCollapsedSections] = useState<CollapsedSections>({}); 
    const [cardsPerRow, setCardsPerRow] = useState<CardsPerRow>(6);
    const [currentTab, setCurrentTab] = useState<CurrentTab>('active');
    const [selectedGame, setSelectedGame] = useState<Game | null>(null);

    const { games, loading, error, refetch } = getGameData(`${import.meta.env.VITE_API_BASE_URL}/getVisualNovel`)

    // Memoized computed values for better performance
    const computedData = useMemo(() => {
        if (!games.length) {
            return {
                activeGames: [],
                ongoingGames: [],
                watchlistGames: [],
                completedGames: [],
                droppedGames: [],
                categorizedOngoing: []
            };
        }

        const activeGames = getActiveGames(games);
        const ongoingGames = getOngoingGames(games);
        const watchlistGames = getWatchlistGames(games);
        const completedGames = getCompletedGames(games);
        const droppedGames = getDroppedGames(games);
        const categorizedOngoing = categorizeOngoingGamesByRating(games);

        return {
            activeGames,
            ongoingGames,
            watchlistGames,
            completedGames,
            droppedGames,
            categorizedOngoing
        };
    }, [games]);

    const archiveGames = useMemo(() => 
        getArchiveGames(games, archiveFilter), 
        [games, archiveFilter]
    );

    const handleGameClick = useCallback((game: Game) => {
        setSelectedGame(game);
    }, []);

    const handleCloseSidebar = useCallback(() => {
        setSelectedGame(null);
    }, []);

    const getRatingRangeColor = (range: string): string => {
        return ratingRangeColors[range] || 'border-gray-400 bg-gray-50';
    };
    
    const toggleSection = (sectionKey: string) => {
        setCollapsedSections(prev => ({
            ...prev,
            [sectionKey]: !prev[sectionKey]
        }));
    };

    const gridCols: Record<CardsPerRow, string> = {
        3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
        4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
        5: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5',
        6: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6'
    };

    const isSidebarVisible = !!selectedGame;

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Loading games...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-600 mb-4">Error loading games: {error}</p>
                    <button 
                        onClick={refetch}
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    const { activeGames, ongoingGames, watchlistGames, completedGames, droppedGames, categorizedOngoing } = computedData;

    return (
        <>
            <div className={`min-h-screen bg-gray-50 p-6 transition-all duration-300 ${
                isSidebarVisible ? 'pr-80' : ''
            }`}>                
                <div className="w-full max-w-none px-4">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-6">Visual Novel Collection</h1>
                        
                        {/* Main Tabs */}
                        <div className="flex space-x-4 mb-6">
                            <button
                                onClick={() => setCurrentTab('active')}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center ${
                                    currentTab === 'active' 
                                        ? 'bg-blue-500 text-white' 
                                        : 'bg-white text-gray-700 hover:bg-gray-100'
                                }`}
                            >
                                <Gamepad2 className="w-4 h-4 mr-2" />
                                Active ({activeGames.length})
                            </button>
                            <button
                                onClick={() => setCurrentTab('archive')}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center ${
                                    currentTab === 'archive' 
                                        ? 'bg-blue-500 text-white' 
                                        : 'bg-white text-gray-700 hover:bg-gray-100'
                                }`}
                            >
                                <Archive className="w-4 h-4 mr-2" />
                                Archive ({completedGames.length + droppedGames.length})
                            </button>
                        </div>
                    </div>

                    {/* Active Games Tab */}
                    {currentTab === 'active' && (
                        <div>
                            {/* Active Filter */}
                            <div className="flex items-center space-x-4 mb-6">
                                <span className="text-sm text-gray-600 font-medium">Show:</span>
                                <button
                                    onClick={() => setActiveFilter('all')}
                                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                                        activeFilter === 'all' 
                                            ? 'bg-gray-700 text-white' 
                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                                >
                                    All
                                </button>
                                <button
                                    onClick={() => setActiveFilter('ongoing')}
                                    className={`px-3 py-1 rounded-full text-sm transition-colors flex items-center ${
                                        activeFilter === 'ongoing' 
                                            ? 'bg-blue-600 text-white' 
                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                                >
                                    <Play className="w-3 h-3 mr-1" />
                                    Ongoing ({ongoingGames.length})
                                </button>
                                <button
                                    onClick={() => setActiveFilter('watchlist')}
                                    className={`px-3 py-1 rounded-full text-sm transition-colors flex items-center ${
                                        activeFilter === 'watchlist' 
                                            ? 'bg-yellow-600 text-white' 
                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                                >
                                    <Eye className="w-3 h-3 mr-1" />
                                    Watchlist ({watchlistGames.length})
                                </button>
                            </div>

                            {/* Active Content */}
                            <div className="space-y-8">
                                {/* Show based on filter */}
                                {activeFilter === 'all' && (
                                    <>
                                        {/* Rating-based categories for Ongoing games */}
                                        {categorizedOngoing.map((category) => {
                                            const isCollapsed = collapsedSections[category.key];
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
                                                                <GameCard 
                                                                    key={game.id} 
                                                                    game={game}
                                                                    statusColor={getStatusColor(game.status)}
                                                                    onGameClick={handleGameClick}
                                                                    currentTab={currentTab}
                                                                />
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

                                        {/* Watchlist section at the bottom */}
                                        {watchlistGames.length > 0 && (
                                            <div className="border-2 rounded-lg p-6 border-yellow-400 bg-yellow-50">
                                                <div 
                                                    className="flex items-center justify-between mb-6 cursor-pointer"
                                                    onClick={() => toggleSection('watchlist')}
                                                >
                                                    <div>
                                                        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                                                            <Eye className="w-6 h-6 mr-2 text-yellow-600" />
                                                            Watchlist
                                                            <span className="ml-2 bg-white bg-opacity-70 text-gray-700 px-2 py-1 rounded-full text-sm font-medium">
                                                                {watchlistGames.length} games
                                                            </span>
                                                        </h2>
                                                    </div>
                                                    <button className="p-2 hover:bg-white hover:bg-opacity-50 rounded-full transition-colors">
                                                        {collapsedSections.watchlist ? (
                                                            <ChevronDown className="w-6 h-6 text-gray-600" />
                                                        ) : (
                                                            <ChevronUp className="w-6 h-6 text-gray-600" />
                                                        )}
                                                    </button>
                                                </div>

                                                {!collapsedSections.watchlist && (
                                                    <div className={`grid ${gridCols[cardsPerRow]} gap-6`}>
                                                        {watchlistGames.map(game => (
                                                            <GameCard 
                                                                key={game.id} 
                                                                game={game}
                                                                statusColor={getStatusColor(game.status)}
                                                                onGameClick={handleGameClick}
                                                                currentTab={currentTab}
                                                            />
                                                        ))}
                                                    </div>
                                                )}

                                                {collapsedSections.watchlist && (
                                                    <p className="text-gray-600 text-center py-4">
                                                        Click to expand {watchlistGames.length} {watchlistGames.length === 1 ? 'game' : 'games'}
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </>
                                )}

                                {/* Filtered views for ongoing only */}
                                {activeFilter === 'ongoing' && categorizedOngoing.length > 0 && (
                                    <>
                                        {categorizedOngoing.map((category) => {
                                            const isCollapsed = collapsedSections[category.key];
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
                                                                <GameCard 
                                                                    key={game.id} 
                                                                    game={game}
                                                                    statusColor={getStatusColor(game.status)}
                                                                    onGameClick={handleGameClick}
                                                                    currentTab={currentTab}
                                                                />
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </>
                                )}

                                {/* Watchlist only view */}
                                {activeFilter === 'watchlist' && watchlistGames.length > 0 && (
                                    <div className={`grid ${gridCols[cardsPerRow]} gap-6`}>
                                        {watchlistGames.map(game => (
                                            <GameCard 
                                                key={game.id} 
                                                game={game}
                                                statusColor={getStatusColor(game.status)}
                                                onGameClick={handleGameClick}
                                                currentTab={currentTab}
                                            />
                                        ))}
                                    </div>
                                )}

                                {/* Empty states */}
                                {activeFilter === 'ongoing' && categorizedOngoing.length === 0 && (
                                    <div className="text-center py-12">
                                        <Play className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                                        <p className="text-gray-500 text-lg">No ongoing games found.</p>
                                    </div>
                                )}

                                {activeFilter === 'watchlist' && watchlistGames.length === 0 && (
                                    <div className="text-center py-12">
                                        <Eye className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                                        <p className="text-gray-500 text-lg">No watchlist games found.</p>
                                    </div>
                                )}

                                {activeFilter === 'all' && categorizedOngoing.length === 0 && watchlistGames.length === 0 && (
                                    <div className="text-center py-12">
                                        <Gamepad2 className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                                        <p className="text-gray-500 text-lg">No active games found.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Archive Tab */}
                    {currentTab === 'archive' && (
                        <div>
                            {/* Archive Filter */}
                            <div className="flex items-center space-x-4 mb-6">
                                <span className="text-sm text-gray-600 font-medium">Show:</span>
                                <button
                                    onClick={() => setArchiveFilter('all')}
                                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                                        archiveFilter === 'all' 
                                            ? 'bg-gray-700 text-white' 
                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                                >
                                    All
                                </button>
                                <button
                                    onClick={() => setArchiveFilter('completed')}
                                    className={`px-3 py-1 rounded-full text-sm transition-colors flex items-center ${
                                        archiveFilter === 'completed' 
                                            ? 'bg-green-600 text-white' 
                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                                >
                                    <Check className="w-3 h-3 mr-1" />
                                    Completed ({completedGames.length})
                                </button>
                                <button
                                    onClick={() => setArchiveFilter('dropped')}
                                    className={`px-3 py-1 rounded-full text-sm transition-colors flex items-center ${
                                        archiveFilter === 'dropped' 
                                            ? 'bg-red-600 text-white' 
                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                                >
                                    <X className="w-3 h-3 mr-1" />
                                    Dropped ({droppedGames.length})
                                </button>
                            </div>

                            {/* Archive Content */}
                            {archiveFilter === 'all' && (
                                <div className="space-y-8">
                                    {/* Completed Games Section */}
                                    {completedGames.length > 0 && (
                                        <div>
                                            <h3 className="text-lg font-semibold mb-4 text-green-700 flex items-center">
                                                <Check className="w-5 h-5 mr-2" />
                                                Completed Games ({completedGames.length})
                                            </h3>
                                            <div className={`grid ${gridCols[cardsPerRow]} gap-6`}>
                                                {completedGames.map(game => (
                                                    <GameCard 
                                                        key={game.id} 
                                                        game={game}
                                                        statusColor={getStatusColor(game.status)}
                                                        onGameClick={handleGameClick}
                                                        currentTab={currentTab}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    
                                    {/* Dropped Games Section */}
                                    {droppedGames.length > 0 && (
                                        <div>
                                            <h3 className="text-lg font-semibold mb-4 text-red-700 flex items-center">
                                                <X className="w-5 h-5 mr-2" />
                                                Dropped & Abandoned ({droppedGames.length})
                                            </h3>
                                            <div className={`grid ${gridCols[cardsPerRow]} gap-6`}>
                                                {droppedGames.map(game => (
                                                    <GameCard 
                                                        key={game.id} 
                                                        game={game}
                                                        statusColor={getStatusColor(game.status)}
                                                        onGameClick={handleGameClick}
                                                        currentTab={currentTab}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Filtered Archive Content */}
                            {archiveFilter !== 'all' && (
                                <div className={`grid ${gridCols[cardsPerRow]} gap-6`}>
                                    {archiveGames.map(game => (
                                        <GameCard 
                                            key={game.id} 
                                            game={game}
                                            statusColor={getStatusColor(game.status)}
                                            onGameClick={handleGameClick}
                                            currentTab={currentTab}
                                        />
                                    ))}
                                </div>
                            )}

                            {/* Empty Archive State */}
                            {completedGames.length === 0 && droppedGames.length === 0 && (
                                <div className="text-center py-12">
                                    <Archive className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                                    <p className="text-gray-500 text-lg">No archived games found.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Game Details Sidebar */}
            <GameDetailsSidebar 
                game={selectedGame} 
                isVisible={!!selectedGame}
                onClose={handleCloseSidebar}
                statusColor={selectedGame ? getStatusColor(selectedGame.status) : ''}
            />
        </>
    );
};

export default VisualNovel;