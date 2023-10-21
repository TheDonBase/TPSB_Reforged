const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Database = require("../../utils/database_handler");
const Logger = require('../../utils/Logger');

module.exports = {
    data: new SlashCommandBuilder()
    .setName('check-users')
    .setDescription('Compare users to database')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .setDMPermission(false),
    async execute(interaction) {
        const guild = interaction.guild;
        let verifiedMembers = 0;
        try {
            const verifiedMembersCount = await processMembers();
            await interaction.reply(`Successfully checked all users in the database. Found ${verifiedMembersCount} verified users out of ${guild.memberCount}!`);
        } catch (error) {
            Logger.error(`Error registering users: ${error}`);
            await interaction.reply('Error occurred while checking users.');
        }
        
        async function processMembers() {
            let verifiedMembers = 0;

            for (const [_, member] of guild.members.cache) {
                const nickname = member.displayName;
                const tornId = await extractTornIdFromNickname(nickname);

                if (tornId) {
                    verifiedMembers++;
                }
            }

            return verifiedMembers;
        }
        
        async function extractTornIdFromNickname(nickname) {
            const regex = /\[(\d+)\]/; // Regular expression to extract Torn ID from the nickname
            const match = nickname.match(regex);
            if (match && match[1]) {
                return match[1];
            }
            return null; // Return null if no match is found
        }
    }
};