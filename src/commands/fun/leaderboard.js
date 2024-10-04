const {SlashCommandBuilder, codeBlock} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('Provides information about the currency leaderboard'),
    async execute(interaction, client) {
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