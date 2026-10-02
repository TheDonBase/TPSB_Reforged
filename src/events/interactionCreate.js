const { Events } = require('discord.js');
const Logger = require('../utils/logger');

const {
    logError,
    logCommand,
    formatCommandArguments
} = require('../utils/ApiManager.js');

module.exports = {
    name: Events.InteractionCreate,

    async execute(interaction, client) {
        /*
        |--------------------------------------------------------------------------
        | Slash Commands
        |--------------------------------------------------------------------------
        */

        if (interaction.isChatInputCommand()) {
            Logger.info(
                `${interaction.user.username} is running ${interaction.commandName}`
            );

            const command = client.commands.get(
                interaction.commandName
            );

            if (!command) {
                Logger.error(
                    `No command matching ${interaction.commandName} was found.`
                );

                return;
            }

            try {
                Logger.info('Sending Command Log');

                await logCommand({
                    userId: interaction.user.id,
                    username: interaction.user.username,
                    commandName: interaction.commandName,
                    arguments: formatCommandArguments(
                        interaction.options
                    )
                });

                Logger.info(
                    'Command Log Sent Successfully.'
                );

                await command.execute(
                    interaction,
                    client
                );

            } catch (error) {
                await handleError(
                    interaction,
                    error,
                    `command ${interaction.commandName}`
                );
            }

            return;
        }


        /*
        |--------------------------------------------------------------------------
        | Buttons
        |--------------------------------------------------------------------------
        */

        if (interaction.isButton()) {
            Logger.info(
                `${interaction.user.username} clicked button ${interaction.customId}`
            );

            const button = client.buttons.get(
                interaction.customId
            );

            if (!button) {
                Logger.error(
                    `No button matching ${interaction.customId} was found.`
                );

                return;
            }

            try {
                await button.execute(
                    interaction,
                    client
                );

            } catch (error) {
                await handleError(
                    interaction,
                    error,
                    `button ${interaction.customId}`
                );
            }

            return;
        }


        /*
        |--------------------------------------------------------------------------
        | Modal Submissions
        |--------------------------------------------------------------------------
        */

        if (interaction.isModalSubmit()) {
            Logger.info(
                `${interaction.user.username} submitted modal ${interaction.customId}`
            );

            const modal = client.modals.get(
                interaction.customId
            );

            if (!modal) {
                Logger.error(
                    `No modal matching ${interaction.customId} was found.`
                );

                return;
            }

            try {
                await modal.execute(
                    interaction,
                    client
                );

            } catch (error) {
                await handleError(
                    interaction,
                    error,
                    `modal ${interaction.customId}`
                );
            }

            return;
        }
    },
};


/*
|--------------------------------------------------------------------------
| Interaction Error Handler
|--------------------------------------------------------------------------
*/

async function handleError(interaction, error, context) {
    Logger.error(
        `Error executing ${context}`
    );

    Logger.error(error);

    try {
        await logError(error);
    } catch (logErrorException) {
        Logger.error(
            `Unable to send error to API: ${logErrorException.message}`
        );
    }

    const response = {
        content:
            'There was an error while processing your request!',
        ephemeral: true
    };

    try {
        if (interaction.replied) {
            await interaction.followUp(response);
        } else if (interaction.deferred) {
            await interaction.editReply({
                content: response.content
            });
        } else {
            await interaction.reply(response);
        }
    } catch (responseError) {
        Logger.error(
            `Unable to send error response: ${responseError.message}`
        );
    }
}