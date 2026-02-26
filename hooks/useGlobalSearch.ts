import { useState, useEffect, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { searchGlobal } from '../services/searchService';
import { GlobalSearchResult, SearchResultType } from '../types';
import { MOCK_CONVERSATIONS, MOCK_ADMIN_TASKS } from '../constants'; // Using constants for non-context data for now

export const useGlobalSearch = () => {
    const { students, instructors, groups, leads } = useData();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Record<SearchResultType, GlobalSearchResult[]> | null>(null);
    const [isSearching, setIsSearching] = useState(false);

    // Prepare context data once on render/update to avoid dependency cycles in useEffect
    const searchContext = useMemo(() => ({
        students,
        instructors,
        groups,
        leads,
        // In a real app, tasks and conversations would likely come from context too
        tasks: MOCK_ADMIN_TASKS, 
        conversations: MOCK_CONVERSATIONS
    }), [students, instructors, groups, leads]);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (query.trim()) {
                setIsSearching(true);
                const searchResults = searchGlobal(query, searchContext);
                setResults(searchResults);
                setIsSearching(false);
            } else {
                setResults(null);
            }
        }, 300); // 300ms debounce

        return () => clearTimeout(timeoutId);
    }, [query, searchContext]);

    const totalResults = results 
        ? (Object.values(results) as GlobalSearchResult[][]).reduce((acc, curr) => acc + curr.length, 0)
        : 0;

    return {
        query,
        setQuery,
        results,
        isSearching,
        totalResults
    };
};