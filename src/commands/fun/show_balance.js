const {SlashCommandBuilder, codeBlock} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('show-balance')
        .setDescription('Provides information about your currency balance.'),
    async execute(interaction, client) {
        return interaction.reply(
            `Your balance is ${client.currency_helper.getBalance(interaction.user.id)}💰`
        )
    },
};