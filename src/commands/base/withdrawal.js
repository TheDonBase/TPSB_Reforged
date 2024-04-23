const { SlashCommandBuilder, userMention } = require('discord.js');
const Logger = require('../../utils/logger');


module.exports = {
    data: new SlashCommandBuilder()
	.setName('withdrawal')
    .setDescription('Notify bankers that you need a withdrawal! You can either type \"All\" Or an actual number')
    .addStringOption(option =>
        option
        .setName('amount')  // Ensure the name is set to 'Amount'
        .setDescription('Choose your amount')
        .setRequired(true)
        ),
    async execute(interaction) {
        try {
            const banker_role = '<@&1165659166501785741>';
            const banker_channel = interaction.guild.channels.cache.get('815742620802089000');
            const amountOption = interaction.options.getString('amount');
            if (isNaN(amountOption) && amountOption.toLocaleLowerCase() === 'all') {
                await banker_channel.send(`${banker_role} ${userMention(interaction.user.id)} Wants to withdraw **All** Of his cash from the faction bank!`);
                interaction.reply("I have notified the bankers :)")
            } else if (!isNaN(amountOption) && amountOption >= 0) {
                await banker_channel.send(`${banker_role} ${userMention(interaction.user.id)} Wants to withdraw **$${formatNumberWithCommas(amountOption)}** Of their cash from the faction bank!`);
                interaction.reply("I have notified the bankers :)")
            }
            interaction.reply("Something weird is going on, please let TheDonBase know so he can investigate")
        } catch (error) {
            Logger.error(`There was an error executing ${this.data.name} with error: ${error}`);
            interaction.reply("There was an unexpected error :( please contact TheDonBase")
        }
    },
};

function formatNumberWithCommas(number) {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}