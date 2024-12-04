const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf } = format;
const DailyRotateFile = require('winston-daily-rotate-file');

// Define the custom format for log messages
const logFormat = printf(({ level, message, timestamp }) => {
    return `${timestamp} [${level}]: ${message}`;
});

// Create the logger
const logger = createLogger({
    format: combine(
        timestamp(),
        logFormat
    ),
    transports: [
        new DailyRotateFile({
            filename: 'logs/esCalc-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '14d'
        }),
        new transports.Console({ level: 'debug' })
    ]
});

module.exports = logger;
