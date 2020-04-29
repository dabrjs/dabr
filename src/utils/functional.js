import { isArray } from './types.js';

export const singleton = xs => (isArray(xs) ? xs : [xs]);

// Functional Programming
export const zipWith = (xs, ys, f) => xs.map((n, i) => f(n, ys[i]));

export const vectorPlus = (xs1, xs2) =>
    zipWith(xs1, xs2, (x1, x2) => x1 + x2);

export const vectorDiff = (xs1, xs2) =>
    zipWith(xs1, xs2, (x1, x2) => x1 - x2);

export const vectorScalarMult = (xs, c) => xs.map(x => x * c);

export const map = (f, arr) => arr.map(f);

export const isElem = (elem, array) => array.indexOf(elem) !== -1;

// Applies a list of functions to a value
export const applyF = fs => val => fs.reduce((x, f) => f(x), val);
