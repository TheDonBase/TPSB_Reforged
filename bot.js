const fs = require('node:fs');
const path = require('node:path');

const {
    Client,
    Collection,
    GatewayIntentBits,
    Partials
} = require('discord.js');

const { token } = require('./config.json');

const Logger = require('./src/utils/logger.js');
const ErrorHandler = require('./src/utils/ErrorHandler.js');
const CurrencyHelper = require('./src/utils/CurrencyHelper.js');


/*
|--------------------------------------------------------------------------
| Discord Client
|--------------------------------------------------------------------------
*/

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildPresences
    ],

    partials: [
        Partials.Channel,
        Partials.Message
    ]
});


/*
|--------------------------------------------------------------------------
| Collections
|--------------------------------------------------------------------------
*/

client.currency = new Collection();

client.commands = new Collection();
client.buttons = new Collection();
client.modals = new Collection();

client.commandsUsed = 0;
client.commandLog = [];


/*
|--------------------------------------------------------------------------
| Command Loader
|--------------------------------------------------------------------------
*/

const foldersPath = path.join(
    __dirname,
    'src/commands'
);

const commandFolders = fs.readdirSync(
    foldersPath
);

for (const folder of commandFolders) {
    const commandsPath = path.join(
        foldersPath,
        folder
    );

    const commandFiles = fs
        .readdirSync(commandsPath)
        .filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const filePath = path.join(
            commandsPath,
            file
        );

        const command = require(filePath);

        if (
            'data' in command &&
            'execute' in command
        ) {
            client.commands.set(
                command.data.name,
                command
            );

            Logger.info(
                `Command loaded: ${command.data.name}`
            );
        } else {
            Logger.error(
                `The command at ${filePath} is missing a required ` +
                `"data" or "execute" property.`
            );
        }
    }
}


/*
|--------------------------------------------------------------------------
| Button Loader
|--------------------------------------------------------------------------
*/

const buttonsPath = path.join(
    __dirname,
    'src/interactions/buttons'
);

if (fs.existsSync(buttonsPath)) {
    const buttonFiles = fs
        .readdirSync(buttonsPath)
        .filter(file => file.endsWith('.js'));

    Logger.info(
        `Loading ${buttonFiles.length} button handlers`
    );

    for (const file of buttonFiles) {
        const filePath = path.join(
            buttonsPath,
            file
        );

        const button = require(filePath);

        if (
            'customId' in button &&
            'execute' in button
        ) {
            client.buttons.set(
                button.customId,
                button
            );

            Logger.info(
                `Button loaded: ${button.customId}`
            );
        } else {
            Logger.error(
                `The button at ${filePath} is missing a required ` +
                `"customId" or "execute" property.`
            );
        }
    }
}


/*
|--------------------------------------------------------------------------
| Modal Loader
|--------------------------------------------------------------------------
*/

const modalsPath = path.join(
    __dirname,
    'src/interactions/modals'
);

if (fs.existsSync(modalsPath)) {
    const modalFiles = fs
        .readdirSync(modalsPath)
        .filter(file => file.endsWith('.js'));

    Logger.info(
        `Loading ${modalFiles.length} modal handlers`
    );

    for (const file of modalFiles) {
        const filePath = path.join(
            modalsPath,
            file
        );

        const modal = require(filePath);

        if (
            'customId' in modal &&
            'execute' in modal
        ) {
            client.modals.set(
                modal.customId,
                modal
            );

            Logger.info(
                `Modal loaded: ${modal.customId}`
            );
        } else {
            Logger.error(
                `The modal at ${filePath} is missing a required ` +
                `"customId" or "execute" property.`
            );
        }
    }
}


/*
|--------------------------------------------------------------------------
| Event Loader
|--------------------------------------------------------------------------
*/

client.events = new Collection();

const eventsPath = path.join(
    __dirname,
    'src/events'
);

const eventFiles = fs
    .readdirSync(eventsPath)
    .filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const filePath = path.join(
        eventsPath,
        file
    );

    const event = require(filePath);

    if (
        'name' in event &&
        'execute' in event
    ) {
        client.events.set(
            event.name,
            event
        );
    }

    if (event.once) {
        client.once(
            event.name,
            (...args) =>
                event.execute(
                    ...args,
                    client
                )
        );

        Logger.info(
            `Running Event: ${event.name}`
        );

    } else {
        client.on(
            event.name,
            (...args) =>
                event.execute(
                    ...args,
                    client
                )
        );

        Logger.info(
            `Running Event: ${event.name}`
        );
    }
}


/*
|--------------------------------------------------------------------------
| Cron Jobs
|--------------------------------------------------------------------------
*/

const cronPath = path.join(
    __dirname,
    'src/cronJobs'
);

if (fs.existsSync(cronPath)) {
    const files = fs.readdirSync(
        cronPath
    );

    const jsFiles = files.filter(
        file => file.endsWith('.js')
    );

    Logger.info(
        `Loading ${jsFiles.length} cron jobs`
    );

    jsFiles.forEach((file, index) => {
        const cronJob = require(
            `./src/cronJobs/${file}`
        );

        Logger.info(
            `${index + 1}: ${file} loaded.`
        );

        cronJob(client);
    });
}


/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

client.currency_helper =
    new CurrencyHelper(client);

client.errorHandler =
    new ErrorHandler(client);

Logger.info(
    'Added CurrencyHelper'
);


/*
|--------------------------------------------------------------------------
| Login
|--------------------------------------------------------------------------
*/

client.login(token);


/*
|--------------------------------------------------------------------------
| Unhandled Promise Rejections
|--------------------------------------------------------------------------
*/

process.on(
    'unhandledRejection',
    async (reason) => {
        const message =
            reason?.message ??
            reason?.toString() ??
            'Unknown rejection';

        Logger.error(message);

        try {
            await fetch(
                'https://tpsb.croaztek.com/api/error-log',
                {
                    method: 'POST',

                    headers: {
                        'Content-Type':
                            'application/json'
                    },

                    body: JSON.stringify({
                        level:
                            'unhandledRejection',

                        message,

                        stackTrace:
                            reason?.stack ?? null
                    })
                }
            );
        } catch (error) {
            Logger.error(
                `Unable to send unhandled rejection to API: ${error.message}`
            );
        }
    }
);