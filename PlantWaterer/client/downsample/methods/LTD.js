'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _arrayWithHoles(arr) {
  if (Array.isArray(arr)) return arr;
}

function _iterableToArrayLimit(arr, i) {
  if (typeof Symbol === "undefined" || !(Symbol.iterator in Object(arr))) return;
  var _arr = [];
  var _n = true;
  var _d = false;
  var _e = undefined;

  try {
    for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
      _arr.push(_s.value);

      if (i && _arr.length === i) break;
    }
  } catch (err) {
    _d = true;
    _e = err;
  } finally {
    try {
      if (!_n && _i["return"] != null) _i["return"]();
    } finally {
      if (_d) throw _e;
    }
  }

  return _arr;
}

function _arrayLikeToArray(arr, len) {
  if (len == null || len > arr.length) len = arr.length;

  for (var i = 0, arr2 = new Array(len); i < len; i++) {
    arr2[i] = arr[i];
  }

  return arr2;
}

function _unsupportedIterableToArray(o, minLen) {
  if (!o) return;
  if (typeof o === "string") return _arrayLikeToArray(o, minLen);
  var n = Object.prototype.toString.call(o).slice(8, -1);
  if (n === "Object" && o.constructor) n = o.constructor.name;
  if (n === "Map" || n === "Set") return Array.from(o);
  if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
}

function _nonIterableRest() {
  throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}

function _slicedToArray(arr, i) {
  return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest();
}

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

var mergeBucketAt = (buckets, index) => {
  var bucketA = buckets[index];
  var bucketB = buckets[index + 1];

  if (!bucketA || !bucketB) {
    throw new Error("Bucket index out of range for merging: ".concat(index, " (allowed indexes are 0 - ").concat(buckets.length - 2));
  }

  var mergedBucket = [...bucketA, ...bucketB];
  var newBuckets = buckets.slice();
  newBuckets.splice(index, 2, mergedBucket);
  return newBuckets;
};
var splitBucketAt = (buckets, index) => {
  var bucket = buckets[index];

  if (!bucket) {
    throw new Error("Bucket index out of range for splitting: ".concat(index, " (allowed indexes are 0 - ").concat(buckets.length - 1));
  }

  var bucketSize = bucket.length;

  if (bucketSize < 2) {
    return buckets;
  }

  var bucketALength = Math.ceil(bucketSize / 2);
  var bucketA = bucket.slice(0, bucketALength);
  var bucketB = bucket.slice(bucketALength);
  var newBuckets = buckets.slice();
  newBuckets.splice(index, 1, bucketA, bucketB);
  return newBuckets;
};
var calculateLinearRegressionCoefficients = data => {
  var N = data.length;
  var averageX = 0;
  var averageY = 0;

  for (var i = 0; i < N; i++) {
    averageX += data[i][0];
    averageY += data[i][1];
  }

  averageX /= N;
  averageY /= N;
  var aNumerator = 0;
  var aDenominator = 0;

  for (var _i = 0; _i < N; _i++) {
    var _data$_i = _slicedToArray(data[_i], 2),
        x = _data$_i[0],
        y = _data$_i[1];

    aNumerator += (x - averageX) * (y - averageY);
    aDenominator += (x - averageX) * (x - averageX);
  }

  var a = aNumerator / aDenominator;
  var b = averageY - a * averageX;
  return [a, b];
};
var calculateSSEForBucket = dataPoints => {
  var _calculateLinearRegre = calculateLinearRegressionCoefficients(dataPoints),
      _calculateLinearRegre2 = _slicedToArray(_calculateLinearRegre, 2),
      a = _calculateLinearRegre2[0],
      b = _calculateLinearRegre2[1];

  var sumStandardErrorsSquared = 0;

  for (var i = 0; i < dataPoints.length; i++) {
    var dataPoint = dataPoints[i];
    var standardError = dataPoint[1] - (a * dataPoint[0] + b);
    sumStandardErrorsSquared += standardError * standardError;
  }

  return sumStandardErrorsSquared;
};
var calculateSSEForBuckets = buckets => {
  // We skip the first and last buckets since they only contain one data point
  var sse = [0];

  for (var i = 1; i < buckets.length - 1; i++) {
    var previousBucket = buckets[i - 1];
    var currentBucket = buckets[i];
    var nextBucket = buckets[i + 1];
    var bucketWithAdjacentPoints = [previousBucket[previousBucket.length - 1], ...currentBucket, nextBucket[0]];
    sse.push(calculateSSEForBucket(bucketWithAdjacentPoints));
  }

  sse.push(0);
  return sse;
};
var findLowestSSEAdjacentBucketsIndex = (sse, ignoreIndex) => {
  var minSSESum = Number.MAX_VALUE;
  var minSSEIndex = undefined;

  for (var i = 1; i < sse.length - 2; i++) {
    if (i === ignoreIndex || i + 1 === ignoreIndex) {
      continue;
    }

    if (sse[i] + sse[i + 1] < minSSESum) {
      minSSESum = sse[i] + sse[i + 1];
      minSSEIndex = i;
    }
  }

  return minSSEIndex;
};
var findHighestSSEBucketIndex = (buckets, sse) => {
  var maxSSE = 0;
  var maxSSEIndex = undefined;

  for (var i = 1; i < sse.length - 1; i++) {
    if (buckets[i].length > 1 && sse[i] > maxSSE) {
      maxSSE = sse[i];
      maxSSEIndex = i;
    }
  }

  return maxSSEIndex;
}; // Largest triangle three buckets data downsampling algorithm implementation

