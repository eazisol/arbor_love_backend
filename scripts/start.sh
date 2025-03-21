#!/bin/bash
cd /home/ec2-user/tree-trim

sudo chown -R ec2-user:ec2-user /home/ec2-user/tree-trim
sudo chmod -R 755 /home/ec2-user/tree-trim

# Start the application and log the output
npm run start:prod > /home/ec2-user/tree-trim/startup.log 2>&1 &

# Ensure the process has time to start
sleep 10
