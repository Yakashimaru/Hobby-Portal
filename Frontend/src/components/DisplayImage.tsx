import { useState, useEffect } from 'react';

interface DisplayImageProps {
    imageTitle: string;
    path: string;
    className: string;
    alt: string;
    fallbackText?: string;
}

const DisplayImage = ({ imageTitle, path, className, alt, fallbackText = "No Image" }: DisplayImageProps) => {
        const jpgSrc = new URL(`${path + imageTitle}.jpg`, import.meta.url).href;
        const pngSrc = new URL(`${path + imageTitle}.png`, import.meta.url).href;

        const [currentSrc, setCurrentSrc] = useState(jpgSrc);
        const [hasError, setHasError] = useState(false);

        // Reset state when imageTitle changes
        useEffect(() => {
            setCurrentSrc(jpgSrc);
            setHasError(false);
        }, [jpgSrc]); // jpgSrc changes when imageTitle changes

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
                    <span className="text-gray-500 text-sm">{fallbackText}</span>
                </div>
            );
        }

        return (
            <img 
                src={currentSrc}
                alt={alt}
                loading="lazy"
                className={className}
                onError={handleError}
            />
        );
    };
export default DisplayImage;