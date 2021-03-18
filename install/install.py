import os
import json
import re
import subprocess
import sys
from configparser import SafeConfigParser
from crontab import CronTab

global setUpEternal
setUpEternal = None

def askIfEternal(data):
    print("Watchdog is helpful for this program. Please install and configure it manually.")
    print("Would you like to set up the Raspberry Pi to be a dedicated plant watering system? (Sets up custom cron jobs) [Y/N]")
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
        setUpEternal = data['setUpEternal']

except FileNotFoundError:
    askIfEternal(data);

except json.decoder.JSONDecodeError:
    askIfEternal(data);

finally:
    if setUpEternal == None:
        askIfEternal(data);


# Write to the json file
if data == None:
    data = {
        'setUpEternal': setUpEternal
    }
else:
    data['setUpEternal'] = setUpEternal

with open('install-preferences.json', 'w') as json_file:
    json.dump(data, json_file)



if setUpEternal:
    # Install a cron job, if one's not already there

    my_cron = CronTab(user='pi')
    cronjob_exists = False
    for job in my_cron:
        if str(job).startswith("#"):
            continue 
        if job.comment == 'Plant Waterer':
            cronjob_exists = True
            break
    
    if (cronjob_exists == False):
        dir_path = os.path.dirname(os.path.realpath(__file__))
        command = 'sudo sh ' + dir_path + '/../start.sh >> ' + dir_path + '/../logs/log.txt 2>&1'
        job = my_cron.new(command=command, comment = 'Plant Waterer')
        job.every_reboot()

    my_cron.write()
        
        

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



print("Please reboot your pi for the changes to take effect. \nPress Enter to exit.......")
sys.stdin.read(1)

    


