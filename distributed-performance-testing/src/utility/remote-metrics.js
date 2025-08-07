const { Client } = require('ssh2');
const logger = require('./logger');


//connects to containers via SSH and fetches metrics
const SSH_USERNAME = process.env.SSH_USERNAME || 'root';
const SSH_PASSWORD = process.env.SSH_PASSWORD || 'root';

function execRemoteCommand(host, port, command) {
    return new Promise((resolve, reject) => {
        const conn = new Client();

        conn.on('ready', () => {
            conn.exec(command, (err, stream) => {
                if (err) {
                    conn.end();
                    return reject(err);
                }

                let stdout = '';
                let stderr = '';

                stream.on('close', () => {
                    conn.end();
                    resolve({ stdout, stderr });
                });

                stream.on('data', (data) => {
                    stdout += data.toString();
                });

                stream.stderr.on('data', (data) => {
                    stderr += data.toString();
                });
            });
        });

        conn.on('error', reject);

        conn.connect({
            host: 'localhost',            // Always connect to host
            port,                         // Use the mapped host port (e.g., 2222, 2223)
            username: SSH_USERNAME,
            password: SSH_PASSWORD
});

    });
}

async function collectRemoteMetrics(ip, port, label) {
    logger.info({
        message: {
            type: 'metrics',
            label: `=== Remote Metrics (${label}) - ${ip}:${port} ===`
        }
    });

    const commands = {
        'Available CPUs (cores)': `nproc`,
        'Total Memory (GB)': `grep MemTotal /proc/meminfo | awk '{ printf "%.2f\\n", $2/1024/1024 }'`,
        'Root Disk Size': `df -h / | awk 'NR==2 {print "Size:", $2, "Used:", $3, "Available:", $4, "Usage:", $5}'`,
        'Disk Type': `df -T / | awk 'NR==2 {print $2}'`,

        'CPU Usage': `top -b -n1 | grep "Cpu(s)"`,
        'Memory Usage': `free -h`,
        'Disk Usage': `df -h /`
    };

    for (const [metricLabel, command] of Object.entries(commands)) {
        try {
            const result = await execRemoteCommand(ip, port, command);
            logger.info({
                message: {
                    type: 'metrics',
                    label: metricLabel,
                    output: result.stdout.trim(),
                    host: ip
                }
            });
        } catch (err) {
            logger.error({
                message: {
                    type: 'metrics',
                    label: `${metricLabel} failed on ${ip}`,
                    error: err.message,
                    host: ip
                }
            });
        }
    }

    logger.info({
        message: {
            type: 'metrics',
            label: '=========================================',
            host: ip
        }
    });
}

module.exports = {
    collectRemoteMetrics
};
