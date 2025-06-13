const Logger = require('./logger');
require('dotenv').config();

// Config-objekt för API-anrop
const API_CONFIG = {
    baseUrl: `http://${process.env.DB_HOST}/api`, // Använder DB_HOST från .env
    apiKey: process.env.BOT_API_KEY
};

function validateApiConfig() {
    if (!API_CONFIG.apiKey) {
        throw new Error('BOT_API_KEY saknas i miljövariabler');
    }

    if (!process.env.DB_HOST) {
        throw new Error('DB_HOST saknas i miljövariabler');
    }
}



// Hjälpfunktion för API-anrop
async function sendApiRequest(endpoint, data, retries = 3) {
    try {
        validateApiConfig();

        Logger.debug(`Skickar förfrågan till ${endpoint}`, {
            host: process.env.DB_HOST,
            endpoint,
            environment: process.env.NODE_ENV
        });

        const response = await fetch(`${API_CONFIG.baseUrl}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': API_CONFIG.apiKey
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API svarade med status: ${response.status}, Body: ${errorText}`);
        }

        const result = await response.json();
        Logger.debug(`Lyckad förfrågan till ${endpoint}`, { result });
        return result;
    } catch (error) {
        Logger.error(`API-anropsfel till ${endpoint}:`, {
            error: error.message,
            host: process.env.DB_HOST,
            environment: process.env.NODE_ENV
        });

        if (retries > 0) {
            const delay = (4 - retries) * 1000; // Ökar väntetiden för varje försök
            Logger.info(`Försöker igen om ${delay/1000} sekunder... (${retries} försök kvar)`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return sendApiRequest(endpoint, data, retries - 1);
        }

        throw error;
    }
}

// Heartbeat
async function updateServerStatus(botInfo) {
    try {
        const data = {
            ping: botInfo.ping,
            version: botInfo.version,
            memoryUsage: botInfo.memoryUsage,
            currentActivity: botInfo.currentActivity
        };

        return await sendApiRequest('/bot/heartbeat', data);
    } catch (error) {
        if (process.env.NODE_ENV === 'production') {
            Logger.error('Produktionsfel - Kunde inte skicka heartbeat:', {
                error: error.message,
                host: process.env.DB_HOST
            });
        }
        throw error;
    }
}

// Error logging
async function logError(error, level = 'error') {
    try {
        const data = {
            message: error.message,
            level: level,
            stackTrace: error.stack,
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV
        };

        return await sendApiRequest('/error-log', data);
    } catch (err) {
        Logger.error('Kunde inte logga fel:', {
            originalError: error.message,
            loggingError: err.message,
            host: process.env.DB_HOST
        });
    }
}

// Command logging
async function logCommand(commandInfo) {
    try {
        const data = {
            discordUserId: commandInfo.userId,
            username: commandInfo.username,
            commandName: commandInfo.commandName,
            arguments: commandInfo.arguments,
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV
        };

        return await sendApiRequest('/command-log', data);
    } catch (error) {
        Logger.error('Kunde inte logga kommando:', {
            error: error.message,
            commandInfo: JSON.stringify(commandInfo),
            host: process.env.DB_HOST
        });
        await logError(error, 'warning').catch(() => {});
    }
}

// Hjälpfunktion för att formatera kommandoargument
function formatCommandArguments(options) {
    if (!options?._hoistedOptions) {
        return {};
    }

    try {
        return options._hoistedOptions.reduce((acc, opt) => {
            acc[opt.name] = opt.value;
            return acc;
        }, {});
    } catch (error) {
        Logger.error('Fel vid formatering av kommandoargument:', {
            error: error.message,
            options: JSON.stringify(options)
        });
        return {};
    }
}

// Validera konfigurationen vid start
try {
    validateApiConfig();
    Logger.info('API-konfiguration validerad:', {
        host: process.env.DB_HOST,
        environment: process.env.NODE_ENV
    });
} catch (error) {
    Logger.error('API-konfigurationsfel:', error.message);
    process.exit(1);
}

module.exports = {
    updateServerStatus,
    logError,
    logCommand,
    formatCommandArguments,
    sendApiRequest
};
