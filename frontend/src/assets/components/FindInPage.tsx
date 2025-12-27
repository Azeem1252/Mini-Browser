import React, { useState, useEffect, useRef } from 'react';
import './FindInPage.css';

interface FindInPageProps {
    isOpen: boolean;
    onClose: () => void;
    content: string;
}

export const FindInPage: React.FC<FindInPageProps> = ({ isOpen, onClose, content }) => {
    const [query, setQuery] = useState('');
    const [currentMatch, setCurrentMatch] = useState(0);
    const [totalMatches, setTotalMatches] = useState(0);
    const [matchCase, setMatchCase] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            inputRef.current?.focus();
            inputRef.current?.select();
        }
    }, [isOpen]);

    useEffect(() => {
        if (!query || !content) {
            setTotalMatches(0);
            setCurrentMatch(0);
            return;
        }

        const searchContent = matchCase ? content : content.toLowerCase();
        const searchQuery = matchCase ? query : query.toLowerCase();

        let count = 0;
        let pos = 0;
        while ((pos = searchContent.indexOf(searchQuery, pos)) !== -1) {
            count++;
            pos += searchQuery.length;
        }

        setTotalMatches(count);
        setCurrentMatch(count > 0 ? 1 : 0);
    }, [query, content, matchCase]);

    const handleNext = () => {
        if (totalMatches > 0) {
            setCurrentMatch((prev) => (prev >= totalMatches ? 1 : prev + 1));
        }
    };

    const handlePrevious = () => {
        if (totalMatches > 0) {
            setCurrentMatch((prev) => (prev <= 1 ? totalMatches : prev - 1));
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            if (e.shiftKey) {
                handlePrevious();
            } else {
                handleNext();
            }
        } else if (e.key === 'Escape') {
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="find-in-page">
            <div className="find-input-container">
                <svg className="find-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="11" cy="11" r="8" strokeWidth="2" />
                    <path d="M21 21l-4.35-4.35" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <input
                    ref={inputRef}
                    type="text"
                    className="find-input"
                    placeholder="Find in page"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                />
                {query && (
                    <span className="find-matches">
                        {totalMatches > 0 ? `${currentMatch} of ${totalMatches}` : 'No matches'}
                    </span>
                )}
            </div>

            <div className="find-actions">
                <button
                    className="find-nav-button"
                    onClick={handlePrevious}
                    disabled={totalMatches === 0}
                    title="Previous match (Shift+Enter)"
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M19 12H5M12 19l-7-7 7-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>
                <button
                    className="find-nav-button"
                    onClick={handleNext}
                    disabled={totalMatches === 0}
                    title="Next match (Enter)"
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M5 12h14M12 5l7 7-7 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>
                <button
                    className={`find-toggle ${matchCase ? 'active' : ''}`}
                    onClick={() => setMatchCase(!matchCase)}
                    title="Match case"
                >
                    Aa
                </button>
                <button className="find-close" onClick={onClose} title="Close (Esc)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M18 6L6 18M6 6l12 12" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                </button>
            </div>
        </div>
    );
};
