import React, { useState, useRef, useEffect } from 'react';
import './AddressBar.css';

interface AddressBarProps {
    url: string;
    isLoading: boolean;
    isSecure?: boolean;
    canGoBack?: boolean;
    canGoForward?: boolean;
    onNavigate: (url: string) => void;
    onBack?: () => void;
    onForward?: () => void;
    onRefresh?: () => void;
    onHome?: () => void;
}

export const AddressBar: React.FC<AddressBarProps> = ({
    url,
    isLoading,
    isSecure,
    onNavigate,
}) => {
    const [inputValue, setInputValue] = useState(url);
    const [isFocused, setIsFocused] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!isFocused) {
            setInputValue(url);
        }
    }, [url, isFocused]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputValue.trim()) {
            onNavigate(inputValue.trim());
            inputRef.current?.blur();
        }
    };

    const handleFocus = () => {
        setIsFocused(true);
        inputRef.current?.select();
    };

    const handleBlur = () => {
        setIsFocused(false);
    };

    return (
        <form className="address-bar" onSubmit={handleSubmit}>
            <div className="address-bar-container">
                <div className="address-bar-icon">
                    {isLoading ? (
                        <svg className="animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <circle cx="12" cy="12" r="10" strokeWidth="2" strokeDasharray="60" strokeDashoffset="15" />
                        </svg>
                    ) : isSecure ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" strokeWidth="2" />
                            <path d="M7 11V7a5 5 0 0110 0v4" strokeWidth="2" />
                        </svg>
                    ) : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <circle cx="12" cy="12" r="10" strokeWidth="2" />
                            <path d="M12 8v4M12 16h.01" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    )}
                </div>

                <input
                    ref={inputRef}
                    type="text"
                    className="address-input"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    placeholder="Search or enter address"
                    spellCheck={false}
                    autoComplete="off"
                />

                {inputValue && isFocused && (
                    <button
                        type="button"
                        className="clear-button"
                        onClick={() => {
                            setInputValue('');
                            inputRef.current?.focus();
                        }}
                        aria-label="Clear"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <circle cx="12" cy="12" r="10" strokeWidth="2" />
                            <path d="M15 9l-6 6M9 9l6 6" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </button>
                )}
            </div>
        </form>
    );
};
