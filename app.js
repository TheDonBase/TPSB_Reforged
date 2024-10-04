const express = require('express');
const fs = require('node:fs');
const path = require('node:path');
const Logger = require('./src/utils/logger.js');
const redis = require('redis');

const app = express();
const port = 8080;

// Create Redis client and connect
const client = redis.createClient();

client.on('error', (err) => {
    Logger.error('Redis error: ' + err);
});

(async () => {
    try {
        await client.connect();
        Logger.info('Connected to Redis');
    } catch (err) {
        Logger.error('Could not connect to Redis: ' + err);
    }
})();

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
    Logger.info("API Endpoint reached.");
    // Check if the Redis client is connected
    if (!client.isOpen) {
        Logger.error('Redis client is not connected. Attempting to reconnect...');
        try {
            await client.connect();
        } catch (err) {
            Logger.error('Could not reconnect to Redis: ' + err);
            return res.status(500).send({ error: 'Failed to fetch stats' });
        }
    }

    await client.get('botStats', (err, stats) => {
        Logger.info('Retrieving Stats.')
        if (err) {
            Logger.error('Error fetching stats from Redis: ' + err);
            return res.status(500).send({ error: 'Failed to fetch stats' });
        }
        if (!stats) {
            Logger.warn('No stats found in Redis.');
            return res.status(404).send({ error: 'No stats available' });
        }
        Logger.info(`Sending response with data: ${JSON.stringify(stats)}`)
        res.status(200).json(JSON.parse(stats));
    });
});

// Start the server
app.listen(port, () => {
    Logger.info(`Web interface running at http://localhost:${port}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
    await client.quit();
    Logger.info('Redis client disconnected on application shutdown.');
    process.exit(0);
});
