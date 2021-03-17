/** settingsHandler
 * Purpose: To provide a singleton class to change settings without needing to read and write directly to the file each time you want to change a setting
 * 
 */

const fs = require('fs');

class SettingsHandler {


    constructor() {
        try {
            this.settings = JSON.parse(fs.readFileSync('settings.json', 'utf8'));
        } catch (error) {
            if (error.code == 'ENOENT') {
                this.settings = {};
            } 
        }
    }

    /**
     * Returns the value of the setting at <key>
     * @param {String} key - Which key is the setting you want located under? e.g. for
     * 
     * {
     *  'static': {
     *      'time': 60
     *  }
     * }
     * 
     * use the key 'static.time'
     * 
     */
    getSetting(key) {
        let ret = this.settings;
        let keyHierarchy = key.split('.'); 

        for (var element of keyHierarchy) {
            ret = ret[element];
            if (ret == undefined) return undefined;
        }
        
        return ret;
    }


    /**
     * Updates a setting <key> to be <value>
     * @param {String} key 
     * @param {Object} value
     */
    async setSetting(key, value) {
        let ref = this.settings;
        let keyHierarchy = key.split('.'); 
        let len = keyHierarchy.length;

        for (var i = 0; i < len - 1; i++) {
            if( !ref[keyHierarchy[i]] ) ref[keyHierarchy[i]] = {};
            ref = ref[keyHierarchy[i]];
        }

        ref[keyHierarchy.pop()] = value;

        fs.writeFile("settings.json", JSON.stringify(this.settings), () => {});
    }
}

module.exports = class Singleton {
    constructor() {
        if (!Singleton.instance) {
            Singleton.instance = new SettingsHandler();
        }
    }

    getInstance() {
        return Singleton.instance;
    }
}
