const Logger = require('./logger');

// Create the ErrorHandler class
class ErrorHandler {
    constructor(client) {
        this.client = client;

        // Listen for process errors
        process.on('unhandledRejection', (error) => this.handleError('Unhandled Rejection', error));
        process.on('uncaughtException', (error) => this.handleError('Uncaught Exception', error));
    }

    // Handle errors and send them to the specified Discord channel
    async handleError(type, error) {
        console.error(`${type}:`, error);

        const logChannelId = '731989414531563603'; // Your log channel ID
        try {
            const logChannel = await this.client.channels.fetch(logChannelId);
            if (logChannel) {
                await logChannel.send(`**${type}**: \`${error.message}\`\n\`\`\`${error.stack}\`\`\``);
            } else {
                console.warn('Log channel not found');
            }
        } catch (fetchError) {
            console.error('Error fetching the log channel:', fetchError);
        }
    }
}

module.exports = ErrorHandler;