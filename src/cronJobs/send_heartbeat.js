const cron = require('node-cron');
const Logger = require('../utils/logger');

module.exports = client => {

    cron.schedule('*/10 * * * * ', async () => {
        Logger.info(`Sending Heartbeat`);
        const memoryUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
        const activity = client.user.presence?.activities[0]?.name || null;

        try {
            const res = await fetch('https://tpsb.croaztek.com/api/bot/heartbeat', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    ping: client.ws.ping,
                    version: '1.0.0',
                    memoryUsage,
                    currentActivity: activity
                })
            });

            const result = await res.json();
            Logger.info('Heartbeat sent successfully:', result);
        } catch (error) {
            Logger.error('Failed to send heartbeat:', error.message);
        }
    });
};