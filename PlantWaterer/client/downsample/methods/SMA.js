'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var __isA = {
  "PointValueExtractor<unknown>": value => typeof value === "function",
  "XYDataPoint": value => value !== undefined && value !== null && __isA["X"](value["x"]) && typeof value["y"] === "number",
  "X": value => typeof value === "number" || value instanceof Date
};
var mapToArray = (input, callback) => {
  var length = input.length;
  var result = new Array(length);

  for (var i = 0; i < length; i++) {
    result[i] = callback(input[i], i);
  }

  return result;
};
var getPointValueExtractor = accessor => {
  if (__isA["PointValueExtractor<unknown>"](accessor)) return accessor;
  return point => point[accessor];
};
var createXYDataPoint = (time, value) => ({
  x: time,
  y: value
});
var createLegacyDataPointConfig = () => ({
  x: point => {
    var t = __isA["XYDataPoint"](point) ? point.x : point[0];
    return t instanceof Date ? t.getTime() : t;
  },
  y: point => 'y' in point ? point.y : point[1],
  toPoint: createXYDataPoint
});
var iterableBasedOn = (input, length) => new input.constructor(length);

var SMANumeric = function SMANumeric(data, windowSize) {
  var slide = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 1;
  var output = [];
  var sum = 0;

  for (var i = 0; i < windowSize; i++) {
    sum += data[i];
  }

  for (var _i = windowSize; _i <= data.length; _i++) {
    if ((_i - windowSize) % slide === 0) {
      output.push(sum / windowSize);
    }

    sum += data[_i] - data[_i - windowSize];
  }

  return output;
};
/**
 * Simple Moving Average (SMA)
 *
 * @param data {Number[]}
 * @param windowSize {Number}
 * @param slide {Number}
 */

var createSMA = config => {
  var timeExtractor = getPointValueExtractor(config.x);
  var valueExtractor = getPointValueExtractor(config.y);
  var pointFactory = config.toPoint;
  return function (values, windowSize) {
    var slide = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 1;
    if (values.length === 0) return values;
    var data = mapToArray(values, valueExtractor);
    var times = mapToArray(values, timeExtractor);
    var output = iterableBasedOn(values, 0);
    var sum = 0;
    var value;

    for (var i = 0; i < windowSize; i++) {
      sum += data[i];
    }

    for (var _i2 = windowSize; _i2 <= data.length; _i2++) {
      if ((_i2 - windowSize) % slide === 0) {
        value = pointFactory((times[_i2 - windowSize] + times[_i2 - 1]) / 2, sum / windowSize, _i2 - windowSize);
        output[output.length] = value;
      }

      sum += data[_i2] - data[_i2 - windowSize];
    }

    return output;
  };
};
var SMA = createSMA(createLegacyDataPointConfig());

exports.SMA = SMA;
exports.SMANumeric = SMANumeric;
exports.createSMA = createSMA;
//# sourceMappingURL=SMA.js.map
