export interface PrayerTheme {
    title: string;
    scripture: string;
    points: string[];
}

export const PRAYER_THEMES: Record<number, PrayerTheme> = {
    0: {
        title: "Personal Purification & Consecration",
        scripture: "Psalm 51:10 - Create in me a clean heart, O God; and renew a right spirit within me.",
        points: [
            "Repentance from personal and secret sins.",
            "Fresh hunger for the Word and Presence of God.",
            "Yielding our members as instruments of righteousness."
        ]
    },
    6: {
        title: "The Church & Global Harvest",
        scripture: "Matthew 16:18 - I will build my church; and the gates of hell shall not prevail against it.",
        points: [
            "Spiritual awakening in the local church.",
            "Boldness for missionaries in unreached territories.",
            "Unity among the Body of Christ."
        ]
    },
    12: {
        title: "National Transformation & Leadership",
        scripture: "2 Chronicles 7:14 - If my people... shall humble themselves and pray... then will I hear from heaven and will heal their land.",
        points: [
            "Wisdom for leaders and policy makers.",
            "Peace and security within our borders.",
            "Economic restoration and justice for the poor."
        ]
    },
    18: {
        title: "Families & The Next Generation",
        scripture: "Malachi 4:6 - And he shall turn the heart of the fathers to the children, and the heart of the children to their fathers.",
        points: [
            "Restoration of broken homes and marriages.",
            "Protection of the youth from negative influences.",
            "Transmission of faith to the coming generation."
        ]
    }
};

export const getCurrentTheme = () => {
    const hour = new Date().getHours();
    if (hour >= 0 && hour < 6) return PRAYER_THEMES[0];
    if (hour >= 6 && hour < 12) return PRAYER_THEMES[6];
    if (hour >= 12 && hour < 18) return PRAYER_THEMES[12];
    return PRAYER_THEMES[18];
};
