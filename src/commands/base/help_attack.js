const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
		.setName('help-attack')
		.setDescription('Need help defeating a target?')
        .addStringOption(option =>
        option
        .setName('target')
        .setDescription('What is the target you need help with? (Torn id) - Example \"1142705\"')
        .setRequired(true)),
    async execute(interaction) {
        const chainers = '<@&1117518078616539197>';
        const help_channel = interaction.guild.channels.cache.get('1192646606026195025');
        const target = interaction.options.getString('target');

        const attackUrl = `https://www.torn.com/loader.php?sid=attack&user2ID=${target}`

        await help_channel.send({
            content: `${chainers}, ${interaction.user} needs help killing a target! 🚨 \n[Help Here](${attackUrl})`,
        });

        },
};