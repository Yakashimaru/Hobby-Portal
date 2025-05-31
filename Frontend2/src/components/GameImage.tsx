import React, { useState } from 'react';
import { formatUnderscoreName, removeSpecialCharacters } from "../utils/formatting";

const GameImage = ({ gameTitle, className, alt }: { gameTitle: string; className: string; alt: string }) => {
        const formattedGameTitle = formatUnderscoreName(removeSpecialCharacters(gameTitle));

        const jpgSrc = new URL(`../assets/images/visual_novel/${formattedGameTitle}.jpg`, import.meta.url).href;
        const pngSrc = new URL(`../assets/images/visual_novel/${formattedGameTitle}.png`, import.meta.url).href;

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
export default GameImage;