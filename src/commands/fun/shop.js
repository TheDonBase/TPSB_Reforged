const {SlashCommandBuilder, codeBlock} = require('discord.js');
const {CurrencyShop} = require("../../utils/dbObjects");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('shop')
        .setDescription('Displays the current shop!'),
    async execute(interaction, client) {

        const commandInfo = {
            commandName: interaction.commandName,
            user: interaction.user.tag,
            timestamp: new Date().toISOString(),
        };

        // Add the command info to the log (limit the array to the last 10 commands)
        interaction.client.commandLog.push(commandInfo); // Assuming client.commandLog is initialized as an empty array
        if (interaction.client.commandLog.length > 10) {
            interaction.client.commandLog.shift(); // Remove the oldest command to keep the array at max 10
        }


        const items = await CurrencyShop.findAll();
        return interaction.reply(codeBlock(items.map(i => `${i.name}: ${i.cost}💰`).join('\n')));
    },
};