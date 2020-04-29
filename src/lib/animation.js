import {
    isEqual,
    isArray,
    isNull,
    isVal,
    isObj,
    copyObj,
    copyArray,
    isNumber,
    isNotNull,
    isObjOrArray,
    vectorPlus,
    vectorDiff,
    vectorScalarMult
} from '../utils/index.js';

// Time functions for animation control from 0 to 1
export const LINEAR = t => t;
export const QUADRATIC = t => t * t;
export const EXPONENTIAL = a => t => Math.pow(t, a);
export const FLIP = F => t => 1 - F(t);

// Change the value of a node gradually through time 'delta' is the
// rate of change in milliseconds. Returns a handle to the setTimeout.
// Timed works for any object/array with numbers inside. The idea is
// to get the difference (diff) between current and final values and
// if the difference is an object/array with only numbers, transform
// the difference into a vector (toNumbers) that will be incremented
// through time. Each step the difference vector will be added to the
// initial vector and the result will be transformed back to object
// (fromNumbers and unDiff)
export const timed = (
    nd,
    { finalVal, totalTime, timeFunction = LINEAR, delta = 10 }
) => {
    const nowVal = nd.val;
    if (nowVal) {
        // Info.get(timed) contains a boolean set to true if the node
        // is already being changed through time. If null then it is
        // the first time timed is being applied to the node.
        const isBeingChanged = nd.info.get(timed);
        if (!isEqual(nowVal, finalVal) && !isBeingChanged) {
            nd.info.set(timed, true);
            let diff_ = diff(nowVal, finalVal);
            if (diff_ != -1) {
                const [nowDiff, finalDiff] = diff_;
                const initialState = toNumbers(nowDiff);
                const finalState = toNumbers(finalDiff);
                const d = vectorDiff(finalState, initialState);
                // setTimeout loop updating 't'
                let t = delta;
                const handle = setInterval(() => {
                    if (t >= totalTime) {
                        nd.info.set(timed, false);
                        clearInterval(handle);
                        t = totalTime;
                    }
                    let newState = vectorPlus(
                        vectorScalarMult(
                            d,
                            timeFunction(t / totalTime)
                        ),
                        initialState
                    );
                    let newVal = unDiff(
                        fromNumbers(newState, nowDiff),
                        nowVal
                    );
                    nd.val = newVal;
                    t = t + delta;
                }, delta);
                return { handle, node: nd };
            }
        }
    }
    return null;
};

// Just ends a timed process
export const stopTimed = ({ handle, node }) => {
    node.info.set(timed, false);
    clearInterval(handle);
};

// From 2 objects it returns only the differences among them
const diff = (o1, o2) => {
    if (!isEqual(o1, o2)) {
        if (typeof o1 == 'boolean') {
            return [o1, o2];
        }
        if (
            (isArray(o1) && !isArray(o2) && !isNull(o2)) ||
            (isArray(o2) && !isArray(o1) && !isNull(o1)) ||
            (isVal(o1) && !isVal(o2) && !isNull(o2)) ||
            (isVal(o2) && !isVal(o1) && !isNull(o1))
        ) {
            Error(3, 'Diffing bad parameter', 'Type mismatch');
            return -1;
        }
        if (
            (isObj(o1) && (isObj(o2) || isNull(o2))) ||
            (isObj(o2) && (isObj(o1) || isNull(o1)))
        ) {
            let no1 = o1 || {};
            let no2 = o2 || {};
            let now = copyObj(no1);
            let merged = copyObj({
                ...no1,
                ...no2
            });
            Object.entries(merged).forEach(([n]) => {
                if (isEqual(no1[n], no2[n])) {
                    delete merged[n];
                    delete now[n];
                } else {
                    let ans = diff(no1[n], no2[n]);

                    if (ans && ans != -1) {
                        let [now_, merged_] = ans;

                        now[n] = now_;
                        merged[n] = merged_;
                    }
                }
            });
            return [now, merged];
        } else if (
            (isArray(o1) && (isArray(o2) || isNull(o2))) ||
            (isArray(o2) && (isArray(o1) || isNull(o1)))
        ) {
            var no1 = o1;
            var no2 = o2;
            if (o1 == null) {
                no1 = o2.map(() => null);
            }
            if (o2 == null) {
                no2 = o1.map(() => null);
            }
            if (no1.length == no2.length) {
                let now = copyArray(no1);
                let merged = copyArray(no2);
                for (let i = 0; i < now.length; i++) {
                    if (isEqual(no1[i], no2[i])) {
                        delete merged[i];
                        delete now[i];
                    } else {
                        let ans = diff(no1[i], no2[i]);

                        if (ans && ans != -1) {
                            let [now_, merged_] = ans;

                            now[i] = now_;
                            merged[i] = merged_;
                        }
                    }
                }
                return [now, merged];
            } else {
                // Arrays with different sizes: can't diff, but it is
                // not an error.
                return [o1, o2];
            }
        } else {
            return [o1, o2];
        }
    } else {
        return -1;
    }
};

