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
var calculateMean = values => {
  var m = 0;

  for (var i = 0; i < values.length; i += 1) {
    m += values[i];
  }

  return m / values.length;
};
var calculateSTD = values => {
  var mean = calculateMean(values);
  var std = 0;

  for (var i = 0; i < values.length; i += 1) {
    std += (values[i] - mean) * (values[i] - mean);
  }

  return Math.sqrt(std / values.length);
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

/*
 * Free FFT and convolution (JavaScript)
 *
 * Copyright (c) 2014 Project Nayuki
 * https://www.nayuki.io/page/free-small-fft-in-multiple-languages
 *
 * (MIT License)
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 * - The above copyright notice and this permission notice shall be included in
 *   all copies or substantial portions of the Software.
 * - The Software is provided "as is", without warranty of any kind, express or
 *   implied, including but not limited to the warranties of merchantability,
 *   fitness for a particular purpose and noninfringement. In no event shall the
 *   authors or copyright holders be liable for any claim, damages or other
 *   liability, whether in an action of contract, tort or otherwise, arising from,
 *   out of or in connection with the Software or the use or other dealings in the
 *   Software.
 */

/*
 * Computes the discrete Fourier transform (DFT) of the given complex vector, storing the result back into the vector.
 * The vector can have any length. This is a wrapper function.
 */

function fft(real, imag) {
  if (real.length != imag.length) throw 'Mismatched lengths';
  var n = real.length;
  if (n == 0) return;else if ((n & n - 1) == 0) // Is power of 2
    transformRadix2(real, imag); // More complicated algorithm for arbitrary sizes
  else transformBluestein(real, imag);
}
/*
 * Computes the inverse discrete Fourier transform (IDFT) of the given complex vector, storing the result back into the vector.
 * The vector can have any length. This is a wrapper function. This transform does not perform scaling, so the inverse is not a true inverse.
 */

function inverseFFT(real, imag) {
  fft(imag, real);
}
/*
 * Computes the discrete Fourier transform (DFT) of the given complex vector, storing the result back into the vector.
 * The vector's length must be a power of 2. Uses the Cooley-Tukey decimation-in-time radix-2 algorithm.
 */

function transformRadix2(real, imag) {
  // Initialization
  if (real.length != imag.length) throw 'Mismatched lengths';
  var n = real.length;
  if (n == 1) // Trivial transform
    return;
  var levels = -1;

  for (var i = 0; i < 32; i++) {
    if (1 << i == n) levels = i; // Equal to log2(n)
  }

  if (levels == -1) throw 'Length is not a power of 2';
  var cosTable = new Array(n / 2);
  var sinTable = new Array(n / 2);

  for (var _i = 0; _i < n / 2; _i++) {
    cosTable[_i] = Math.cos(2 * Math.PI * _i / n);
    sinTable[_i] = Math.sin(2 * Math.PI * _i / n);
  } // Bit-reversed addressing permutation


  for (var _i2 = 0; _i2 < n; _i2++) {
    var j = reverseBits(_i2, levels);

    if (j > _i2) {
      var temp = real[_i2];
      real[_i2] = real[j];
      real[j] = temp;
      temp = imag[_i2];
      imag[_i2] = imag[j];
      imag[j] = temp;
    }
  } // Cooley-Tukey decimation-in-time radix-2 FFT


  for (var size = 2; size <= n; size *= 2) {
    var halfsize = size / 2;
    var tablestep = n / size;

    for (var _i3 = 0; _i3 < n; _i3 += size) {
      for (var _j = _i3, k = 0; _j < _i3 + halfsize; _j++, k += tablestep) {
        var tpre = real[_j + halfsize] * cosTable[k] + imag[_j + halfsize] * sinTable[k];
        var tpim = -real[_j + halfsize] * sinTable[k] + imag[_j + halfsize] * cosTable[k];
        real[_j + halfsize] = real[_j] - tpre;
        imag[_j + halfsize] = imag[_j] - tpim;
        real[_j] += tpre;
        imag[_j] += tpim;
      }
    }
  }
} // Returns the integer whose value is the reverse of the lowest 'bits' bits of the integer 'x'.


function reverseBits(x, bits) {
  var y = 0;

  for (var i = 0; i < bits; i++) {
    y = y << 1 | x & 1;
    x >>>= 1;
  }

  return y;
}
/*
 * Computes the discrete Fourier transform (DFT) of the given complex vector, storing the result back into the vector.
 * The vector can have any length. This requires the convolution function, which in turn requires the radix-2 FFT function.
 * Uses Bluestein's chirp z-transform algorithm.
 */


function transformBluestein(real, imag) {
  // Find a power-of-2 convolution length m such that m >= n * 2 + 1
  if (real.length != imag.length) throw 'Mismatched lengths';
  var n = real.length;
  var m = 1;

  while (m < n * 2 + 1) {
    m *= 2;
  } // Trignometric tables


  var cosTable = new Array(n);
  var sinTable = new Array(n);

  for (var i = 0; i < n; i++) {
    var j = i * i % (n * 2); // This is more accurate than j = i * i

    cosTable[i] = Math.cos(Math.PI * j / n);
    sinTable[i] = Math.sin(Math.PI * j / n);
  } // Temporary vectors and preprocessing


  var areal = new Array(m);
  var aimag = new Array(m);

  for (var _i4 = 0; _i4 < n; _i4++) {
    areal[_i4] = real[_i4] * cosTable[_i4] + imag[_i4] * sinTable[_i4];
    aimag[_i4] = -real[_i4] * sinTable[_i4] + imag[_i4] * cosTable[_i4];
  }

  for (var _i5 = n; _i5 < m; _i5++) {
    areal[_i5] = aimag[_i5] = 0;
  }

  var breal = new Array(m);
  var bimag = new Array(m);
  breal[0] = cosTable[0];
  bimag[0] = sinTable[0];

  for (var _i6 = 1; _i6 < n; _i6++) {
    breal[_i6] = breal[m - _i6] = cosTable[_i6];
    bimag[_i6] = bimag[m - _i6] = sinTable[_i6];
  }

  for (var _i7 = n; _i7 <= m - n; _i7++) {
    breal[_i7] = bimag[_i7] = 0;
  } // Convolution


  var creal = new Array(m);
  var cimag = new Array(m);
  convolveComplex(areal, aimag, breal, bimag, creal, cimag); // Postprocessing

  for (var _i8 = 0; _i8 < n; _i8++) {
    real[_i8] = creal[_i8] * cosTable[_i8] + cimag[_i8] * sinTable[_i8];
    imag[_i8] = -creal[_i8] * sinTable[_i8] + cimag[_i8] * cosTable[_i8];
  }
}
/*
 * Computes the circular convolution of the given complex vectors. Each vector's length must be the same.
 */


function convolveComplex(xreal, ximag, yreal, yimag, outreal, outimag) {
  if (xreal.length != ximag.length || xreal.length != yreal.length || yreal.length != yimag.length || xreal.length != outreal.length || outreal.length != outimag.length) throw 'Mismatched lengths';
  var n = xreal.length;
  xreal = xreal.slice();
  ximag = ximag.slice();
  yreal = yreal.slice();
  yimag = yimag.slice();
  fft(xreal, ximag);
  fft(yreal, yimag);

  for (var i = 0; i < n; i++) {
    var temp = xreal[i] * yreal[i] - ximag[i] * yimag[i];
    ximag[i] = ximag[i] * yreal[i] + xreal[i] * yimag[i];
    xreal[i] = temp;
  }

  inverseFFT(xreal, ximag);

  for (var _i9 = 0; _i9 < n; _i9++) {
    // Scaling (because this FFT implementation omits it)
    outreal[_i9] = xreal[_i9] / n;
    outimag[_i9] = ximag[_i9] / n;
  }
}

var calculateDiffs = values => {
  var length = values.length - 1;
  if (length < 1) return [];
  var diffs = new Array(length);

  for (var i = 0; i < length; i++) {
    diffs[i] = values[i + 1] - values[i];
  }

  return diffs;
};

var calculateRoughness = values => calculateSTD(calculateDiffs(values));

var calculateKurtosis = values => {
  var length = values.length;
  var mean = calculateMean(values);
  var u4 = 0;
  var variance = 0;
  var diff;
  var diffSqr;

  for (var i = 0; i < length; i++) {
    diff = values[i] - mean;
    diffSqr = diff * diff;
    u4 += diffSqr * diffSqr;
    variance += diffSqr;
  }

  return length * u4 / (variance * variance);
};

var findWindowSize = (head, tail, data, minRoughness, originalKurt, windowSize) => {
  while (head <= tail) {
    var w = Math.round((head + tail) / 2);
    var smoothed = SMANumeric(data, w, 1);
    var kurtosis = calculateKurtosis(smoothed);

    if (kurtosis >= originalKurt) {
      /* Search second half if feasible */
      var roughness = calculateRoughness(smoothed);

      if (roughness < minRoughness) {
        windowSize = w;
        minRoughness = roughness;
      }

      head = w + 1;
    } else {
      /* Search first half */
      tail = w - 1;
    }
  }

  return windowSize;
};

var calculatePeaks = function calculatePeaks(correlations) {
  var threshold = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0.2;
  var length = correlations.length;
  if (length <= 1) return [[], 0];
  var maxCorrelation = 0;
  var peaks = [];

  if (correlations.length > 1) {
    var positive = correlations[1] > correlations[0];
    var max = 1;

    for (var i = 2; i < correlations.length; i += 1) {
      if (!positive && correlations[i] > correlations[i - 1]) {
        max = i;
        positive = !positive;
      } else if (positive && correlations[i] > correlations[max]) {
        max = i;
      } else if (positive && correlations[i] < correlations[i - 1]) {
        if (max > 1 && correlations[max] > threshold) {
          peaks.push(max);

          if (correlations[max] > maxCorrelation) {
            maxCorrelation = correlations[max];
          }
        }

        positive = !positive;
      }
    }
  }
  /* If there is no autocorrelation peak within the MAX_WINDOW boundary try windows from the largest to the smallest */


  if (peaks.length <= 1) {
    for (var _i = 2; _i < length; _i += 1) {
      peaks.push(_i);
    }
  }

  return [peaks, maxCorrelation];
};

var calculateAutocorrelation = (values, maxLag) => {
  var length = values.length;
  var mean = calculateMean(values);
  /* Padding to the closest power of 2 */

  var len = Math.pow(2, Math.trunc(Math.log2(length)) + 1);
  var fftreal = new Array(len).fill(0);
  var fftimg = new Array(len).fill(0);

  for (var i = 0; i < length; i += 1) {
    fftreal[i] = values[i] - mean;
  }
  /* F_R(f) = FFT(X) */


  fft(fftreal, fftimg);
  /* S(f) = F_R(f)F_R*(f) */

  for (var _i2 = 0; _i2 < fftreal.length; _i2 += 1) {
    fftreal[_i2] = Math.pow(fftreal[_i2], 2) + Math.pow(fftimg[_i2], 2);
    fftimg[_i2] = 0;
  }
  /*  R(t) = IFFT(S(f)) */


  inverseFFT(fftreal, fftimg); // Calculate correlations

  var correlations = [];

  for (var _i3 = 1; _i3 < maxLag; _i3++) {
    correlations[_i3] = fftreal[_i3] / fftreal[0];
  }

  var _calculatePeaks = calculatePeaks(correlations),
      _calculatePeaks2 = _slicedToArray(_calculatePeaks, 2),
      peaks = _calculatePeaks2[0],
      maxCorrelation = _calculatePeaks2[1];

  return {
    correlations,
    peaks,
    maxCorrelation
  };
};

var createASAP = config => {
  var valueExtractor = getPointValueExtractor(config.y);
  var SMA = createSMA(config);
  return function ASAP(values, resolution) {
    if (values.length === 0) return values;

    if (resolution <= 0) {
      throw new Error("Supplied non-positive resolution parameter to ASAP: ".concat(resolution));
    } // If the resolution is at least twice as big as the number of data points
    // then the values get downsampled to desired resolution first by SMA


    if (values.length >= 2 * resolution) {
      var scale = Math.trunc(values.length / resolution);
      return ASAP(SMA(values, scale, scale), resolution);
    } // First turn data points into a sequence of values


    var data = mapToArray(values, valueExtractor);

    var _calculateAutocorrela = calculateAutocorrelation(data, Math.round(data.length / 10)),
        correlations = _calculateAutocorrela.correlations,
        peaks = _calculateAutocorrela.peaks,
        maxCorrelation = _calculateAutocorrela.maxCorrelation;

    var originalKurtosis = calculateKurtosis(data);
    var minRoughness = calculateRoughness(data);
    var windowSize = 1;
    var lb = 1;
    var largestFeasible = -1;
    var tail = data.length / 10;

    for (var i = peaks.length - 1; i >= 0; i -= 1) {
      var w = peaks[i];

      if (w < lb || w === 1) {
        break;
      } else if (Math.sqrt(1 - correlations[w]) * windowSize > Math.sqrt(1 - correlations[windowSize]) * w) {
        continue;
      }

      var smoothed = SMANumeric(data, w, 1);
      var kurtosis = calculateKurtosis(smoothed);
      var roughness = calculateRoughness(smoothed);

      if (kurtosis >= originalKurtosis) {
        if (roughness < minRoughness) {
          minRoughness = roughness;
          windowSize = w;
        }

        lb = Math.round(Math.max(w * Math.sqrt((maxCorrelation - 1) / (correlations[w] - 1)), lb));

        if (largestFeasible < 0) {
          largestFeasible = i;
        }
      }
    }

    if (largestFeasible > 0) {
      if (largestFeasible < peaks.length - 2) {
        tail = peaks[largestFeasible + 1];
      }

      lb = Math.max(lb, peaks[largestFeasible] + 1);
    }

    windowSize = findWindowSize(lb, tail, data, minRoughness, originalKurtosis, windowSize);
    return SMA(values, windowSize, 1);
  };
};
var ASAP = createASAP(createLegacyDataPointConfig());

exports.ASAP = ASAP;
exports.createASAP = createASAP;
//# sourceMappingURL=ASAP.js.map
