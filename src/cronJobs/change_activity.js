const cron = require('node-cron');
const Logger = require('../utils/logger');

module.exports = client => {
    const tornStatuses = [
        'Robbing a bank in Torn 💰',
        'Chaining noobs 🔗',
        'Searching for Xanax 💊',
        'Avoiding jail... barely 🚓',
        'Training in the gym 🏋️',
        'Spying on factions 🕵️',
        'Scamming the item market 🧃',
        'Planning a raid 📦',
        'Hunting bounties 🎯',
        'Camping the city 🔫',
        'Wasting E on nothing ⚡',
        'Stockpiling meds 🩹',
        'Farming merits like a nerd 📚',
        'Flexing stats 📊',
        'Sniping auctions 💸'
    ];

    const updateActivity = () => {
        const randomStatus = tornStatuses[Math.floor(Math.random() * tornStatuses.length)];

        try {
            client.user.setActivity(randomStatus, { type: 'PLAYING' });
            Logger.info(`🎮 Updated bot activity to: "${randomStatus}"`);
        } catch (error) {
            Logger.error('⚠️ Failed to update activity:', error.message);
        }
    };

    const cronJob = cron.schedule('0 * * * *', updateActivity, {
        scheduled: true,
        timezone: 'Europe/Stockholm'
    });

    // Set one immediately at startup
    updateActivity();

    return {
        cleanup: () => {
            Logger.info('🧹 Stänger av statusuppdaterare');
            cronJob.stop();
        }
    };
};
