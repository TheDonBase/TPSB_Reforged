const {SlashCommandBuilder, userMention} = require('discord.js');
const Logger = require('../../utils/logger');


module.exports = {
    data: new SlashCommandBuilder()
        .setName('track-stats')
        .setDescription('Start tracking your stats'),
    async execute(interaction) {

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