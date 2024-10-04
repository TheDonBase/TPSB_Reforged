const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits, Partials } = require('discord.js');
const { token } = require('./config.json');
const Logger = require('./src/utils/logger.js');
const ErrorHandler = require('./src/utils/ErrorHandler.js');
const CurrencyHelper = require('./src/utils/CurrencyHelper.js');
const redis = require('redis');
const RedisService = require('./src/utils/RedisService.js');

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

client.redisService = new RedisService();

client.currency = new Collection();
client.commands = new Collection();
client.commandLog = new Collection();

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
    if ('name' in event && 'execute' in event) {
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
    Logger.error('Missing files');
    return;
}

let jsFiles = files.filter(f => f.split('.').pop() === 'js');

if (jsFiles.length <= 0) {
    return;
}

Logger.info(`Loading ${jsFiles.length} cron jobs`);

jsFiles.forEach((f, i) => {
    let props = require(`./src/cronJobs/${f}`);
    Logger.info(`${i + 1}: ${f} loaded.`);
    props(client);
});

client.currency_helper = new CurrencyHelper(client);
client.errorHandler = new ErrorHandler(client);

Logger.info(`Added CurrencyHelper`);

async function updateBotStats() {
    const guild = client.guilds.cache.get('731431228959490108');
    const stats = {
        serverName: guild ? guild.name : null,
        memberCount: guild ? guild.memberCount : 0,
        serverStatus: client.ws.status === 0 ? 'Online' : 'Offline',
        uptime: process.uptime(),
        ping: client.ws.ping,
        sent: new Date().toISOString()
    };

    // Instead of just setting it in Redis, publish to a channel
    await client.redisService.set('botStats', stats);
    await client.redisService.publish('botStatsChannel', stats);
}
// Update stats every 30 seconds
setInterval(updateBotStats, 30000);

client.login(token);
