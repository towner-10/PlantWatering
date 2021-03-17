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
interface SmoothingFunctionConfig<P> extends DownsamplingFunctionConfig<P> {
  toPoint: (x: number, y: number, index: number) => P;
}
type TypedArray =
  | Int8Array
  | Int16Array
  | Int32Array
  | Uint8Array
  | Uint8ClampedArray
  | Uint16Array
  | Uint32Array
  | Float32Array
  | Float64Array;
type DefaultDataPoint = {
  x: number;
  y: number;
};
type GetValueForIndex = (index: number) => number;
type Transformer<Params extends unknown[] = []> = (
  length: number,
  getX: GetValueForIndex,
  getY: GetValueForIndex,
  ...params: Params
) => IterableIterator<DefaultDataPoint>;
type Indexable<T> = {
  length: number;
  [index: number]: T;
};
type ArrayDownsamplingFunction<T, Params extends unknown[] = []> = (data: T[], ...params: Params) => T[];
type TypedArrayDownsamplingFunction<Params extends unknown[] = []> = <A extends TypedArray = TypedArray>(
  data: A,
  ...params: Params
) => A;
type DownsamplingFunction<T, Params extends unknown[] = [], Input extends Indexable<T> = Indexable<T>> = (
  data: Input,
  ...params: Params
) => Input;
declare const createASAP: <P>(config: SmoothingFunctionConfig<P>) => DownsamplingFunction<P, [number], Indexable<P>>;
declare const ASAP: DownsamplingFunction<DataPoint, [number], Indexable<DataPoint>>;
// Largest triangle three buckets data downsampling algorithm implementation
declare const createLTD: <P>(config: DownsamplingFunctionConfig<P>) => DownsamplingFunction<P, [number], Indexable<P>>;
declare const LTD: DownsamplingFunction<DataPoint, [number], Indexable<DataPoint>>;
// Largest triangle three buckets data downsampling algorithm implementation
declare const createLTOB: <P>(config: DownsamplingFunctionConfig<P>) => DownsamplingFunction<P, [number], Indexable<P>>;
declare const LTOB: DownsamplingFunction<DataPoint, [number], Indexable<DataPoint>>;
// Largest triangle three buckets data downsampling algorithm implementation
declare const createLTTB: <P>(config: DownsamplingFunctionConfig<P>) => DownsamplingFunction<P, [number], Indexable<P>>;
declare const LTTB: DownsamplingFunction<DataPoint, [number], Indexable<DataPoint>>;
/**
 * Simple Moving Average (SMA)
 *
 * @param data {Number[]}
 * @param windowSize {Number}
 * @param slide {Number}
 */
declare const createSMA: <P>(
  config: SmoothingFunctionConfig<P>,
) => DownsamplingFunction<P, [number, number | undefined] | [number], Indexable<P>>;
declare const SMA: DownsamplingFunction<DataPoint, [number, number | undefined] | [number], Indexable<DataPoint>>;
declare const _default: {
  ASAP: DownsamplingFunction<DataPoint, [number], Indexable<DataPoint>>;
  LTD: DownsamplingFunction<DataPoint, [number], Indexable<DataPoint>>;
  LTOB: DownsamplingFunction<DataPoint, [number], Indexable<DataPoint>>;
  LTTB: DownsamplingFunction<DataPoint, [number], Indexable<DataPoint>>;
  SMA: DownsamplingFunction<DataPoint, [number, number | undefined] | [number], Indexable<DataPoint>>;
  createASAP: <P>(config: SmoothingFunctionConfig<P>) => DownsamplingFunction<P, [number], Indexable<P>>;
  createLTD: <P_1>(config: DownsamplingFunctionConfig<P_1>) => DownsamplingFunction<P_1, [number], Indexable<P_1>>;
  createLTOB: <P_2>(config: DownsamplingFunctionConfig<P_2>) => DownsamplingFunction<P_2, [number], Indexable<P_2>>;
  createLTTB: <P_3>(config: DownsamplingFunctionConfig<P_3>) => DownsamplingFunction<P_3, [number], Indexable<P_3>>;
  createSMA: <P_4>(
    config: SmoothingFunctionConfig<P_4>,
  ) => DownsamplingFunction<P_4, [number, number | undefined] | [number], Indexable<P_4>>;
};
export {
  _default as default,
  X,
  Value,
  NormalizedDataPoint,
  TupleDataPoint,
  XYDataPoint,
  DataPoint,
  NumericPropertyNames,
  NumericPropertyAccessor,
  PointValueExtractor,
  DownsamplingFunctionConfig,
  SmoothingFunctionConfig,
  TypedArray,
  DefaultDataPoint,
  GetValueForIndex,
  Transformer,
  Indexable,
  ArrayDownsamplingFunction,
  TypedArrayDownsamplingFunction,
  DownsamplingFunction,
  ASAP,
  createASAP,
  LTD,
  createLTD,
  LTOB,
  createLTOB,
  LTTB,
  createLTTB,
  SMA,
  createSMA,
};
