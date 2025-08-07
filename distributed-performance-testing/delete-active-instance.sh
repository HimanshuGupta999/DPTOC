#!/bin/bash

# Get the name and zone of the RUNNING instance(s)
echo "Looking for RUNNING GCE instances..."

instances=$(gcloud compute instances list --filter="status=RUNNING" --format="value(name,zone)")

if [ -z "$instances" ]; then
    echo "No running instances found."
    exit 0
fi

echo "Found the following running instance(s):"
echo "$instances"
echo

while IFS=$'\t' read -r name zone; do
    echo -n "Do you want to delete instance: $name in zone: $zone? (y/n)"
    read -r confirm </dev/tty
    if [[ "$confirm" == "y" || "$confirm" == "Y" ]]; then
        echo "Deleting instance: $name..."
        gcloud compute instances delete "$name" --zone="$zone" --quiet
        if [ $? -eq 0 ]; then
            echo "Instance '$name' deleted successfully."
        else
            echo "Failed to delete instance '$name'."
        fi
    else
        echo "Skipped deleting $name."
    fi
    echo
done <<< "$instances"
