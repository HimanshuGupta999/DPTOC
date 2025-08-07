const { exec } = require('child_process');
const logger = require('./logger');

function execCommand(cmd, label) {
    exec(cmd, (err, stdout, stderr) => {
        if (err) {
            logger.error({ type: 'metrics', label, error: err.message });
            return;
        }
        if (stderr) {
            logger.warn({ type: 'metrics', label, stderr });
        }
        logger.info({ type: 'metrics', label, output: stdout.trim() });
    });
}

function logSystemStats(label = '') {
    logger.info({ type: 'metrics', label: `=== System Metrics (${label}) ===` });
    execCommand("top -b -n1 | grep 'Cpu(s)'", 'CPU Usage');
    execCommand("free -h", 'Memory Usage');
    execCommand("df -h /", 'Disk Usage');
    logger.info({ type: 'metrics', label: '=========================================' });
}

let intervalId = null;

function startContinuousLogging(intervalMs = 5000) {
    if (intervalId) return;
    logger.info({ type: 'metrics', message: `Starting CONTINUOUS system metrics logging every ${intervalMs / 1000}s` });
    intervalId = setInterval(() => logSystemStats('During execution'), intervalMs);
}

function stopContinuousLogging() {
    if (intervalId) {
        clearInterval(intervalId);
        logger.info({ type: 'metrics', message: 'Stopped CONTINUOUS system metrics logging.' });
        intervalId = null;
    }
}

module.exports = {
    logSystemStats,
    startContinuousLogging,
    stopContinuousLogging
};
