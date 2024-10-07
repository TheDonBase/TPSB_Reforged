const Logger = require('./src/utils/logger.js');
const RedisService = require('./src/utils/RedisService.js');
const port = 8080;
const express = require('express');
const http = require('http');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const redisService = new RedisService();

app.use(cors());
app.use(express.static('src/public')); // Serve static files from src/public

// Dynamically create routes for each HTML file in src/public
const publicPath = path.join(__dirname, 'src/public'); // Corrected path
fs.readdir(publicPath, (err, files) => {
    if (err) {
        console.error('Failed to read public directory:', err);
        return;
    }

    files.forEach(file => {
        if (file.endsWith('.html')) {
            const route = `/${file.replace('.html', '')}`; // Remove .html for the route
            app.get(route, (req, res) => {
                res.sendFile(path.join(publicPath, file));
            });
            console.log(`Route created: ${route} -> ${file}`);
        }
    });
});

let currentStats = {};

async function initializeStats() {
    const stats = await redisService.get('botStats');
    if (stats) {
        currentStats = stats; // Update currentStats with fetched data
    } else {
        Logger.warn('No botStats found in Redis. Using default values.');
        currentStats = {
            memberCount: 0,
            commandsUsed: 0,
            uptime: 0,
            ping: 0,
            lastCommands: []
        };
    }
}

// Call initializeStats on server start
initializeStats().then(() => {
    console.log('Initialized stats from Redis');
});

// Endpoint to get stats
app.get('/api/stats', (req, res) => {
    res.json(currentStats);
});

// Redis Pub/Sub
redisService.subscribe('botStatsChannel', (message) => {
    currentStats = message; // Update currentStats when a new message is received
    console.log('Updated stats from Redis:', currentStats);
});

// Start the server
server.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
