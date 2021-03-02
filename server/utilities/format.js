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
}