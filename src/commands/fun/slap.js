const { SlashCommandBuilder, userMention} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
		.setName('slap')
		.setDescription('Slap another user!')
        .addUserOption(option =>
        option
        .setName('target')
        .setDescription('Choose the member to slap!')
        .setRequired(true))
        .addStringOption(option =>
        option
        .setName('weapon')
        .setDescription('Choose your weapon of desire.')
        .setRequired(true)
        .addChoices(
            { name: 'Baseball Bat', value: 'Baseball Bat' },
            { name: 'Rotten Fish', value: 'Rotten Fish' },
            { name: 'Spanking Plank', value: 'Spanking Plank' },
            { name: 'Newspaper', value: 'Newspaper' }
        )
        )
        .addStringOption(option =>
        option.setName('reason')
        .setDescription('Tell the person why you want to slap them.')),
    async execute(interaction) {
        const target = interaction.options.getUser('target');
        const user = interaction.user;
        const weapon = interaction.options.getString('weapon');
        const reason = interaction.options.getString('reason');
        if(reason != null) {
            interaction.reply(`${userMention(user.id)} has slapped ${userMention(target.id)} with a **${weapon}** because: ${reason}`)
        } else {
            interaction.reply(`${userMention(user.id)} has slapped ${userMention(target.id)} with a **${weapon}**`)
        }
        },
};