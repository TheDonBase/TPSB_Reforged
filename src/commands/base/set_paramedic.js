const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
		.setName('become-paramedic')
		.setDescription('Become a paramedic!'),
    async execute(interaction) {
        const paramedic_role = '1163661894498930749';

        if(interaction.member.roles.cache.has(paramedic_role)) {
            await interaction.member.roles.remove(paramedic_role)
            interaction.reply("Awww shmucks... You are no longer a paramedic!");
        } else {
            await interaction.member.roles.add(paramedic_role)
            interaction.reply("You are now a paramedic, Way to go our Savior!");
        }
    },
};