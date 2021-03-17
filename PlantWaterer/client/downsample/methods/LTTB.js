'use strict';

var exports = {};
Object.defineProperty(exports, '__esModule', { value: true });

var __isA = {
  "PointValueExtractor<unknown>": value => typeof value === "function",
  "XYDataPoint": value => value !== undefined && value !== null && __isA["X"](value["x"]) && typeof value["y"] === "number",
  "X": value => typeof value === "number" || value instanceof Date
};
function calculateTriangleArea(pointA, pointB, pointC) {
  return Math.abs((pointA[0] - pointC[0]) * (pointB[1] - pointA[1]) - (pointA[0] - pointB[0]) * (pointC[1] - pointA[1])) / 2;
}
function calculateAverageDataPoint() {
  for (var _len = arguments.length, points = new Array(_len), _key = 0; _key < _len; _key++) {
    points[_key] = arguments[_key];
  }

  var length = points.length;
  if (!length) return undefined;
  var averageX = 0;
  var averageY = 0;

  for (var i = 0; i < length; i++) {
    averageX += points[i][0];
    averageY += points[i][1];
  }

  return [averageX / length, averageY / length];
}
function splitIntoBuckets(data, desiredLength) {
  if (data.length === 2) {
    return [[data[0]], [data[1]]];
  }

  var first = data[0];
  var center = data.slice(1, data.length - 1);
  var last = data[data.length - 1]; // First and last bucket are formed by the first and the last data points
  // so we only have N - 2 buckets left to fill

  var bucketSize = center.length / (desiredLength - 2);
  var splitData = [[first]];

  for (var i = 0; i < desiredLength - 2; i++) {
    var bucketStartIndex = Math.floor(i * bucketSize);
    var bucketEndIndex = Math.floor((i + 1) * bucketSize);
    var dataPointsInBucket = center.slice(bucketStartIndex, bucketEndIndex);
    splitData.push(dataPointsInBucket);
  }

  splitData.push([last]);
  return splitData;
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

function LTTBIndexesForBuckets(buckets) {
  var bucketCount = buckets.length;
  var bucketDataPointIndexes = [0];
  var previousBucketsSize = 1;
  var lastSelectedDataPoint = buckets[0][0];

  for (var index = 1; index < bucketCount - 1; index++) {
    var bucket = buckets[index];
    var nextBucket = buckets[index + 1];
    var averageDataPointFromNextBucket = calculateAverageDataPoint(...nextBucket);
    if (averageDataPointFromNextBucket === undefined) continue;
    var maxArea = -1;
    var maxAreaIndex = -1;

    for (var j = 0; j < bucket.length; j++) {
      var dataPoint = bucket[j];
      var area = calculateTriangleArea(lastSelectedDataPoint, dataPoint, averageDataPointFromNextBucket);

      if (area > maxArea) {
        maxArea = area;
        maxAreaIndex = j;
      }
    }

    lastSelectedDataPoint = bucket[maxAreaIndex];
    bucketDataPointIndexes.push(previousBucketsSize + maxAreaIndex);
    previousBucketsSize += bucket.length;
  }

  bucketDataPointIndexes.push(previousBucketsSize);
  return bucketDataPointIndexes;
} // Largest triangle three buckets data downsampling algorithm implementation

var createLTTB = config => {
  var normalize = createNormalize(config.x, config.y);
  return (data, desiredLength) => {
    if (desiredLength < 0) {
      throw new Error("Supplied negative desiredLength parameter to LTTB: ".concat(desiredLength));
    }

    var length = data.length;
    if (length <= 1 || length <= desiredLength) return data;
    var normalizedData = normalize(data);
    var buckets = splitIntoBuckets(normalizedData, desiredLength);
    var bucketDataPointIndexes = LTTBIndexesForBuckets(buckets);
    var output = iterableBasedOn(data, bucketDataPointIndexes.length);

    for (var i = 0; i < bucketDataPointIndexes.length; i++) {
      output[i] = data[bucketDataPointIndexes[i]];
    }

    return output;
  };
};
var LTTB = createLTTB(createLegacyDataPointConfig());

export {LTTB as LTTB, LTTBIndexesForBuckets as LTTBIndexesForBuckets};

