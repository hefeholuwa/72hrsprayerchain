export interface PrayerTheme {
    title: string;
    scripture: string;
    points: string[];
    colorScheme: {
        primary: string;      // Main accent color (hex)
        glow: string;         // Glow/ambient color (hex)
        background: string;   // Radial gradient stop (rgba)
    };
}

export const PRAYER_THEMES: Record<number, PrayerTheme> = {
    0: {
        title: "Theme: Coming Soon",
        scripture: "Prepare your hearts for the upcoming watch.",
        points: [
            "Prayer points for this watch will be updated shortly."
        ],
        colorScheme: {
            primary: "#7c3aed",      // Deep Purple
            glow: "#4c1d95",         // Royal Purple
            background: "rgba(124, 58, 237, 0.08)"
        }
    },
    6: {
        title: "Theme: Coming Soon",
        scripture: "Prepare your hearts for the upcoming watch.",
        points: [
            "Prayer points for this watch will be updated shortly."
        ],
        colorScheme: {
            primary: "#f59e0b",      // Amber Gold
            glow: "#b45309",         // Deep Amber
            background: "rgba(245, 158, 11, 0.08)"
        }
    },
    12: {
        title: "Theme: Coming Soon",
        scripture: "Prepare your hearts for the upcoming watch.",
        points: [
            "Prayer points for this watch will be updated shortly."
        ],
        colorScheme: {
            primary: "#f97316",      // Bright Orange
            glow: "#ea580c",         // Fiery Orange
            background: "rgba(249, 115, 22, 0.08)"
        }
    },
    18: {
        title: "Theme: Coming Soon",
        scripture: "Prepare your hearts for the upcoming watch.",
        points: [
            "Prayer points for this watch will be updated shortly."
        ],
        colorScheme: {
            primary: "#dc2626",      // Deep Red
            glow: "#991b1b",         // Ember Red
            background: "rgba(220, 38, 38, 0.08)"
        }
    }
};

export const getCurrentTheme = () => {
    const hour = new Date().getHours();
    if (hour >= 0 && hour < 6) return PRAYER_THEMES[0];
    if (hour >= 6 && hour < 12) return PRAYER_THEMES[6];
    if (hour >= 12 && hour < 18) return PRAYER_THEMES[12];
    return PRAYER_THEMES[18];
};
