const {SlashCommandBuilder, codeBlock} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('Provides information about the currency leaderboard'),
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
            codeBlock(
                `Currency Leaderboard\n\n` +
                client.currency.sort((a, b) => b.balance - a.balance)
                    .filter(user => client.users.cache.has(user.user_id))
                    .first(10)
                    .map((user, position) => `(${position + 1}) ${(client.users.cache.get(user.user_id).displayName)}: ${user.balance}💰`)
                    .join('\n')
            )
        )
    },
};