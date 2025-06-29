// components/sidebars/AddGameSidebar.tsx
import React, { useState, useCallback } from 'react';
import { Save, Globe, Edit3, Loader, CheckCircle, ArrowRight, ChevronDown } from 'lucide-react';
import Sidebar from './Sidebar'; // 
import type { Game } from '../../types/game';

interface AddGameSidebarProps {
  isVisible: boolean;
  onClose: () => void;
  onGameAdded: (game: Game) => void;
}

interface ScrapedData {
  game: string;
  developer: string;
  last_updated: string;
  version: string;
  year: number;
}

const createEmptyGame = (): Partial<Game> => ({
  game: '',
  developer: '',
  status: 'Ongoing',
  last_played: new Date().toISOString().split('T')[0],
});

const AddGameSidebar: React.FC<AddGameSidebarProps> = ({ isVisible, onClose, onGameAdded }) => {
  const [mode, setMode] = useState<'choose' | 'manual' | 'url'>('choose');
  const [loading, setLoading] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [scrapedData, setScrapedData] = useState<ScrapedData | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [formData, setFormData] = useState<Partial<Game>>(createEmptyGame());
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const statusOptions: Game['status'][] = ['Ongoing', 'Completed', 'Watchlist', 'Dropped', 'Abandoned'];

  // API URLs
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const VITE_API_SCRAPPER_URL = import.meta.env.VITE_API_SCRAPPER_URL;

  const updateFormField = useCallback(<K extends keyof Game>(field: K, value: Game[K] | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  }, []);

  const setTodaysDate = () => {
    const today = new Date().toISOString().split('T')[0];
    updateFormField('last_played', today);
  };

  const handleUrlScrape = async () => {
    if (!urlInput.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${VITE_API_SCRAPPER_URL}/getVNDate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: urlInput,
          limiter_low: 3,
          limiter_high: 8
        })
      });

      const data = await response.json();
      
      if (data.game && data.developer) {
        const scraped: ScrapedData = {
          game: data.game,
          developer: data.developer,
          last_updated: data.last_updated || '',
          version: data.version || '',
          year: data.year || new Date().getFullYear()
        };
        
        setScrapedData(scraped);
        setFormData(prev => ({
          ...prev,
          game: scraped.game,
          developer: scraped.developer,
          last_updated_ver: scraped.version,
          year: scraped.year
        }));
      } else {
        alert('Could not extract game data from this URL. Try manual entry instead.');
      }
    } catch (error) {
      console.error('Scraping error:', error);
      alert('Failed to fetch game data. Please try manual entry.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGame = async () => {
    if (!formData.game?.trim()) {
      alert('Game title is required!');
      return;
    }

    setLoading(true);
    try {
      const gameData = {
        ...formData,
        status: formData.status || 'Ongoing',
        last_played: formData.last_played || new Date().toISOString().split('T')[0],
      };

      const response = await fetch(`${API_BASE_URL}/addVisualNovel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gameData)
      });

      if (response.ok) {
        const newGame = await response.json();
        
        onGameAdded(newGame);
        
        setHasUnsavedChanges(false);
        resetSidebar();
        onClose();
      } else {
        const error = await response.json();
        alert(`Failed to save game: ${error.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save game. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetSidebar = () => {
    setMode('choose');
    setScrapedData(null);
    setUrlInput('');
    setShowAdvanced(false);
    setFormData(createEmptyGame());
    setHasUnsavedChanges(false);
  };

  const handleClose = () => {
    // Only reset if successfully saved, otherwise keep data
    if (!hasUnsavedChanges) {
      resetSidebar();
    }
    onClose();
  };

  const renderContent = () => {
    if (mode === 'choose') {
      return (
        <div className="p-4 space-y-4">
          <div className="text-center mb-6">
            <h3 className="text-lg font-bold mb-2">How would you like to add this game?</h3>
            <p className="text-gray-600 text-sm">Choose your preferred method</p>
          </div>

          <div className="space-y-3">
            <button 
              onClick={() => setMode('manual')}
              className="w-full bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 hover:border-blue-400 rounded-lg p-4 transition-all text-left"
            >
              <div className="flex items-center mb-2">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                  <Edit3 className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h4 className="font-bold">Manual Entry</h4>
                  <p className="text-xs text-gray-600">Quick and private</p>
                </div>
              </div>
              <div className="text-xs text-gray-700 space-y-1">
                <div className="flex items-center">
                  <CheckCircle className="w-3 h-3 text-green-500 mr-2" />
                  Just title and status required
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-3 h-3 text-green-500 mr-2" />
                  Complete privacy - no web requests
                </div>
              </div>
            </button>

            <button 
              onClick={() => setMode('url')}
              className="w-full bg-green-50 hover:bg-green-100 border-2 border-green-200 hover:border-green-400 rounded-lg p-4 transition-all text-left"
            >
              <div className="flex items-center mb-2">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3">
                  <Globe className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h4 className="font-bold">Import from URL</h4>
                  <p className="text-xs text-gray-600">Auto-fill from website</p>
                </div>
              </div>
              <div className="text-xs text-gray-700 space-y-1">
                <div className="flex items-center">
                  <CheckCircle className="w-3 h-3 text-green-500 mr-2" />
                  Instant auto-fill of details
                </div>
                <div className="flex items-center">
                  <Globe className="w-3 h-3 text-blue-500 mr-2" />
                  Fetches data from game website
                </div>
              </div>
            </button>
          </div>
        </div>
      );
    }

    if (mode === 'url') {
      return (
        <div className="p-4 space-y-4">
          <div className="flex items-center mb-4">
            <button 
              onClick={() => setMode('choose')}
              className="text-gray-500 hover:text-gray-700 mr-3"
            >
              ← Back
            </button>
            <h3 className="font-bold">Import from URL</h3>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Game URL
            </label>
            <div className="flex space-x-2">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://"
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
              <button
                onClick={handleUrlScrape}
                disabled={!urlInput || loading}
                className="bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg"
              >
                {loading ? <Loader className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              </button>
            </div>
            
            {loading && (
              <div className="mt-3 flex items-center text-green-600 text-sm">
                <Loader className="w-3 h-3 animate-spin mr-2" />
                Fetching game information...
              </div>
            )}
          </div>

          {scrapedData && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center mb-2">
                <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                <h4 className="font-medium text-green-800 text-sm">Successfully imported!</h4>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-600">Game:</span>
                  <span className="ml-1 font-medium">{scrapedData.game}</span>
                </div>
                <div>
                  <span className="text-gray-600">Developer:</span>
                  <span className="ml-1 font-medium">{scrapedData.developer}</span>
                </div>
              </div>
              
              <div className="mt-3 flex space-x-2">
                <button 
                  onClick={() => setMode('manual')}
                  className="text-green-600 hover:text-green-700 text-xs"
                >
                  Edit before saving
                </button>
                <button
                  onClick={handleSaveGame}
                  disabled={loading}
                  className="bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white px-3 py-1 rounded text-xs flex items-center"
                >
                  {loading ? <Loader className="w-3 h-3 mr-1 animate-spin" /> : <Save className="w-3 h-3 mr-1" />}
                  Save Game
                </button>
              </div>
            </div>
          )}
        </div>
      );
    }

    if (mode === 'manual') {
      return (
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <button 
                onClick={() => setMode('choose')}
                className="text-gray-500 hover:text-gray-700 mr-3"
              >
                ← Back
              </button>
              <h3 className="font-bold">Manual Entry</h3>
            </div>
            {!scrapedData && (
              <button 
                onClick={() => setMode('url')}
                className="text-blue-500 hover:text-blue-600 text-xs flex items-center"
              >
                <Globe className="w-3 h-3 mr-1" />
                Import URL
              </button>
            )}
          </div>

          {scrapedData && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
              <div className="flex items-center text-blue-700 text-xs">
                <CheckCircle className="w-3 h-3 mr-2" />
                Pre-filled with imported data. You can edit any field below.
              </div>
            </div>
          )}

          <div className="space-y-3">
            {/* Essential Fields */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Game Title *
              </label>
              <input
                type="text"
                value={formData.game || ''}
                onChange={(e) => updateFormField('game', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                placeholder="Enter game title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status *
              </label>
              <select 
                value={formData.status || 'Ongoing'}
                onChange={(e) => updateFormField('status', e.target.value as Game['status'])}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                {statusOptions.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Played Date
              </label>
              <div className="flex space-x-2">
                <input
                  type="date"
                  value={formData.last_played || ''}
                  onChange={(e) => updateFormField('last_played', e.target.value)}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={setTodaysDate}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded-lg text-xs"
                >
                  Today
                </button>
              </div>
            </div>

            {/* Show More Toggle */}
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full text-blue-500 hover:text-blue-600 text-sm py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center"
            >
              <ChevronDown className={`w-4 h-4 mr-2 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
              {showAdvanced ? 'Show Less Fields' : 'Show More Fields'}
            </button>

            {/* Advanced Fields */}
            {showAdvanced && (
              <div className="space-y-3 border-t pt-3">
                <h4 className="font-medium text-gray-700 text-sm">Additional Details</h4>
                
                {/* Developer & Year */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Developer</label>
                    <input
                      type="text"
                      value={formData.developer || ''}
                      onChange={(e) => updateFormField('developer', e.target.value)}
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Year</label>
                    <input
                      type="number"
                      value={formData.year || ''}
                      onChange={(e) => updateFormField('year', e.target.value ? parseInt(e.target.value) : undefined)}
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                      min="1990"
                      max="2030"
                    />
                  </div>
                </div>

                {/* Ratings */}
                <div>
                  <label className="block text-xs text-gray-600 mb-2">Ratings (0-10, 0.5 increments)</label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Overall</label>
                      <input
                        type="number"
                        value={formData.rating || ''}
                        onChange={(e) => updateFormField('rating', e.target.value ? parseFloat(e.target.value) : undefined)}
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                        min="0" max="10" step="0.5"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Story</label>
                      <input
                        type="number"
                        value={formData.story || ''}
                        onChange={(e) => updateFormField('story', e.target.value ? parseFloat(e.target.value) : undefined)}
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                        min="0" max="10" step="0.5"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Renders</label>
                      <input
                        type="number"
                        value={formData.renders || ''}
                        onChange={(e) => updateFormField('renders', e.target.value ? parseFloat(e.target.value) : undefined)}
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                        min="0" max="10" step="0.5"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Animations</label>
                      <input
                        type="number"
                        value={formData.animations || ''}
                        onChange={(e) => updateFormField('animations', e.target.value ? parseFloat(e.target.value) : undefined)}
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                        min="0" max="10" step="0.5"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Scenes</label>
                      <input
                        type="number"
                        value={formData.scenes || ''}
                        onChange={(e) => updateFormField('scenes', e.target.value ? parseFloat(e.target.value) : undefined)}
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                        min="0" max="10" step="0.5"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>

                {/* Favorites */}
                <div>
                  <label className="block text-xs text-gray-600 mb-2">Favorite Characters</label>
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={formData.fav_1 || ''}
                      onChange={(e) => updateFormField('fav_1', e.target.value)}
                      placeholder="Favorite 1"
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                    />
                    <input
                      type="text"
                      value={formData.fav_2 || ''}
                      onChange={(e) => updateFormField('fav_2', e.target.value)}
                      placeholder="Favorite 2"
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                    />
                    <input
                      type="text"
                      value={formData.fav_3 || ''}
                      onChange={(e) => updateFormField('fav_3', e.target.value)}
                      placeholder="Favorite 3"
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                    />
                  </div>
                </div>

                {/* Version */}
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Last Played Version</label>
                  <input
                    type="text"
                    value={formData.last_played_ver || ''}
                    onChange={(e) => updateFormField('last_played_ver', e.target.value)}
                    placeholder="v1.0.0"
                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                  />
                </div>
              </div>
            )}

            <div className="flex space-x-2 pt-3">
              <button 
                onClick={() => setMode('choose')}
                className="flex-1 bg-gray-200 hover:bg-gray-300 py-2 rounded-lg text-sm"
              >
                Back
              </button>
              <button
                onClick={resetSidebar}
                className="px-3 bg-red-100 hover:bg-red-200 text-red-700 py-2 rounded-lg text-sm"
              >
                Reset
              </button>
              <button
                onClick={handleSaveGame}
                disabled={!formData.game || loading}
                className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white py-2 rounded-lg text-sm flex items-center justify-center"
              >
                {loading ? (
                  <Loader className="w-3 h-3 mr-1 animate-spin" />
                ) : (
                  <Save className="w-3 h-3 mr-1" />
                )}
                Save
              </button>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <Sidebar
      isVisible={isVisible}
      onClose={handleClose}
      title="Add New Game"
      subtitle={mode === 'url' ? 'Import from URL' : mode === 'manual' ? 'Manual Entry' : 'Choose Method'}
    >
      {renderContent()}
    </Sidebar>
  );
};

export default AddGameSidebar;