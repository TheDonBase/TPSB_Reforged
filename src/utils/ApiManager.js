const Logger = require('./logger');

// Config-objekt för API-anrop
const API_CONFIG = {
    baseUrl: process.env.API_BASE_URL || 'https://tpsb.croaztek.com/api',
    apiKey: process.env.BOT_API_KEY
};

// Hjälpfunktion för API-anrop
async function sendApiRequest(endpoint, data) {
    try {
        Logger.debug(`Skickar förfrågan till ${endpoint}`, {
            endpoint,
            data: JSON.stringify(data)
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
            stack: error.stack
        });
        throw error;
    }
}

// Heartbeat
async function updateServerStatus(botInfo) {
    try {
        const data = {
            ping: botInfo.ping,
            version: botInfo.version,
            memoryUsage: botInfo.memoryUsage, // Använd värdet som skickas in
            currentActivity: botInfo.currentActivity // Ändrat från activity till currentActivity
        };

        return await sendApiRequest('/bot/heartbeat', data);
    } catch (error) {
        Logger.error('Kunde inte skicka heartbeat:', {
            error: error.message,
            botInfo: JSON.stringify(botInfo)
        });
        throw error; // Kasta om felet för att låta anroparen hantera det
    }
}

// Error logging
async function logError(error, level = 'error') {
    try {
        const data = {
            message: error.message,
            level: level,
            stackTrace: error.stack,
            timestamp: new Date().toISOString()
        };

        return await sendApiRequest('/error-log', data);
    } catch (err) {
        Logger.error('Kunde inte logga fel:', {
            originalError: error.message,
            loggingError: err.message
        });
        // Här kastar vi inte om felet eftersom detta är en loggningsfunktion
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
            timestamp: new Date().toISOString()
        };

        return await sendApiRequest('/command-log', data);
    } catch (error) {
        Logger.error('Kunde inte logga kommando:', {
            error: error.message,
            commandInfo: JSON.stringify(commandInfo)
        });
        // Logga som varning
        await logError(error, 'warning').catch(err => {
            Logger.error('Kunde inte logga kommandofel:', err.message);
        });
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

// Hjälpfunktion för att validera API-konfiguration
function validateApiConfig() {
    if (!API_CONFIG.apiKey) {
        throw new Error('BOT_API_KEY saknas i miljövariabler');
    }

    if (!API_CONFIG.baseUrl) {
        throw new Error('API_BASE_URL saknas i miljövariabler');
    }
}

// Validera konfigurationen vid start
try {
    validateApiConfig();
} catch (error) {
    Logger.error('API-konfigurationsfel:', error.message);
    process.exit(1); // Avsluta processen om konfigurationen är ogiltig
}

module.exports = {
    updateServerStatus,
    logError,
    logCommand,
    formatCommandArguments,
    sendApiRequest
};