import { useEffect, useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import type { ThemeName } from '../types';

interface UseThemeReturn {
    theme: ThemeName;
    setTheme: (theme: ThemeName) => void;
    toggleTheme: () => void;
    isDark: boolean;
    systemPreference: 'dark' | 'light';
}

/**
 * Custom hook for managing browser theme
 * Supports system preference detection and auto mode
 */
export function useTheme(defaultTheme: ThemeName = 'dark'): UseThemeReturn {
    const [theme, setThemeState] = useLocalStorage<ThemeName>('browser_theme', defaultTheme);

    // Get system preference
    const getSystemPreference = useCallback((): 'dark' | 'light' => {
        if (typeof window !== 'undefined' && window.matchMedia) {
            return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        return 'dark';
    }, []);

    // Get effective theme (resolving 'auto')
    const getEffectiveTheme = useCallback(
        (themeName: ThemeName): ThemeName => {
            if (themeName === 'auto') {
                return getSystemPreference();
            }
            return themeName;
        },
        [getSystemPreference]
    );

    // Apply theme to document
    const applyTheme = useCallback((themeName: ThemeName) => {
        const effectiveTheme = themeName === 'auto' ? getSystemPreference() : themeName;
        document.documentElement.setAttribute('data-theme', effectiveTheme);
        
        // Update meta theme-color for mobile browsers
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
            const colors: Record<string, string> = {
                dark: '#0f0f0f',
                light: '#ffffff',
                ocean: '#0a1929',
                forest: '#1a2f1a',
                sunset: '#2d1b2e',
                cyberpunk: '#0d0221',
                dracula: '#282a36',
                nord: '#2e3440',
                solarized: '#002b36',
            };
            metaThemeColor.setAttribute('content', colors[effectiveTheme] || colors.dark);
        }

        // Dispatch custom event for theme changes
        window.dispatchEvent(new CustomEvent('themeChange', { detail: { theme: effectiveTheme } }));
    }, [getSystemPreference]);

    // Set theme
    const setTheme = useCallback(
        (newTheme: ThemeName) => {
            setThemeState(newTheme);
            applyTheme(newTheme);
        },
        [setThemeState, applyTheme]
    );

    // Toggle between dark and light
    const toggleTheme = useCallback(() => {
        const effectiveTheme = getEffectiveTheme(theme);
        const newTheme = effectiveTheme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
    }, [theme, getEffectiveTheme, setTheme]);

    // Apply theme on mount and when theme changes
    useEffect(() => {
        applyTheme(theme);
    }, [theme, applyTheme]);

    // Listen for system preference changes when in auto mode
    useEffect(() => {
        if (theme !== 'auto') return;

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = () => {
            applyTheme('auto');
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [theme, applyTheme]);

    const isDark = ['dark', 'ocean', 'forest', 'sunset', 'cyberpunk', 'dracula', 'nord', 'solarized'].includes(
        getEffectiveTheme(theme)
    );

    return {
        theme,
        setTheme,
        toggleTheme,
        isDark,
        systemPreference: getSystemPreference(),
    };
}
