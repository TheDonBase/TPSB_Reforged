const { SlashCommandBuilder } = require('discord.js');
const {MessageEmbed} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
.setName('chains')
.setDescription('Check current chains'),
    async execute(interaction) {
        const url = 'https://croaztek.com/admin/api_get_chains';
        try {
            const response = await fetch(url);
            if (!response.ok) {
                interaction.reply("There was an error getting the chains, please contact TheDonBase");
            }
            const chains = await response.json();

            const embed = {
                color: 0x0099ff,
                title: 'Latest Chains',
                fields: [],
            };

            // Add the latest chains to the embed
            chains.slice(0, 5).forEach((chain, index) => {
                embed.fields.push({
                    name: `Chain ${index + 1}`,
                    value: `ID: ${chain.id}\n Start Date: ${chain.date}`,
                });
            });

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error fetching or processing data:', error);
            await interaction.reply('Failed to fetch or process data.');
        }
    },
};