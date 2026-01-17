/* ============================================================================
   SPELIN PROGRESS TRACKING MODULE
   Tracks user progress, achievements, and statistics across the site
   ============================================================================ */

// =============================================================================
// PROGRESS DATA STRUCTURE
// =============================================================================

const DEFAULT_PROGRESS = {
    // Learning progress
    phonemesMastered: [],
    phonemesReviewed: [],

    // Game stats
    games: {
        soundMatch: { played: 0, highScore: 0, totalCorrect: 0, totalIncorrect: 0 },
        spellIt: { played: 0, highScore: 0, totalCorrect: 0, totalIncorrect: 0 },
        readIt: { played: 0, highScore: 0, totalCorrect: 0, totalIncorrect: 0 },
        flashCards: { sessionsCompleted: 0, cardsMastered: 0, cardsReviewed: 0 }
    },

    // Reader stats
    reader: {
        textsRead: 0,
        wordsRead: 0,
        timeSpent: 0 // in seconds
    },

    // Typing stats
    typing: {
        charactersTyped: 0,
        wordsConverted: 0
    },

    // Achievements
    achievements: [],

    // Settings
    settings: {
        hoverSpeak: true,
        soundEnabled: true
    },

    // Timestamps
    firstVisit: null,
    lastVisit: null,
    totalVisits: 0
};

// =============================================================================
// ACHIEVEMENTS DEFINITIONS
// =============================================================================

const ACHIEVEMENTS = {
    // Learning
    first_phoneme: {
        id: 'first_phoneme',
        name: 'First Sound',
        description: 'Listen to your first phoneme',
        icon: '🔊'
    },
    all_consonants: {
        id: 'all_consonants',
        name: 'Consonant Master',
        description: 'Learn all consonant sounds',
        icon: '🔤'
    },
    all_vowels: {
        id: 'all_vowels',
        name: 'Vowel Virtuoso',
        description: 'Learn all vowel sounds',
        icon: '🅰️'
    },
    all_phonemes: {
        id: 'all_phonemes',
        name: 'Complete Alphabet',
        description: 'Master all 42 phonemes',
        icon: '🏆'
    },

    // Games
    first_game: {
        id: 'first_game',
        name: 'Game On',
        description: 'Play your first game',
        icon: '🎮'
    },
    perfect_round: {
        id: 'perfect_round',
        name: 'Perfect Round',
        description: 'Get 100% in any game',
        icon: '💯'
    },
    streak_5: {
        id: 'streak_5',
        name: 'On a Roll',
        description: 'Get a 5-answer streak',
        icon: '🔥'
    },
    streak_10: {
        id: 'streak_10',
        name: 'Unstoppable',
        description: 'Get a 10-answer streak',
        icon: '⚡'
    },
    high_scorer: {
        id: 'high_scorer',
        name: 'High Scorer',
        description: 'Score over 100 points in a game',
        icon: '⭐'
    },

    // Reader
    first_read: {
        id: 'first_read',
        name: 'First Read',
        description: 'Read your first text',
        icon: '📖'
    },
    bookworm: {
        id: 'bookworm',
        name: 'Bookworm',
        description: 'Read 10 texts',
        icon: '📚'
    },

    // Typing
    first_type: {
        id: 'first_type',
        name: 'First Words',
        description: 'Type your first spelin text',
        icon: '⌨️'
    },
    typist: {
        id: 'typist',
        name: 'Typist',
        description: 'Type 100 characters',
        icon: '✍️'
    },

    // Dedication
    returning_student: {
        id: 'returning_student',
        name: 'Returning Student',
        description: 'Come back for a second visit',
        icon: '👋'
    },
    dedicated_learner: {
        id: 'dedicated_learner',
        name: 'Dedicated Learner',
        description: 'Visit 5 times',
        icon: '🎓'
    }
};

// =============================================================================
// PROGRESS CLASS
// =============================================================================

class SpelinProgress {
    constructor() {
        this.storageKey = 'spelinProgress';
        this.progress = this.load();
        this.updateVisit();
    }

