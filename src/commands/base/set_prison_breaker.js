const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
		.setName('become_prison_breaker')
		.setDescription('Become a Prison Breaker!'),
    async execute(interaction) {
        const prison_breaker_role = '1163661717667053638';

        if(interaction.member.roles.cache.has(prison_breaker_role)) {
            await interaction.member.roles.remove(prison_breaker_role)
            interaction.reply("Aww Damnit. Now who are we gonna find to break into the prison? (You are no longer a prison breaker)");
        } else {
            await interaction.member.roles.add(prison_breaker_role)
            interaction.reply("Mr Bombastic! It's fantastic now you are a prison breaker!");
        }
    },
};