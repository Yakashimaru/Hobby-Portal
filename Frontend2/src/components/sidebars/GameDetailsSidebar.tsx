import React, { useState } from 'react';
import { Heart, Edit3, Save, X, Trash2} from 'lucide-react';

import DisplayImage from '../DisplayImage';
import type { Game } from 'types/game';

import Sidebar from './Sidebar';
import HoverImagePreview from '../HoverImagePreview';
import { formatUnderscoreName, removeSpecialCharacters } from '../../utils/formatting';
import fetchRequest from '../../utils/fetchRequest';

interface GameDetailsSidebarProps {
    game: Game | null;
    isVisible: boolean;
    onClose: () => void;
    statusColor: string;
    onOpenGallery: (game: Game, index: number) => void;
    onGameDeleted?: () => void;
    onSilentRefetch?: () => void;
}

const GameDetailsSidebar: React.FC<GameDetailsSidebarProps> = ({ 
    game, 
    isVisible, 
    onClose, 
    statusColor,
    onOpenGallery,
    onGameDeleted,
    onSilentRefetch
}) => {  
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState<Game | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    if (!game) return null;

    const currentGame = isEditing && editData ? editData : game;
    const favorites = [currentGame.fav_1, currentGame.fav_2, currentGame.fav_3].filter(Boolean);

    const imagePath = "../assets/images/visual_novel/";

    const handleFavoriteClick = (index: number) => {
        onOpenGallery(game, index);
    };

    const handleEdit = () => {
        // Convert dd/mm/yyyy to yyyy-mm-dd for date input
        const convertDateFormat = (dateStr: string) => {
            if (!dateStr) return new Date().toISOString().split('T')[0];
            const parts = dateStr.split('/');
            if (parts.length === 3) {
                return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
            }
            return dateStr;
        };

        setEditData({ 
            ...game,
            last_played: convertDateFormat(game.last_played || '')
        });
        setIsEditing(true);
    };

    const handleCancel = () => {
        setEditData(null);
        setIsEditing(false);
    };

    const handleSave = async () => {
        if (!editData || !game) return;
        
        setIsSaving(true);
        try {
            const updatePayload = {
                game: editData.game,
                developer: editData.developer,
                status: editData.status,
                year: editData.year,
                rating: editData.rating,
                story: editData.story,
                renders: editData.renders,
                animations: editData.animations,
                scenes: editData.scenes,
                last_played: editData.last_played,
                last_played_ver: editData.last_played_ver,
                fav_1: editData.fav_1,
                fav_2: editData.fav_2,
                fav_3: editData.fav_3,
                genre_1: editData.genre_1,
                genre_2: editData.genre_2,
                src_f:editData.src_f
            };

            await fetchRequest(`${API_BASE_URL}/updateVN/${game.id}`, 'PUT', updatePayload);
            
            // Call silent refetch if provided
            if (onSilentRefetch) {
                onSilentRefetch();
            }

            Object.assign(game, editData);
            
            setIsEditing(false);
            setEditData(null);
        } catch (error) {
            console.error('Failed to update game:', error);
            alert('Failed to update game. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const updateEditField = <K extends keyof Game>(field: K, value: Game[K]) => {
        if (editData) {
            setEditData({ ...editData, [field]: value });
        }
    };

    // Delete handler
    const handleDelete = async () => {
        if (!game) return;
        
        const confirmMessage = `Are you sure you want to delete "${game.game}"?\n\nThis action cannot be undone.`;
        
        if (window.confirm(confirmMessage)) {
            try {
                const response = await fetch(`${API_BASE_URL}/deleteVisualNovel`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        game: game.game
                    })
                });
                
                if (response.ok) {
                    onClose(); // Close sidebar immediately after successful delete
                    onGameDeleted?.(); // Refresh the game list
                } else {
                    alert('Failed to delete game. Please try again.');
                }
            } catch (error) {
                console.error('Error deleting game:', error);
                alert('An error occurred while deleting the game.');
            }
        }
    };
    
    return (
        <Sidebar 
            isVisible={isVisible}
            onClose={onClose}
            title={isEditing && editData ? (
                <input 
                    value={editData.game}
                    onChange={(e) => updateEditField('game', e.target.value)}
                    className="text-xl font-bold bg-transparent border-b-2 border-blue-500 focus:outline-none w-full"
                />
            ) : (
                <div className="flex items-center justify-between w-full">
                    <span>{currentGame.game}</span>
                    <button 
                        onClick={handleEdit}
                        className="ml-2 p-1 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors"
                        title="Edit Game"
                    >
                        <Edit3 size={16} />
                    </button>
                </div>
            )}
            subtitle={isEditing && editData ? (
                <input 
                    value={editData.developer || ''}
                    onChange={(e) => updateEditField('developer', e.target.value)}
                    className="text-sm bg-transparent border-b border-gray-300 focus:border-blue-500 focus:outline-none w-full mt-1"
                    placeholder="Developer"
                />
            ) : currentGame.developer}
            year={isEditing && editData ? (
                <input 
                    type="number"
                    value={editData.year || ''}
                    onChange={(e) => updateEditField('year', e.target.value ? parseInt(e.target.value) : undefined)}
                    className="bg-transparent border-b border-gray-300 focus:border-blue-500 focus:outline-none w-12 text-center text-xs"
                    min="1990" max="2030"
                />
            ) : currentGame.year}
            rating={isEditing && editData ? (
                <input 
                    type="number"
                    value={editData.rating || ''}
                    onChange={(e) => updateEditField('rating', e.target.value ? parseFloat(e.target.value) : 0)}
                    className="bg-transparent border-b border-gray-300 focus:border-blue-500 focus:outline-none w-8 text-center text-xs"
                    min="0" max="10" step="0.5"
                />
            ) : currentGame.rating}
            status={isEditing && editData ? (
                <select 
                    value={editData.status}
                    onChange={(e) => updateEditField('status', e.target.value as Game['status'])}
                    className="bg-transparent border border-gray-300 rounded text-xs p-1 focus:border-blue-500 focus:outline-none"
                >
                    <option value="Ongoing">Ongoing</option>
                    <option value="Completed">Completed</option>
                    <option value="Watchlist">Watchlist</option>
                    <option value="Dropped">Dropped</option>
                    <option value="Abandoned">Abandoned</option>
                </select>
            ) : currentGame.status}
            statusColor={statusColor}
        >

            {/* Edit Controls - Save/Cancel only show when editing */}
            {isEditing && (
                <div className="p-4 border-b bg-gray-50">
                    <div className="flex gap-2">
                        <button 
                            onClick={handleSave}
                            disabled={isSaving}
                            className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center"
                        >
                            {isSaving ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                            ) : (
                                <Save size={16} className="mr-2" />
                            )}
                            {isSaving ? 'Saving...' : 'Save'}
                        </button>
                        <button 
                            onClick={handleCancel}
                            className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center"
                        >
                            <X size={16} className="mr-2" />
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            <div className="p-4 space-y-2">
                {/* Individual Ratings - Compact Pills */}
                {(currentGame.story || currentGame.renders || currentGame.animations || currentGame.scenes) && (
                    <div className="flex flex-wrap gap-1 justify-center">
                        {/* Story Rating */}
                        <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap flex items-center">
                            Story: 
                            {isEditing && editData ? (
                                <input 
                                    type="number"
                                    value={editData.story || ''}
                                    onChange={(e) => updateEditField('story', e.target.value ? parseFloat(e.target.value) : undefined)}
                                    className="ml-1 w-12 bg-transparent text-center border-b border-blue-400 focus:outline-none"
                                    min="0" max="10" step="0.5"
                                    placeholder="0"
                                />
                            ) : (
                                <span className="ml-1">{currentGame.story || '0'}</span>
                            )}
                        </div>

                        {/* Renders Rating */}
                        <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap flex items-center">
                            Renders: 
                            {isEditing && editData ? (
                                <input 
                                    type="number"
                                    value={editData.renders || ''}
                                    onChange={(e) => updateEditField('renders', e.target.value ? parseFloat(e.target.value) : undefined)}
                                    className="ml-1 w-12 bg-transparent text-center border-b border-green-400 focus:outline-none"
                                    min="0" max="10" step="0.5"
                                    placeholder="0"
                                />
                            ) : (
                                <span className="ml-1">{currentGame.renders || '0'}</span>
                            )}
                        </div>

                        {/* Animations Rating */}
                        <div className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap flex items-center">
                            Anim: 
                            {isEditing && editData ? (
                                <input 
                                    type="number"
                                    value={editData.animations || ''}
                                    onChange={(e) => updateEditField('animations', e.target.value ? parseFloat(e.target.value) : undefined)}
                                    className="ml-1 w-12 bg-transparent text-center border-b border-purple-400 focus:outline-none"
                                    min="0" max="10" step="0.5"
                                    placeholder="0"
                                />
                            ) : (
                                <span className="ml-1">{currentGame.animations || '0'}</span>
                            )}
                        </div>

                        {/* Scenes Rating */}
                        <div className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap flex items-center">
                            Scenes: 
                            {isEditing && editData ? (
                                <input 
                                    type="number"
                                    value={editData.scenes || ''}
                                    onChange={(e) => updateEditField('scenes', e.target.value ? parseFloat(e.target.value) : undefined)}
                                    className="ml-1 w-12 bg-transparent text-center border-b border-red-400 focus:outline-none"
                                    min="0" max="10" step="0.5"
                                    placeholder="0"
                                />
                            ) : (
                                <span className="ml-1">{currentGame.scenes || '0'}</span>
                            )}
                        </div>
                    </div>
                )}

                {/* Favorite Characters - Main Focus */}
                {favorites.length > 0 && (
                    <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center justify-center">
                            <Heart className="w-5 h-5 mr-2 text-red-500" />
                            Favorites
                        </h4>
                        
                        {isEditing && editData ? (
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs text-gray-600 mb-1">Favorite 1</label>
                                    <input 
                                        value={editData.fav_1 || ''}
                                        onChange={(e) => updateEditField('fav_1', e.target.value)}
                                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
                                        placeholder="Character name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-600 mb-1">Favorite 2</label>
                                    <input 
                                        value={editData.fav_2 || ''}
                                        onChange={(e) => updateEditField('fav_2', e.target.value)}
                                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
                                        placeholder="Character name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-600 mb-1">Favorite 3</label>
                                    <input 
                                        value={editData.fav_3 || ''}
                                        onChange={(e) => updateEditField('fav_3', e.target.value)}
                                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
                                        placeholder="Character name"
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {favorites.map((favorite, index) => {
                                    const gradients = [
                                        'from-pink-300 to-purple-300',
                                        'from-blue-300 to-green-300',
                                        'from-yellow-300 to-orange-300'
                                    ];
                                    const characterImageTitle = formatUnderscoreName(removeSpecialCharacters(game.game + " " + favorite));
                                    
                                    return (
                                        <HoverImagePreview
                                            key={index}
                                            imageTitle={characterImageTitle}
                                            imagePath={imagePath}
                                            characterName={favorite || ''}
                                            previewSize="large"
                                        >
                                            <div key={index} className="text-center">
                                                <div className={`w-full h-40 bg-gradient-to-br ${gradients[index]} rounded-lg flex items-center justify-center mb-2 shadow-sm overflow-hidden hover:shadow-lg transition-shadow duration-200`}
                                                    onClick={() => handleFavoriteClick(index)}>
                                                    <DisplayImage 
                                                        imageTitle={characterImageTitle}
                                                        path={imagePath}
                                                        className="w-full h-full object-cover"
                                                        alt={favorite || ''}
                                                        fallbackText={favorite}
                                                    />
                                                </div>
                                                <p className="font-semibold text-gray-900 text-center">{favorite}</p>
                                            </div>
                                        </HoverImagePreview>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* Game Version/Update Information */}
                <div className="bg-gray-50 rounded-lg p-3 space-y-3">
                    <div className="grid grid-cols-1 gap-3">
                        {/* Last Played Section */}
                        <div className="bg-white rounded-md p-3 border-l-4 border-blue-400">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-medium text-blue-700 uppercase tracking-wide">Last Played</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div>
                                    <span className="text-gray-500 block">Date:</span>
                                    {isEditing && editData ? (
                                        <input 
                                            type="date"
                                            value={editData.last_played || ''}
                                            onChange={(e) => updateEditField('last_played', e.target.value)}
                                            className="font-semibold text-blue-600 bg-transparent border-b border-blue-300 focus:outline-none w-full text-xs"
                                        />
                                    ) : (
                                        <span className="font-semibold text-blue-600">{currentGame.last_played || 'N/A'}</span>
                                    )}
                                </div>
                                <div>
                                    <span className="text-gray-500 block">Version:</span>
                                    {isEditing && editData ? (
                                        <input 
                                            value={editData.last_played_ver || ''}
                                            onChange={(e) => updateEditField('last_played_ver', e.target.value)}
                                            className="font-semibold text-blue-600 bg-transparent border-b border-blue-300 focus:outline-none w-full text-xs"
                                            placeholder="v1.0.0"
                                        />
                                    ) : (
                                        <span className="font-semibold text-blue-600">{currentGame.last_played_ver || 'N/A'}</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Latest Update Section */}
                        <div className="bg-white rounded-md p-3 border-l-4 border-green-400">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-medium text-green-700 uppercase tracking-wide">Latest Update</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div>
                                    <span className="text-gray-500 block">Date:</span>
                                    <span className="font-semibold text-green-600">{currentGame.last_updated || 'N/A'}</span>
                                </div>
                                <div>
                                    <span className="text-gray-500 block">Version:</span>
                                    <span className="font-semibold text-green-600">{currentGame.last_updated_ver || 'N/A'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Additional Editable Fields in Edit Mode */}
                {isEditing && editData && (
                    <div className="bg-gray-50 rounded-lg p-3 space-y-3">
                        <h4 className="text-sm font-medium text-gray-700">Additional Details</h4>
                        
                        {/* Genres */}
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-xs text-gray-600 mb-1">Genre 1</label>
                                <input 
                                    value={editData.genre_1 || ''}
                                    onChange={(e) => updateEditField('genre_1', e.target.value)}
                                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
                                    placeholder="Primary genre"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-600 mb-1">Genre 2</label>
                                <input 
                                    value={editData.genre_2 || ''}
                                    onChange={(e) => updateEditField('genre_2', e.target.value)}
                                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
                                    placeholder="Secondary genre"
                                />
                            </div>
                        </div>

                        {/* For sources */}
                        <div>
                            <label className="block text-xs text-gray-600 mb-1">Source f</label>
                            <input 
                                value={editData.src_f || ''}
                                onChange={(e) => updateEditField('src_f', e.target.value)}
                                className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
                                placeholder="Source ID"
                            />
                        </div>
                    </div>
                )}
            </div>

            {isEditing && (
                <div className="p-4">
                    <button
                        onClick={handleDelete}
                        className="w-full bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
                    >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Game
                    </button>
                    <p className="text-xs text-gray-500 text-center mt-1">This action cannot be undone</p>
                </div>
            )}
        </Sidebar>
    );
};

export default GameDetailsSidebar;