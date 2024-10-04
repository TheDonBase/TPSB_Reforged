const { SlashCommandBuilder, userMention } = require('discord.js');
const Logger = require('../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('withdrawal')
        .setDescription('Notify bankers that you need a withdrawal. You can either type "All" or an actual number.')
        .addStringOption(option =>
            option
                .setName('amount')  // Ensure the name is set to 'Amount'
                .setDescription('Choose your amount')
                .setRequired(true)
        ),
    async execute(interaction) {

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


        try {
            const bankerRoleId = '1165659166501785741'; // Update with actual role ID
            const bankerChannelId = '815742620802089000'; // Update with actual channel ID

            const bankerRoleMention = `<@&${bankerRoleId}>`;
            const bankerChannel = interaction.guild.channels.cache.get(bankerChannelId);

            const amountOption = interaction.options.getString('amount').toLowerCase();

            if (isNaN(amountOption) && amountOption === 'all') {
                await bankerChannel.send(`${bankerRoleMention} ${userMention(interaction.user.id)} wants to withdraw **All** of their cash from the faction bank!`);
            } else if (!isNaN(amountOption) && parseFloat(amountOption) >= 0) {
                await bankerChannel.send(`${bankerRoleMention} ${userMention(interaction.user.id)} wants to withdraw **$${formatNumberWithCommas(amountOption)}** of their cash from the faction bank!`);
            } else if (!isNaN(amountOption) && parseFloat(amountOption) === 0) {
                await interaction.reply("You seem to want to withdraw ***0***$. Is that correct?");
                return;
            } else {
                await interaction.reply("Invalid input. Please provide either 'All' or a valid amount.");
                return;
            }

            await interaction.reply("I have notified the bankers :)");
        } catch (error) {
            Logger.error(`There was an error executing ${this.data.name} with error: ${error}`);
            interaction.reply("There was an unexpected error. Please contact TheDonBase.");
        }
    },
};

function formatNumberWithCommas(number) {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
