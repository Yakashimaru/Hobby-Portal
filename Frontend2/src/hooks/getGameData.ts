// Create src/hooks/useGameData.ts
import { useState, useEffect } from 'react';
import type { Game } from '../types/game';

export const getGameData = (apiUrl: string) => {
    const [games, setGames] = useState<Game[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchGames = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(apiUrl);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            if (!Array.isArray(data)) {
                throw new Error('API response is not an array');
            }
            setGames(data);
        } catch (err: any) {
            console.error('Failed to fetch games:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const silentRefetch = async () => {
    // Don't set loading to true
        try {
            const response = await fetch(apiUrl);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            if (!Array.isArray(data)) {
                throw new Error('API response is not an array');
            }
            setGames(data); // Just update the games, no loading state
        } catch (err: any) {
            console.error('Silent refetch failed:', err);
            // Optionally set error, but don't show loading
        }
    };

    useEffect(() => {
        fetchGames();
    }, [apiUrl]);

    return { games, loading, error, refetch: fetchGames, silentRefetch };
};

