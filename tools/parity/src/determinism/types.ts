export type DeterminismVerdict = 'PASS' | 'FAIL';

export interface HashMismatch {
  artifactId: string;
  declaredHash: string;
  computedHash: string;
}

export interface DoubleRunMismatch {
  path: string;
  runA: string;
  runB: string;
}

export interface DoubleRunResult<T> {
  label: string;
  admissible: boolean;
  canonicalMatch: boolean;
  hashMatch: boolean;
  contentHashRunA: string;
  contentHashRunB: string;
  runA: T;
  runB: T;
  mismatches: DoubleRunMismatch[];
}
