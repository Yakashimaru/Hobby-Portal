import { useState, useEffect } from 'react';

interface DisplayImageProps {
    imageTitle: string;
    path: string;
    className: string;
    alt: string;
    fallbackText?: string;
    cacheBuster?: number;
}

const DisplayImage = ({ imageTitle, path, className, alt, fallbackText = "No Image", cacheBuster }: DisplayImageProps) => {
        const baseUrl = import.meta.env.VITE_R2_IMAGE_URL;
        const qs = cacheBuster ? `?ts=${cacheBuster}` : '';
        const jpgSrc = `${baseUrl}/${path}${imageTitle}.jpg${qs}`;
        const pngSrc = `${baseUrl}/${path}${imageTitle}.png${qs}`;

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