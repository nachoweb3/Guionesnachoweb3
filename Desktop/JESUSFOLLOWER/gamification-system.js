// Gamification & Social Proof System for Trading Bot
const fs = require('fs');
const path = require('path');

class GamificationSystem {
    constructor() {
        this.dataFile = './gamification_data.json';
        this.loadData();
    }

    loadData() {
        try {
            if (fs.existsSync(this.dataFile)) {
                const data = JSON.parse(fs.readFileSync(this.dataFile, 'utf8'));
                this.users = data.users || {};
                this.leaderboard = data.leaderboard || [];
                this.achievements = data.achievements || {};
                this.globalStats = data.globalStats || {
                    totalTrades: 0,
                    totalProfit: 0,
                    activeUsers: 0,
                    onlineNow: 0
                };
            } else {
                this.initializeData();
            }
        } catch (error) {
            console.error('Error loading gamification data:', error);
            this.initializeData();
        }
    }

    initializeData() {
        this.users = {};
        this.leaderboard = [];
        this.achievements = {
            firstTrade: { name: "🎯 Primer Trade", desc: "Realiza tu primera operación", points: 10 },
            profit100: { name: "💰 $100 Profit", desc: "Gana $100 en un solo trade", points: 50 },
            profit1000: { name: "💎 $1000 Profit", desc: "Gana $1000 en total", points: 200 },
            trader10: { name: "📈 10 Trades", desc: "Realiza 10 operaciones", points: 30 },
            trader100: { name: "🚀 100 Trades", desc: "Realiza 100 operaciones", points: 150 },
            copyMaster: { name: "👥 Copy Master", desc: "Copia 5 KOLs diferentes", points: 100 },
            monthActive: { name: "🔥 Mes Activo", desc: "Usa el bot por 30 días", points: 75 },
            whale: { name: "🐋 Ballena", desc: "Opera con más de 10 SOL", points: 100 }
        };
        this.globalStats = {
            totalTrades: 2847,
            totalProfit: 45230,
            activeUsers: 1527,
            onlineNow: 89
        };
        this.saveData();
    }

    saveData() {
        try {
            fs.writeFileSync(this.dataFile, JSON.stringify({
                users: this.users,
                leaderboard: this.leaderboard,
                achievements: this.achievements,
                globalStats: this.globalStats
            }));
        } catch (error) {
            console.error('Error saving gamification data:', error);
        }
    }

    // Update user stats
    updateUserStats(userId, action, data = {}) {
        if (!this.users[userId]) {
            this.users[userId] = {
                username: data.username || `User${userId}`,
                points: 0,
                level: 1,
                trades: 0,
                profit: 0,
                streak: 0,
                lastActivity: Date.now(),
                achievements: [],
                rank: 'Novato',
                referrals: 0,
                badges: []
            };
        }

        const user = this.users[userId];
        let pointsEarned = 0;

        switch (action) {
            case 'trade':
                user.trades++;
                this.globalStats.totalTrades++;
                pointsEarned = 5;

                // Check achievements
                if (user.trades === 1) {
                    this.unlockAchievement(userId, 'firstTrade');
                }
                if (user.trades === 10) {
                    this.unlockAchievement(userId, 'trader10');
                }
                if (user.trades === 100) {
                    this.unlockAchievement(userId, 'trader100');
                }

                // Update streak
                const today = new Date().toDateString();
                if (user.lastActivityDate !== today) {
                    user.streak++;
                    user.lastActivityDate = today;
                }
                break;

            case 'profit':
                user.profit += data.amount;
                this.globalStats.totalProfit += data.amount;
                pointsEarned = Math.floor(data.amount * 0.1);

                if (data.amount >= 100) {
                    this.unlockAchievement(userId, 'profit100');
                }
                break;

            case 'referral':
                user.referrals++;
                pointsEarned = 25;
                break;

            case 'level_up':
                user.level++;
                user.rank = this.getRank(user.level);
                pointsEarned = user.level * 20;
                break;
        }

        user.points += pointsEarned;
        user.lastActivity = Date.now();

        // Update leaderboard
        this.updateLeaderboard(userId);

        // Randomly update global stats for realism
        if (Math.random() > 0.7) {
            this.globalStats.onlineNow = Math.floor(80 + Math.random() * 40);
        }

        this.saveData();
        return pointsEarned;
    }

    unlockAchievement(userId, achievementId) {
        const user = this.users[userId];
        if (user && !user.achievements.includes(achievementId)) {
            user.achievements.push(achievementId);
            const achievement = this.achievements[achievementId];
            user.points += achievement.points;

            // Add badge
            user.badges.push(achievementId);

            return {
                unlocked: true,
                achievement: achievement,
                newPoints: achievement.points
            };
        }
        return { unlocked: false };
    }

