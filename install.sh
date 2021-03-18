#!/bin/sh
# install.sh
# Installs the PlantWaterer, setting up settings necessary to run it.

#sudo apt update
#sudo apt install python3
cd readlink -f $(dirname "$0")
sudo python3 ./install/install.py
chmod 775 start.sh
chmod 775 ./NodePortableForPi/bin/node

./NodePortableForPi/bin/npm i

