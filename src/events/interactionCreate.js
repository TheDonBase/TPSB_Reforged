const { Events } = require('discord.js');
const Logger = require('../utils/logger');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {
        if(!interaction.isChatInputCommand()) return;
        Logger.info(`${interaction.user.username} is running ${interaction.commandName}`);
        const command = interaction.client.commands.get(interaction.commandName);
        
        if(!command) {
            Logger.error(`No command matching ${interaction.commandName} was found.`);
            return;
        }
        
        try {
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
            
            interaction.client.commandsUsed += 1;

            await client.redisService.set('lastCommands', JSON.stringify(interaction.client.commandLog));

            await command.execute(interaction, client);
        } catch (error) {
            Logger.error(`Error executing ${interaction.commandName}`);
            Logger.error(error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
            } else {
                await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
            }
        }
    },
};