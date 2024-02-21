const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits, Partials } = require('discord.js');
const { token } = require('./config.json');
const Logger = require('./src/utils/Logger');
const { Users, CurrencyShop } = require('./src/utils/dbObjects.js');
const { Op } = require('sequelize');
const CurrencyHelper = require('./src/utils/CurrencyHelper');

const client = new Client({ intents: [
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

client.currency = new Collection();

client.commands = new Collection();
const foldersPath = path.join(__dirname, 'src/commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        // Set a new item in the Collection with the key as the command name and the value as the exported module
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
        } else {
            Logger.error(`The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
    }
}

client.events = new Collection();
const eventsPath = path.join(__dirname, 'src/events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    if('name' in event && 'execute' in event) {
        client.events.set(event.name, event);
    } 
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client));
        Logger.info(`Running Event: ${event.name}`);
    } else {
        client.on(event.name, (...args) => event.execute(...args, client));
        Logger.info(`Running Event: ${event.name}`);
    }
}

const files = fs.readdirSync('./src/cronJobs');

if (!files) {
    Logger.error('missing files')
    return;
}

let jsFiles = files.filter(f => f.split('.').pop() === 'js');

if(jsFiles.length <= 0) {
    return;
}

Logger.info(`Loading ${jsFiles.length} cron jobs`);

jsFiles.forEach((f, i) => {
    let props = require(`./src/cronJobs/${f}`);
    Logger.info(`${i + 1}: ${f} loaded.`)
    props(client);
});


client.currency_helper = new CurrencyHelper(client);
Logger.info(`Added CurrencyHelper`)

client.login(token);