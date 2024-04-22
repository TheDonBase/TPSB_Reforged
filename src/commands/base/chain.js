const { SlashCommandBuilder } = require('discord.js');
const {MessageEmbed} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
.setName('chain')
.setDescription('Check current chain schedule')
    .addIntegerOption(option =>
    option
    .setName("id")
    .setDescription("Chain ID")
    .setMinValue(1)),
    async execute(interaction) {
        const id = interaction.options.getInteger('id');
        const url = `https://croaztek.com/admin/api_get_chain/${id}`;
        try {
            const response = await fetch(url, {
                method: 'GET'
            });
            if (!response.ok) {
                interaction.reply("There was an error getting the chain details, please contact TheDonBase");
            }
            const chain = await response.json();

            // Constructing the embed
            const embed = new MessageEmbed()
                        .setColor('#0099ff')
                        .setTitle('Chain Details')
                        .addField('Chain ID', chain.id)
                        .addField('Date', chain.date.date);

            // Adding days and guards information
            chain.days.forEach(day => {
                const guardsString = chain.guards
                            .filter(guard => guard.day === day.date)
                            .map(guard => `${guard.hour}: ${guard.player}`)
                            .join('\n');
                embed.addField(day.day, `${day.date}\nGuards:\n${guardsString}`);
            });

            // Sending the embed
            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error fetching or processing data:', error);
            await interaction.reply('Failed to fetch or process data.');
        }
    },
};