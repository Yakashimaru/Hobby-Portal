import { useState, useEffect } from 'react';
import { Play, ChevronDown, RefreshCw, Eye, Settings, Plus, Globe } from 'lucide-react';
import type { Game } from '../../types/game';
import AddGameSidebar from '../sidebars/AddGameSidebar';

interface GameManagementToolbarProps {
    activeFilter: 'all' | 'ongoing' | 'watchlist';
    onFilterChange: (filter: 'all' | 'ongoing' | 'watchlist') => void;
    ongoingCount: number;
    watchlistCount: number;
    onUpdateAll: () => void;
    isUpdating: boolean;
    updateProgress?: { 
        total: number;
        completed: number;
        current: string;
    } | null;
    onGameAdded: (game: Game) => void; // Prop for adding games
}

const GameManagementToolbar = ({
    activeFilter,
    onFilterChange,
    ongoingCount,
    watchlistCount,
    onUpdateAll,
    isUpdating,
    updateProgress,
    onGameAdded,
}: GameManagementToolbarProps) => {
    const [showActionsDropdown, setShowActionsDropdown] = useState(false);
    const [showAddGameModal, setShowAddGameModal] = useState(false); // Add game modal state

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Element;
            if (!target.closest('[data-actions-dropdown]')) {
                setShowActionsDropdown(false);
            }
        };

        if (showActionsDropdown) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [showActionsDropdown]);

    const handleGameAdded = (game: Game) => {
        onGameAdded(game); // This calls silentRefetch() in parent
        setShowAddGameModal(false);
        console.log('Game added successfully:', game.game);
    };

    return (
        <>
            <div className="space-y-4">
                <div className="bg-gray-100 rounded-lg p-4 mb-6 flex items-center justify-between">
                    {/* Filter Buttons */}
                    <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-600 font-medium">Show:</span>
                        <button
                            onClick={() => onFilterChange('all')}
                            className={`px-3 py-1 rounded-full text-sm transition-colors ${
                                activeFilter === 'all' 
                                    ? 'bg-gray-700 text-white' 
                                    : 'bg-white text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => onFilterChange('ongoing')}
                            className={`px-3 py-1 rounded-full text-sm transition-colors flex items-center ${
                                activeFilter === 'ongoing' 
                                    ? 'bg-blue-600 text-white' 
                                    : 'bg-white text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            <Play className="w-3 h-3 mr-1" />
                            Ongoing ({ongoingCount})
                        </button>
                        <button
                            onClick={() => onFilterChange('watchlist')}
                            className={`px-3 py-1 rounded-full text-sm transition-colors flex items-center ${
                                activeFilter === 'watchlist' 
                                    ? 'bg-yellow-600 text-white' 
                                    : 'bg-white text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            <Eye className="w-3 h-3 mr-1" />
                            Watchlist ({watchlistCount})
                        </button>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center space-x-3">
                        {/* Cards per row selector - to match your image */}
                        <select className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option>6 per row</option>
                            <option>5 per row</option>
                            <option>4 per row</option>
                            <option>3 per row</option>
                        </select>

                        {/* NEW: Add Game Button - Make it primary */}
                        <button
                            onClick={() => setShowAddGameModal(true)}
                            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Game
                        </button>

                        {/* Update All Button - Primary Action */}
                        <button
                            onClick={onUpdateAll}
                            disabled={isUpdating}
                            className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors flex items-center min-w-32"
                        >
                            <RefreshCw className={`w-4 h-4 mr-2 ${isUpdating ? 'animate-spin' : ''}`} />
                            {isUpdating ? (
                                updateProgress ? 
                                    `${updateProgress.completed}/${updateProgress.total}` : 
                                    'Updating...'
                            ) : 'Update All'}
                        </button>

                        {/* Actions Dropdown - Secondary Actions */}
                        <div className="relative" data-actions-dropdown>
                            <button
                                onClick={() => setShowActionsDropdown(!showActionsDropdown)}
                                className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
                            >
                                <Settings className="w-4 h-4 mr-2" />
                                Actions
                                <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${showActionsDropdown ? 'rotate-180' : ''}`} />
                            </button>

                            {/* Dropdown Menu */}
                            {showActionsDropdown && (
                                <div className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-lg border min-w-48 z-50">
                                    <div className="py-2">
                                        <button
                                            onClick={() => {
                                                console.log('Add New Game clicked');
                                                setShowActionsDropdown(false);
                                            }}
                                            className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center"
                                        >
                                            <Plus className="w-4 h-4 mr-3" />
                                            Add New Game
                                        </button>
                                        
                                        <div className="relative group">
                                            <button className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center justify-between">
                                                <div className="flex items-center">
                                                    <Globe className="w-4 h-4 mr-3" />
                                                    Add Game from Site
                                                </div>
                                            </button>
                                            
                                            {/* Submenu */}
                                            <div className="absolute right-full top-0 mr-1 bg-white rounded-lg shadow-lg border min-w-40 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
                                                <div className="py-2">
                                                    <button
                                                        onClick={() => {
                                                            setShowActionsDropdown(false);
                                                        }}
                                                        className="w-full text-left px-4 py-2 hover:bg-gray-100"
                                                    >
                                                        AAA
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setShowActionsDropdown(false);
                                                        }}
                                                        className="w-full text-left px-4 py-2 hover:bg-gray-100"
                                                    >
                                                        BBB
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            console.log('Add from Other Site clicked');
                                                            setShowActionsDropdown(false);
                                                        }}
                                                        className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-600"
                                                    >
                                                        Other...
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        <hr className="my-2" />
                                        
                                        <button
                                            onClick={() => {
                                                console.log('Import Games clicked');
                                                setShowActionsDropdown(false);
                                            }}
                                            className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center text-gray-600"
                                        >
                                            <RefreshCw className="w-4 h-4 mr-3" />
                                            Import Games
                                        </button>
                                        
                                        <button
                                            onClick={() => {
                                                console.log('Export Collection clicked');
                                                setShowActionsDropdown(false);
                                            }}
                                            className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center text-gray-600"
                                        >
                                            <Settings className="w-4 h-4 mr-3" />
                                            Export Collection
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Inline Progress Bar - Add this inside the component */}
                {isUpdating && updateProgress && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-blue-900">
                            Updating Games ({updateProgress.completed}/{updateProgress.total})
                        </span>
                        <span className="text-xs text-blue-700">
                            Current: {updateProgress.current}
                        </span>
                    </div>
                    <div className="w-full bg-blue-100 rounded-full h-2">
                        <div 
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${(updateProgress.completed / updateProgress.total) * 100}%` }}
                        />
                    </div>
                </div>
                )}
            </div>
            <AddGameSidebar
                isVisible={showAddGameModal}
                onClose={() => setShowAddGameModal(false)}
                onGameAdded={handleGameAdded}
            />
        </>
    );
};

export default GameManagementToolbar;