const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Database = require("../../utils/DatabaseHandler");
const Logger = require('../../utils/logger');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

module.exports = {
    data: new SlashCommandBuilder()
        .setName('purge')
        .setDescription('The Great Purge')
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
        .setDMPermission(false),
    async execute(interaction) {
        const generalChannelId = '731431228959490111';
        const guild = interaction.guild;
        let kickedUsers = 0;

        try {
            const generalChannel = await guild.channels.fetch(generalChannelId);
            await generalChannel.send({
                content: `:rotating_light: ${interaction.user} has initiated the server purge! :rotating_light:`
            });

            const factionMembers = await fetchFactionMembers(); // Fetch faction members from the API
            const verifiedMembersCount = await processMembers(factionMembers);

            await generalChannel.send({
                content: `:rotating_light: The Server has been purged! ${kickedUsers} members have been purged! :rotating_light:`
            });
            await interaction.reply(`Successfully purged the faction. Purged ${kickedUsers} users out of ${guild.memberCount}!`);
        } catch (error) {
            Logger.error(`Error kicking users: ${error}`);
            await interaction.reply('Error occurred while purging users.');
        }

        async function fetchFactionMembers() {
            const peace_faction = 8322; // Replace with your actual faction ID
            const apiKeyResponse = await db.getApiKey('peace'); // Fetch API key from the database
            const apiKeyArray = JSON.parse(apiKeyResponse);
            const peace_api = `https://api.torn.com/faction/${peace_faction}?selections=&key=${apiKeyArray[0].api_key}`;
            const peace_data = await fetch(peace_api);
            const peace_json = await peace_data.json();
            return Object.keys(peace_json.members); // Get an array of Torn IDs from the API response
        }

        async function processMembers(factionMembers) {
            let verifiedMembers = 0;

            // Fetch all members of the guild
            const members = await guild.members.fetch();

            for (const member of members.values()) {
                const nickname = member.displayName;
                const tornId = await extractTornIdFromNickname(nickname);

                // Check if the user is in the faction or is a bot
                if (factionMembers.includes(tornId) || member.user.bot) {
                    verifiedMembers++;
                } else {
                    try {
                        await member.kick('User is not verified for being in the faction.'); // Kick the user with a reason
                        kickedUsers++;
                        Logger.debug(`User ${member.user.username} was purged from the server.`);
                    } catch (error) {
                        // Handle errors that occur during kicking
                        Logger.error(`Error kicking user ${member.user.username} with error: ${error}`);
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