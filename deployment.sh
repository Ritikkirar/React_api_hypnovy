#! /bin/bash

echo "Git checkout"
git stash
git pull origin master --force
export NVM_DIR=~/.nvm
source ~/.nvm/nvm.sh
echo "npm installation"             
npm install
