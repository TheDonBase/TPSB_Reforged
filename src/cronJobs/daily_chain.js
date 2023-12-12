const cron = require('node-cron');
const Logger = require('../utils/Logger');


const warboard_channel = '731431926774235186';
const guild_id = '731431228959490108';

module.exports = client => {
    cron.schedule('00 20 * * *', () => {
        Logger.info(`Running Daily Chain.`);
        const guild = client.guilds.cache.get(guild_id); // fetch the first guild in the cache
        if(!guild) {
            Logger.error("Couldn't find guild!");
            return;
        }
        const channel = guild.channels.cache.get(warboard_channel);
        if (!channel) {
            Logger.error("Couldn't find channel!");
            return;
        }
        const chainers = '<@&1117518078616539197>';
        channel.send(`:rotating_light: ${chainers} Daily chain is starting now! Let the slaughtering commence! :rotating_light:`);
    });
}