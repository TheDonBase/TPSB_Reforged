const {SlashCommandBuilder, codeBlock} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('show-balance')
        .setDescription('Provides information about your currency balance.'),
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


        return interaction.reply(
            `Your balance is ${client.currency_helper.getBalance(interaction.user.id)}💰`
        )
    },
};