/**
 * Possible types for the X coordinate (most probably time)
 */
type X = number | Date;
/**
 * Possible types for the Value coordinate
 */
type Value = number;
type NormalizedDataPoint = [Value, Value];
type TupleDataPoint = [X, Value];
interface XYDataPoint {
  x: X;
  y: Value;
}
type DataPoint = TupleDataPoint | XYDataPoint;
type NumericPropertyNames<T> = {
  [K in keyof T]: T[K] extends Value ? K : never;
}[keyof T];
// TODO P extends [] does not cover all the tuple cases with heterogenous tuples
// and it would be nice to have a (generated) type for that
type NumericPropertyAccessor<P> = P extends unknown[] ? number : NumericPropertyNames<P>;
type PointValueExtractor<P> = (point: P, index: number) => Value;
interface DownsamplingFunctionConfig<P> {
  x: NumericPropertyAccessor<P> | PointValueExtractor<P>;
  y: NumericPropertyAccessor<P> | PointValueExtractor<P>;
}
type Indexable<T> = {
  length: number;
  [index: number]: T;
};
type DownsamplingFunction<T, Params extends unknown[] = [], Input extends Indexable<T> = Indexable<T>> = (
  data: Input,
  ...params: Params
) => Input;
declare const mergeBucketAt: (buckets: NormalizedDataPoint[][], index: number) => NormalizedDataPoint[][];
declare const splitBucketAt: (buckets: NormalizedDataPoint[][], index: number) => NormalizedDataPoint[][];
declare const calculateLinearRegressionCoefficients: (data: NormalizedDataPoint[]) => [Value, Value];
declare const calculateSSEForBucket: (dataPoints: NormalizedDataPoint[]) => number;
declare const calculateSSEForBuckets: (buckets: NormalizedDataPoint[][]) => number[];
declare const findLowestSSEAdjacentBucketsIndex: (sse: number[], ignoreIndex: number) => number | undefined;
declare const findHighestSSEBucketIndex: (buckets: NormalizedDataPoint[][], sse: number[]) => number | undefined;
declare const createLTD: <P>(config: DownsamplingFunctionConfig<P>) => DownsamplingFunction<P, [number], Indexable<P>>;
declare const LTD: DownsamplingFunction<DataPoint, [number], Indexable<DataPoint>>;
export {
  mergeBucketAt,
  splitBucketAt,
  calculateLinearRegressionCoefficients,
  calculateSSEForBucket,
  calculateSSEForBuckets,
  findLowestSSEAdjacentBucketsIndex,
  findHighestSSEBucketIndex,
  createLTD,
  LTD,
};
