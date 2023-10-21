const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fetch = require('node-fetch'); // Import the 'fetch' library
const Database = require("../../utils/database_handler");
const Logger = require('../../utils/Logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('update-usernames')
        .setDescription('Updates the users in the guild.')
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
        .setDMPermission(false),
    async execute(interaction) {
        try {
            const db = new Database(); // Assuming you have a method to query your database

            // Fetch all API keys and usernames from the database
            const apiKeysAndUsernames = await db.query('SELECT api_key, username FROM api_keys');

            // Iterate through the fetched data and update Discord usernames
            for (const { api_key: apiKey, username } of apiKeysAndUsernames) {
                // Make a GET request to Torn API using the apiKey
                const response = await fetch(`https://api.torn.com/user/?selections=profile&key=${apiKey}`);
                const userData = await response.json();

                // Update Discord username based on Torn API response
                const newUsername = `${userData.name} [${userData.player_id}]`;

                // Find the Discord user by username and update their nickname
                const member = await interaction.guild.members.fetch({ query: username, limit: 1 });
                if (member) {
                    await member.first().setNickname(newUsername);
                }
            }

            await interaction.reply('Usernames updated successfully!');
        } catch (error) {
            Logger.error('Error updating usernames:', error);
            await interaction.reply('Error occurred while updating usernames.');
        }
    }
};
