#!/bin/bash
# Stop the existing NestJS server if running
pm2 stop all || true
