const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Database = require("../../utils/database_handler");
const Logger = require('../../utils/Logger');

module.exports = {
    data: new SlashCommandBuilder()
    .setName('purge')
    .setDescription('The Great Purge')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .setDMPermission(false),
    async execute(interaction) {
        const general_channel = interaction.guild.channels.cache.get('731431228959490111');
        general_channel.send({
            content: `:rotating_light: ${interaction.user} Has initiated the server purge! :rotating_light: `,
        });
        const guild = interaction.guild;
        let kickedUsers = 0;
        try {
            const verifiedMembersCount = await processMembers();
            general_channel.send({
                content: `:rotating_light: The Server has been purged! ${kickedUsers} members have been purged! :rotating_light:`,
            });
            await interaction.reply(`Successfully purged the faction. Purged ${kickedUsers} users out of ${guild.memberCount}!`);
        } catch (error) {
            Logger.error(`Error kicking users: ${error}`);
            await interaction.reply('Error occurred while purging users.');
        }

        async function processMembers() {
            let verifiedMembers = 0;

            for (const [_, member] of guild.members.cache) {
                const nickname = member.displayName;
                const tornId = await extractTornIdFromNickname(nickname);

                if (tornId) {
                    verifiedMembers++;
                } else {
                    try {
                        await member.kick('User is not verified for being in the faction.'); // Kick the user with a reason
                        kickedUsers++;
                        Logger.debug(`User ${member.user.username} was purged from the server.`);
                    } catch (error) {
                        // Handle errors that occur during role removal or kicking
                        Logger.error(`Error removing roles or kicking user ${member.user.username} with error: ${error}`);
                    }
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