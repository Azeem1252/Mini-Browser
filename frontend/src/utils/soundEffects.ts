// Sound effects manager
class SoundEffects {
    private enabled: boolean = true;
    private audioContext: AudioContext | null = null;

    constructor() {
        // Check if sound is enabled in settings
        const settings = localStorage.getItem('browser_settings');
        if (settings) {
            const parsed = JSON.parse(settings);
            this.enabled = parsed.soundEffects !== false;
        }
    }

    private getAudioContext(): AudioContext {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        return this.audioContext;
    }

    private playTone(frequency: number, duration: number, type: OscillatorType = 'sine') {
        if (!this.enabled) return;

        try {
            const ctx = this.getAudioContext();
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);

            oscillator.frequency.value = frequency;
            oscillator.type = type;

            gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

            oscillator.start(ctx.currentTime);
            oscillator.stop(ctx.currentTime + duration);
        } catch (err) {
            console.error('Sound effect error:', err);
        }
    }

    // Tab sounds
    tabOpen() {
        this.playTone(800, 0.1, 'sine');
        setTimeout(() => this.playTone(1000, 0.1, 'sine'), 50);
    }

    tabClose() {
        this.playTone(600, 0.1, 'sine');
        setTimeout(() => this.playTone(400, 0.1, 'sine'), 50);
    }

    // Navigation sounds
    navigate() {
        this.playTone(500, 0.05, 'square');
    }

    // Bookmark sounds
    bookmarkAdd() {
        this.playTone(600, 0.08, 'sine');
        setTimeout(() => this.playTone(800, 0.08, 'sine'), 60);
        setTimeout(() => this.playTone(1000, 0.1, 'sine'), 120);
    }

    bookmarkRemove() {
        this.playTone(800, 0.08, 'sine');
        setTimeout(() => this.playTone(600, 0.1, 'sine'), 60);
    }

    // Success/Error sounds
    success() {
        this.playTone(800, 0.1, 'sine');
        setTimeout(() => this.playTone(1200, 0.15, 'sine'), 100);
    }

    error() {
        this.playTone(300, 0.2, 'sawtooth');
    }

    // Click sound
    click() {
        this.playTone(1000, 0.03, 'square');
    }

    // Enable/disable sounds
    setEnabled(enabled: boolean) {
        this.enabled = enabled;
    }

    isEnabled(): boolean {
        return this.enabled;
    }
}

export const soundEffects = new SoundEffects();
