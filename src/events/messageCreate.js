const {Events} = require('discord.js');
const Database = require('../utils/DatabaseHandler');
const Logger = require('../utils/logger');

module.exports = {
    name: Events.MessageCreate,
    async execute(message, client) {
        if (message.channel.type === 1 && !message.author.bot) {
	Logger.debug(`Message: ${message.content}`);
            if (message.content.toLowerCase().includes("api-key:")) {
                Logger.info('Message contains API key instruction.');

                // Split the message content at ":" and take anything after that as the API key
                const splitMessage = message.content.split(':');
                if (splitMessage.length >= 2) {
                    const apiKey = splitMessage[1].trim(); // Extract the API key (removing extra spaces)
                    Logger.info('Extracted API key:', apiKey);
                    const db = new Database();
                    try {
                        // Insert the username and API key into the api_keys table
                        const query = 'INSERT INTO api_keys (username, api_key) VALUES (?, ?)';
                        await db.query(query, [message.author.username, apiKey]);

                        // Send a confirmation message to the user
                        await message.reply('API key registered successfully!');
                    } catch (error) {
                        console.error('Error registering API key:', error);
                        await message.reply('Error occurred while registering your API key.');
                    }
                } else {
                    Logger.error('Invalid API key format.'); // Handle invalid format
                }
            } else if (message.content.toLowerCase().includes('track-stats:')) {
                const splitMessage = message.content.split(':');
                if (splitMessage.length >= 2) {
                    const apiKey = splitMessage[1].trim(); // Extract the API key (removing extra spaces)
                    const url = `https://api.torn.com/user/?selections=battlestats&key=${apiKey}`;

                    const db = new Database();
                    try {
                        // Check if user already exists in the database
                        const userExistsQuery = 'SELECT * FROM stat_tracking WHERE username = ?';
                        const userExistsResult = await db.query(userExistsQuery, [message.author.username]);

                        if (userExistsResult.length > 0) {
                            // If the user already exists, return a message indicating that the user is already registered
                            await message.reply('You are already registered in the stat tracker.');
                            return; // Exit the function
                        }

                        // If the user doesn't exist, proceed with inserting the new record
                        const response = await fetch(url);
                        const data = await response.json();
                        const insertQuery = 'INSERT INTO stat_tracking (username, api_key, strength, speed, dexterity, defense) VALUES (?, ?, ?, ?, ?, ?)';
                        const values = [message.author.username, apiKey, data.strength, data.speed, data.dexterity, data.defense];
                        await db.query(insertQuery, values);

                        // Send a confirmation message to the user
                        await message.reply('Stat Tracker registered successfully!');
                    } catch (error) {
                        console.error('Error registering stat tracker:', error);
                        await message.reply('Error occurred while registering your stat tracking.');
                    }

                } else {
                    Logger.error('Invalid API key format.'); // Handle invalid format
                }
            }
        }
        if(message.author.bot) return;
        await client.currency_helper.addBalance(message.author.id, 1)
    },
};