var createLTD = config => {
  var normalize = createNormalize(config.x, config.y);
  return (data, desiredLength) => {
    if (desiredLength < 0) {
      throw new Error("Supplied negative desiredLength parameter to LTD: ".concat(desiredLength));
    }

    var length = data.length;

    if (length <= 2 || length <= desiredLength) {
      return data;
    } // Now we are sure that:
    //
    // - length is [2, Infinity)
    // - threshold is (length, Inifnity)


    var normalizedData = normalize(data); // Require: data . The original data
    // Require: threshold . Number of data points to be returned
    // 1: Split the data into equal number of buckets as the threshold but have the first
    // bucket only containing the first data point and the last bucket containing only
    // the last data point . First and last buckets are then excluded in the bucket
    // resizing
    // 2: Calculate the SSE for the buckets accordingly . With one point in adjacent
    // buckets overlapping
    // 3: while halting condition is not met do . For example, using formula 4.2
    // 4: Find the bucket F with the highest SSE
    // 5: Find the pair of adjacent buckets A and B with the lowest SSE sum . The
    // pair should not contain F
    // 6: Split bucket F into roughly two equal buckets . If bucket F contains an odd
    // number of points then one bucket will contain one more point than the other
    // 7: Merge the buckets A and B
    // 8: Calculate the SSE of the newly split up and merged buckets
    // 9: end while.
    // 10: Use the Largest-Triangle-Three-Buckets algorithm on the resulting bucket configuration
    // to select one point per buckets

    var buckets = splitIntoBuckets(normalizedData, desiredLength);
    var numIterations = length * 10 / desiredLength;

    for (var iteration = 0; iteration < numIterations; iteration++) {
      // 2: Calculate the SSE for the buckets accordingly . With one point in adjacent
      // buckets overlapping
      var sseForBuckets = calculateSSEForBuckets(buckets); // 4: Find the bucket F with the highest SSE

      var highestSSEBucketIndex = findHighestSSEBucketIndex(buckets, sseForBuckets);

      if (highestSSEBucketIndex === undefined) {
        break;
      } // 5: Find the pair of adjacent buckets A and B with the lowest SSE sum . The
      // pair should not contain F


      var lowestSSEAdajacentBucketIndex = findLowestSSEAdjacentBucketsIndex(sseForBuckets, highestSSEBucketIndex);

      if (lowestSSEAdajacentBucketIndex === undefined) {
        break;
      } // 6: Split bucket F into roughly two equal buckets . If bucket F contains an odd
      // number of points then one bucket will contain one more point than the other


      buckets = splitBucketAt(buckets, highestSSEBucketIndex); // 7: Merge the buckets A and B
      // If the lowest SSE index was after the highest index in the original
      // unsplit array then we need to move it by one up since now the array has one more element
      // before this index

      buckets = mergeBucketAt(buckets, lowestSSEAdajacentBucketIndex > highestSSEBucketIndex ? lowestSSEAdajacentBucketIndex + 1 : lowestSSEAdajacentBucketIndex);
    }

    var dataPointIndexes = LTTBIndexesForBuckets(buckets);
    var outputLength = dataPointIndexes.length;
    var output = iterableBasedOn(data, outputLength);

    for (var i = 0; i < outputLength; i++) {
      output[i] = data[dataPointIndexes[i]];
    }

    return output;
  };
};
var LTD = createLTD(createLegacyDataPointConfig());

exports.LTD = LTD;
exports.calculateLinearRegressionCoefficients = calculateLinearRegressionCoefficients;
exports.calculateSSEForBucket = calculateSSEForBucket;
exports.calculateSSEForBuckets = calculateSSEForBuckets;
exports.createLTD = createLTD;
exports.findHighestSSEBucketIndex = findHighestSSEBucketIndex;
exports.findLowestSSEAdjacentBucketsIndex = findLowestSSEAdjacentBucketsIndex;
exports.mergeBucketAt = mergeBucketAt;
exports.splitBucketAt = splitBucketAt;
//# sourceMappingURL=LTD.js.map
