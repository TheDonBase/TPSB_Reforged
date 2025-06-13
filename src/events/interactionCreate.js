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
            await fetch('https://tpsb.croaztek.com/api/command-log', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  discordUserId: interaction.user.id,
                  username: interaction.user.username,
                  commandName: interaction.commandName,
                  arguments: interaction.options?.data ?? []
                })
              });

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