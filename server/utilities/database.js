const sqlite3 = require('sqlite3').verbose();

module.exports = class Database {

    constructor() {
        this.db = new sqlite3.Database('storage.db', (err) => {
            if (err) {
                this.errorState = true;
                console.error(err.message);
            }
            else {
                this.errorState = false;
                this.db.run(`CREATE TABLE IF NOT EXISTS datapoints (value INT(255), time TIMESTAMP)`);
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

    close() {
        if (this.errorState == false) this.db.close();
    }
}