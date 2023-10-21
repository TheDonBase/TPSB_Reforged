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

        // Create log files if they don't exist
        this.logLevels.forEach(level => {
            const logFileName = `${level}.log`;
            const logFilePath = path.join(logFolder, logFileName);
            this.logFiles[level] = fs.createWriteStream(logFilePath, { flags: 'a' });
        });
    }

    log(level, message) {
        if (this.logLevels.includes(level)) {
            const currentDate = new Date();
            const logMessage = `[${currentDate.toLocaleString()} ${level.toUpperCase()}] ${message}`;
            this.logFiles[level].write(logMessage + '\n');
            console[level](logMessage); // Output to console based on log level
        } else {
            console.error(`Invalid log level: ${level}`);
        }
    }

    error(message) {
        this.log('error', message);
    }

    debug(message) {
        this.log('debug', message);
    }

    warning(message) {
        this.log('warning', message);
    }
    
    info(message) {
        this.log('info', message);
    }
}

const LoggerInstance = new Logger();
module.exports = LoggerInstance;
