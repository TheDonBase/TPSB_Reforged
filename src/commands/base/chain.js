const { SlashCommandBuilder } = require('discord.js');

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

            // Loop through each day and create an embed for each
            for (const day of chain.days) {
                const embed = {
                    color: 0x0099ff,
                    title: `Chain Details - ${day.day}`,
                    fields: [
                        { name: 'Chain ID', value: chain.id, inline: true },
                        { name: 'Date', value: day.date, inline: true }
                    ]
                };

                const guardsForDay = chain.guards.filter(guard => guard.day === day.day);
                                guardsForDay.forEach(guard => {
                                    embed.fields.push({ name: guard.hour, value: guard.player });
                                });


                await interaction.channel.send({ embeds: [embed] });
            }
        } catch (error) {
            console.error('Error fetching or processing data:', error);
            await interaction.reply('Failed to fetch or process data.');
        }
    },
};
