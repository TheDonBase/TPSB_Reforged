const {SlashCommandBuilder, codeBlock} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('transfer')
        .setDescription('Transfer currency to another user!')
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('Choose the member to transfer too!')
                .setRequired(true))
        .addIntegerOption(option =>
            option
                .setName("amount")
                .setDescription("Choose the amount to transfer.")
                .setMinValue(1)),
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


        const currentAmount = client.currency_helper.getBalance(interaction.user.id);
        const transferAmount = interaction.options.getInteger('amount');
        const transferTarget = interaction.options.getUser('user');

        if (transferAmount > currentAmount) return interaction.reply(`Sorry ${interaction.user}, you only have ${currentAmount}.`);
        if (transferAmount <= 0) return interaction.reply(`Please enter an amount greater than zero, ${interaction.user}.`);

        await client.currency_helper.addBalance(interaction.user.id, -transferAmount);
        await client.currency_helper.addBalance(transferTarget.id, transferAmount);

        return interaction.reply(`Successfully transferred ${transferAmount} 💰 to ${transferTarget.tag}. Your current balance is ${client.currency_helper.getBalance(interaction.user.id)} 💰`);
    },
};