// From object differerences and the old value, constructs a new value
const unDiff = (changesVal, oldVal) => {
    if (isObj(changesVal)) {
        let newVal = {};
        Object.entries(oldVal).forEach(([n]) => {
            if (isNotNull(changesVal[n])) {
                newVal[n] = unDiff(changesVal[n], oldVal[n]);
            } else {
                if (isObj(oldVal[n])) {
                    newVal[n] = copyObj(oldVal[n]);
                } else {
                    newVal[n] = oldVal[n];
                }
            }
        });
        return newVal;
    } else if (isArray(changesVal)) {
        let newVal = [];
        if (changesVal.length == oldVal.length) {
            for (let i = 0; i < oldVal.length; i++) {
                if (isNotNull(changesVal[i])) {
                    newVal[i] = unDiff(changesVal[i], oldVal[i]);
                } else {
                    if (isObj(oldVal[i])) {
                        newVal[i] = copyObj(oldVal[i]);
                    } else {
                        newVal[i] = oldVal[i];
                    }
                }
            }
            return newVal;
        } else {
            Error(
                4,
                'UnDiffing bad parameters',
                `Array size mismatch between ${changesVal} and ${oldVal}`
            );
            return null;
        }
    } else {
        return changesVal;
    }
};

// Transforms any nested object structure with numbers into an array
// of numbers
const toNumbers = val => {
    if (isNumber(val)) {
        return [val];
    } else if (isObjOrArray(val)) {
        let tuple = [];
        Object.values(val).forEach(v => {
            let ns = toNumbers(v);
            if (ns) {
                tuple = tuple.concat(ns);
            }
        });
        return tuple;
    } else {
        // any other value besides number cannot be trivially
        // transformed into number 🤔
        Error(
            5,
            'toNumbers bad parameters',
            `Value ${val} is not a number nor an object`
        );
        return null;
    }
};

// From an array of numbers and an object structure (val), constructs
// a new object with the values in the number array
const fromNumbers = (numbers, val) => {
    return fromNumbersAux(copyArray(numbers), val);
    function fromNumbersAux(ns, v) {
        if (isNumber(v)) {
            return ns.shift();
        } else if (isObj(v)) {
            let result = {};
            Object.entries(v).forEach(([i, p]) => {
                result[i] = fromNumbersAux(ns, p);
            });
            return result;
        } else if (isArray(v)) {
            let result = [];
            for (var i = 0; i < v.length; i++) {
                if (isNotNull(v[i])) {
                    result[i] = fromNumbersAux(ns, v[i]);
                } else {
                    delete result[i];
                }
            }
            return result;
        } else {
            Error(
                6,
                'fromNumbers bad parameters',
                `Value ${v} is not a number nor an object nor an array`
            );
            return null;
        }
    }
};
