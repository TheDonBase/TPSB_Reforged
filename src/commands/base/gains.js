const {SlashCommandBuilder} = require('discord.js');
const Database = require("../../utils/DatabaseHandler");
const {MessageEmbed} = require('discord.js');
const Logger = require('../../utils/logger');
const { sendApiRequest } = require('../../utils/ApiManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('gains')
        .setDescription('Check your gains'),
    async execute(interaction) {
        const db = new Database();

        try {
            // Check if user exists in the database
            const userExistsQuery = 'SELECT * FROM stat_tracking WHERE username = ?';
            const userExistsResult = await db.query(userExistsQuery, [interaction.user.username]);

            if (userExistsResult.length === 0) {
                const instructions = `
                You are not registered in the stat tracker.
                Please send me a private message with the following text:
                \`\`\`
track-stats:<your-api-key>
                \`\`\`
                Replace <your-api-key> with your Torn API key.
                And you don't have to use < - > these symbols, \n Make sure the API Key is ***Atleast*** Limited Access. if it is not and you have set an api key and recieve an error. Please contact TheDonBase.
                `;
                await interaction.reply(instructions);
                return;
            }

            // Retrieve user's API key from the database
            const apiKey = userExistsResult[0].api_key;

            // Fetch new stats using the API key
            const url = `https://api.torn.com/user/?selections=battlestats&key=${apiKey}`;
            const response = await fetch(url);
            const newData = await response.json();

            // Retrieve old stats from the database
            const oldData = userExistsResult[0];

            const formattedStrength = formatNumberWithCommas(newData.strength);
            const formattedSpeed = formatNumberWithCommas(newData.speed);
            const formattedDexterity = formatNumberWithCommas(newData.dexterity);
            const formattedDefense = formatNumberWithCommas(newData.defense);


            // Calculate gains
            const gains = {
                strength: newData.strength - oldData.strength,
                speed: newData.speed - oldData.speed,
                dexterity: newData.dexterity - oldData.dexterity,
                defense: newData.defense - oldData.defense
            };

            // Update the database with new stats

            const statsPayload = {
                username: interaction.user.username,
                strength: newData.strength,
                speed: newData.speed,
                dexterity: newData.dexterity,
                defense: newData.defense,
                updatedAt: new Date().toISOString()
            };

            try {
                await sendApiRequest(`/stats/${interaction.user.username}`, statsPayload, 3, 'PATCH');
                Logger.info(`PATCH skickad till /stats/${interaction.user.username}`);
            } catch (patchError) {
                Logger.warn(`PATCH misslyckades, försöker POST istället...`);
                try {
                    await sendApiRequest(`/stats`, statsPayload, 3, 'POST');
                    Logger.info(`POST skickad till /stats`);
                } catch (postError) {
                    Logger.error(`Kunde inte skicka stats till API:`, {
                        patchError: patchError.message,
                        postError: postError.message
                    });
                }
            }

            const oldStatsDate = new Date(oldData.updated_at).toLocaleDateString();
            // Create an embed with old stats, new stats, and gains
            const embed = {
                color: '7419530', // Set the color of the embed
                title: 'Stat Gains',
                fields: [
                    {
                        name: `Old Stats as of Date: ${oldStatsDate}`,
                        value: `Strength: ${formatNumberWithCommas(oldData.strength)}\nSpeed: ${formatNumberWithCommas(oldData.speed)}\nDexterity: ${formatNumberWithCommas(oldData.dexterity)}\nDefense: ${formatNumberWithCommas(oldData.defense)}`,
                        inline: false,
                    },
                    {
                        name: 'New Stats',
                        value: `Strength: ${formattedStrength}\nSpeed: ${formattedSpeed}\nDexterity: ${formattedDexterity}\nDefense: ${formattedDefense}`,
                        inline: false,
                    },
                    {
                        name: 'Gains',
                        value: `Strength: ${formatNumberWithCommas(gains.strength)}\nSpeed: ${formatNumberWithCommas(gains.speed)}\nDexterity: ${formatNumberWithCommas(gains.dexterity)}\nDefense: ${formatNumberWithCommas(gains.defense)}`,
                        inline: false,
                    }
                ],
                timestamp: new Date()
            };

            await interaction.reply({embeds: [embed]});
        } catch (error) {
            console.error('Error fetching stats:', error);
            await interaction.reply('Error occurred while fetching your stats.');
        }
    },
};

function formatNumberWithCommas(number) {
    Logger.debug(`Number is: ${number}`);
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
