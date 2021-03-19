import os
import json
import re
import subprocess
import sys
from configparser import SafeConfigParser
from os import path

global setUpEternal
setUpEternal = None

def askIfEternal(data):
    print("Watchdog is helpful for this program. Please install and configure it manually.")
    print("Would you like to set up the Raspberry Pi to be a dedicated plant watering system? (Sets up custom .xinitrc jobs) [Y/N]")
    response = input()
    while ((re.search("Y", response, re.IGNORECASE) != None) ^ (re.search("N", response, re.IGNORECASE) != None)) != True:
        print("Please enter the characters Y or N.")
        response = input()

    global setUpEternal
    setUpEternal = (re.search("Y", response, re.IGNORECASE) != None);

    
data = None

try:
    with open('install-preferences.json') as f:
        data = json.load(f)
        try:
            setUpEternal = data['setUpEternal']
        
        finally:
            print()

except FileNotFoundError:
    print("Config file not found")
    askIfEternal(data);

except json.decoder.JSONDecodeError:
    print("Config file not json")
    askIfEternal(data);

finally:
    

    if setUpEternal == None:
        print("Config file empty")
        askIfEternal(data)


# Write to the json file
if data == None:
    data = {
        'setUpEternal': setUpEternal
    }

with open('install-preferences.json', 'w') as json_file:
    json.dump(data, json_file)



if setUpEternal:
    # Install in autostart, if one's not already there
    dir_path = os.path.dirname(os.path.realpath(__file__))
    command = "@sudo -u pi env DISPLAY=:0.0 x-terminal-emulator -e 'sh " + dir_path + "/../start.sh' >> " + dir_path + "/../logs/log.txt 2>&1\n"

    hasCommand = False
    with open('~/.config/lxsession/LXDE-pi/autostart') as ft:
        for line in ft:
            line = line.replace("\n", "")
            if command in line:
                hasCommand = True

    if hasCommand == False:
        with open('~/.config/lxsession/LXDE-pi/autostart', 'a+') as ft:
            ft.write(command)


        

# Set up i2c
i2c_on = False;
i2c_arm_on = False;

with open('/boot/config.txt') as f:
    for line in f:
        line = line.replace("\n", "")
        if line == "dtparam=i2c_arm=on":
            i2c_arm_on = True
        elif line == "dtparam=i2c=on":
            i2c_on = True


f = open("/boot/config.txt", "a")

if (i2c_on == False):
    f.write("dtparam=i2c=on\n")

if (i2c_arm_on == False):
    f.write("dtparam=i2c_arm=on\n")

f.close()

#Make the start.sh file
dir_path = os.path.dirname(os.path.realpath(__file__))

with open('start.sh', 'w+') as f:
    f.write("#!/bin/sh\n"
    + "# start.sh\n"
    + "# Navigate and execute the PlantWaterer.\n"
    + "cd " + dir_path + "/../PlantWaterer\n"
    + "sudo ../NodePortableForPi/bin/node index.js # Plant Waterer")

print("Please reboot your pi for the changes to take effect. \nPress Enter to continue.......")
sys.stdin.read(1)

    


