const cron = require('node-cron');
const Logger = require('../utils/logger');

const general_channel = '731431228959490111';
const guild_id = '731431228959490108';

module.exports = client => {
    // Modify the cron schedule to run on the 24th of December at 8 PM (20:00)
    cron.schedule('00 20 25 12 *', () => {
        Logger.info(`Running Merry Christmas Scandinavian version.`);
        const guild = client.guilds.cache.get(guild_id);
        if (!guild) {
            Logger.error("Couldn't find guild!");
            return;
        }
        const channel = guild.channels.cache.get(general_channel);
        if (!channel) {
            Logger.error("Couldn't find channel!");
            return;
        }

        // Tag everyone and send a Christmassy message
        const everyone = '@everyone';
        channel.send(`${everyone} We wish you a Merry Christmas!! 🎄🎅`);
    });
};
