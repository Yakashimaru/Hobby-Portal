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
        const src = `${baseUrl}/${path}${imageTitle}.jpg${qs}`;

        const [hasError, setHasError] = useState(false);

        useEffect(() => {
            setHasError(false);
        }, [src]);

        if (hasError) {
            return (
                <div className={`${className} bg-gray-200 flex items-center justify-center`}>
                    <span className="text-gray-500 text-sm">{fallbackText}</span>
                </div>
            );
        }

        return (
            <img
                src={src}
                alt={alt}
                loading="lazy"
                className={className}
                onError={() => setHasError(true)}
            />
        );
    };
export default DisplayImage;
