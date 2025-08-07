#!/bin/bash

# Define variables
INSTANCE_NAME="jmeter-single-node"
ZONE="us-central1-a"
MACHINE_TYPE="e2-medium"
IMAGE_FAMILY="ubuntu-2204-lts"
IMAGE_PROJECT="ubuntu-os-cloud"
BOOT_DISK_SIZE="20GB"
STARTUP_SCRIPT="install-and-clone.sh"

echo "Creating GCE instance: $INSTANCE_NAME in $ZONE..."

./google-cloud-sdk/bin/gcloud compute instances create "$INSTANCE_NAME" \
  --zone="$ZONE" \
  --machine-type="$MACHINE_TYPE" \
  --image-family="$IMAGE_FAMILY" \
  --image-project="$IMAGE_PROJECT" \
  --boot-disk-size="$BOOT_DISK_SIZE" \
  --metadata-from-file startup-script="$STARTUP_SCRIPT" \
  --tags=http-server,https-server \
  --scopes=https://www.googleapis.com/auth/cloud-platform

echo "Waiting for startup script to finish..."

# Poll serial port output
for i in {1..30}; do
    LOG=$(./google-cloud-sdk/bin/gcloud compute instances get-serial-port-output "$INSTANCE_NAME" \
        --zone="$ZONE" --port=1 --start=0 2>/dev/null)

    if echo "$LOG" | grep -q "Finished running startup scripts."; then
        echo "Startup script completed successfully."
        break
    elif echo "$LOG" | grep -q "startup-script: FAILED"; then
        echo "Startup script failed. Here's the log excerpt:"
        echo "-------------------------------------------"
        echo "$LOG" | grep "startup-script"
        echo "-------------------------------------------"
        echo "Please check Google Cloud Console for more details."
        exit 1
    else
        echo "Still waiting... (${i}/30)"
        sleep 10
    fi
done

if [[ $i -eq 30 ]]; then
    echo " Timeout waiting for startup script to complete. Check logs manually:"
    echo "    ./google-cloud-sdk/bin/gcloud compute instances get-serial-port-output $INSTANCE_NAME --zone=$ZONE --port=1"
    exit 1
fi

echo "You can now SSH into the instance:"
echo "    ./google-cloud-sdk/bin/gcloud compute ssh $INSTANCE_NAME --zone=$ZONE"
