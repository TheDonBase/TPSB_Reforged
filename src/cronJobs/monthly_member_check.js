const cron = require('node-cron');
const Logger = require('../utils/logger');
const Database = require("../utils/DatabaseHandler");

const execution_chamber = '731989414531563603';
const guild_id = '731431228959490108';
const db = new Database();

module.exports = async client => {
    const peace_faction = 8322;
    const apiKeyResponse = await db.getApiKey('peace');
    const apiKeyArray = JSON.parse(apiKeyResponse);
    let verifiedPeaceMembers = 0;
    let peace_members;

    cron.schedule('00 00 1 * *', async () => {
        Logger.info(`Running monthly member check`);
        const guild = client.guilds.cache.get(guild_id);
        if (!guild) {
            Logger.error("Couldn't find guild!");
            return;
        }
        const channel = guild.channels.cache.get(execution_chamber);
        if (!channel) {
            Logger.error("Couldn't find channel!");
            return;
        }

        try {
            const verifiedMessage = await processMembers(apiKeyArray[0].api_key);

            // Create a rich embed
            const embed = {
                color: '7419530', // Set the color of the embed
                title: 'Member Verification Stats',
                fields: [
                    {
                        name: 'Peace Members',
                        value: `${verifiedPeaceMembers} out of ${peace_members.length}`,
                        inline: false,
                    },
                ],
                timestamp: new Date(),
            };

            // Get non-affiliated members
            const allGuildMembers = guild.members.cache.map(member => member.displayName);
            const nonAffiliatedMembers = [];
            for (const nickname of allGuildMembers) {
                const tornId = await extractTornIdFromNickname(nickname);
                Logger.debug(tornId);
                if (tornId && !(peace_members.includes(tornId))) {
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

            await execution_chamber.send({embeds: [embed]});
        } catch (error) {
            Logger.error(`Error proccessing members: ${error}`);
            await execution_chamber.send('Error occurred while checking users.');
        }
    });

    async function processMembers(api_key) {
        Logger.info("Processing members");
        const peace_api = `https://api.torn.com/faction/${peace_faction}?selections=&key=${api_key}`;
        const peace_data = await fetch(peace_api);
        const peace_json = await peace_data.json();
        peace_members = Object.keys(peace_json.members);

        for (const [_, member] of guild.members.cache) {
            const nickname = member.displayName;
            const tornId = await extractTornIdFromNickname(nickname);

            if (tornId) {
                if (peace_members.includes(tornId)) {
                    verifiedPeaceMembers++;
                }
            }
        }
        let verified_members = `Verified Members in discord ${verifiedPeaceMembers} out of ${peace_members.length}`
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
};
