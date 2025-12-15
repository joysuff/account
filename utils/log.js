import { formatDateTime } from "./date.js";
import chalk from "chalk";

const logLevels = {
    INFO: chalk.blue,
    WARN: chalk.yellow,
    ERROR: chalk.red,
    DEBUG: chalk.gray
};

const dataColor = chalk.green;

function log(level, message, data) {
    const date = formatDateTime(new Date());
    const colorFn = logLevels[level] || ((text) => text);
    const logMessage = `[${date}] [${level}] ${message}`;
    if (data !== undefined) {
        const dataStr = typeof data === "string"
            ? data 
            : JSON.stringify(data);

        console.log(
            colorFn(logMessage), 
            dataColor(dataStr)
        );
    } else {
        console.log(colorFn(logMessage));
    }
}
function logTable(level, message, tableData) {
    const date = formatDateTime(new Date());
    const colorFn = logLevels[level] || ((text) => text);
    const logMessage = `[${date}] [${level}] ${message}`;
    console.log(colorFn(logMessage));
    console.table(tableData);
}

export default {
    info: (message, data) => log('INFO', message, data),
    warn: (message, data) => log('WARN', message, data),
    error: (message, data) => log('ERROR', message, data),
    debug: (message, data) => log('DEBUG', message, data),
    table: (message, data, level = 'INFO') => logTable(level, message, data)
}