    // Load progress from localStorage
    load() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (saved) {
                const parsed = JSON.parse(saved);
                // Merge with defaults to handle new fields
                return this.mergeDeep(DEFAULT_PROGRESS, parsed);
            }
        } catch (e) {
            console.warn('Failed to load progress:', e);
        }
        return { ...DEFAULT_PROGRESS };
    }

    // Save progress to localStorage
    save() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.progress));
        } catch (e) {
            console.warn('Failed to save progress:', e);
        }
    }

    // Deep merge objects
    mergeDeep(target, source) {
        const output = { ...target };
        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                output[key] = this.mergeDeep(target[key] || {}, source[key]);
            } else {
                output[key] = source[key];
            }
        }
        return output;
    }

    // Update visit timestamps
    updateVisit() {
        const now = new Date().toISOString();
        if (!this.progress.firstVisit) {
            this.progress.firstVisit = now;
        }
        this.progress.lastVisit = now;
        this.progress.totalVisits++;

        // Check for visit achievements
        if (this.progress.totalVisits === 2) {
            this.unlockAchievement('returning_student');
        }
        if (this.progress.totalVisits >= 5) {
            this.unlockAchievement('dedicated_learner');
        }

        this.save();
    }

    // ==========================================================================
    // PHONEME TRACKING
    // ==========================================================================

    markPhonemePlayed(phoneme) {
        if (!this.progress.phonemesReviewed.includes(phoneme)) {
            this.progress.phonemesReviewed.push(phoneme);

            // First phoneme achievement
            if (this.progress.phonemesReviewed.length === 1) {
                this.unlockAchievement('first_phoneme');
            }

            this.checkPhonemeAchievements();
            this.save();
        }
    }

    markPhonemeMastered(phoneme) {
        if (!this.progress.phonemesMastered.includes(phoneme)) {
            this.progress.phonemesMastered.push(phoneme);
            this.checkPhonemeAchievements();
            this.save();
        }
    }

    checkPhonemeAchievements() {
        const consonants = ['p', 'b', 't', 'd', 'k', 'g', 'f', 'v', 's', 'z', 'h', 'm', 'n', 'l', 'r', 'w', 'y', 'c', 'j', 'x', 'X', 'q', '3', '8'];
        const vowels = ['a', 'e', 'i', 'o', 'u', 'A', 'E', 'I', 'O', 'U', 'W', '0', '4', '7', '9', '6', '1', '2'];

        const masteredConsonants = consonants.filter(c => this.progress.phonemesMastered.includes(c));
        const masteredVowels = vowels.filter(v => this.progress.phonemesMastered.includes(v));

        if (masteredConsonants.length === consonants.length) {
            this.unlockAchievement('all_consonants');
        }

        if (masteredVowels.length === vowels.length) {
            this.unlockAchievement('all_vowels');
        }

        if (this.progress.phonemesMastered.length >= 42) {
            this.unlockAchievement('all_phonemes');
        }
    }

    // ==========================================================================
    // GAME TRACKING
    // ==========================================================================

    recordGameResult(game, result) {
        const gameStats = this.progress.games[game];
        if (!gameStats) return;

        gameStats.played++;
        gameStats.totalCorrect += result.correct || 0;
        gameStats.totalIncorrect += result.incorrect || 0;

        if (result.score > gameStats.highScore) {
            gameStats.highScore = result.score;
        }

        // Achievements
        if (this.getTotalGamesPlayed() === 1) {
            this.unlockAchievement('first_game');
        }

        if (result.accuracy === 100) {
            this.unlockAchievement('perfect_round');
        }

        if (result.bestStreak >= 5) {
            this.unlockAchievement('streak_5');
        }

        if (result.bestStreak >= 10) {
            this.unlockAchievement('streak_10');
        }

        if (result.score >= 100) {
            this.unlockAchievement('high_scorer');
        }

        this.save();
    }

    recordFlashCardSession(mastered, reviewed) {
        this.progress.games.flashCards.sessionsCompleted++;
        this.progress.games.flashCards.cardsMastered += mastered;
        this.progress.games.flashCards.cardsReviewed += reviewed;

        // Mark mastered phonemes
        // (Assuming mastered is an array of phoneme characters)
        if (Array.isArray(mastered)) {
            mastered.forEach(char => this.markPhonemeMastered(char));
        }

        this.save();
    }

    getTotalGamesPlayed() {
        return Object.values(this.progress.games).reduce((sum, g) => sum + (g.played || 0), 0);
    }

    getHighScore(game) {
        return this.progress.games[game]?.highScore || 0;
    }

    // ==========================================================================
    // READER TRACKING
    // ==========================================================================

    recordTextRead(wordCount) {
        this.progress.reader.textsRead++;
        this.progress.reader.wordsRead += wordCount;

        if (this.progress.reader.textsRead === 1) {
            this.unlockAchievement('first_read');
        }

        if (this.progress.reader.textsRead >= 10) {
            this.unlockAchievement('bookworm');
        }

        this.save();
    }

    // ==========================================================================
    // TYPING TRACKING
    // ==========================================================================

    recordTyping(charCount) {
        const wasZero = this.progress.typing.charactersTyped === 0;
        this.progress.typing.charactersTyped += charCount;

        if (wasZero && charCount > 0) {
            this.unlockAchievement('first_type');
        }

        if (this.progress.typing.charactersTyped >= 100) {
            this.unlockAchievement('typist');
        }

        this.save();
    }

    // ==========================================================================
    // ACHIEVEMENTS
    // ==========================================================================

    unlockAchievement(achievementId) {
        if (!this.progress.achievements.includes(achievementId)) {
            this.progress.achievements.push(achievementId);
            this.save();

            // Dispatch event for UI notification
            const achievement = ACHIEVEMENTS[achievementId];
            if (achievement) {
                window.dispatchEvent(new CustomEvent('achievementUnlocked', {
                    detail: achievement
                }));
            }

            return true;
        }
        return false;
    }

    hasAchievement(achievementId) {
        return this.progress.achievements.includes(achievementId);
    }

    getAchievements() {
        return this.progress.achievements.map(id => ACHIEVEMENTS[id]).filter(Boolean);
    }

    getAllAchievements() {
        return Object.values(ACHIEVEMENTS);
    }

    getAchievementProgress() {
        return {
            unlocked: this.progress.achievements.length,
            total: Object.keys(ACHIEVEMENTS).length
        };
    }

    // ==========================================================================
    // STATISTICS
    // ==========================================================================

    getStats() {
        return {
            phonemesMastered: this.progress.phonemesMastered.length,
            phonemesReviewed: this.progress.phonemesReviewed.length,
            gamesPlayed: this.getTotalGamesPlayed(),
            textsRead: this.progress.reader.textsRead,
            wordsRead: this.progress.reader.wordsRead,
            charactersTyped: this.progress.typing.charactersTyped,
            achievements: this.progress.achievements.length,
            totalVisits: this.progress.totalVisits,
            firstVisit: this.progress.firstVisit,
            lastVisit: this.progress.lastVisit
        };
    }

    // ==========================================================================
    // RESET
    // ==========================================================================

    reset() {
        this.progress = { ...DEFAULT_PROGRESS };
        this.progress.firstVisit = new Date().toISOString();
        this.progress.lastVisit = new Date().toISOString();
        this.progress.totalVisits = 1;
        this.save();
    }
}

