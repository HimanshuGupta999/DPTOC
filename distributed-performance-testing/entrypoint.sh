#!/bin/bash

echo "Starting JMeter test execution..."

jmeter -n \
  -t ${TEST_PLAN_PATH} \
  -l ${RESULT_PATH}/results.jtl \
  -JinfluxdbUrl=${INFLUXDB_URL} \
  -JinfluxdbToken=${INFLUXDB_TOKEN} \
  -JinfluxdbOrg=${INFLUXDB_ORG} \
  -JinfluxdbBucket=${INFLUXDB_BUCKET} \
  -Japplication=${APPLICATION_NAME}

echo "JMeter test execution completed."
