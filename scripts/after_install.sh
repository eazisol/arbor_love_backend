#!/bin/bash

# Ensure the script is run as ec2-user
if [ "$(whoami)" != "ec2-user" ]; then
  echo "This script must be run as ec2-user"
  exit 1
fi

# Navigate to the application directory
cd /home/ec2-user/tree-trim

# Ensure correct permissions
sudo chown -R ec2-user:ec2-user /home/ec2-user/tree-trim
sudo chmod -R 755 /home/ec2-user/tree-trim

# Clean node_modules and reinstall dependencies
rm -rf node_modules
npm install

# Build the application
npm run build
