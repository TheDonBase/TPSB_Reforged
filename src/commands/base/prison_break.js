const { SlashCommandBuilder } = require('discord.js');
const Logger = require('../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
		.setName('prison_break')
		.setDescription('Call for a prison break!'),
    async execute(interaction) {
        const prison_breaker_role = '<@&1163661717667053638>';
        const prison_break_channel = interaction.guild.channels.cache.get('1163661314938392658');
        try {
            const tornId = await extractTornIdFromNickname(interaction.member.displayName);
            const bust_url = `https://www.torn.com/jailview.php?XID=${tornId}&action=rescue&step=breakout`;
            await prison_break_channel.send({
                content: `${prison_breaker_role}, ${interaction.user} needs a prison break! 🚨 \n[Bust out here](${bust_url})`,
            });
        } catch (error) {
            Logger.error(error);
            interaction.reply("There was an error.");
        }
    },
};

async function extractTornIdFromNickname(nickname) {
    const regex = /\[(\d+)\]/; // Regular expression to extract Torn ID from the nickname
    const match = nickname.match(regex);
    if (match && match[1]) {
        return match[1];
    }
    return null; // Return null if no match is found
}