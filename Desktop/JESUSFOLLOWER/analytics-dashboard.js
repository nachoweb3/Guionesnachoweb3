// Analytics Dashboard for Trading Bot
const fs = require('fs');
const path = require('path');

class AnalyticsDashboard {
    constructor() {
        this.dataFile = './analytics_data.json';
        this.loadData();
    }

    loadData() {
        try {
            if (fs.existsSync(this.dataFile)) {
                const data = JSON.parse(fs.readFileSync(this.dataFile, 'utf8'));
                this.data = data;
            } else {
                this.initializeData();
            }
        } catch (error) {
            console.error('Error loading analytics data:', error);
            this.initializeData();
        }
    }

    initializeData() {
        this.data = {
            dailyStats: [],
            userStats: {},
            tokenStats: {},
            performance: {
                totalRevenue: 0,
                totalUsers: 0,
                activeUsers: 0,
                churnRate: 0,
                avgSessionTime: 0,
                conversionRate: 0
            },
            funnels: {
                landing: { visitors: 0, signups: 0 },
                bot: { starts: 0, upgrades: 0 },
                retention: { day1: 0, day7: 0, day30: 0 }
            }
        };

        // Generate some initial data
        this.generateInitialData();
        this.saveData();
    }

    generateInitialData() {
        // Generate daily stats for last 30 days
        const today = new Date();
        for (let i = 29; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);

            this.data.dailyStats.push({
                date: date.toISOString().split('T')[0],
                newUsers: Math.floor(Math.random() * 20) + 5,
                activeUsers: Math.floor(Math.random() * 100) + 50,
                trades: Math.floor(Math.random() * 200) + 100,
                revenue: Math.floor(Math.random() * 1000) + 500,
                upgrades: Math.floor(Math.random() * 5) + 1,
                churn: Math.floor(Math.random() * 5)
            });
        }

        // Generate some user stats
        this.data.performance = {
            totalRevenue: 45780,
            totalUsers: 1527,
            activeUsers: 89,
            churnRate: 12.5,
            avgSessionTime: 12.3,
            conversionRate: 8.7
        };

