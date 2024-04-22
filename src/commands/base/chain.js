const {SlashCommandBuilder} = require('discord.js');
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

            const embed = {
                color: 0x0099ff,
                title: 'Chain Details',
                fields: [
                    {name: 'Chain ID', value: chain.id, inline: true},
                    {name: 'Date', value: chain.date.date, inline: true}
                ]
            };

            chain.days.forEach(day => {
                const guardsString = chain.guards
                    .filter(guard => guard.day === day.date)
                    .map(guard => `${guard.hour}: ${guard.player}`)
                    .join('\n');
                embed.fields.push({name: day.day, value: `${day.date}\nGuards:\n${guardsString}`});
            });

            await interaction.reply({embeds: [embed]});
        } catch (error) {
            console.error('Error fetching or processing data:', error);
            await interaction.reply('Failed to fetch or process data.');
        }
    },
};