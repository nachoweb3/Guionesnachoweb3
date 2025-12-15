// Social Proof Feed Generator
// Generates realistic social proof messages for the bot

class SocialProofFeed {
    constructor() {
        this.usernames = this.generateUsernames();
        this.tokens = this.generateTokens();
        this.actions = ['compró', 'vendió', 'copió'];
        this.profits = [45, 67, 89, 123, 156, 234, 345, 456, 567, 789, 890, 1234];
        this.platforms = ['Pump.fun', 'Raydium', 'Orca', 'Jupiter'];
    }

    generateUsernames() {
        const prefixes = ['Crypto', 'Trader', 'Moon', 'Diamond', 'Smart', 'Quick', 'Profit', 'Alpha', 'Whale', 'Bull'];
        const suffixes = ['King', 'Master', 'Pro', 'Expert', 'Hunter', 'Wizard', 'Guru', 'Ninja', 'Ace', 'Star'];
        const names = [];

        for (let i = 0; i < 50; i++) {
            const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
            const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
            const number = Math.floor(Math.random() * 999) + 1;
            names.push(`${prefix}${suffix}${number}`);
        }

        return names;
    }

    generateTokens() {
        return [
            'PEPE', 'WIF', 'BONK', 'FLOKI', 'SHIB', 'DOGE', 'MEME', 'PEPE2.0',
            'GROK', 'BODEN', 'WEN', 'JUP', 'RAY', 'SOL', 'USDT', 'PYTH',
            'RNDR', 'HNT', 'LUNA', 'USTC', 'FTT', 'SRM', 'OXY'
        ];
    }

    // Generate random social proof message
    generateMessage() {
        const types = [
            this.generateTradeMessage,
            this.generateProfitMessage,
            this.generateUpgradeMessage,
            this.generateAchievementMessage,
            this.generateStatsMessage
        ];

        const generator = types[Math.floor(Math.random() * types.length)];
        return generator.call(this);
    }

    generateTradeMessage() {
        const username = this.usernames[Math.floor(Math.random() * this.usernames.length)];
        const action = this.actions[Math.floor(Math.random() * this.actions.length)];
        const token = this.tokens[Math.floor(Math.random() * this.tokens.length)];
        const profit = this.profits[Math.floor(Math.random() * this.profits.length)];
        const platform = this.platforms[Math.floor(Math.random() * this.platforms.length)];

        return {
            type: 'trade',
            message: `🎯 ${username} ${action} ${token} en ${platform} con ganancias de +$${profit}!`,
            data: { username, action, token, profit, platform }
        };
    }

    generateProfitMessage() {
        const usernames = ['CryptoKing789', 'DiamondHands234', 'ProfitHunter567', 'AlphaTrader123'];
        const username = usernames[Math.floor(Math.random() * usernames.length)];
        const time = ['hoy', 'en 1 hora', 'en 30 min', 'esta mañana'];
        const profit = [234, 567, 890, 1234, 2345, 3456];

        return {
            type: 'profit',
            message: `💰 ${username} ha ganado $${profit[Math.floor(Math.random() * profit.length)]} ${time[Math.floor(Math.random() * time.length)]}!`,
            data: { username, profit }
        };
    }

    generateUpgradeMessage() {
        const plans = ['Basic', 'Pro', 'Enterprise'];
        const username = this.usernames[Math.floor(Math.random() * this.usernames.length)];
        const plan = plans[Math.floor(Math.random() * plans.length)];

        return {
            type: 'upgrade',
            message: `🚀 ${username} acaba de actualizar al plan ${plan}!`,
            data: { username, plan }
        };
    }

    generateAchievementMessage() {
        const achievements = [
            '🏆 "Primer Trade"',
            '💎 "Ballena Status"',
            '🔥 "Racha de 7 días"',
            '👑 "Top Trader"',
            '⚡ "Speed Demon"'
        ];
        const achievement = achievements[Math.floor(Math.random() * achievements.length)];

        return {
            type: 'achievement',
            message: `¡Alguien desbloqueó ${achievement}!`,
            data: { achievement }
        };
    }

    generateStatsMessage() {
        const onlineUsers = Math.floor(85 + Math.random() * 50);
        const totalTrades = 2000 + Math.floor(Math.random() * 1000);
        const totalProfit = 35000 + Math.floor(Math.random() * 20000);

        return {
            type: 'stats',
            message: `📊 ${onlineUsers} usuarios operando ahora | ${totalTrades.toLocaleString()} trades hoy | $${(totalProfit / 1000).toFixed(0)}K profit total`,
            data: { onlineUsers, totalTrades, totalProfit }
        };
    }

    // Generate multiple messages
    generateMultiple(count = 3) {
        const messages = [];
        for (let i = 0; i < count; i++) {
            messages.push(this.generateMessage());
        }
        return messages;
    }

    // Get trending tokens
    getTrendingTokens() {
        return this.tokens.slice(0, 5).map(token => ({
            symbol: token,
            change: (Math.random() * 200 - 100).toFixed(1),
            volume: (Math.random() * 1000000).toFixed(0)
        }));
    }

    // Get recent big winners
    getBigWinners() {
        const winners = [];
        for (let i = 0; i < 5; i++) {
            const username = this.usernames[Math.floor(Math.random() * this.usernames.length)];
            const profit = 1000 + Math.floor(Math.random() * 5000);
            winners.push({ username, profit });
        }
        return winners;
    }
}

module.exports = SocialProofFeed;