const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Database = require("../../utils/DatabaseHandler");
const Logger = require('../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
    .setName('register-users')
    .setDescription('Register users to the database of the guild')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .setDMPermission(false),
    async execute(interaction) {
        try {
            const db = new Database();
            const guild = interaction.guild;
            await guild.members.fetch();

            for (const [memberID, member] of guild.members.cache) {
                const username = member.user.username;
                const query = 'INSERT INTO users (username) VALUES (?)';
                await db.query(query, [username]);
            }

            await interaction.reply('Successfully registered all users in the database.');
        } catch (error) {
            Logger.error('Error registering users:', error);
            await interaction.reply('Error occurred while registering users.');
        }
    }
};