/**
 * Possible types for the X coordinate (most probably time)
 */
type X = number | Date;
/**
 * Possible types for the Value coordinate
 */
type Value = number;
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
declare const createLTOB: <P>(config: DownsamplingFunctionConfig<P>) => DownsamplingFunction<P, [number], Indexable<P>>;
declare const LTOB: DownsamplingFunction<DataPoint, [number], Indexable<DataPoint>>;
export { createLTOB, LTOB };
