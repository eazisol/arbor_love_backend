#!/bin/bash

# Ensure the script is run as ec2-user
if [ "$(whoami)" != "ec2-user" ]; then
  echo "This script must be run as ec2-user"
  exit 1
fi

# Install Node.js if not installed
if ! command -v node &> /dev/null
then
    curl -sL https://rpm.nodesource.com/setup_18.x | sudo bash -
    sudo yum install -y nodejs
fi

# Install PM2 if not installed
if ! command -v pm2 &> /dev/null
then
    sudo npm install -g pm2
fi
