import { useEffect, useRef } from 'react';

export const useClickOutside = (callback: () => void) => {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Element;
            
            // Don't close if clicking on the sidebar itself
            if (ref.current && !ref.current.contains(target)) {
                // Don't close if clicking on a game card or any of its children
                const gameCard = target.closest('[data-game-card]');
                if (gameCard) {
                    return;
                }
                
                callback();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [callback]);

    return ref;
};