module.exports = class Format {

    /**
     * Helper method to create timestamp a number of seconds in the past.
     * @param {number} seconds
     */
    static dateSecondsAgo(seconds) {
        return Date.now() - 1000 * seconds;
    }

    /**
     * Helper method to create a UNIX timestamp.
     * @param {Date} date 
     * @returns UNIX timestamp
     */
    static convertDateToTimestamp(date) {
        return Math.floor(date / 1000);
    }

    static map(x, in_min, in_max, out_min, out_max) {
        var num = (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
        if (num < out_min) num = out_min;
        else if (num > out_max) num = out_max;
        return num;
    }
}