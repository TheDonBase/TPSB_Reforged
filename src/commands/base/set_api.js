const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('set-api-key')
        .setDescription('Register your TORN API key to the bot.'),
    async execute(interaction) {
        // Send an ephemeral message with instructions on how to securely provide the API key
        await interaction.reply({
            content: 'This command only works through direct messages. Please do not provide your API key here. send it by saying api-key: **api-key-here** ',
            ephemeral: true
        });
        },
};