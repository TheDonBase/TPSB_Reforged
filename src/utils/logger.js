const fs = require('fs');
const path = require('path');

class Logger {
    constructor() {
        this.logLevels = ['error', 'debug', 'warning', 'info'];
        this.logFiles = {};

        const logFolder = path.join(__dirname, 'logs');

        if (!fs.existsSync(logFolder)) {
            fs.mkdirSync(logFolder);
        }

        this.logLevels.forEach(level => {
            const logFileName = `${level}.log`;
            const logFilePath = path.join(logFolder, logFileName);
            this.logFiles[level] = fs.createWriteStream(logFilePath, { flags: 'a' });
        });
    }

    log(level, message, data = null) {
        if (!this.logLevels.includes(level)) {
            console.error(`Invalid log level: ${level}`);
            return;
        }

        const currentDate = new Date();
        let logMessage = `[${currentDate.toLocaleString()} ${level.toUpperCase()}] ${message}`;

        if (data) {
            try {
                // Förhindra extremt lång output
                const cleanedData = { ...data };
                if (cleanedData.errorMessage?.length > 500) {
                    cleanedData.errorMessage = cleanedData.errorMessage.slice(0, 500) + '... [trunkerad]';
                }
                if (cleanedData.errorStack?.length > 800) {
                    cleanedData.errorStack = cleanedData.errorStack.slice(0, 800) + '... [trunkerad]';
                }

                logMessage += `\n${JSON.stringify(cleanedData, null, 2)}`;
            } catch (e) {
                logMessage += ` [Kunde inte serialisera data: ${e.message}]`;
            }
        }

        // Skriv till fil
        this.logFiles[level].write(logMessage + '\n');

        // Skriv till konsol
        const consoleMethod = level === 'warning' ? 'warn' : level;
        console[consoleMethod](logMessage);
    }

    error(message, data = null) {
        this.log('error', message, data);
    }

    debug(message, data = null) {
        this.log('debug', message, data);
    }

    warning(message, data = null) {
        this.log('warning', message, data);
    }

    info(message, data = null) {
        this.log('info', message, data);
    }
}

const LoggerInstance = new Logger();
module.exports = LoggerInstance;
