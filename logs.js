exports.getLogs = exports.Logs = void 0;

class Logs {
    constructor(logger, level = 3) {
        this.logger = logger;
        this.level = level;
        logs = this;
    }
    trace(message, ...parameters) {
        if (this.level == 5) {
            this.logger.info(message, ...parameters);
        }
    }
    debug(message, ...parameters) {
        if (this.level >= 4) {
            this.logger.info(message, ...parameters);
        }
    }
    info(message, ...parameters) {
        if (this.level >= 3) {
            this.logger.info(message, ...parameters);
        }
    }
    warn(message, ...parameters) {
        if (this.level >= 2) {
            this.logger.warn(message, ...parameters);
        }
    }
    error(message, ...parameters) {
        if (this.level >= 1) {
            this.logger.error(message, ...parameters);
        }
    }
}
exports.Logs = Logs;

let logs;
function getLogs() {
    return logs;
}

exports.getLogs = getLogs;
