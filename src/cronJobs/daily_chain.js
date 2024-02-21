const cron = require('node-cron');
const Logger = require('../utils/Logger');
const Database = require("../utils/DatabaseHandler");


const warboard_channel = '731431926774235186';
const guild_id = '731431228959490108';

const db = new Database(); // Assuming you have a method to query your database

// Function to format cooldown duration in a human-readable format
function formatCooldown(cooldownSeconds) {
    const minutes = Math.floor(cooldownSeconds / 60);
    const remainingSeconds = cooldownSeconds - minutes * 60;

    if (minutes > 0) {
        if (remainingSeconds > 0) {
            return `Cooldown remaining: **${minutes} minutes ${remainingSeconds} seconds**`;
        } else {
            return `Cooldown remaining: **${minutes} minutes**`;
        }
    } else {
        return `Cooldown remaining: **${remainingSeconds} seconds**`;
    }
}

module.exports = client => {
    cron.schedule('00 20 * * *', async () => {
        Logger.info(`Running Daily Chain.`);
        const guild = client.guilds.cache.get(guild_id); // fetch the first guild in the cache
        if (!guild) {
            Logger.error("Couldn't find guild!");
            return;
        }
        const channel = guild.channels.cache.get(warboard_channel);
        if (!channel) {
            Logger.error("Couldn't find channel!");
            return;
        }
        const chainers = '<@&1117518078616539197>';

        const api_key_json = await db.getApiKey('peace'); // Assuming db.getApiKey() returns a JSON string
        let api_key;
        try {
            const api_key_array = JSON.parse(api_key_json);
            if (Array.isArray(api_key_array) && api_key_array.length > 0) {
                const api_key_obj = api_key_array[0];
                api_key = api_key_obj.api_key; // Note the lowercase 'api_key'
                Logger.debug(`API Key: ${api_key}`);
            } else {
                Logger.error("Invalid JSON format or empty array.");
            }
        } catch (error) {
            Logger.error(`Error parsing JSON: ${error.message}`);
        }
        const api_url = `https://api.torn.com/faction/?selections=chain&key=${api_key}`
        const response = await fetch(api_url);
        const data = await response.json();
        if (data && data.chain) {
            const { cooldown, current } = data.chain;
        
            if (cooldown > 0) {
                const cooldownMessage = formatCooldown(cooldown);
                channel.send(`:rotating_light: ${chainers} Awwww f---... Chain has cooldown \n ${cooldownMessage} :( :rotating_light:`);
                Logger.info(`Awww shmucks... Chain has cooldown :(`);
            } else if (current > 0) {
                channel.send(`:rotating_light: ${chainers} Daily chain is in progress! \n Current Kills: **${current}** \n Let the slaughtering commence! :rotating_light:`);
                Logger.info(`Sending chain in progress message.`);
            } else {
                channel.send(`:rotating_light: ${chainers} Daily chain is starting now! Let the slaughtering commence! :rotating_light:`);
                Logger.info(`Sending Daily chain message.`)
            }
        } else {
            Logger.error("No data or invalid data from the API.");
            return;
        }
    });
}