    getRank(level) {
        const ranks = [
            { level: 1, name: 'Novato', emoji: '🌱' },
            { level: 5, name: 'Aprendiz', emoji: '⭐' },
            { level: 10, name: 'Experto', emoji: '🎯' },
            { level: 20, name: 'Maestro', emoji: '👑' },
            { level: 50, name: 'Leyenda', emoji: '🔥' },
            { level: 100, name: 'Dios Trading', emoji: '⚡' }
        ];

        for (let i = ranks.length - 1; i >= 0; i--) {
            if (level >= ranks[i].level) {
                return `${ranks[i].emoji} ${ranks[i].name}`;
            }
        }
        return '🌱 Novato';
    }

    updateLeaderboard(userId) {
        const user = this.users[userId];
        const existingIndex = this.leaderboard.findIndex(u => u.userId === userId);

        const entry = {
            userId: userId,
            username: user.username,
            profit: user.profit,
            trades: user.trades,
            points: user.points,
            rank: user.rank
        };

        if (existingIndex >= 0) {
            this.leaderboard[existingIndex] = entry;
        } else {
            this.leaderboard.push(entry);
        }

        // Sort by profit
        this.leaderboard.sort((a, b) => b.profit - a.profit);

        // Keep top 20
        this.leaderboard = this.leaderboard.slice(0, 20);
    }

    // Generate social proof messages
    generateSocialProof() {
        const messages = [];

        // Recent trades
        const recentTrades = [
            { user: 'CryptoKing', action: 'compró', token: 'PEPE', profit: '+$234' },
            { user: 'TraderPro', action: 'vendió', token: 'WIF', profit: '+$567' },
            { user: 'MoonShot', action: 'copió', token: 'BONK', profit: '+$123' },
            { user: 'DiamondHands', action: 'compró', token: 'FLOKI', profit: '+$89' },
            { user: 'QuickProfits', action: 'vendió', token: 'SHIB', profit: '+$445' }
        ];

        const trade = recentTrades[Math.floor(Math.random() * recentTrades.length)];
        messages.push(`🎯 ${trade.user} ${trade.action} ${trade.token} con ganancias de ${trade.profit}!`);

        // New upgrades
        if (Math.random() > 0.7) {
            const usernames = ['AlphaTrader', 'CryptoWhale', 'SmartMoney', 'QuickProfits', 'DiamondHands'];
            const plans = ['Basic', 'Pro', 'Enterprise'];
            const username = usernames[Math.floor(Math.random() * usernames.length)];
            const plan = plans[Math.floor(Math.random() * plans.length)];
            messages.push(`🚀 ${username} acaba de actualizar a plan ${plan}!`);
        }

        // Achievement unlocks
        if (Math.random() > 0.8) {
            const achievement = Object.values(this.achievements)[Math.floor(Math.random() * 5)];
            messages.push(`🏆 ¡Alguien desbloqueó "${achievement.name}"!`);
        }

        // Global stats
        messages.push(`👥 ${this.globalStats.onlineNow} usuarios operando ahora mismo`);

        return messages;
    }

    // Get user profile for display
    getUserProfile(userId) {
        const user = this.users[userId];
        if (!user) {
            return null;
        }

        return {
            username: user.username,
            level: user.level,
            rank: user.rank,
            points: user.points,
            trades: user.trades,
            profit: user.profit,
            streak: user.streak,
            achievements: user.achievements.map(id => this.achievements[id]),
            badges: user.badges,
            nextLevelPoints: (user.level + 1) * 100 - user.points,
            progress: (user.points % 100)
        };
    }

    // Get leaderboard with pagination
    getLeaderboard(page = 1, limit = 10) {
        const start = (page - 1) * limit;
        const end = start + limit;

        return {
            users: this.leaderboard.slice(start, end),
            currentPage: page,
            totalPages: Math.ceil(this.leaderboard.length / limit),
            userRank: userId => {
                const index = this.leaderboard.findIndex(u => u.userId === userId);
                return index >= 0 ? index + 1 : null;
            }
        };
    }

    // Daily challenges
    getDailyChallenges() {
        const challenges = [
            { id: 'daily_trader', desc: 'Realiza 5 trades', reward: 25, type: 'trades', target: 5 },
            { id: 'profit_seeker', desc: 'Gana $50 en profit', reward: 50, type: 'profit', target: 50 },
            { id: 'copy_expert', desc: 'Copia 3 KOLs diferentes', reward: 30, type: 'copy', target: 3 },
            { id: 'social_butterfly', desc: 'Refiere 1 amigo', reward: 40, type: 'referral', target: 1 }
        ];

        return challenges.slice(0, 3);
    }
}

module.exports = GamificationSystem;