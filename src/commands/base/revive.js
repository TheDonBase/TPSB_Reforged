const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
		.setName('revive')
		.setDescription('Call for a revive!'),
    async execute(interaction) {
        const paramedic_role = '<@&1163661894498930749>';
        const revive_channel = interaction.guild.channels.cache.get('1163661338359377942');

        await revive_channel.send({
            content: `${paramedic_role}, ${interaction.user} needs a revive! 🏥`,
        });
        
    },
};