const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') }); // Load .env from the root directory

module.exports = {
    masterIp: process.env.MASTER_IP,
    slaveIps: process.env.SLAVE_IPS.split(','),
    jmeterDir: process.env.JMETER_DIR || '/opt/jmeter',
    jmeterVersion: process.env.JMETER_VERSION,
    testPlanPath: process.env.TEST_PLAN_PATH,
    resultPath: process.env.RESULT_PATH,
    username: process.env.SSH_USERNAME,
    password: process.env.SSH_PASSWORD,
    numberOfThreads: process.env.NUMBER_OF_THREADS,
    influxDbUser: process.env.INFLUXDB_ADMIN_USER,
    influxDbPassword: process.env.INFLUXDB_ADMIN_PASSWORD,
    influxDbOrg: process.env.INFLUXDB_ORG,
    influxDbBucket: process.env.INFLUXDB_BUCKET,
    influxDbToken: process.env.INFLUXDB_TOKEN,
    influxDbUrl: `http://influxdb:8086`,
    applicationName: process.env.APPLICATION_NAME || 'jmeter_app',
    grafanaUser: process.env.GRAFANA_ADMIN_USER,
    grafanaPassword: process.env.RAFANA_ADMIN_PASSWORD,


    //To map each container’s IP (used in .env) to its corresponding SSH port.
    sshPorts: {
    [process.env.MASTER_IP]: parseInt(process.env.SSH_PORT_MASTER, 10),
    [process.env.SLAVE_IPS.split(',')[0]]: parseInt(process.env.SSH_PORT_SLAVE1, 10),
    [process.env.SLAVE_IPS.split(',')[1]]: parseInt(process.env.SSH_PORT_SLAVE2, 10)
  }

};