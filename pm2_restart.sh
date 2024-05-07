#!/bin/bash

APP_NAME="platinum-security"
APP_PATH="/home/ubuntu/platinum-security-api/"

# Check if the app is already running
if pm2 id $APP_NAME > /dev/null; then
  # App is running, restart it
  pm2 restart $APP_NAME
else
  # App is not running, start it
  cd $APP_PATH
  pm2 start npm --name $APP_NAME -- start --watch
fi

