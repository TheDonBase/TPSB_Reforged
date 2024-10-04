const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
		.setName('become-paramedic')
		.setDescription('Become a paramedic!'),
    async execute(interaction) {
        const paramedic_role = '1163661894498930749';

        // Log command execution
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

        if(interaction.member.roles.cache.has(paramedic_role)) {
            await interaction.member.roles.remove(paramedic_role)
            interaction.reply("Awww shmucks... You are no longer a paramedic!");
        } else {
            await interaction.member.roles.add(paramedic_role)
            interaction.reply("You are now a paramedic, Way to go our Savior!");
        }
    },
};