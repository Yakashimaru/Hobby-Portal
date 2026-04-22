// components/sidebars/AddGameSidebar.tsx
import React, { useState, useCallback } from 'react';
import { Save, Globe, Edit3, Loader, CheckCircle, ArrowRight, ChevronDown, ImageOff, X, RefreshCw } from 'lucide-react';
import Sidebar from './Sidebar';
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
  src_f: number;
  banner_url?: string;
}

interface BannerToast {
  bannerUrl: string;
  gameName: string;
}

const createEmptyGame = (): Partial<Game> => ({
  game: '',
  developer: '',
  status: 'Watchlist',
  last_played: new Date().toISOString().split('T')[0],
});

const QUICK_STATUSES: Game['status'][] = ['Watchlist'];
const ALL_STATUSES: Game['status'][] = ['Ongoing', 'Completed', 'Watchlist', 'Dropped', 'Abandoned'];

const AddGameSidebar: React.FC<AddGameSidebarProps> = ({ isVisible, onClose, onGameAdded }) => {
  const [mode, setMode] = useState<'choose' | 'manual' | 'url'>('choose');
  const [loading, setLoading] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [scrapedData, setScrapedData] = useState<ScrapedData | null>(null);
  const [formData, setFormData] = useState<Partial<Game>>(createEmptyGame());
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [useBanner, setUseBanner] = useState(false);
  const [bannerToast, setBannerToast] = useState<BannerToast | null>(null);
  const [bannerRetrying, setBannerRetrying] = useState(false);
  const [showMore, setShowMore] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const VITE_API_SCRAPPER_URL = import.meta.env.VITE_API_SCRAPPER_URL;

  const isQuickSave = QUICK_STATUSES.includes(formData.status as Game['status']);

  const updateFormField = useCallback(<K extends keyof Game>(field: K, value: Game[K] | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  }, []);

  const setTodaysDate = () => {
    const today = new Date().toISOString().split('T')[0];
    updateFormField('last_played', today);
  };

  const downloadBannerAsync = async (bannerUrl: string, gameName: string) => {
    try {
      const response = await fetch(`${VITE_API_SCRAPPER_URL}/downloadBanner`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ banner_url: bannerUrl, game_name: gameName })
      });
      if (!response.ok) throw new Error(`Server error: ${response.status}`);
    } catch (error) {
      console.error('Banner download failed:', error);
      setBannerToast({ bannerUrl, gameName });
    }
  };

  const handleUrlScrape = async () => {
    if (!urlInput.trim()) return;
    setLoading(true);
    try {
      const response = await fetch(`${VITE_API_SCRAPPER_URL}/getVNDate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlInput, limiter_low: 3, limiter_high: 8 })
      });

      const data = await response.json();

      if (data.game && data.developer) {
        const scraped: ScrapedData = {
          game: data.game,
          developer: data.developer,
          last_updated: data.last_updated || '',
          version: data.version || '',
          year: data.year || new Date().getFullYear(),
          src_f: data.src_f || '',
          banner_url: data.banner_url || null
        };
        setScrapedData(scraped);
        setUseBanner(!!scraped.banner_url);
        setFormData(prev => ({
          ...prev,
          game: scraped.game,
          developer: scraped.developer,
          last_updated_ver: scraped.version,
          last_updated: scraped.last_updated,
          year: scraped.year,
          ...(data.src_f && { src_f: data.src_f })
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
        status: formData.status || 'Watchlist',
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

        if (useBanner && scrapedData?.banner_url && scrapedData?.game) {
          downloadBannerAsync(scrapedData.banner_url, scrapedData.game);
        }

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

  const handleRetryBanner = async () => {
    if (!bannerToast) return;
    setBannerRetrying(true);
    try {
      const response = await fetch(`${VITE_API_SCRAPPER_URL}/downloadBanner`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ banner_url: bannerToast.bannerUrl, game_name: bannerToast.gameName })
      });
      if (!response.ok) throw new Error(`Server error: ${response.status}`);
      setBannerToast(null);
    } catch (error) {
      console.error('Banner retry failed:', error);
    } finally {
      setBannerRetrying(false);
    }
  };

  const resetSidebar = () => {
    setMode('choose');
    setScrapedData(null);
    setUrlInput('');
    setFormData(createEmptyGame());
    setHasUnsavedChanges(false);
    setUseBanner(false);
    setShowMore(false);
  };

  const handleClose = () => {
    if (!hasUnsavedChanges) resetSidebar();
    onClose();
  };

  const renderBanner = () => {
    if (!scrapedData?.banner_url) return (
      <div className="flex items-center text-gray-400 text-xs py-1">
        <ImageOff className="w-3 h-3 mr-1" />
        No banner found
      </div>
    );

    return (
      <div className="space-y-2">
        <img
          src={scrapedData.banner_url}
          alt="Game banner"
          className="w-full rounded-lg object-cover max-h-44"
        />
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={useBanner}
            onChange={(e) => setUseBanner(e.target.checked)}
            className="w-4 h-4 accent-green-500"
          />
          <span className="text-xs text-gray-600">Download and save this banner</span>
        </label>
      </div>
    );
  };

  const renderDetailFields = () => (
    <div className="space-y-3 border-t pt-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Last Played Date</label>
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
            min="1990" max="2030"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs text-gray-600 mb-2">Ratings (0-10, 0.5 increments)</label>
        <div className="grid grid-cols-2 gap-2">
          {(['rating', 'story', 'renders', 'animations', 'scenes'] as const).map(field => (
            <div key={field}>
              <label className="block text-xs text-gray-500 mb-1 capitalize">{field}</label>
              <input
                type="number"
                value={formData[field] || ''}
                onChange={(e) => updateFormField(field, e.target.value ? parseFloat(e.target.value) : undefined)}
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                min="0" max="10" step="0.5" placeholder="0"
              />
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs text-gray-600 mb-2">Favorite Characters</label>
        <div className="space-y-2">
          {(['fav_1', 'fav_2', 'fav_3'] as const).map((field, i) => (
            <input
              key={field}
              type="text"
              value={formData[field] || ''}
              onChange={(e) => updateFormField(field, e.target.value)}
              placeholder={`Favorite ${i + 1}`}
              className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs text-gray-600 mb-1">Last Played Version</label>
          <input
            type="text"
            value={formData.last_updated_ver || ''}
            onChange={(e) => updateFormField('last_played_ver', e.target.value)}
            placeholder="v1.0.0"
            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Source f</label>
          <input
            type="text"
            value={formData.src_f || ''}
            onChange={(e) => updateFormField('src_f', e.target.value)}
            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
            placeholder="Source ID"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs text-gray-600 mb-1">Genre 1</label>
          <input
            type="text"
            value={formData.genre_1 || ''}
            onChange={(e) => updateFormField('genre_1', e.target.value)}
            placeholder="Genre 1"
            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Genre 2</label>
          <input
            type="text"
            value={formData.genre_2 || ''}
            onChange={(e) => updateFormField('genre_2', e.target.value)}
            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
            placeholder="Genre 2"
          />
        </div>
      </div>
    </div>
  );

  const renderUrlMode = () => (
    <div className="p-4 space-y-4">
      <div className="flex items-center mb-4">
        <button onClick={() => setMode('choose')} className="text-gray-500 hover:text-gray-700 mr-3">
          ← Back
        </button>
        <h3 className="font-bold">Import from URL</h3>
      </div>

      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Game URL</label>
        <div className="flex space-x-2">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleUrlScrape()}
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
        <div className="space-y-4">
          {/* 1. Banner */}
          {renderBanner()}

          {/* 2. Scraped summary */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center mb-2">
              <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
              <h4 className="font-medium text-green-800 text-sm">Successfully imported!</h4>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div><span className="text-gray-600">Game:</span><span className="ml-1 font-medium">{scrapedData.game}</span></div>
              <div><span className="text-gray-600">Developer:</span><span className="ml-1 font-medium">{scrapedData.developer}</span></div>
            </div>
          </div>

          {/* 3. Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={formData.status || 'Watchlist'}
              onChange={(e) => updateFormField('status', e.target.value as Game['status'])}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* 4. Detail fields */}
          {isQuickSave ? (
            <button
              type="button"
              onClick={() => setShowMore(v => !v)}
              className="w-full text-gray-500 hover:text-gray-700 text-xs py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center justify-center"
            >
              <ChevronDown className={`w-3 h-3 mr-1 transition-transform ${showMore ? 'rotate-180' : ''}`} />
              {showMore ? 'Hide fields' : 'Show more fields'}
            </button>
          ) : (
            <div className="flex items-center text-xs text-gray-500">
              <ChevronDown className="w-3 h-3 mr-1" />
              Fill in details below
            </div>
          )}
          {(!isQuickSave || showMore) && renderDetailFields()}

          {/* 5. Save — sticky so it's always reachable */}
          <div className="sticky bottom-0 bg-white pt-2 pb-1">
            <button
              onClick={handleSaveGame}
              disabled={loading}
              className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white py-2 rounded-lg text-sm flex items-center justify-center"
            >
              {loading ? <Loader className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Save Game
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const renderManualMode = () => (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <button onClick={() => setMode('choose')} className="text-gray-500 hover:text-gray-700 mr-3">
            ← Back
          </button>
          <h3 className="font-bold">Manual Entry</h3>
        </div>
        <button
          onClick={resetSidebar}
          className="text-red-400 hover:text-red-600 text-xs"
        >
          Reset
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Game Title *</label>
          <input
            type="text"
            value={formData.game || ''}
            onChange={(e) => updateFormField('game', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            placeholder="Enter game title"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            value={formData.status || 'Watchlist'}
            onChange={(e) => updateFormField('status', e.target.value as Game['status'])}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {isQuickSave ? (
          <button
            type="button"
            onClick={() => setShowMore(v => !v)}
            className="w-full text-gray-500 hover:text-gray-700 text-xs py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center justify-center"
          >
            <ChevronDown className={`w-3 h-3 mr-1 transition-transform ${showMore ? 'rotate-180' : ''}`} />
            {showMore ? 'Hide fields' : 'Show more fields'}
          </button>
        ) : null}
        {(!isQuickSave || showMore) && renderDetailFields()}

        <div className="sticky bottom-0 bg-white pt-2 pb-1">
          <button
            onClick={handleSaveGame}
            disabled={!formData.game || loading}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white py-2 rounded-lg text-sm flex items-center justify-center"
          >
            {loading ? <Loader className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Save Game
          </button>
        </div>
      </div>
    </div>
  );

  const renderChooseMode = () => (
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
            <div className="flex items-center"><CheckCircle className="w-3 h-3 text-green-500 mr-2" />Just title and status required</div>
            <div className="flex items-center"><CheckCircle className="w-3 h-3 text-green-500 mr-2" />Complete privacy - no web requests</div>
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
            <div className="flex items-center"><CheckCircle className="w-3 h-3 text-green-500 mr-2" />Instant auto-fill of details</div>
            <div className="flex items-center"><Globe className="w-3 h-3 text-blue-500 mr-2" />Fetches data from game website</div>
          </div>
        </button>
      </div>
    </div>
  );

  return (
    <>
      <Sidebar
        isVisible={isVisible}
        onClose={handleClose}
        title="Add New Game"
        subtitle={mode === 'url' ? 'Import from URL' : mode === 'manual' ? 'Manual Entry' : 'Choose Method'}
      >
        {mode === 'choose' && renderChooseMode()}
        {mode === 'url' && renderUrlMode()}
        {mode === 'manual' && renderManualMode()}
      </Sidebar>

      {/* Banner error toast — persists after sidebar closes */}
      {bannerToast && (
        <div className="fixed bottom-4 right-4 z-50 bg-white border border-red-200 rounded-lg shadow-lg p-4 w-72">
          <div className="flex items-start justify-between mb-2">
            <p className="text-sm font-medium text-red-700">Banner download failed</p>
            <button onClick={() => setBannerToast(null)} className="text-gray-400 hover:text-gray-600 ml-2">
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-gray-500 mb-3">{bannerToast.gameName}</p>
          <button
            onClick={handleRetryBanner}
            disabled={bannerRetrying}
            className="w-full bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white py-1.5 rounded text-xs flex items-center justify-center"
          >
            {bannerRetrying ? <Loader className="w-3 h-3 animate-spin mr-1" /> : <RefreshCw className="w-3 h-3 mr-1" />}
            Retry
          </button>
        </div>
      )}
    </>
  );
};

export default AddGameSidebar;
