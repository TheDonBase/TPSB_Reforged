const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('set-api-key')
        .setDescription('Register your TORN API key to the bot.'),
    async execute(interaction) {
        // Send an ephemeral message with instructions on how to securely provide the API key
        
        // Log command execution
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
        
        await interaction.reply({
            content: 'This command only works through direct messages. Please do not provide your API key here. send it by saying api-key: **api-key-here** ',
            ephemeral: true
        });
        },
};