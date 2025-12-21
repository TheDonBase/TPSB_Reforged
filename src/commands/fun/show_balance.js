const {SlashCommandBuilder, codeBlock} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('show-balance')
        .setDescription('Provides information about your currency balance.'),
    async execute(interaction, client) {
        await interaction.deferReply({ ephemeral: true});
        return interaction.editReply(
            `Your balance is ${client.currency_helper.getBalance(interaction.user.id)}💰`
        )
    },
};