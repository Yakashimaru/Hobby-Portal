import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Heart } from 'lucide-react';
import DisplayImage from './DisplayImage';
import { formatUnderscoreName, removeSpecialCharacters } from '../utils/formatting';

interface FullscreenGalleryProps {
    isOpen: boolean;
    onClose: () => void;
    favorites: string[];
    currentIndex: number;
    onIndexChange: (index: number) => void;
    imagePath: string;
    gameTitle: string;
    formattedGameName: string;
}

const FullscreenGallery: React.FC<FullscreenGalleryProps> = ({
    isOpen,
    onClose,
    favorites,
    currentIndex,
    onIndexChange,
    imagePath,
    gameTitle,
    formattedGameName
}) => {
    const [selectedThumbIndex, setSelectedThumbIndex] = useState(currentIndex);
    const [showOverlayUI, setShowOverlayUI] = useState(true); // Only for counter and character name
    const [mouseTimer, setMouseTimer] = useState<number | null>(null);

    useEffect(() => {
        setSelectedThumbIndex(currentIndex);
    }, [currentIndex]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;
            
            switch (e.key) {
                case 'Escape':
                    onClose();
                    break;
                case 'ArrowLeft':
                    goToPrevious();
                    break;
                case 'ArrowRight':
                    goToNext();
                    break;
            }
        };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, favorites.length]);

  // Handle mouse movement for auto-hide UI (only counter and character name)
    useEffect(() => {
        const handleMouseMove = () => {
            setShowOverlayUI(true);
            
            // Clear existing timer
            if (mouseTimer) {
                clearTimeout(mouseTimer);
            }
            
            // Set new timer to hide overlay UI after 2 seconds of no movement
            const newTimer = setTimeout(() => {
                setShowOverlayUI(false);
            }, 2000);
            
            setMouseTimer(newTimer);
        };

    if (isOpen) {
        document.addEventListener('mousemove', handleMouseMove);
        
        // Initial timer
        const initialTimer = setTimeout(() => {
            setShowOverlayUI(false);
        }, 2000);
        setMouseTimer(initialTimer);
    }

    return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        if (mouseTimer) {
            clearTimeout(mouseTimer);
        }
    };
  }, [isOpen]);

    const goToPrevious = () => {
        const newIndex = currentIndex > 0 ? currentIndex - 1 : favorites.length - 1;
        onIndexChange(newIndex);
        setSelectedThumbIndex(newIndex);
    };

    const goToNext = () => {
        const newIndex = currentIndex < favorites.length - 1 ? currentIndex + 1 : 0;
        onIndexChange(newIndex);
        setSelectedThumbIndex(newIndex);
    };

    const handleThumbnailClick = (index: number) => {
        onIndexChange(index);
        setSelectedThumbIndex(index);
    };

    const handleBackgroundClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const handleCloseClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onClose();
    };

    if (!isOpen || favorites.length === 0) return null;

    const currentFavorite = favorites[currentIndex];
    const characterImageTitle = `${formattedGameName}_${formatUnderscoreName(removeSpecialCharacters(currentFavorite))}`;

    return (
        <div 
            className="fixed inset-0 bg-black z-[9999] flex flex-col"
            onClick={handleBackgroundClick}
        >
            {/* Top UI Bar - ALWAYS VISIBLE */}
            <div className="absolute top-0 left-0 right-0 z-[10000]">
                {/* Close Button */}
                <div className="absolute top-4 right-4">
                    <button
                        onClick={handleCloseClick}
                        className="bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full transition-all cursor-pointer"
                        >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Game Title - Modern glassmorphism style */}
                <div className="absolute top-4 left-4">
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg shadow-lg">
                        <div className="flex items-center">
                            <Heart className="w-5 h-5 mr-2 text-red-400 fill-red-400" />
                            <span className="font-bold">{gameTitle}</span>
                        </div>
                    </div>
                </div>


                {/* Counter - FADES OUT */}
                <div className={`absolute top-4 left-1/2 transform -translate-x-1/2 transition-opacity duration-300 ${
                    showOverlayUI ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}>
                    <div className="bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                        {currentIndex + 1} / {favorites.length}
                    </div>
                </div>
            </div>

            {/* Main Image Area - NO PADDING, perfect fit */}
            <div 
                className="flex-1 flex items-center justify-center relative"
                onClick={handleBackgroundClick}
                style={{ height: 'calc(100vh - 80px)' }}
            >
                {/* Navigation Arrows - ALWAYS VISIBLE */}
                {favorites.length > 1 && (
                    <>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                goToPrevious();
                            }}
                            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-3 rounded-full transition-all z-10 cursor-pointer"
                        >
                            <ChevronLeft className="w-8 h-8" />
                        </button>

                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                goToNext();
                                }}
                            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-3 rounded-full transition-all z-10 cursor-pointer"
                        >
                            <ChevronRight className="w-8 h-8" />
                        </button>
                    </>
                )}

                {/* Main Image - Perfect fit, NO padding */}
                <div 
                    className="w-full h-full flex items-center justify-center"
                    onClick={handleBackgroundClick}
                >
                    <DisplayImage
                        imageTitle={characterImageTitle}
                        path={imagePath}
                        className="max-w-full max-h-full object-contain"
                        alt={currentFavorite}
                        fallbackText={currentFavorite}
                    />
                </div>
            </div>

            {/* Character Name - FADES OUT */}
            <div className={`absolute bottom-24 left-1/2 transform -translate-x-1/2 z-10 transition-opacity duration-300 ${
                showOverlayUI ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}>
                <div className="bg-black bg-opacity-70 text-white px-6 py-3 rounded-lg">
                    <h3 className="font-bold text-xl text-center">{currentFavorite}</h3>
                </div>
            </div>

            {/* Bottom Thumbnail Strip - Modern gradient, no black box */}
            <div className="h-20 black flex-shrink-0">
                <div className="flex items-center justify-center h-full px-4">
                    <div className="flex space-x-2">
                        {favorites.map((favorite, index) => {
                            const thumbImageTitle = `${formattedGameName}_${formatUnderscoreName(removeSpecialCharacters(favorite))}`;
                            return (
                                <button
                                    key={index}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleThumbnailClick(index);
                                    }}
                                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                                    index === selectedThumbIndex 
                                        ? 'border-white scale-110' 
                                        : 'border-transparent hover:border-gray-400'
                                    }`}
                                >
                                    <DisplayImage
                                        imageTitle={thumbImageTitle}
                                        path={imagePath}
                                        className="w-full h-full object-cover"
                                        alt={favorite}
                                        fallbackText={favorite.substring(0, 2)}
                                    />
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FullscreenGallery;