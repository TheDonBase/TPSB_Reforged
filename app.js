const express = require('express');
const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits, Partials } = require('discord.js');
const { token } = require('./config.json');
const Logger = require('./src/utils/logger.js');
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

const app = express();
const port = 8080;

app.use(express.json());
app.use(express.static("public"))

function setupRoutesForPublicDir(directory, app) {
    fs.readdirSync(directory).forEach((file) => {
        const fullPath = path.join(directory, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            // If it's a directory, recursively process its contents
            setupRoutesForPublicDir(fullPath, app);
        } else if (path.extname(file) === '.html') {
            // If it's an HTML file, create a route
            const relativePath = fullPath.replace(path.join(__dirname, 'src/public'), '');
            const routePath = relativePath.replace(/\\/g, '/').replace(/\.html$/, '');

            // Serve the HTML file at the generated route
            app.get(routePath, (req, res) => {
                res.sendFile(fullPath);
            });

            Logger.info(`Route created: ${routePath} -> ${fullPath}`);
        }
    });
}

// Setup routes for all HTML files in the src/public directory
setupRoutesForPublicDir(path.join(__dirname, 'src/public'), app);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'src', 'public', 'index.html'));
});

app.post('/api/send-message', async (req, res) => {
    Logger.debug(`Request Body: ${req.body}`)
    const { channelId, message } = req.body;

    try {
        const channel = await client.channels.fetch(channelId);
        await channel.send(message);
        res.status(200).send({ success: true });
    } catch (error) {
        Logger.error(`Error sending message: ${error}`);
        res.status(500).send({ error: 'Failed to send message' });
    }
});

app.get('/api/stats', async (req, res) => {
    try {
        const guild = client.guilds.cache.get('731431228959490108'); // Replace with your guild (server) ID
        if (!guild) return res.status(404).send({ error: 'Guild not found' });

        const memberCount = guild.memberCount;
        const serverName = guild.name;
        const serverStatus = client.ws.status; // WebSocket status (0 = connected)

        const stats = {
            serverName,
            memberCount,
            serverStatus: serverStatus === 0 ? 'Online' : 'Offline',
            uptime: process.uptime(),
            ping: client.ws.ping
        };

        res.status(200).json(stats);
    } catch (error) {
        Logger.error(`Error fetching stats: ${error}`);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});


app.listen(port, () => {
    Logger.info(`Webinterface running at http://localhost:${port}`);
})

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
