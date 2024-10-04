const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
		.setName('revive')
		.setDescription('Call for a revive!'),
    async execute(interaction) {
        const paramedic_role = '<@&1163661894498930749>';
        const revive_channel = interaction.guild.channels.cache.get('1163661338359377942');

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
        
        await revive_channel.send({
            content: `${paramedic_role}, ${interaction.user} needs a revive! 🏥`,
        });
        
    },
};