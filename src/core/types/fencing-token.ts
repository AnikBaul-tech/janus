/**
 * A monotonically increasing token assigned to each successful
 * lease acquisition.
 *
 * Represented as a decimal string to preserve 64-bit integer precision.
 */
export type FencingToken = string & {
  readonly __brand: "FencingToken";
};
