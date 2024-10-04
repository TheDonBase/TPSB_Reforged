const express = require('express');
const fs = require('node:fs');
const path = require('node:path');
const Logger = require('./src/utils/logger.js');
const redis = require('redis');
const client = redis.createClient();

const app = express();
const port = 8080;

app.use(express.json());
app.use(express.static("src/public"))

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

app.get('/api/stats', async (req, res) => {
    client.get('botStats', (err, stats) => {
        if (err) {
            Logger.error('Error fetching stats from Redis');
            return res.status(500).send({ error: 'Failed to fetch stats' });
        }
        res.status(200).json(JSON.parse(stats));
    });
});


app.listen(port, () => {
    Logger.info(`Webinterface running at http://localhost:${port}`);
})