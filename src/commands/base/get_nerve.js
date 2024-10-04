const { SlashCommandBuilder } = require('discord.js');
const Database = require("../../utils/DatabaseHandler");
const Logger = require('../../utils/logger');

const ROLE_ID = '731432747318378528'; // Role ID that can access the full list

module.exports = {
    data: new SlashCommandBuilder()
        .setName('get-nerve')
        .setDescription('Retrieve a list of usernames and their nerve values.'),
    async execute(interaction) {
        const db = new Database();
        const username = interaction.member.nickname; // Get the username of the requester

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
            Logger.info('Retrieving nerve data from the database...');
            
            // Check if the user has the required role
            if (interaction.member.roles.cache.has(ROLE_ID)) {
                // Fetch all users and their nerve values from the nerve table
                const users = await db.query("SELECT username, nerve FROM nerve");
                
                if (users.length === 0) {
                    await interaction.reply("No users found in the nerve table.");
                    return;
                }

                // Format the response
                let nerveList = "```";
                nerveList += `Username              | Nerve\n`;
                nerveList += `----------------------|-------\n`;

                // Populate the nerve list with user data
                users.forEach(user => {
                    nerveList += `${user.username.padEnd(22)}| ${user.nerve}\n`;
                });
                nerveList += "```";

                // Send the formatted response
                await interaction.reply(`Nerve Values:\n${nerveList}`);
                Logger.info('Nerve data retrieved and sent successfully.');

            } else {
                // If the user doesn't have the role, fetch their own nerve value
                Logger.info(`User ${username} does not have the role. Fetching their own nerve value...`);
                
                const result = await db.query("SELECT nerve FROM nerve WHERE username = ?", [username]);
                
                if (!result || result.length === 0) {
                    await interaction.reply("You do not have a nerve entry in the database. Please set your nerve using /set-nerve.");
                    return;
                }
            
                const user = result[0];
                await interaction.reply(`Your nerve value is: ${user.nerve}`);
            }
            

        } catch (error) {
            Logger.error(`Error retrieving nerve data: ${error.message}`, error);
            await interaction.reply('There was an error while retrieving nerve data. Please try again later.');
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
