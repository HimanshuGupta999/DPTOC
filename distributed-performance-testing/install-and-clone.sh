#!/bin/bash

# Ensure non-interactive frontend
export DEBIAN_FRONTEND=noninteractive

# Variables
USERNAME="nashtech"
USER_HOME="/home/$USERNAME"

# Basic tools
apt-get update
apt-get install -y curl git build-essential sudo

# Docker and Docker-Compose
apt-get install -y docker.io
apt-get install -y docker-compose
usermod -aG docker $USERNAME
systemctl enable docker
systemctl start docker

# Node.js + npm
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Clone repo as the default user
sudo -u "$USERNAME" bash <<EOF
cd "$USER_HOME"
git clone https://github.com/NashTech-Labs/distributed-performance-testing.git 
EOF
