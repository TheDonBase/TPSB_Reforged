const { Events } = require('discord.js');
const Database = require('../utils/database_handler.js');

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        if (message.channel.type === 1 && !message.author.bot) {
            if(message.content.includes("api-key:"))
                {
                    console.log('Message contains API key instruction.');

                    // Split the message content at ":" and take anything after that as the API key
                    const splitMessage = message.content.split(':');
                    if (splitMessage.length >= 2) {
                        const apiKey = splitMessage[1].trim(); // Extract the API key (removing extra spaces)
                        console.log('Extracted API key:', apiKey);
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
                        console.log('Invalid API key format.'); // Handle invalid format
                    }
                }
        }
    },
};