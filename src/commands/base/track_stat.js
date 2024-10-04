const {SlashCommandBuilder, userMention} = require('discord.js');
const Logger = require('../../utils/logger');


module.exports = {
    data: new SlashCommandBuilder()
        .setName('track-stats')
        .setDescription('Start tracking your stats'),
    async execute(interaction) {
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

        const instructions = `
Please send me a private message with the following text:
\`\`\`
track-stats:<your-api-key>
\`\`\`
Replace <your-api-key> with your Torn API key.
And you don't have to use < - > these symbols
`;

        // Reply with the instructions
        await interaction.reply(instructions);
    },
};