#!/bin/sh
# install.sh
# Installs the PlantWaterer, setting up settings necessary to run it.

sudo apt update
sudo apt install python3
sudo pip3 install python-crontab
sudo python3 ./install/install.py