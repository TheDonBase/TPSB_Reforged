const {SlashCommandBuilder, codeBlock} = require('discord.js');
const {CurrencyShop} = require("../../utils/dbObjects");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('shop')
        .setDescription('Displays the current shop!'),
    async execute(interaction, client) {
        await interaction.deferReply({ ephemeral: true});
        const items = await CurrencyShop.findAll();
        return interaction.editReply(codeBlock(items.map(i => `${i.name}: ${i.cost}💰`).join('\n')));
    },
};