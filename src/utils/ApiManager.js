// Config-objekt för API-anrop
const API_CONFIG = {
    baseUrl: 'https://tpsb.croaztek.com/api',
    apiKey: process.env.BOT_API_KEY // Läs från .env fil
};

// Hjälpfunktion för API-anrop
async function sendApiRequest(endpoint, data) {
    try {
        const response = await fetch(`${API_CONFIG.baseUrl}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': API_CONFIG.apiKey
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`API svarade med status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('API-anropsfel:', error);
        throw error;
    }
}

// Exempel på användning för heartbeat
// Heartbeat
async function updateServerStatus(botInfo) {
    try {
        await sendApiRequest('/bot/heartbeat', {
            ping: botInfo.ping,
            version: botInfo.version,
            memoryUsage: process.memoryUsage().heapUsed,
            currentActivity: botInfo.activity
        });
    } catch (error) {
        console.error('Kunde inte skicka heartbeat:', error);
        // Här kan vi välja att kasta om felet om vi vill hantera det uppströms
    }
}

// Error logging
async function logError(error, level = 'error') {
    try {
        await sendApiRequest('/error-log', {
            message: error.message,
            level: level,
            stackTrace: error.stack
        });
    } catch (err) {
        console.error('Kunde inte logga fel:', err);
    }
}

// Command logging
async function logCommand(commandInfo) {
    try {
        await sendApiRequest('/command-log', {
            discordUserId: commandInfo.userId,
            username: commandInfo.username,
            commandName: commandInfo.commandName,
            arguments: commandInfo.arguments
        });
    } catch (error) {
        console.error('Kunde inte logga kommando:', error);
        // Vi kan välja att logga detta som ett fel också
        await logError(error, 'warning');
    }
}

// Hjälpfunktion för att formatera kommandoargument
function formatCommandArguments(options) {
    if (!options?._hoistedOptions) return {};

    return options._hoistedOptions.reduce((acc, opt) => {
        acc[opt.name] = opt.value;
        return acc;
    }, {});
}

module.exports = {
    // Exportera alla funktioner
    updateServerStatus,
    logError,
    logCommand,
    // Hjälpfunktioner
    formatCommandArguments,
    // För testning/debugging
    sendApiRequest
};
