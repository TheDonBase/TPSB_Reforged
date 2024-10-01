const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Database = require("../../utils/DatabaseHandler");
const Logger = require('../../utils/logger');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

module.exports = {
    data: new SlashCommandBuilder()
        .setName('check-users')
        .setDescription('Compare users to database')
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
        .setDMPermission(false),
    async execute(interaction) {
        const guild = interaction.guild;
        const welcomeChannelId = '1166857299294429285';
        const peace_faction = 8322;
        const db = new Database();
        const apiKeyResponse = await db.getApiKey('peace');
        const apiKeyArray = JSON.parse(apiKeyResponse);
        let verifiedPeaceMembers = 0;
        const nicknameFormatRegex = /\[\d+\]/; // Regex to match [digits] format
        let peace_members;

        try {
            const welcomeChannel = await guild.channels.fetch(welcomeChannelId);

            if (!welcomeChannel || !welcomeChannel.isTextBased()) {
                return interaction.reply('This channel is either not found or not a text channel.');
            }

            const membersInChannel = await guild.members.fetch();
            const allGuildMembers = membersInChannel
                .filter(member => welcomeChannel.members.has(member.id) && !member.user.bot)
                .map(member => member.displayName);

            const verifiedMessage = await processMembers(apiKeyArray[0].api_key);

            // Create a rich embed
            const embed = {
                color: '7419530', // Set the color of the embed
                title: 'Member Verification Stats',
                fields: [
                    {
                        name: 'Members',
                        value: `${verifiedPeaceMembers} out of ${peace_members.length}`,
                        inline: false,
                    },
                ],
                timestamp: new Date(),
            };

            const nonAffiliatedMembers = [];

            for (const nickname of allGuildMembers) {
                const tornId = await extractTornIdFromNickname(nickname);
                if(tornId) {
                    Logger.info(`${nickname} has the userId of: ${tornId}`)
                } else {
                    Logger.info(`${nickname} has no userId.`)
                }
                if (!peace_members.includes(tornId) || !nicknameFormatRegex.test(nickname)) {
                    nonAffiliatedMembers.push(nickname);
                }
            }

            // Truncate non-affiliated members if length exceeds maximum
            let truncatedNonAffiliatedMembers = nonAffiliatedMembers.join(', ');
            if (truncatedNonAffiliatedMembers.length > 1024) {
                truncatedNonAffiliatedMembers = truncatedNonAffiliatedMembers.slice(0, 1021) + '...';
            }

            // Add non-affiliated members to the embed if it's not empty
            if (truncatedNonAffiliatedMembers) {
                embed.fields.push({
                    name: 'Non-affiliated Members',
                    value: truncatedNonAffiliatedMembers,
                    inline: false,
                });
            }

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            Logger.error(`Error processing members: ${error}`);
            await interaction.reply('Error occurred while checking users.');
        }

        async function processMembers(api_key) {
            Logger.info("Processing members");
            const peace_api = `https://api.torn.com/faction/${peace_faction}?selections=&key=${api_key}`;
            const peace_data = await fetch(peace_api);
            const peace_json = await peace_data.json();
            peace_members = Object.keys(peace_json.members);

            for (const member of peace_members) {
                if (member) {
                    verifiedPeaceMembers++;
                }
            }
            return `Verified Members in discord ${verifiedPeaceMembers} out of ${peace_members.length}`;
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
