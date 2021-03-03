const LiquidCrystal = require('raspberrypi-liquid-crystal');

module.exports = class LCD {
    constructor() {
        this.lcd = new LiquidCrystal(1, 0x27, 16, 2);
        this.error = false;

        try {
            this.lcd.beginSync();
        } catch (e) {
            console.log(e);
            this.error = true;
        }
    }

    clear() {
        if (!this.error) this.lcd.clearSync();
    }

    printLines(firstLine, secondLine) {
        if (this.error) return;
        this.clear();
        this.lcd.printSync(firstLine);
        this.lcd.setCursorSync(0, 1);
        this.lcd.printSync(secondLine);
    }
}