        this.data.funnels = {
            landing: { visitors: 12500, signups: 1089 },
            bot: { starts: 1089, upgrades: 127 },
            retention: { day1: 0.85, day7: 0.67, day30: 0.42 }
        };
    }

    saveData() {
        try {
            fs.writeFileSync(this.dataFile, JSON.stringify(this.data, null, 2));
        } catch (error) {
            console.error('Error saving analytics data:', error);
        }
    }

    // Track events
    trackEvent(type, data = {}) {
        const today = new Date().toISOString().split('T')[0];
        let dayStats = this.data.dailyStats.find(d => d.date === today);

        if (!dayStats) {
            dayStats = {
                date: today,
                newUsers: 0,
                activeUsers: 0,
                trades: 0,
                revenue: 0,
                upgrades: 0,
                churn: 0
            };
            this.data.dailyStats.push(dayStats);
        }

        switch (type) {
            case 'new_user':
                dayStats.newUsers++;
                this.data.performance.totalUsers++;
                break;
            case 'trade':
                dayStats.trades++;
                break;
            case 'upgrade':
                dayStats.upgrades++;
                const planPrice = { BASIC: 29, PRO: 99, ENTERPRISE: 299 };
                dayStats.revenue += planPrice[data.plan] || 0;
                this.data.performance.totalRevenue += planPrice[data.plan] || 0;
                break;
            case 'active_user':
                dayStats.activeUsers++;
                break;
            case 'churn':
                dayStats.churn++;
                break;
        }

        this.saveData();
    }

    // Generate dashboard report
    generateDashboard() {
        const report = {
            overview: this.getOverview(),
            charts: this.getChartData(),
            kpis: this.getKPIs(),
            funnels: this.getFunnelAnalysis(),
            trends: this.getTrends(),
            recommendations: this.getRecommendations()
        };

        return report;
    }

    getOverview() {
        const yesterday = this.data.dailyStats[this.data.dailyStats.length - 2];
        const today = this.data.dailyStats[this.data.dailyStats.length - 1];

        return {
            totalUsers: this.data.performance.totalUsers,
            activeUsers: today.activeUsers,
            totalRevenue: this.data.performance.totalRevenue,
            todayRevenue: today.revenue,
            todayTrades: today.trades,
            conversionRate: this.data.performance.conversionRate,
            churnRate: this.data.performance.churnRate
        };
    }

    getChartData() {
        // Revenue chart (last 7 days)
        const revenueData = this.data.dailyStats.slice(-7).map(d => ({
            date: d.date,
            revenue: d.revenue
        }));

        // User growth chart (last 30 days)
        const userGrowth = this.data.dailyStats.map((d, i) => ({
            date: d.date,
            users: this.data.dailyStats.slice(0, i + 1).reduce((sum, day) => sum + day.newUsers, 0)
        }));

        // Plan distribution
        const planDistribution = {
            FREE: 0.6,
            BASIC: 0.25,
            PRO: 0.12,
            ENTERPRISE: 0.03
        };

        return {
            revenue: revenueData,
            userGrowth,
            planDistribution,
            dailyActive: this.data.dailyStats.slice(-7).map(d => ({
                date: d.date,
                users: d.activeUsers
            }))
        };
    }

    getKPIs() {
        const last30Days = this.data.dailyStats.slice(-30);
        const previous30Days = this.data.dailyStats.slice(-60, -30);

        const currentMonth = {
            revenue: last30Days.reduce((sum, d) => sum + d.revenue, 0),
            newUsers: last30Days.reduce((sum, d) => sum + d.newUsers, 0),
            trades: last30Days.reduce((sum, d) => sum + d.trades, 0),
            upgrades: last30Days.reduce((sum, d) => sum + d.upgrades, 0)
        };

        const previousMonth = {
            revenue: previous30Days.reduce((sum, d) => sum + d.revenue, 0),
            newUsers: previous30Days.reduce((sum, d) => sum + d.newUsers, 0),
            trades: previous30Days.reduce((sum, d) => sum + d.trades, 0),
            upgrades: previous30Days.reduce((sum, d) => sum + d.upgrades, 0)
        };

        return {
            monthlyGrowth: {
                revenue: this.calculateGrowth(previousMonth.revenue, currentMonth.revenue),
                users: this.calculateGrowth(previousMonth.newUsers, currentMonth.newUsers),
                trades: this.calculateGrowth(previousMonth.trades, currentMonth.trades),
                upgrades: this.calculateGrowth(previousMonth.upgrades, currentMonth.upgrades)
            },
            avgRevenuePerUser: (currentMonth.revenue / currentMonth.newUsers).toFixed(2),
            avgTradesPerUser: (currentMonth.trades / Math.max(currentMonth.newUsers, 1)).toFixed(1),
            upgradeRate: (currentMonth.upgrades / currentMonth.newUsers * 100).toFixed(1)
        };
    }

    getFunnelAnalysis() {
        const landingConversion = (this.data.funnels.landing.signups / this.data.funnels.landing.visitors * 100).toFixed(1);
        const botConversion = (this.data.funnels.bot.upgrades / this.data.funnels.bot.starts * 100).toFixed(1);

        return {
            landing: {
                visitors: this.data.funnels.landing.visitors,
                signups: this.data.funnels.landing.signups,
                conversionRate: landingConversion
            },
            bot: {
                starts: this.data.funnels.bot.starts,
                upgrades: this.data.funnels.bot.upgrades,
                conversionRate: botConversion
            },
            retention: this.data.funnels.retention
        };
    }

    getTrends() {
        const last7Days = this.data.dailyStats.slice(-7);

        // Growth trend
        const growthTrend = last7Days.map(d => d.newUsers);
        const growthDirection = growthTrend[growthTrend.length - 1] > growthTrend[0] ? 'up' : 'down';

        // Most profitable day
        const mostProfitable = last7Days.reduce((max, d) => d.revenue > max.revenue ? d : max);

        // Busiest day
        const busiestDay = last7Days.reduce((max, d) => d.trades > max.trades ? d : max);

        return {
            userGrowth: {
                direction: growthDirection,
                percentage: this.calculateGrowth(growthTrend[0], growthTrend[growthTrend.length - 1])
            },
            mostProfitableDay: mostProfitable,
            busiestDay: busiestDay,
            avgDailyRevenue: (last7Days.reduce((sum, d) => sum + d.revenue, 0) / 7).toFixed(0)
        };
    }

    getRecommendations() {
        const recommendations = [];

        // Check conversion rates
        if (this.data.performance.conversionRate < 10) {
            recommendations.push({
                type: 'conversion',
                priority: 'high',
                message: 'La tasa de conversión es baja. Considera mejorar el onboarding.',
                action: 'Agregar tutorial interactivo'
            });
        }

        // Check churn rate
        if (this.data.performance.churnRate > 15) {
            recommendations.push({
                type: 'retention',
                priority: 'high',
                message: 'La tasa de abandono es alta. Implementa un programa de retención.',
                action: 'Crear email de reactivación + descuento especial'
            });
        }

        // Check upgrade rate
        const last30Days = this.data.dailyStats.slice(-30);
        const upgradeRate = (last30Days.reduce((sum, d) => sum + d.upgrades, 0) /
                           last30Days.reduce((sum, d) => sum + d.newUsers, 0)) * 100;

        if (upgradeRate < 10) {
            recommendations.push({
                type: 'monetization',
                priority: 'medium',
                message: 'Pocos usuarios se actualizan a planes premium.',
                action: 'Mostrar más beneficios del plan premium'
            });
        }

        // Check daily activity
        const avgActive = last30Days.reduce((sum, d) => sum + d.activeUsers, 0) / 30;
        const totalUsers = this.data.performance.totalUsers;
        const activePercentage = (avgActive / totalUsers) * 100;

        if (activePercentage < 10) {
            recommendations.push({
                type: 'engagement',
                priority: 'medium',
                message: 'Bajo engagement diario. Implementa gamificación.',
                action: 'Añadir retos diarios y sistema de puntos'
            });
        }

        return recommendations;
    }

    calculateGrowth(oldValue, newValue) {
        if (oldValue === 0) return newValue > 0 ? 100 : 0;
        return (((newValue - oldValue) / oldValue) * 100).toFixed(1);
    }

    // Export to CSV
    exportToCSV() {
        let csv = 'Date,New Users,Active Users,Trades,Revenue,Upgrades,Churn\n';

        this.data.dailyStats.forEach(day => {
            csv += `${day.date},${day.newUsers},${day.activeUsers},${day.trades},${day.revenue},${day.upgrades},${day.churn}\n`;
        });

        return csv;
    }
}

module.exports = AnalyticsDashboard;