// =============================================================================
// ACHIEVEMENT NOTIFICATION UI
// =============================================================================

function showAchievementNotification(achievement) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'achievement-notification';
    notification.innerHTML = `
        <div class="achievement-icon">${achievement.icon}</div>
        <div class="achievement-content">
            <div class="achievement-title">Achievement Unlocked!</div>
            <div class="achievement-name">${achievement.name}</div>
            <div class="achievement-desc">${achievement.description}</div>
        </div>
    `;

    // Add styles if not already present
    if (!document.getElementById('achievement-styles')) {
        const styles = document.createElement('style');
        styles.id = 'achievement-styles';
        styles.textContent = `
            .achievement-notification {
                position: fixed;
                bottom: 100px;
                right: 20px;
                background: var(--bg-secondary, #16213e);
                border: 2px solid var(--accent, #00d9ff);
                border-radius: 12px;
                padding: 16px 20px;
                display: flex;
                align-items: center;
                gap: 16px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), 0 0 20px rgba(0, 217, 255, 0.3);
                z-index: 1000;
                animation: slideInRight 0.5s ease, fadeOut 0.5s ease 3.5s forwards;
                max-width: 350px;
            }

            .achievement-icon {
                font-size: 2.5rem;
            }

            .achievement-content {
                flex: 1;
            }

            .achievement-title {
                font-size: 0.75rem;
                color: var(--accent, #00d9ff);
                text-transform: uppercase;
                letter-spacing: 1px;
                margin-bottom: 4px;
            }

            .achievement-name {
                font-size: 1.1rem;
                font-weight: 600;
                color: var(--text-primary, #e8e8e8);
                margin-bottom: 2px;
            }

            .achievement-desc {
                font-size: 0.85rem;
                color: var(--text-secondary, #a0a0a0);
            }

            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }

            @keyframes fadeOut {
                to {
                    opacity: 0;
                    visibility: hidden;
                }
            }
        `;
        document.head.appendChild(styles);
    }

    document.body.appendChild(notification);

    // Remove after animation
    setTimeout(() => {
        notification.remove();
    }, 4000);
}

// Listen for achievement events
window.addEventListener('achievementUnlocked', (e) => {
    showAchievementNotification(e.detail);
});

// =============================================================================
// EXPORTS
// =============================================================================

// Create global instance
const spelinProgress = new SpelinProgress();

window.spelinProgress = spelinProgress;
window.ACHIEVEMENTS = ACHIEVEMENTS;
