const winston = require('winston');
const path = require('path');

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'nfl-predictor-backend' },
  transports: [
    // Write all logs to console
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(
          ({ level, message, timestamp, ...metadata }) => {
            let msg = `${timestamp} [${level}]: ${message}`;
            if (Object.keys(metadata).length > 0) {
              try {
                // Filter out circular references and non-serializable objects
                const filteredMetadata = Object.keys(metadata).reduce((acc, key) => {
                  if (key !== 'service' && metadata[key] !== undefined) {
                    try {
                      // Test if it can be stringified
                      JSON.stringify(metadata[key]);
                      acc[key] = metadata[key];
                    } catch (e) {
                      // Skip circular or non-serializable properties
                      acc[key] = '[Circular or Non-Serializable]';
                    }
                  }
                  return acc;
                }, {});

                if (Object.keys(filteredMetadata).length > 0) {
                  msg += ` ${JSON.stringify(filteredMetadata)}`;
                }
              } catch (e) {
                // If all else fails, just log the message without metadata
                msg += ` [Metadata logging error]`;
              }
            }
            return msg;
          }
        )
      )
    }),
    // Write error logs to file
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Write all logs to combined file
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/combined.log'),
      maxsize: 5242880,
      maxFiles: 5,
    })
  ],
});

// Create a stream object for Morgan
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  }
};

module.exports = logger;
