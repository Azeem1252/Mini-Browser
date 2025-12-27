import { useEffect, useCallback, useMemo } from 'react';

export interface KeyBinding {
    key: string;
    ctrl?: boolean;
    alt?: boolean;
    shift?: boolean;
    meta?: boolean;
    action: () => void;
    description?: string;
    preventDefault?: boolean;
}

interface UseKeyboardShortcutsOptions {
    enabled?: boolean;
    target?: 'window' | 'document';
}

/**
 * Custom hook for managing keyboard shortcuts
 * Provides a declarative way to define and handle keyboard shortcuts
 */
export function useKeyboardShortcuts(
    bindings: KeyBinding[],
    options: UseKeyboardShortcutsOptions = {}
) {
    const { enabled = true, target = 'window' } = options;

    const bindingsMap = useMemo(() => {
        const map = new Map<string, KeyBinding>();
        bindings.forEach((binding) => {
            const key = createShortcutKey(binding);
            map.set(key, binding);
        });
        return map;
    }, [bindings]);

    const handleKeyDown = useCallback(
        (event: KeyboardEvent) => {
            if (!enabled) return;

            // Don't trigger shortcuts when typing in inputs
            const target = event.target as HTMLElement;
            if (
                target.tagName === 'INPUT' ||
                target.tagName === 'TEXTAREA' ||
                target.isContentEditable
            ) {
                // Allow certain shortcuts even in inputs
                const isEscapeOrCommandPalette =
                    event.key === 'Escape' ||
                    (event.ctrlKey && event.key === 'k');
                if (!isEscapeOrCommandPalette) return;
            }

            const key = createShortcutKey({
                key: event.key.toLowerCase(),
                ctrl: event.ctrlKey,
                alt: event.altKey,
                shift: event.shiftKey,
                meta: event.metaKey,
                action: () => {},
            });

            const binding = bindingsMap.get(key);
            if (binding) {
                if (binding.preventDefault !== false) {
                    event.preventDefault();
                }
                binding.action();
            }
        },
        [enabled, bindingsMap]
    );

    useEffect(() => {
        const eventTarget = target === 'window' ? window : document;
        eventTarget.addEventListener('keydown', handleKeyDown as EventListener);
        return () => {
            eventTarget.removeEventListener('keydown', handleKeyDown as EventListener);
        };
    }, [handleKeyDown, target]);

    // Return helper to get shortcut display string
    const getShortcutString = useCallback((binding: KeyBinding): string => {
        const parts: string[] = [];
        if (binding.ctrl) parts.push('Ctrl');
        if (binding.alt) parts.push('Alt');
        if (binding.shift) parts.push('Shift');
        if (binding.meta) parts.push('⌘');
        parts.push(binding.key.toUpperCase());
        return parts.join('+');
    }, []);

    return { getShortcutString };
}

function createShortcutKey(binding: KeyBinding): string {
    return `${binding.ctrl ? 'ctrl+' : ''}${binding.alt ? 'alt+' : ''}${binding.shift ? 'shift+' : ''}${binding.meta ? 'meta+' : ''}${binding.key.toLowerCase()}`;
}

// Pre-defined common shortcuts
export const COMMON_SHORTCUTS = {
    NEW_TAB: { key: 't', ctrl: true },
    CLOSE_TAB: { key: 'w', ctrl: true },
    REOPEN_TAB: { key: 't', ctrl: true, shift: true },
    NEXT_TAB: { key: 'Tab', ctrl: true },
    PREV_TAB: { key: 'Tab', ctrl: true, shift: true },
    REFRESH: { key: 'r', ctrl: true },
    HARD_REFRESH: { key: 'r', ctrl: true, shift: true },
    BACK: { key: 'ArrowLeft', alt: true },
    FORWARD: { key: 'ArrowRight', alt: true },
    HOME: { key: 'Home', alt: true },
    BOOKMARK: { key: 'd', ctrl: true },
    HISTORY: { key: 'h', ctrl: true },
    DOWNLOADS: { key: 'j', ctrl: true },
    FIND: { key: 'f', ctrl: true },
    ZOOM_IN: { key: '=', ctrl: true },
    ZOOM_OUT: { key: '-', ctrl: true },
    ZOOM_RESET: { key: '0', ctrl: true },
    COMMAND_PALETTE: { key: 'k', ctrl: true },
    FULLSCREEN: { key: 'F11' },
    DEV_TOOLS: { key: 'F12' },
};
