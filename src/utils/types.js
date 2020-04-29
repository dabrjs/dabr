// Type checking functions

export const isWeakMap = xs =>
    xs.constructor && xs.constructor.name == 'WeakMap';

export const isArray = x =>
    !!x && x.constructor && x.constructor.name == 'Array';

export const isVal = x =>
    (x == 0 && !isArray(x)) ||
    (!!x &&
        typeof x != 'object' &&
        x.constructor &&
        x.constructor.name != 'Array');

export const isObj = x =>
    !!x &&
    typeof x == 'object' &&
    x.constructor &&
    x.constructor.name != 'Array';

export const isNull = x => x == null || x == undefined;

export const isObjOrArray = x => x && typeof x == 'object';

export const isNumber = x =>
    (x == 0 && !isArray(x)) || (!!x && typeof x == 'number');

export const isNotNull = x => (x == 0 && !isArray(x)) || !!x;

export const isFunction = x => !!x && typeof x == 'function';

export const isObjectEmpty = obj =>
    Object.entries(obj).length === 0 && obj.constructor === Object;

// Array object higher-order functions
export const isEmpty = array => array.length == 0;

export const arrayToObj = arr => {
    let res = {};
    arr.forEach(([key, val]) => {
        res[key] = val;
    });
    return res;
};

export const iterate = (bs, f) => Object.entries(bs).map(f);

export const mapValuesObj = (bs, f) =>
    arrayToObj(
        Object.entries(bs)
            .map(([k, v]) => {
                let r = f(v, k);
                return r ? [k, r] : null;
            })
            .filter(isNotNull)
    );

export const mapObj = (f, obj) => mapValuesObj(obj, f);

export const concatObj = (...a) => Object.assign({}, ...a);

export const concatenation = (x1, x2) => x1.concat(x2);

// Copy functions

export const copyArray = array => array.slice();

export const copyObj = obj => Object.assign({}, obj);

export const copyObjDeep = obj => JSON.parse(JSON.stringify(obj));

// Object non-reference equality

export const isEqual = (o1, o2) => {
    let leftChain = [];
    let rightChain = [];
    return compare2Objects(o1, o2);
    function compare2Objects(x, y) {
        var p;
        if (x == null && y == undefined) {
            return true;
        }
        if (x == undefined && y == null) {
            return true;
        }
        if (
            isNaN(x) &&
            isNaN(y) &&
            typeof x === 'number' &&
            typeof y === 'number'
        ) {
            return true;
        }
        if (x === y) {
            return true;
        }
        if (
            (typeof x === 'function' && typeof y === 'function') ||
            (x instanceof Date && y instanceof Date) ||
            (x instanceof RegExp && y instanceof RegExp) ||
            (x instanceof String && y instanceof String) ||
            (x instanceof Number && y instanceof Number)
        ) {
            return x.toString() === y.toString();
        }
        if (!(x instanceof Object && y instanceof Object)) {
            return false;
        }
        if (x.isPrototypeOf(y) || y.isPrototypeOf(x)) {
            return false;
        }
        if (x.constructor !== y.constructor) {
            return false;
        }
        if (x.prototype !== y.prototype) {
            return false;
        }
        if (leftChain.indexOf(x) > -1 || rightChain.indexOf(y) > -1) {
            return false;
        }
        for (p in y) {
            if (y.hasOwnProperty(p) !== x.hasOwnProperty(p)) {
                return false;
            } else if (typeof y[p] !== typeof x[p]) {
                return false;
            }
        }
        for (p in x) {
            if (y.hasOwnProperty(p) !== x.hasOwnProperty(p)) {
                return false;
            } else if (typeof y[p] !== typeof x[p]) {
                return false;
            }
            switch (typeof x[p]) {
                case 'object':
                case 'function':
                    leftChain.push(x);
                    rightChain.push(y);
                    if (!compare2Objects(x[p], y[p])) {
                        return false;
                    }
                    leftChain.pop();
                    rightChain.pop();
                    break;
                default:
                    if (x[p] !== y[p]) {
                        return false;
                    }
                    break;
            }
        }
        return true;
    }
};
