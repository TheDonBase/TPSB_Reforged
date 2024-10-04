const express = require('express');
const fs = require('node:fs');
const path = require('node:path');
const Logger = require('./src/utils/logger.js');
const RedisService = require('./src/utils/RedisService.js');
const app = express();
const port = 8080;

// Initialize Redis Service
const redisService = new RedisService();

app.use(express.json());
app.use(express.static("src/public"));

// Function to set up routes for public directory
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

// Endpoint to get bot stats
app.get('/api/stats', async (req, res) => {
    try {
        Logger.info("Stats API Endpoint reached.");
        const stats = await redisService.get('botStats');

        if (!stats) {
            Logger.warn('No stats found in Redis.');
            return res.status(404).send({ error: 'No stats available' });
        }
        
        const now = Date.now();
        const sentTime = new Date(stats.sent).getTime(); // Convert sent to timestamp
        const timeDifference = now - sentTime;

        // Check if the 'sent' timestamp is more than 5 minutes old (300,000 milliseconds)
        if (timeDifference > 300000) {
            stats.serverStatus = 'Offline'; // Alter server status to 'Offline'
        }

        res.status(200).json(stats);
    } catch (err) {
        Logger.error('Error fetching stats from Redis: ' + err);
        res.status(500).send({ error: 'Failed to fetch stats' });
    }
});

app.get('/api/commands', async (req, res) => {
    try {
        Logger.info("Commands API Endpoint reached.");
        const stats = await redisService.get('lastCommands');

        if (!stats) {
            Logger.warn('No stats found in Redis.');
            return res.status(404).send({ error: 'No stats available' });
        }
       

        res.status(200).json(stats);
    } catch (err) {
        Logger.error('Error fetching stats from Redis: ' + err);
        res.status(500).send({ error: 'Failed to fetch stats' });
    }
});


redisService.subscribe('botStatsChannel', (stats) => {
    // Assuming you have a function to update the page with new stats
    Logger.info('Received bot stats via pub/sub');
    // Send the stats via WebSocket to the client, or directly update in-memory data
});

redisService.subscribe('botCommandsChannel', (stats) => {
    // Assuming you have a function to update the page with new stats
    Logger.info('Received bot stats via pub/sub');
    // Send the stats via WebSocket to the client, or directly update in-memory data
});

// Start the server
app.listen(port, () => {
    Logger.info(`Web interface running at http://localhost:${port}`);
});