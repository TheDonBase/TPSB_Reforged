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
        const execution_chamber = interaction.guild.channels.cache.get('731989414531563603');
        const guild = interaction.guild;
        const war_faction = 19249;
        const peace_faction = 8322;
        const db = new Database();
        const api_key = await db.getApiKey()

        try {
            const verifiedMessage = await processMembers(api_key);
            await execution_chamber.send(verifiedMessage);
        } catch (error) {
            Logger.error(`Error registering users: ${error}`);
            await interaction.reply('Error occurred while checking users.');
        }
        
        async function processMembers(api_key) {
            let verifiedPeaceMembers = 0;
            let verifiedWarMembers = 0;
            const war_api = `https://api.torn.com/faction/${war_faction}?selections=&key=${api_key}`;
            const peace_api = `https://api.torn.com/faction/${peace_faction}?selections=&key=${api_key}`;
            const war_data = await fetch(war_api);
            const peace_data = await fetch(peace_api);
            const war_json = await war_data.json();
            const peace_json = await peace_data.json();
            const war_members = Object.keys(war_json.members);
            const peace_members = Object.keys(peace_json.members);
            Logger.debug(`War members: ${war_members.length} Peace Members: ${peace_members.length}`);

            for (const [_, member] of guild.members.cache) {
                const nickname = member.displayName;
                const tornId = await extractTornIdFromNickname(nickname);

                if (tornId) {
                    if (war_members.includes(tornId)) {
                        verifiedWarMembers++;
                    } else if (peace_members.includes(tornId)) {
                        verifiedPeaceMembers++;
                    }
                }
            }
            let verified_members = `Verified War members in discord: ${verifiedWarMembers} out of ${war_members.length} and Verified Peace Members in discord ${verifiedPeaceMembers} out of ${peace_members.length}`
            return verified_members;
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