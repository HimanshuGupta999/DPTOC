require('../utility/otel');
const { Client } = require('ssh2');
const logger = require('../utility/logger');
const config = require('../../config/config');
const executeCommand = require('../commands/executeCommand');
const executeBackgroundCommand = require('../commands/executeBackgroundCommand');

// Check if InfluxDB CLI is present
function checkInflux(ip, callback) {
    const checkCommand = `which influx || echo "not found"`;
    executeCommand(ip, checkCommand, (err, result) => {
        if (err) return callback(err);
        return callback(null, result.trim() !== 'not found');
    });
}

// Install InfluxDB and perform initial setup
async function installInfluxDB(ip, callback) {
    try {
        const installCommand = `
        # Cleanup
        sudo rm -rf /etc/apt/keyrings/influxdata-archive_compat.asc

        # Add repo
        sudo mkdir -p /etc/apt/keyrings
        curl -fsSL https://repos.influxdata.com/influxdata-archive_compat.key | sudo tee /etc/apt/keyrings/influxdata-archive_compat.asc > /dev/null
        sudo chmod 644 /etc/apt/keyrings/influxdata-archive_compat.asc
        echo "deb [signed-by=/etc/apt/keyrings/influxdata-archive_compat.asc] https://repos.influxdata.com/debian stable main" | sudo tee /etc/apt/sources.list.d/influxdata.list

        # Install
        sudo apt-get update && sudo apt-get install -y influxdb2 influxdb2-cli

        # Setup InfluxDB
        influx setup --username ${config.influxDbUser} --password ${config.influxDbPassword} \\
          --org ${config.influxDbOrg} --bucket ${config.influxDbBucket} \\
          --token ${config.influxDbToken} --force
        `;
        executeCommand(ip, installCommand, callback);
    } catch (err) {
        callback(err);
    }
}

// Start the service and verify health
function startInfluxDBService(ip, callback) {
    const startCommand = `
        pgrep influxd || nohup influxd > influxdb.log 2>&1 &
        sleep 5
        curl -s http://localhost:8086/health | grep '"status":"pass"' || echo "health_fail"
    `;
    executeCommand(ip, startCommand, (err, result) => {
        if (err) return callback(err);
        if (result.includes("health_fail")) {
            return callback(new Error("InfluxDB failed health check"));
        }
        logger.info(`InfluxDB started and healthy on ${ip}`);
        callback(null, result);
    });
}

// Create a bucket for JMeter metrics
function createJMeterDatabase(ip, callback) {
    const conn = new Client();
    conn
        .on('ready', () => {
            logger.info(`SSH connected to ${ip}`);

            // First: Check if the bucket already exists
            const checkCmd = `influx bucket list --org ${config.influxDbOrg} --token ${config.influxDbToken} | grep jmeter_results`;
            conn.exec(checkCmd, (err, stream) => {
                if (err) return callback(err);

                let checkOutput = '';
                stream.on('data', data => checkOutput += data.toString());
                stream.on('close', () => {
                    if (checkOutput.trim() !== '') {
                        logger.info(`${config.influxDbBucket} Bucket already exists. Skipping creation.`);
                        conn.end();
                        return callback(null, 'Bucket already exists');
                    }

                    // If not found, create the bucket
                    const createCmd = `influx bucket create -n jmeter_results -r 0 --org ${config.influxDbOrg} --token ${config.influxDbToken} --host http://localhost:8086`;
                    conn.exec(createCmd, (err, createStream) => {
                        if (err) return callback(err);

                        let output = '', errorOutput = '';
                        createStream.on('data', data => output += data.toString());
                        createStream.stderr.on('data', data => errorOutput += data.toString());
                        createStream.on('close', code => {
                            conn.end();
                            if (code === 0) {
                                logger.info(`${config.influxDbBucket} Bucket created!!.`);
                                callback(null, output);
                            } else {
                                callback(new Error(`Bucket creation failed: ${errorOutput || output}`));
                            }
                        });
                    });
                });
            });
        })
        .connect({
            host: ip,
            port: 22,
            username: config.username,
            password: config.password,
        });
}

module.exports = {
    installInfluxDB,
    startInfluxDBService,
    createJMeterDatabase
};
