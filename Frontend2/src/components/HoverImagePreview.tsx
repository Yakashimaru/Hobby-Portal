import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import DisplayImage from './DisplayImage';

interface HoverImagePreviewProps {
  imageTitle: string;
  imagePath: string;
  characterName: string;
  className?: string;
  children: React.ReactNode;
  previewSize?: 'small' | 'medium' | 'large';
}

const HoverImagePreview: React.FC<HoverImagePreviewProps> = ({
    imageTitle,
    imagePath,
    characterName,
    className = '',
    children,
    previewSize = 'medium'
}) => {
    const [isHovered, setIsHovered] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const containerRef = useRef<HTMLDivElement>(null);

    const sizes = {
        small: { width: 240, height: 180 },
        medium: { width: 320, height: 240 },
        large: { width: 600, height: 337.5 }
    };

    const currentSize = sizes[previewSize];

    const handleMouseEnter = () => {
        console.log('Mouse entered, showing preview for:', characterName);

        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            
            const imgElement = containerRef.current.querySelector('img');
            const targetRect = imgElement ? imgElement.getBoundingClientRect() : rect;

            // Try to center first
            let previewTop = targetRect.top + (targetRect.height / 2) - (currentSize.height / 2);

            // Check if it goes below viewport
            const wouldOverflow = previewTop + currentSize.height > window.innerHeight;

            if (wouldOverflow) {
                // Align to bottom instead for bottom items
                previewTop = targetRect.bottom - currentSize.height;
            }

            setPosition({
                top: previewTop,
                left: rect.left - 20 - currentSize.width
            });
        }

        setIsHovered(true);
    };

    const handleMouseLeave = () => {
        console.log('Mouse left, hiding preview for:', characterName);
        setIsHovered(false);
    };

    // Portal content positioned relative to the hovered element
    const portalContent = isHovered ? (
    <div 
        className="fixed z-[9999] pointer-events-none"
        style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
            width: `${currentSize.width}px`,
            height: `${currentSize.height}px`
        }}
    >
        <div className="w-full h-full shadow-2xl rounded-lg overflow-hidden bg-white border-2 border-gray-200">
        <DisplayImage
            imageTitle={imageTitle}
            path={imagePath}
            className="w-full h-full object-cover"
            alt={characterName}
            fallbackText={characterName}
        />
        </div>
    </div>
    ) : null;

    return (
    <>
        <div
            ref={containerRef}
            className={`relative cursor-pointer ${className}`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
        {children}
        </div>
        
        {/* Render the portal at document body level */}
        {portalContent && createPortal(portalContent, document.body)}
    </>
    );
};

export default HoverImagePreview;