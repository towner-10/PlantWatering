const sqlite3 = require('sqlite3').verbose();

class Database {
    constructor() {
        this.db = new sqlite3.Database('storage.db', (err) => {
            if (err) {
                this.errorState = true;
                console.error(err.message);
            }
            else {
                this.errorState = false;
                this.db.run(`CREATE TABLE IF NOT EXISTS datapoints (value REAL, time TIMESTAMP)`);
                this.db.run(`CREATE TABLE IF NOT EXISTS pumpHistory (start TIMESTAMP, end TIMESTAMP)`);
            }
        });
    }

    addPoint(value, time) {
        if (this.errorState == false) {
            this.db.run(`INSERT INTO datapoints VALUES (${value}, ${time});`);
        }
    }

    /**
     * 
     * @param {number} fromTime Beginning timestamp (UNIX FORMAT)
     * @param {number} toTime Ending timestamp (UNIX FORMAT)
     * @returns Promise containing the query result
     */
    async getPoints(fromTime, toTime) {
        return await new Promise((resolve, reject) => {
            var arr = [];

            this.db.all(`SELECT * FROM datapoints WHERE time BETWEEN ${fromTime} and ${toTime};`, [], (err, rows) => {
                if (err) {
                    console.log(err);
                    reject(null);
                }
                rows.forEach((row) => {
                    arr.push({
                        'data': row.value,
                        'time': row.time
                    });
                });
                resolve(arr);
            });
        });
    }

    addPumpHistory(start, end) {
        if (this.errorState == false) {
            console.log("Start: " + start + " | End: " + end);
            this.db.run(`INSERT INTO pumpHistory VALUES (${start}, ${end});`);
        }
    }

    /**
     * Fetches the pump history between 2 timestamps
     * @param {number} fromTime Beginning timestamp (UNIX FORMAT)
     * @param {number} toTime Ending timestamp (UNIX FORMAT)
     * @returns Promise containing the query result
     */
    async getPumpHistory(fromTime, toTime) {
        return await new Promise((resolve, reject) => {
            var arr = [];

            this.db.all(`SELECT * FROM pumpHistory WHERE start BETWEEN ${fromTime} and ${toTime};`, [], (err, rows) => {
                if (err) {
                    console.log(err);
                    reject(null);
                }
                rows.forEach((row) => {
                    arr.push({
                        'start': row.start,
                        'end': row.end
                    });
                });
                resolve(arr);
            });
        });
    }

    close() {
        if (this.errorState == false) this.db.close();
    }
}

module.exports = class Singleton {
    constructor() {
        if (!Singleton.instance) {
            Singleton.instance = new Database();
        }
    }

    getInstance() {
        return Singleton.instance;
    }
}