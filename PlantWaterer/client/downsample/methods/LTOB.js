'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var __isA = {
  "PointValueExtractor<unknown>": value => typeof value === "function",
  "XYDataPoint": value => value !== undefined && value !== null && __isA["X"](value["x"]) && typeof value["y"] === "number",
  "X": value => typeof value === "number" || value instanceof Date
};
function calculateTriangleArea(pointA, pointB, pointC) {
  return Math.abs((pointA[0] - pointC[0]) * (pointB[1] - pointA[1]) - (pointA[0] - pointB[0]) * (pointC[1] - pointA[1])) / 2;
}
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
var createNormalize = (x, y) => {
  var getX = getPointValueExtractor(x);
  var getY = getPointValueExtractor(y);
  return data => mapToArray(data, (point, index) => [getX(point, index), getY(point, index)]);
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

var createLTOB = config => {
  var normalize = createNormalize(config.x, config.y);
  return (data, desiredLength) => {
    if (desiredLength < 0) {
      throw new Error("Supplied negative desiredLength parameter to LTOB: ".concat(desiredLength));
    }

    var length = data.length;

    if (length <= 1 || length <= desiredLength) {
      return data;
    } // Now we are sure that:
    //
    // - length is [2, Infinity)
    // - threshold is (length, Inifnity)


    var bucketSize = length / desiredLength;
    var normalizedData = normalize(data);
    var outputLength = Math.max(2, desiredLength);
    var output = iterableBasedOn(data, outputLength);
    output[0] = data[0];
    output[outputLength - 1] = data[length - 1];

    for (var bucket = 1; bucket < desiredLength - 1; bucket++) {
      var startIndex = Math.floor(bucket * bucketSize);
      var endIndex = Math.min(length - 1, (bucket + 1) * bucketSize);
      var maxArea = -1;
      var maxAreaIndex = -1;

      for (var j = startIndex; j < endIndex; j++) {
        var previousDataPoint = normalizedData[j - 1];
        var dataPoint = normalizedData[j];
        var nextDataPoint = normalizedData[j + 1];
        var area = calculateTriangleArea(previousDataPoint, dataPoint, nextDataPoint);

        if (area > maxArea) {
          maxArea = area;
          maxAreaIndex = j;
        }
      } // sampledData.push(data[maxAreaIndex]);


      output[bucket] = data[maxAreaIndex];
    } // sampledData.push(data[length - 1]);
    // output[desiredLength - 1] = data[length - 1];


    return output;
  };
};
var LTOB = createLTOB(createLegacyDataPointConfig());

exports.LTOB = LTOB;
exports.createLTOB = createLTOB;
//# sourceMappingURL=LTOB.js.map
