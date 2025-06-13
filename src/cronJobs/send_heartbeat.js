const cron = require('node-cron');
const Logger = require('../utils/logger');
const { updateServerStatus } = require('../utils/ApiManager');

module.exports = client => {
    // Hjälpfunktion för att formatera minnesanvändning
    const getFormattedMemoryUsage = () => {
        return (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
    };

    // Hjälpfunktion för att hämta nuvarande aktivitet
    const getCurrentActivity = () => {
        return client.user.presence?.activities[0]?.name || null;
    };

    // Hjälpfunktion för att skapa heartbeat data
    const createHeartbeatData = () => ({
        ping: client.ws.ping,
        version: process.env.BOT_VERSION || '1.0.0',
        memoryUsage: getFormattedMemoryUsage(),
        currentActivity: getCurrentActivity()
    });

    // Funktion för att skicka heartbeat
    const sendHeartbeat = async () => {
        Logger.info('Skickar Heartbeat');

        try {
            const heartbeatData = createHeartbeatData();
            const result = await updateServerStatus(heartbeatData);

            Logger.info('Heartbeat skickades framgångsrikt:', result);

            // Spara senaste lyckade heartbeat-tiden
            global.lastSuccessfulHeartbeat = new Date();
        } catch (error) {
            Logger.error('Kunde inte skicka heartbeat:', error.message);

            // Om det gått mer än 30 minuter sedan senaste lyckade heartbeat
            if (global.lastSuccessfulHeartbeat &&
                (new Date() - global.lastSuccessfulHeartbeat) > 30 * 60 * 1000) {
                Logger.warn('Ingen lyckad heartbeat på över 30 minuter!');
                // Här kan du lägga till ytterligare åtgärder vid längre avbrott
            }
        }
    };

    // Schemalägg heartbeat var 10:e sekund
    cron.schedule('* */10 * * * *', sendHeartbeat, {
        scheduled: true,
        timezone: 'Europe/Stockholm'
    });

    // Skicka första heartbeat direkt när botten startar
    sendHeartbeat();

    // Lägg till en cleanup funktion som kan användas vid avstängning
    return {
        cleanup: () => {
            // Städa upp cron-jobbet om det behövs
            if (cronJob) {
                cronJob.stop();
            }
        }
    };
};
