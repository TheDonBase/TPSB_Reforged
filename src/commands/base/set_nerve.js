const { SlashCommandBuilder } = require('discord.js');
const Database = require("../../utils/DatabaseHandler"); // Your database handler
const Logger = require('../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('set-nerve')
        .setDescription('Add or update your natural nerve bar.')
        .addStringOption(option =>
            option
            .setName('nerve')
            .setDescription('What is your natural nerve bar amount?')
            .setRequired(true))
        .addStringOption(option =>
            option
            .setName('reason')
            .setDescription('Optional: Why do you set it? Example: Initial add / Did last time wrong / Updating new NNB')
            .setRequired(false)),
    async execute(interaction) {
        const db = new Database();
        const username = interaction.member.nickname; // Use username
        const nerve = interaction.options.getString('nerve');
        const reason = interaction.options.getString('reason') || 'No reason provided';
        const now = new Date().toISOString().slice(0, 19).replace('T', ' '); // Format current date for MySQL

        // Log command execution
        const commandInfo = {
            commandName: interaction.commandName,
            user: interaction.user.tag,
            timestamp: new Date().toISOString(),
        };

        // Add the command info to the log (limit the array to the last 10 commands)
        interaction.client.commandLog.push(commandInfo); // Assuming client.commandLog is initialized as an empty array
        if (interaction.client.commandLog.length > 10) {
            interaction.client.commandLog.shift(); // Remove the oldest command to keep the array at max 10
        }

        try {
            Logger.info(`Checking if user ${username} exists in the database...`);
            Logger.info(`Attempting to query for username: ${username}`);

            // Check if the user already exists in the nerve table (case insensitive)
            const [user] = await db.query("SELECT * FROM nerve WHERE username = ?", [username]);

            if (!user || user.length === 0) {
                Logger.error(`No result returned from SELECT query for user ${username}`);
                // Handle the case where the user does not exist
                Logger.info(`User ${username} does not exist. Inserting new record...`);

                // User doesn't exist, insert new row with the initial pastNerve entry
                const initialPastNerve = JSON.stringify([{
                    nerve: nerve,
                    lastUpdated: now,
                    reason: reason
                }]); // Start with the current nerve, timestamp, and reason

                await db.query(`
                    INSERT INTO nerve (username, nerve, lastUpdated, pastNerve)
                    VALUES (?, ?, ?, ?)
                `, [username, nerve, now, initialPastNerve]);

                Logger.info(`Added new nerve entry for user ${username}`);
                await interaction.reply(`Your nerve has been set to ${nerve}.`);
            } else {
                Logger.info(`User ${username} exists. Updating record...`);

                // User exists, update their nerve and append to pastNerve
                let pastNerve;
                try {
                    pastNerve = JSON.parse(user[0].pastNerve) || [];
                } catch (jsonError) {
                    Logger.error(`Error parsing pastNerve JSON for user ${username}: ${jsonError.message}`);
                    pastNerve = [];
                }

                // Append current nerve and reason to pastNerve
                pastNerve.push({
                    nerve: user[0].nerve, 
                    lastUpdated: user[0].lastUpdated,
                    reason: reason // Include the reason for this update
                });

                await db.query(`
                    UPDATE nerve 
                    SET nerve = ?, lastUpdated = ?, pastNerve = ?
                    WHERE username = ?
                `, [nerve, now, JSON.stringify(pastNerve), username]);

                Logger.info(`Updated nerve for user ${username}`);
                await interaction.reply(`Your nerve has been updated to ${nerve} with reason: "${reason}".`);
            }
        } catch (error) {
            Logger.error(`Error handling nerve update for user ${username}: ${error.message}`, error);
            await interaction.reply('There was an error while updating your nerve. Please try again later.');
        } finally {
            try {
                db.close(); // Close the database connection
                Logger.info('Database connection closed.');
            } catch (closeError) {
                Logger.error(`Error closing the database connection: ${closeError.message}`);
            }
        }
    },
};
