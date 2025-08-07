const fs = require('fs');
const path = require('path');

const templatePath = path.resolve(__dirname, 'grafana/provisioning/datasources/datasources.template.yml');
const outputPath = path.resolve(__dirname, 'grafana/provisioning/datasources/datasource.yml');

// Load environment variables
require('dotenv').config();

// Read template
let content = fs.readFileSync(templatePath, 'utf8');

// Replace placeholders
content = content
  .replace('${INFLUXDB_ORG}', process.env.INFLUXDB_ORG)
  .replace('${INFLUXDB_BUCKET}', process.env.INFLUXDB_BUCKET)
  .replace('${INFLUXDB_TOKEN}', process.env.INFLUXDB_TOKEN)
  .replace('${INFLUXDB_URL}', process.env.INFLUXDB_URL);

// Write to datasources.yml
fs.writeFileSync(outputPath, content);
console.log(' datasources.yml generated successfully.');
