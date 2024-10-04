const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
		.setName('server')
		.setDescription('Provides information about the server.'),
    async execute(interaction) {
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
      
      // interaction.guild is the object representing the Guild in which the command was run
        await interaction.reply(`This server is ${interaction.guild.name} and has ${interaction.guild.memberCount} members.`);
        },
};