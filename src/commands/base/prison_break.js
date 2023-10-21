const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
		.setName('prison_break')
		.setDescription('Call for a prison break!'),
    async execute(interaction) {
        const prison_breaker_role = '<@&1163661717667053638>';
        const prison_break_channel = interaction.guild.channels.cache.get('1163661314938392658');
        await prison_break_channel.send({
            content: `${prison_breaker_role}, ${interaction.user} needs a prison break! 🚨`,
        });
    },
};