const {SlashCommandBuilder, codeBlock} = require('discord.js');
const {CurrencyShop, Users} = require("../../utils/dbObjects");
const { Op } = require('sequelize');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('buy')
        .setDescription('Buy an item from the shop!')
    .addStringOption(option =>
    option
        .setName("item")
        .setDescription("Choose the item to buy.")
        .setRequired(true)),
    async execute(interaction, client) {
        const itemName = interaction.options.getString('item');
        const item = await CurrencyShop.findOne({ where: { name: { [Op.like]: itemName } } });

        if (!item) return interaction.reply(`That item doesn't exist.`);
        if (item.cost > client.currency_helper.getBalance(interaction.user.id)) {
            return interaction.reply(`You currently have ${client.currency_helper.getBalance(interaction.user.id)}, but the ${item.name} costs ${item.cost}!`);
        }

        const user = await Users.findOne({ where: { user_id: interaction.user.id } });
        await client.currency_helper.addBalance(interaction.user.id, -item.cost);
        await user.addItem(item);

        return interaction.reply(`You've bought: ${item.name}.`);
    },
};