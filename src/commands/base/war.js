const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
		.setName('war')
		.setDescription('Adds the war faction role to you!'),
    async execute(interaction) {
        const war_role = '1163116813308133376';
        if(interaction.member.roles.cache.has(war_role)) {
            await interaction.member.roles.remove(war_role)
            interaction.reply("Removed the War faction role from you!");
        } else {
            await interaction.member.roles.add(war_role)
            interaction.reply("Added the War faction role to you!");
        }
        },
};