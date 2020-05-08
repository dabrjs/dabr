// Type checking functions

const isWeakMap = xs =>
    xs.constructor && xs.constructor.name == 'WeakMap';

const isArray = x =>
    !!x && x.constructor && x.constructor.name == 'Array';

const isVal = x =>
    (x == 0 && !isArray(x)) ||
    (!!x &&
        typeof x != 'object' &&
        x.constructor &&
        x.constructor.name != 'Array');

const isObj = x =>
    !!x &&
    typeof x == 'object' &&
    x.constructor &&
    x.constructor.name != 'Array';

const isNull = x => x == null || x == undefined;

const isObjOrArray = x => x && typeof x == 'object';

const isNumber = x =>
    (x == 0 && !isArray(x)) || (!!x && typeof x == 'number');

const isNotNull = x => (x == 0 && !isArray(x)) || !!x;

const arrayToObj = arr => {
    let res = {};
    arr.forEach(([key, val]) => {
        res[key] = val;
    });
    return res;
};

const iterate = (bs, f) => Object.entries(bs).map(f);

const mapValuesObj = (bs, f) =>
    arrayToObj(
        Object.entries(bs)
            .map(([k, v]) => {
                let r = f(v, k);
                return r ? [k, r] : null;
            })
            .filter(isNotNull)
    );

const mapObj = (f, obj) => mapValuesObj(obj, f);

const concatObj = (...a) => Object.assign({}, ...a);

// Copy functions

const copyArray = array => array.slice();

const copyObj = obj => Object.assign({}, obj);

// Object non-reference equality

const isEqual = (o1, o2) => {
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

const singleton = xs => (isArray(xs) ? xs : [xs]);

// Functional Programming
const zipWith = (xs, ys, f) => xs.map((n, i) => f(n, ys[i]));

const vectorPlus = (xs1, xs2) =>
    zipWith(xs1, xs2, (x1, x2) => x1 + x2);

const vectorDiff = (xs1, xs2) =>
    zipWith(xs1, xs2, (x1, x2) => x1 - x2);

const vectorScalarMult = (xs, c) => xs.map(x => x * c);

// Applies a list of functions to a value
const applyF = fs => val => fs.reduce((x, f) => f(x), val);

// Node creation entry point
const node = (val = null, info = new WeakMap()) =>
    mkNode({
        val: val, // current value
        old: null, // previous value
        trans: new Set(), // binded transitions
        changed: false, // set when node is already updated
        isNode: true, // to check if obj is a node
        info: info // WeakMap with any info - better than strings!
    });

const mkNode = target => new Proxy(target, { set, get });

// Property 'target' can be used to retrieve the raw node object
const get = (target, prop) =>
    prop == 'target' ? target : target[prop];

const set = (target, prop, value) => {
    if (prop == 'val') {
        // Node networks care about value equality. Different from
        // channels, if the value is the same nothing happens.
        if (!target.changed && !isEqual(target.val, value)) {
            target.old = target.val;
            target.val = value;
            // Property 'changed' being set to true before running
            // transitions prevents infinite loops. Node nets are
            // assumed to stabilize values in 1 run always so there
            // is no reason to run the same transition twice.
            target.changed = true;
            target.trans.forEach(t => {
                // if transition returns truish value, it means the
                // transition should be deleted
                if (t.func()) {
                    target.trans.delete(t); // = target.trans.filter(tr => tr != t);
                }
            });
            target.changed = false;
        }
        return true;
    }
    return false;
};

const allNodesNotNull = nds =>
    nds.map(x => isNotNull(x.val)).reduce((x, y) => x && y, true);

// Binds a transition to many nodes.
// It runs whenever any one of the binded nodes change.
const tran = (nodes, func) => {
    if (nodes.length > 0) {
        const transition = { nodes, func };
        // Many transitions with the same tag is not allowed. Tags are
        // used as an indentity for dynamically created transitions.
        nodes.forEach(nd => {
            const ts = nd.target.trans;
            if (!ts.has(transition)) {
                ts.add(transition);
            }
        });
        // The transition runs right away if nodes are initialized with
        // non null values.
        if (allNodesNotNull(nodes)) {
            func();
        }
        return transition;
    } else {
        return null;
    }
};

// Only runs if all binded nodes are not null
const safeTran = (nodes, func) =>
    tran(nodes, () => {
        if (allNodesNotNull(nodes)) {
            func();
        }
    });

// Remove a transition from all binded nodes
const removeTran = transition => {
    transition.nodes.forEach(nd => {
        const target = nd.target;
        target.trans.delete(transition);
    });
};

// Used when you want to make sure an obj is a node
const toNode = x => (x.isNode ? x : node(x));

// Create a node from a transition
const nodeT = (nodes, func, info) => {
    const aux = node(null, info);
    tran(nodes, () => {
        aux.val = func();
    });
    return aux;
};

const safeNodeT = (nodes, func, info) => {
    const aux = node(null, info);
    safeTran(nodes, () => {
        aux.val = func();
    });
    return aux;
};

// Similar to nodeT but the function receives values as input
const mapN = (ns, f, info) =>
    nodeT(ns, () => f(...ns.map(n => n.val)), info);

const safeMapN = (ns, f, info) =>
    safeNodeT(ns, () => f(...ns.map(n => n.val)), info);

// A tree of anything in which every children are actually nodes (DABR
// nodes). You can define children as an array or only 1 element and
// as a node or not a node but in the end it always becomes a node
// with an array of trees inside.
const Tree = (val, children) => {
    let ch;
    if (children) {
        if (children.isNode) {
            if (isArray(children.val)) {
                ch = children;
            } else {
                ch = mapN([children], singleton);
            }
        } else {
            if (children.isEntry) {
                ch = children;
            } else {
                ch = toNode(singleton(children));
            }
        }
    } else {
        ch = node([]);
    }
    return {
        isTree: true,
        val: val,
        children: ch
    };
};

// Shorthand only
const T = Tree;

// Maps a function through the rect
const mapT = f => (tree, path = []) =>
    Tree(
        f(tree.val, path),
        tree.children.isEntry
            ? tree.children
            : mapN([tree.children], chs =>
                  chs.map((ch, i) => mapT(f)(ch, path.concat(i)))
              )
    );

const treePath = (tree, path) => {
    let res = null;
    walkT((t, p) => {
        console.log('AAAAAAAAAAAAAAAAaaa', t, p);
        if (isEqual(p, path)) {
            res = t;
        }
    })(tree);
    return res;
};

const getFirst = tree => treePath(tree, []);

// Similar to map but the output does not matter
const walkT = f => (tree, path = []) => {
    f(tree.val, path);
    if (!tree.children.isEntry) {
        tran([tree.children], () => {
            const chs = tree.children.val;
            chs.forEach((ch, i) => walkT(f)(ch, path.concat(i)));
        });
    }
};

// Special object used to indicate entry-points to flatten Trees of
// Trees of A into Trees of A (see 'flatten' function)
const Entry = {
    isEntry: true
};

// Substitute an Entry object by children
const substEntry = (tree, val) => {
    if (tree.children.isEntry) {
        tree.children = val;
    } else {
        tree.children = mapN([tree.children], chs =>
            chs.map(ch => substEntry(ch, val))
        );
    }
    return tree;
};

// Flattens a Tree of Trees using the Entry special object as an
// indicator of how to flatten the trees. Really useful for all sorts
// of transformations.
const flatten = tree => {
    const val = tree.val;
    if (val.isTree) {
        return flatten(substEntry(val, tree.children));
    } else {
        tree.children = mapN([tree.children], chs =>
            chs.map(flatten)
        );
        return tree;
    }
};

const styleAttrs = {
    color: ({ elem, node: col }) => () => {
        elem.style['background-color'] = col.val;
    },
    show: ({ elem, node: sh }) => () => {
        if (sh.val) {
            elem.style['display'] = 'block';
        } else {
            elem.style['display'] = 'none';
        }
    }
};

// Binds CSS properties to nodes
var addStyle = mapT(r => {
    if (r.style) {
        iterate(r.style, ([name, val]) => {
            const nd = toNode(val);
            const ans = styleAttrs[name];
            if (ans) {
                const tr = ans({
                    node: nd,
                    elem: r.inst.dom,
                    rect: r
                });
                const t = tran([nd], tr);
                r.renderTrans.add(t);
            }
        });
    }
    return r;
});

const events = {
    click: ({ elem, channel }) => {
        elem.addEventListener('click', e => {
            channel.put = e;
        });
    },
    mouseOver: ({ elem, channel }) => {
        elem.addEventListener('mouseover', e => {
            channel.put = e;
        });
    },
    mouseEnter: ({ elem, channel }) => {
        elem.addEventListener('mouseenter', e => {
            channel.put = e;
        });
    }
};

// Binds events to channels
var addChans = mapT(r => {
    if (r.events) {
        iterate(r.events, ([name, ch]) => {
            if (ch.isChan) {
                const ans = events[name];
                if (ans) {
                    ans({
                        channel: ch,
                        elem: r.inst.dom,
                        rect: r
                    });
                }
            }
        });
    }
    return r;
});

const nodes = {
    scrollAbs: ({ elem, rect, node: scroll }) => {
        elem.addEventListener('scroll', () => {
            scroll.val = [elem.scrollLeft, elem.scrollTop];
        });
        const t = tran([scroll], () => {
            const [l, t] = scroll.val;
            elem.scrollLeft = l;
            elem.scrollTop = t;
        });
        rect.renderTrans.add(t);
    },
    scroll: ({ elem, rect, node: scroll }) => {
        const limN = mapN([rect.layout.sizAbs], siz => [
            elem.scrollWidth - Math.round(siz[0]),
            elem.scrollHeight - Math.round(siz[1])
        ]);
        elem.addEventListener('scroll', () => {
            const lim = limN.val;
            scroll.val = [
                lim[0] === 0 ? 0 : 100 * (elem.scrollLeft / lim[0]),
                lim[1] === 0 ? 0 : 100 * (elem.scrollTop / lim[1])
            ];
        });
        const t = tran([scroll], () => {
            const [l, t] = scroll.val;
            const lim = limN.val;
            const res = [
                Math.round((l / 100) * lim[0]),
                Math.round((t / 100) * lim[1])
            ];
            if (elem.scrollLeft != res[0]) {
                elem.scrollLeft = res[0];
            }
            if (elem.scrollTop != res[1]) {
                elem.scrollTop = res[1];
            }
        });
        rect.renderTrans.add(t);
    }
};

var addNodes = mapT(r => {
    if (r.nodes) {
        iterate(r.nodes, ([name, val]) => {
            const nd = toNode(val);
            const ans = nodes[name];
            if (ans) {
                ans({
                    node: nd,
                    elem: r.inst.dom,
                    rect: r
                });
            }
        });
    }
    return r;
});

// Channel creation entry point
const chan = (val, info) =>
    mkChan({
        get: val, // current event value
        ports: new Set(), // binded listeners
        isChan: true, // to check if obj is a channel
        info: info // additional arbitray info
    });

const mkChan = target =>
    new Proxy(target, {
        get: get$1,
        set: set$1
    });

// Property 'target' can be used to retrieve the raw channel object
// 'get' is used to get the current channel value
const get$1 = (target, prop) =>
    prop == 'target' ? target : target[prop];

// 'put' is used to set the current value of the channel
const set$1 = (target, prop, value) => {
    if (prop == 'put') {
        // Unlike nodes, channel set is treated as an event, so the
        // function runs even if the value is equal to the current.
        // Channel networks also DON'T prevent infinite loops.
        target.get = value;
        target.ports.forEach(port => {
            port.func();
        });
        return true;
    }
    return false;
};

// Adds a listener to each channel
const listen = (chans, func) => {
    const listener = { chans, func };
    chans.forEach(chan => {
        chan.ports.add(listener);
    });
    return listener;
};

// Listener removal
const removeListen = listener => {
    listener.chans.forEach(chan => {
        const target = chan.target;
        target.ports.delete(listener);
    });
};

// After first listen, listener is removed
const listenOnce = (chans, func) => {
    const listener = listen(chans, () => {
        func();
        removeListen(listener);
    });
    return listener;
};

// Creates a channel from a listener function. If function returns
// null or undefined, the channel is not set.
const chanL = (chans, func) => {
    const aux = chan();
    listen(chans, () => {
        const ans = func();
        if (isNotNull(ans)) {
            aux.put = ans;
        }
    });
    return aux;
};

// Maps a function to a node. Because it uses chanL, returning a null
// or undefined value filters the result.
const mapC = (cs, f) =>
    chanL(cs, () => f(...cs.map(c => c.get)));

// Specialization of mapC to filter only
const filterC = (chan, cond) =>
    mapC([chan], val => (cond(val) ? val : null));

// Creates the staindard Rect interface, which is a standard set of
// attrs transformations/functions can rely on. Doc:
// isRect: property to check if an object is a rect
// isSupp: check if rect is support (defined by transformations) or
//   core (defined by the user)
// isCore: opposite of isSupp
// oldVersions: array containing older references to the same rect
//   before being preserved by the preserveR function. This value
//   is important for transformations relying on correct rect.inst
//   values even after rect gets transformed by functions (and its
//   object reference changes)
// init: channel set to true when a rect is initialized
// stop: channel set to true when a rect is initialized
// created: node equal to true after rect is initialized and
//   null/false otherwise
// removed: node equal to true after rect is destroyed and null/false
//   otherwise
// inst: object containing info about how the rect was instantiated
//   inst.dom: the DOM element binded to the rect
//   inst.par: the parent rect
// renderTrans: references to transitions related to DOM rendering.
//   Normally the user should not modify this attr.
// data: additional information/nodes/channels outside of the standard
//   attrs that the rect interacts with. It is good practice for
//   transformations to put additional data inside this attr with key
//   equal to the transformation itself. It is defined as {key, val}
//   or [{key, val}]. Examples:
//     'rect.data.get(border)' gets data put by the 'border' function.
//     'rect.data.get(Rect)' stores if a rect isMain or isAux.
// layout: information regarding positioning. All attrs are nodes.
//   layout.posAbs: absolute position in pixels, only initialized
//     after rect is ran
//   layout.sizAbs: absolute size in pixels, only initialized
//     after rect is ran
//   layout.max: maximum relative lengths for coords,
//     default is [100,100]
//   layout.pos: relative position length. Obligatory in any rect.
//   layout.siz: relative size length. Obligatory in any rect.
const Rect = def => {
    const defaultLayout = {
        posAbs: node(),
        sizAbs: node(),
        max: node([100, 100])
    };

    const defaultRectAttrs = {
        isRect: true,
        isSupp: false,
        isCore: true,
        oldVersions: [],
        init: chan(),
        stop: chan(),
        created: node(),
        removed: node(),
        inst: null,
        renderTrans: new Set(),
        data: new WeakMap([[Rect, {}]]),
        layout: defaultLayout
    };

    const aux = {};
    if (def.data) {
        if (isWeakMap(def.data)) {
            aux.data = def.data;
        } else {
            const arr = singleton(def.data);
            aux.data = new WeakMap(
                arr.map(({ key, val }) => [key, [val]])
            );
        }
    }
    if (def.layout) {
        aux.layout = concatObj(defaultLayout, def.layout);
    }

    const res = concatObj(defaultRectAttrs, def, aux);
    if (res.layout) {
        res.layout = mapObj(toNode, res.layout);
    }
    return res;
};

// Same as Rect, but with isAux = true
const Supp = def => {
    const rect = Rect(def);
    rect.isSupp = true;
    rect.isCore = false;
    return rect;
};

// Changes some Rect properties, preserving the others
const preserveR = (rect, changes) => {
    const aux = {};
    iterate(changes, ([name, key]) => {
        if (rect[name] && isObj(rect[name])) {
            aux[name] = concatObj(rect[name], key);
        } else {
            aux[name] = key;
        }
    });
    if (changes.data) {
        const arr = singleton(changes.data);
        aux.data = rect.data;
        arr.forEach(({ key, val }) => {
            if (aux.data.has(key)) {
                const current = aux.data.get(key);
                aux.data.set(current.concat(key));
            } else {
                aux.data.set(key, [val]);
            }
        });
    }
    aux.inst = null; //rect.inst;
    aux.init = chan(); //rect.init;
    aux.created = node(); //rect.created;
    aux.oldVersions = rect.oldVersions.concat([rect]);
    return Rect(concatObj(rect, aux));
};

// Auxiliar function to define {key, val}, it is really only a
// more aesthetical way of defining the object (imo)
const keyed = (key, val) => ({
    key: key,
    val: val
});

// A dummy rectangle covering the entire parent rectangle
const Dummy = changes =>
    preserveR(
        Supp({
            layout: {
                pos: [0, 0],
                siz: [100, 100]
            }
        }),
        changes || {}
    );

// A set of functions for easy Tree of Rect manipulation

// Define a tree of rect and its in 1 function
const RectT = (def, chs) => Tree(Rect(def), chs);

// Same thing as RectT but for support rects
const SuppT = (def, chs) => Tree(Supp(def), chs);

// Apply function 'f' if condition 'cond' holds, or else do nothing
const cond = c => f => mapT(x => (c(x) ? f(x) : x));

// Cond but with else clause as well
const condElse = (c1, c2) => (f1, f2) =>
    mapT(x => (c1(x) ? f1(x) : c2(x) ? f2(x) : x));

// Apply function if element is Rect and is core
const core = cond(x => x.isCore);

// Apply function if element is Rect is support
const supp = cond(x => x.isSupp);

// Apply function if element is a Tree
const tree = cond(x => x.isTree);

// Apply function only to the most top-level element of the tree
const top = f => tree => Tree(f(tree.val), tree.children);

// Length defined by relative value plus a pixel value
const rel = (r, p) => ({
    px: p,
    rel: r
});

// Length in pixels
const px = p => rel([0, 0], p);

// Add render transitions related to layout (positioning)
const addLayoutTriggers = (layout, elem, rect, parLayout) => {
    const maxN = parLayout.max;

    const posN = layout.pos;
    const posT = tran([posN, maxN], () => {
        const pos = posN.val;
        const max = maxN.val;
        if (pos.rel) {
            elem.style.left = `calc(${(pos.rel[0] * 100) /
                max[0]}% + ${pos.px[0]}px)`;
            elem.style.top = `calc(${(pos.rel[1] * 100) /
                max[1]}% + ${pos.px[1]}px)`;
        } else {
            elem.style.left = `${(pos[0] * 100) / max[0]}%`;
            elem.style.top = `${(pos[1] * 100) / max[1]}%`;
        }
    });
    rect.renderTrans.add(posT);

    const sizN = layout.siz;
    const sizT = tran([sizN, maxN], () => {
        const siz = sizN.val;
        const max = maxN.val;
        if (siz.rel) {
            elem.style.width = `calc(${(siz.rel[0] * 100) /
                max[0]}% + ${siz.px[0]}px)`;
            elem.style.height = `calc(${(siz.rel[1] * 100) /
                max[1]}% + ${siz.px[1]}px)`;
        } else {
            elem.style.width = `${(siz[0] * 100) / max[0]}%`;
            elem.style.height = `${(siz[1] * 100) / max[1]}%`;
        }
    });
    rect.renderTrans.add(sizT);
};

// Rect's default layout reactivity updates posAbs and sizAbs whenever
// max, siz or pos changes. posAbs and sizAbs should not be changed
// directly
const defaultLayoutReactivity = (
    posN, // rect's relative position node
    sizN, // rect's relative size node
    pMaxN, // parent's max node
    pPosAbsN, // parent's absolute position
    pSizAbsN, // parent's absolute size
    posAbsN, // rect's absolute position
    sizAbsN // rect's absolute size
) =>
    safeMapN(
        [posN, sizN, pMaxN, pPosAbsN, pSizAbsN],
        (pos, siz, pMax, pPosAbs, pSizAbs) => {
            let posPx = [0, 0];
            let sizPx = [0, 0];
            let posRel = pos;
            let sizRel = siz;
            if (pos.rel) {
                posRel = pos.rel;
                posPx = pos.px;
            }
            if (siz.rel) {
                sizRel = siz.rel;
                sizPx = siz.px;
            }
            // Some simple math
            let a = [pSizAbs[0] / pMax[0], pSizAbs[1] / pMax[1]];
            let sizAbs = [sizRel[0] * a[0], sizRel[1] * a[1]];
            let posAbs = [
                posRel[0] * a[0] + pPosAbs[0],
                posRel[1] * a[1] + pPosAbs[1]
            ];
            posAbsN.val = vectorPlus(posAbs, posPx);
            sizAbsN.val = vectorPlus(sizAbs, sizPx);
        }
    );

/**
 * A collection of shims that provide minimal functionality of the ES6 collections.
 *
 * These implementations are not meant to be used outside of the ResizeObserver
 * modules as they cover only a limited range of use cases.
 */
/* eslint-disable require-jsdoc, valid-jsdoc */
var MapShim = (function () {
    if (typeof Map !== 'undefined') {
        return Map;
    }
    /**
     * Returns index in provided array that matches the specified key.
     *
     * @param {Array<Array>} arr
     * @param {*} key
     * @returns {number}
     */
    function getIndex(arr, key) {
        var result = -1;
        arr.some(function (entry, index) {
            if (entry[0] === key) {
                result = index;
                return true;
            }
            return false;
        });
        return result;
    }
    return /** @class */ (function () {
        function class_1() {
            this.__entries__ = [];
        }
        Object.defineProperty(class_1.prototype, "size", {
            /**
             * @returns {boolean}
             */
            get: function () {
                return this.__entries__.length;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * @param {*} key
         * @returns {*}
         */
        class_1.prototype.get = function (key) {
            var index = getIndex(this.__entries__, key);
            var entry = this.__entries__[index];
            return entry && entry[1];
        };
        /**
         * @param {*} key
         * @param {*} value
         * @returns {void}
         */
        class_1.prototype.set = function (key, value) {
            var index = getIndex(this.__entries__, key);
            if (~index) {
                this.__entries__[index][1] = value;
            }
            else {
                this.__entries__.push([key, value]);
            }
        };
        /**
         * @param {*} key
         * @returns {void}
         */
        class_1.prototype.delete = function (key) {
            var entries = this.__entries__;
            var index = getIndex(entries, key);
            if (~index) {
                entries.splice(index, 1);
            }
        };
        /**
         * @param {*} key
         * @returns {void}
         */
        class_1.prototype.has = function (key) {
            return !!~getIndex(this.__entries__, key);
        };
        /**
         * @returns {void}
         */
        class_1.prototype.clear = function () {
            this.__entries__.splice(0);
        };
        /**
         * @param {Function} callback
         * @param {*} [ctx=null]
         * @returns {void}
         */
        class_1.prototype.forEach = function (callback, ctx) {
            if (ctx === void 0) { ctx = null; }
            for (var _i = 0, _a = this.__entries__; _i < _a.length; _i++) {
                var entry = _a[_i];
                callback.call(ctx, entry[1], entry[0]);
            }
        };
        return class_1;
    }());
})();

/**
 * Detects whether window and document objects are available in current environment.
 */
var isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined' && window.document === document;

// Returns global object of a current environment.
var global$1 = (function () {
    if (typeof global !== 'undefined' && global.Math === Math) {
        return global;
    }
    if (typeof self !== 'undefined' && self.Math === Math) {
        return self;
    }
    if (typeof window !== 'undefined' && window.Math === Math) {
        return window;
    }
    // eslint-disable-next-line no-new-func
    return Function('return this')();
})();

/**
 * A shim for the requestAnimationFrame which falls back to the setTimeout if
 * first one is not supported.
 *
 * @returns {number} Requests' identifier.
 */
var requestAnimationFrame$1 = (function () {
    if (typeof requestAnimationFrame === 'function') {
        // It's required to use a bounded function because IE sometimes throws
        // an "Invalid calling object" error if rAF is invoked without the global
        // object on the left hand side.
        return requestAnimationFrame.bind(global$1);
    }
    return function (callback) { return setTimeout(function () { return callback(Date.now()); }, 1000 / 60); };
})();

// Defines minimum timeout before adding a trailing call.
var trailingTimeout = 2;
/**
 * Creates a wrapper function which ensures that provided callback will be
 * invoked only once during the specified delay period.
 *
 * @param {Function} callback - Function to be invoked after the delay period.
 * @param {number} delay - Delay after which to invoke callback.
 * @returns {Function}
 */
function throttle (callback, delay) {
    var leadingCall = false, trailingCall = false, lastCallTime = 0;
    /**
     * Invokes the original callback function and schedules new invocation if
     * the "proxy" was called during current request.
     *
     * @returns {void}
     */
    function resolvePending() {
        if (leadingCall) {
            leadingCall = false;
            callback();
        }
        if (trailingCall) {
            proxy();
        }
    }
    /**
     * Callback invoked after the specified delay. It will further postpone
     * invocation of the original function delegating it to the
     * requestAnimationFrame.
     *
     * @returns {void}
     */
    function timeoutCallback() {
        requestAnimationFrame$1(resolvePending);
    }
    /**
     * Schedules invocation of the original function.
     *
     * @returns {void}
     */
    function proxy() {
        var timeStamp = Date.now();
        if (leadingCall) {
            // Reject immediately following calls.
            if (timeStamp - lastCallTime < trailingTimeout) {
                return;
            }
            // Schedule new call to be in invoked when the pending one is resolved.
            // This is important for "transitions" which never actually start
            // immediately so there is a chance that we might miss one if change
            // happens amids the pending invocation.
            trailingCall = true;
        }
        else {
            leadingCall = true;
            trailingCall = false;
            setTimeout(timeoutCallback, delay);
        }
        lastCallTime = timeStamp;
    }
    return proxy;
}

// Minimum delay before invoking the update of observers.
var REFRESH_DELAY = 20;
// A list of substrings of CSS properties used to find transition events that
// might affect dimensions of observed elements.
var transitionKeys = ['top', 'right', 'bottom', 'left', 'width', 'height', 'size', 'weight'];
// Check if MutationObserver is available.
var mutationObserverSupported = typeof MutationObserver !== 'undefined';
/**
 * Singleton controller class which handles updates of ResizeObserver instances.
 */
var ResizeObserverController = /** @class */ (function () {
    /**
     * Creates a new instance of ResizeObserverController.
     *
     * @private
     */
    function ResizeObserverController() {
        /**
         * Indicates whether DOM listeners have been added.
         *
         * @private {boolean}
         */
        this.connected_ = false;
        /**
         * Tells that controller has subscribed for Mutation Events.
         *
         * @private {boolean}
         */
        this.mutationEventsAdded_ = false;
        /**
         * Keeps reference to the instance of MutationObserver.
         *
         * @private {MutationObserver}
         */
        this.mutationsObserver_ = null;
        /**
         * A list of connected observers.
         *
         * @private {Array<ResizeObserverSPI>}
         */
        this.observers_ = [];
        this.onTransitionEnd_ = this.onTransitionEnd_.bind(this);
        this.refresh = throttle(this.refresh.bind(this), REFRESH_DELAY);
    }
    /**
     * Adds observer to observers list.
     *
     * @param {ResizeObserverSPI} observer - Observer to be added.
     * @returns {void}
     */
    ResizeObserverController.prototype.addObserver = function (observer) {
        if (!~this.observers_.indexOf(observer)) {
            this.observers_.push(observer);
        }
        // Add listeners if they haven't been added yet.
        if (!this.connected_) {
            this.connect_();
        }
    };
    /**
     * Removes observer from observers list.
     *
     * @param {ResizeObserverSPI} observer - Observer to be removed.
     * @returns {void}
     */
    ResizeObserverController.prototype.removeObserver = function (observer) {
        var observers = this.observers_;
        var index = observers.indexOf(observer);
        // Remove observer if it's present in registry.
        if (~index) {
            observers.splice(index, 1);
        }
        // Remove listeners if controller has no connected observers.
        if (!observers.length && this.connected_) {
            this.disconnect_();
        }
    };
    /**
     * Invokes the update of observers. It will continue running updates insofar
     * it detects changes.
     *
     * @returns {void}
     */
    ResizeObserverController.prototype.refresh = function () {
        var changesDetected = this.updateObservers_();
        // Continue running updates if changes have been detected as there might
        // be future ones caused by CSS transitions.
        if (changesDetected) {
            this.refresh();
        }
    };
    /**
     * Updates every observer from observers list and notifies them of queued
     * entries.
     *
     * @private
     * @returns {boolean} Returns "true" if any observer has detected changes in
     *      dimensions of it's elements.
     */
    ResizeObserverController.prototype.updateObservers_ = function () {
        // Collect observers that have active observations.
        var activeObservers = this.observers_.filter(function (observer) {
            return observer.gatherActive(), observer.hasActive();
        });
        // Deliver notifications in a separate cycle in order to avoid any
        // collisions between observers, e.g. when multiple instances of
        // ResizeObserver are tracking the same element and the callback of one
        // of them changes content dimensions of the observed target. Sometimes
        // this may result in notifications being blocked for the rest of observers.
        activeObservers.forEach(function (observer) { return observer.broadcastActive(); });
        return activeObservers.length > 0;
    };
    /**
     * Initializes DOM listeners.
     *
     * @private
     * @returns {void}
     */
    ResizeObserverController.prototype.connect_ = function () {
        // Do nothing if running in a non-browser environment or if listeners
        // have been already added.
        if (!isBrowser || this.connected_) {
            return;
        }
        // Subscription to the "Transitionend" event is used as a workaround for
        // delayed transitions. This way it's possible to capture at least the
        // final state of an element.
        document.addEventListener('transitionend', this.onTransitionEnd_);
        window.addEventListener('resize', this.refresh);
        if (mutationObserverSupported) {
            this.mutationsObserver_ = new MutationObserver(this.refresh);
            this.mutationsObserver_.observe(document, {
                attributes: true,
                childList: true,
                characterData: true,
                subtree: true
            });
        }
        else {
            document.addEventListener('DOMSubtreeModified', this.refresh);
            this.mutationEventsAdded_ = true;
        }
        this.connected_ = true;
    };
    /**
     * Removes DOM listeners.
     *
     * @private
     * @returns {void}
     */
    ResizeObserverController.prototype.disconnect_ = function () {
        // Do nothing if running in a non-browser environment or if listeners
        // have been already removed.
        if (!isBrowser || !this.connected_) {
            return;
        }
        document.removeEventListener('transitionend', this.onTransitionEnd_);
        window.removeEventListener('resize', this.refresh);
        if (this.mutationsObserver_) {
            this.mutationsObserver_.disconnect();
        }
        if (this.mutationEventsAdded_) {
            document.removeEventListener('DOMSubtreeModified', this.refresh);
        }
        this.mutationsObserver_ = null;
        this.mutationEventsAdded_ = false;
        this.connected_ = false;
    };
    /**
     * "Transitionend" event handler.
     *
     * @private
     * @param {TransitionEvent} event
     * @returns {void}
     */
    ResizeObserverController.prototype.onTransitionEnd_ = function (_a) {
        var _b = _a.propertyName, propertyName = _b === void 0 ? '' : _b;
        // Detect whether transition may affect dimensions of an element.
        var isReflowProperty = transitionKeys.some(function (key) {
            return !!~propertyName.indexOf(key);
        });
        if (isReflowProperty) {
            this.refresh();
        }
    };
    /**
     * Returns instance of the ResizeObserverController.
     *
     * @returns {ResizeObserverController}
     */
    ResizeObserverController.getInstance = function () {
        if (!this.instance_) {
            this.instance_ = new ResizeObserverController();
        }
        return this.instance_;
    };
    /**
     * Holds reference to the controller's instance.
     *
     * @private {ResizeObserverController}
     */
    ResizeObserverController.instance_ = null;
    return ResizeObserverController;
}());

/**
 * Defines non-writable/enumerable properties of the provided target object.
 *
 * @param {Object} target - Object for which to define properties.
 * @param {Object} props - Properties to be defined.
 * @returns {Object} Target object.
 */
var defineConfigurable = (function (target, props) {
    for (var _i = 0, _a = Object.keys(props); _i < _a.length; _i++) {
        var key = _a[_i];
        Object.defineProperty(target, key, {
            value: props[key],
            enumerable: false,
            writable: false,
            configurable: true
        });
    }
    return target;
});

/**
 * Returns the global object associated with provided element.
 *
 * @param {Object} target
 * @returns {Object}
 */
var getWindowOf = (function (target) {
    // Assume that the element is an instance of Node, which means that it
    // has the "ownerDocument" property from which we can retrieve a
    // corresponding global object.
    var ownerGlobal = target && target.ownerDocument && target.ownerDocument.defaultView;
    // Return the local global object if it's not possible extract one from
    // provided element.
    return ownerGlobal || global$1;
});

// Placeholder of an empty content rectangle.
var emptyRect = createRectInit(0, 0, 0, 0);
/**
 * Converts provided string to a number.
 *
 * @param {number|string} value
 * @returns {number}
 */
function toFloat(value) {
    return parseFloat(value) || 0;
}
/**
 * Extracts borders size from provided styles.
 *
 * @param {CSSStyleDeclaration} styles
 * @param {...string} positions - Borders positions (top, right, ...)
 * @returns {number}
 */
function getBordersSize(styles) {
    var positions = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        positions[_i - 1] = arguments[_i];
    }
    return positions.reduce(function (size, position) {
        var value = styles['border-' + position + '-width'];
        return size + toFloat(value);
    }, 0);
}
/**
 * Extracts paddings sizes from provided styles.
 *
 * @param {CSSStyleDeclaration} styles
 * @returns {Object} Paddings box.
 */
function getPaddings(styles) {
    var positions = ['top', 'right', 'bottom', 'left'];
    var paddings = {};
    for (var _i = 0, positions_1 = positions; _i < positions_1.length; _i++) {
        var position = positions_1[_i];
        var value = styles['padding-' + position];
        paddings[position] = toFloat(value);
    }
    return paddings;
}
/**
 * Calculates content rectangle of provided SVG element.
 *
 * @param {SVGGraphicsElement} target - Element content rectangle of which needs
 *      to be calculated.
 * @returns {DOMRectInit}
 */
function getSVGContentRect(target) {
    var bbox = target.getBBox();
    return createRectInit(0, 0, bbox.width, bbox.height);
}
/**
 * Calculates content rectangle of provided HTMLElement.
 *
 * @param {HTMLElement} target - Element for which to calculate the content rectangle.
 * @returns {DOMRectInit}
 */
function getHTMLElementContentRect(target) {
    // Client width & height properties can't be
    // used exclusively as they provide rounded values.
    var clientWidth = target.clientWidth, clientHeight = target.clientHeight;
    // By this condition we can catch all non-replaced inline, hidden and
    // detached elements. Though elements with width & height properties less
    // than 0.5 will be discarded as well.
    //
    // Without it we would need to implement separate methods for each of
    // those cases and it's not possible to perform a precise and performance
    // effective test for hidden elements. E.g. even jQuery's ':visible' filter
    // gives wrong results for elements with width & height less than 0.5.
    if (!clientWidth && !clientHeight) {
        return emptyRect;
    }
    var styles = getWindowOf(target).getComputedStyle(target);
    var paddings = getPaddings(styles);
    var horizPad = paddings.left + paddings.right;
    var vertPad = paddings.top + paddings.bottom;
    // Computed styles of width & height are being used because they are the
    // only dimensions available to JS that contain non-rounded values. It could
    // be possible to utilize the getBoundingClientRect if only it's data wasn't
    // affected by CSS transformations let alone paddings, borders and scroll bars.
    var width = toFloat(styles.width), height = toFloat(styles.height);
    // Width & height include paddings and borders when the 'border-box' box
    // model is applied (except for IE).
    if (styles.boxSizing === 'border-box') {
        // Following conditions are required to handle Internet Explorer which
        // doesn't include paddings and borders to computed CSS dimensions.
        //
        // We can say that if CSS dimensions + paddings are equal to the "client"
        // properties then it's either IE, and thus we don't need to subtract
        // anything, or an element merely doesn't have paddings/borders styles.
        if (Math.round(width + horizPad) !== clientWidth) {
            width -= getBordersSize(styles, 'left', 'right') + horizPad;
        }
        if (Math.round(height + vertPad) !== clientHeight) {
            height -= getBordersSize(styles, 'top', 'bottom') + vertPad;
        }
    }
    // Following steps can't be applied to the document's root element as its
    // client[Width/Height] properties represent viewport area of the window.
    // Besides, it's as well not necessary as the <html> itself neither has
    // rendered scroll bars nor it can be clipped.
    if (!isDocumentElement(target)) {
        // In some browsers (only in Firefox, actually) CSS width & height
        // include scroll bars size which can be removed at this step as scroll
        // bars are the only difference between rounded dimensions + paddings
        // and "client" properties, though that is not always true in Chrome.
        var vertScrollbar = Math.round(width + horizPad) - clientWidth;
        var horizScrollbar = Math.round(height + vertPad) - clientHeight;
        // Chrome has a rather weird rounding of "client" properties.
        // E.g. for an element with content width of 314.2px it sometimes gives
        // the client width of 315px and for the width of 314.7px it may give
        // 314px. And it doesn't happen all the time. So just ignore this delta
        // as a non-relevant.
        if (Math.abs(vertScrollbar) !== 1) {
            width -= vertScrollbar;
        }
        if (Math.abs(horizScrollbar) !== 1) {
            height -= horizScrollbar;
        }
    }
    return createRectInit(paddings.left, paddings.top, width, height);
}
/**
 * Checks whether provided element is an instance of the SVGGraphicsElement.
 *
 * @param {Element} target - Element to be checked.
 * @returns {boolean}
 */
var isSVGGraphicsElement = (function () {
    // Some browsers, namely IE and Edge, don't have the SVGGraphicsElement
    // interface.
    if (typeof SVGGraphicsElement !== 'undefined') {
        return function (target) { return target instanceof getWindowOf(target).SVGGraphicsElement; };
    }
    // If it's so, then check that element is at least an instance of the
    // SVGElement and that it has the "getBBox" method.
    // eslint-disable-next-line no-extra-parens
    return function (target) { return (target instanceof getWindowOf(target).SVGElement &&
        typeof target.getBBox === 'function'); };
})();
/**
 * Checks whether provided element is a document element (<html>).
 *
 * @param {Element} target - Element to be checked.
 * @returns {boolean}
 */
function isDocumentElement(target) {
    return target === getWindowOf(target).document.documentElement;
}
/**
 * Calculates an appropriate content rectangle for provided html or svg element.
 *
 * @param {Element} target - Element content rectangle of which needs to be calculated.
 * @returns {DOMRectInit}
 */
function getContentRect(target) {
    if (!isBrowser) {
        return emptyRect;
    }
    if (isSVGGraphicsElement(target)) {
        return getSVGContentRect(target);
    }
    return getHTMLElementContentRect(target);
}
/**
 * Creates rectangle with an interface of the DOMRectReadOnly.
 * Spec: https://drafts.fxtf.org/geometry/#domrectreadonly
 *
 * @param {DOMRectInit} rectInit - Object with rectangle's x/y coordinates and dimensions.
 * @returns {DOMRectReadOnly}
 */
function createReadOnlyRect(_a) {
    var x = _a.x, y = _a.y, width = _a.width, height = _a.height;
    // If DOMRectReadOnly is available use it as a prototype for the rectangle.
    var Constr = typeof DOMRectReadOnly !== 'undefined' ? DOMRectReadOnly : Object;
    var rect = Object.create(Constr.prototype);
    // Rectangle's properties are not writable and non-enumerable.
    defineConfigurable(rect, {
        x: x, y: y, width: width, height: height,
        top: y,
        right: x + width,
        bottom: height + y,
        left: x
    });
    return rect;
}
/**
 * Creates DOMRectInit object based on the provided dimensions and the x/y coordinates.
 * Spec: https://drafts.fxtf.org/geometry/#dictdef-domrectinit
 *
 * @param {number} x - X coordinate.
 * @param {number} y - Y coordinate.
 * @param {number} width - Rectangle's width.
 * @param {number} height - Rectangle's height.
 * @returns {DOMRectInit}
 */
function createRectInit(x, y, width, height) {
    return { x: x, y: y, width: width, height: height };
}

/**
 * Class that is responsible for computations of the content rectangle of
 * provided DOM element and for keeping track of it's changes.
 */
var ResizeObservation = /** @class */ (function () {
    /**
     * Creates an instance of ResizeObservation.
     *
     * @param {Element} target - Element to be observed.
     */
    function ResizeObservation(target) {
        /**
         * Broadcasted width of content rectangle.
         *
         * @type {number}
         */
        this.broadcastWidth = 0;
        /**
         * Broadcasted height of content rectangle.
         *
         * @type {number}
         */
        this.broadcastHeight = 0;
        /**
         * Reference to the last observed content rectangle.
         *
         * @private {DOMRectInit}
         */
        this.contentRect_ = createRectInit(0, 0, 0, 0);
        this.target = target;
    }
    /**
     * Updates content rectangle and tells whether it's width or height properties
     * have changed since the last broadcast.
     *
     * @returns {boolean}
     */
    ResizeObservation.prototype.isActive = function () {
        var rect = getContentRect(this.target);
        this.contentRect_ = rect;
        return (rect.width !== this.broadcastWidth ||
            rect.height !== this.broadcastHeight);
    };
    /**
     * Updates 'broadcastWidth' and 'broadcastHeight' properties with a data
     * from the corresponding properties of the last observed content rectangle.
     *
     * @returns {DOMRectInit} Last observed content rectangle.
     */
    ResizeObservation.prototype.broadcastRect = function () {
        var rect = this.contentRect_;
        this.broadcastWidth = rect.width;
        this.broadcastHeight = rect.height;
        return rect;
    };
    return ResizeObservation;
}());

var ResizeObserverEntry = /** @class */ (function () {
    /**
     * Creates an instance of ResizeObserverEntry.
     *
     * @param {Element} target - Element that is being observed.
     * @param {DOMRectInit} rectInit - Data of the element's content rectangle.
     */
    function ResizeObserverEntry(target, rectInit) {
        var contentRect = createReadOnlyRect(rectInit);
        // According to the specification following properties are not writable
        // and are also not enumerable in the native implementation.
        //
        // Property accessors are not being used as they'd require to define a
        // private WeakMap storage which may cause memory leaks in browsers that
        // don't support this type of collections.
        defineConfigurable(this, { target: target, contentRect: contentRect });
    }
    return ResizeObserverEntry;
}());

var ResizeObserverSPI = /** @class */ (function () {
    /**
     * Creates a new instance of ResizeObserver.
     *
     * @param {ResizeObserverCallback} callback - Callback function that is invoked
     *      when one of the observed elements changes it's content dimensions.
     * @param {ResizeObserverController} controller - Controller instance which
     *      is responsible for the updates of observer.
     * @param {ResizeObserver} callbackCtx - Reference to the public
     *      ResizeObserver instance which will be passed to callback function.
     */
    function ResizeObserverSPI(callback, controller, callbackCtx) {
        /**
         * Collection of resize observations that have detected changes in dimensions
         * of elements.
         *
         * @private {Array<ResizeObservation>}
         */
        this.activeObservations_ = [];
        /**
         * Registry of the ResizeObservation instances.
         *
         * @private {Map<Element, ResizeObservation>}
         */
        this.observations_ = new MapShim();
        if (typeof callback !== 'function') {
            throw new TypeError('The callback provided as parameter 1 is not a function.');
        }
        this.callback_ = callback;
        this.controller_ = controller;
        this.callbackCtx_ = callbackCtx;
    }
    /**
     * Starts observing provided element.
     *
     * @param {Element} target - Element to be observed.
     * @returns {void}
     */
    ResizeObserverSPI.prototype.observe = function (target) {
        if (!arguments.length) {
            throw new TypeError('1 argument required, but only 0 present.');
        }
        // Do nothing if current environment doesn't have the Element interface.
        if (typeof Element === 'undefined' || !(Element instanceof Object)) {
            return;
        }
        if (!(target instanceof getWindowOf(target).Element)) {
            throw new TypeError('parameter 1 is not of type "Element".');
        }
        var observations = this.observations_;
        // Do nothing if element is already being observed.
        if (observations.has(target)) {
            return;
        }
        observations.set(target, new ResizeObservation(target));
        this.controller_.addObserver(this);
        // Force the update of observations.
        this.controller_.refresh();
    };
    /**
     * Stops observing provided element.
     *
     * @param {Element} target - Element to stop observing.
     * @returns {void}
     */
    ResizeObserverSPI.prototype.unobserve = function (target) {
        if (!arguments.length) {
            throw new TypeError('1 argument required, but only 0 present.');
        }
        // Do nothing if current environment doesn't have the Element interface.
        if (typeof Element === 'undefined' || !(Element instanceof Object)) {
            return;
        }
        if (!(target instanceof getWindowOf(target).Element)) {
            throw new TypeError('parameter 1 is not of type "Element".');
        }
        var observations = this.observations_;
        // Do nothing if element is not being observed.
        if (!observations.has(target)) {
            return;
        }
        observations.delete(target);
        if (!observations.size) {
            this.controller_.removeObserver(this);
        }
    };
    /**
     * Stops observing all elements.
     *
     * @returns {void}
     */
    ResizeObserverSPI.prototype.disconnect = function () {
        this.clearActive();
        this.observations_.clear();
        this.controller_.removeObserver(this);
    };
    /**
     * Collects observation instances the associated element of which has changed
     * it's content rectangle.
     *
     * @returns {void}
     */
    ResizeObserverSPI.prototype.gatherActive = function () {
        var _this = this;
        this.clearActive();
        this.observations_.forEach(function (observation) {
            if (observation.isActive()) {
                _this.activeObservations_.push(observation);
            }
        });
    };
    /**
     * Invokes initial callback function with a list of ResizeObserverEntry
     * instances collected from active resize observations.
     *
     * @returns {void}
     */
    ResizeObserverSPI.prototype.broadcastActive = function () {
        // Do nothing if observer doesn't have active observations.
        if (!this.hasActive()) {
            return;
        }
        var ctx = this.callbackCtx_;
        // Create ResizeObserverEntry instance for every active observation.
        var entries = this.activeObservations_.map(function (observation) {
            return new ResizeObserverEntry(observation.target, observation.broadcastRect());
        });
        this.callback_.call(ctx, entries, ctx);
        this.clearActive();
    };
    /**
     * Clears the collection of active observations.
     *
     * @returns {void}
     */
    ResizeObserverSPI.prototype.clearActive = function () {
        this.activeObservations_.splice(0);
    };
    /**
     * Tells whether observer has active observations.
     *
     * @returns {boolean}
     */
    ResizeObserverSPI.prototype.hasActive = function () {
        return this.activeObservations_.length > 0;
    };
    return ResizeObserverSPI;
}());

// Registry of internal observers. If WeakMap is not available use current shim
// for the Map collection as it has all required methods and because WeakMap
// can't be fully polyfilled anyway.
var observers = typeof WeakMap !== 'undefined' ? new WeakMap() : new MapShim();
/**
 * ResizeObserver API. Encapsulates the ResizeObserver SPI implementation
 * exposing only those methods and properties that are defined in the spec.
 */
var ResizeObserver = /** @class */ (function () {
    /**
     * Creates a new instance of ResizeObserver.
     *
     * @param {ResizeObserverCallback} callback - Callback that is invoked when
     *      dimensions of the observed elements change.
     */
    function ResizeObserver(callback) {
        if (!(this instanceof ResizeObserver)) {
            throw new TypeError('Cannot call a class as a function.');
        }
        if (!arguments.length) {
            throw new TypeError('1 argument required, but only 0 present.');
        }
        var controller = ResizeObserverController.getInstance();
        var observer = new ResizeObserverSPI(callback, controller, this);
        observers.set(this, observer);
    }
    return ResizeObserver;
}());
// Expose public methods of ResizeObserver.
[
    'observe',
    'unobserve',
    'disconnect'
].forEach(function (method) {
    ResizeObserver.prototype[method] = function () {
        var _a;
        return (_a = observers.get(this))[method].apply(_a, arguments);
    };
});

var index = (function () {
    // Export existing implementation if available.
    if (typeof global$1.ResizeObserver !== 'undefined') {
        return global$1.ResizeObserver;
    }
    return ResizeObserver;
})();

// Initializes Rect: creates DOM, adds layout, nodes, chans and style
// triggers. Runs inside 'document.body'.
const run = rectT =>
    addStyle(addChans(addNodes(runRect(rectT))));

// Similar to run but runs inside any DOM element
const runDOM = (rectT, dom) =>
    addStyle(addChans(addNodes(runRectDOM(rectT, dom))));

const getDeviceSize = () => [
    document.documentElement.clientWidth,
    document.documentElement.clientHeight
];

// Initialize Rect: creates DOM, adds only core layout triggers only.
// If one wants to use Rect but not use default nodes, chans, style,
// use this function instead of 'run'. Runs inside document.body.
const runRect = rectT => {
    const sizAbs = node(getDeviceSize());
    const parent = {
        layout: {
            posAbs: node([0, 0]),
            sizAbs: sizAbs,
            max: node([100, 100])
        },
        inst: {
            dom: document.body
        }
    };

    window.onresize = () => {
        sizAbs.val = getDeviceSize();
    };
    // Flattens tree so that Trees of Trees of ... Trees of Rects
    // become just Trees of Rects
    return runInside(flatten(rectT), parent);
};

// Similar to runRect, but runs inside any DOM element. Uses
// 'ResizeObserver' to check for size changes in the DOM.
const runRectDOM = (rectT, dom) => {
    const sizAbs = node([dom.offsetWidth, dom.offsetHeight]);
    const parent = {
        layout: {
            posAbs: node([0, 0]),
            sizAbs: sizAbs,
            max: node([100, 100])
        },
        inst: {
            dom: dom
        }
    };

    addDabrCss(dom);

    new index(entries => {
        const entry = entries[0];
        const { width, height } = entry.contentRect;
        sizAbs.val = [width, height];
    }).observe(dom);
    // Flattens tree so that Trees of Trees of ... Trees of Rects
    // become just Trees of Rects
    return runInside(flatten(rectT), parent);
};

// Main run function
const runInside = (rectT, parent) => {
    const rect = rectT.val;

    addGlobalCSSOnce();
    const elem = document.createElement('div');
    addDabrCss(elem);
    parent.inst.dom.appendChild(elem);

    rect.inst = {
        dom: elem,
        par: parent
    };

    const lay = rect.layout;
    // Binds rect parameters to actual CSS properties
    addLayoutTriggers(lay, elem, rect, parent.layout);
    // Adds (default) resize reactivity to the rect
    defaultLayoutReactivity(
        lay.pos,
        lay.siz,
        parent.layout.max,
        parent.layout.posAbs,
        parent.layout.sizAbs,
        lay.posAbs,
        lay.sizAbs
    );
    // Trigger events for oldVersions as well. This way functions
    // working with olderVersions of rects (before preserveR's) get
    // the correct value of inst as well
    rect.oldVersions.forEach(oldVersion => {
        oldVersion.inst = rect.inst;
        oldVersion.init.put = true;
        oldVersion.created.val = true;
    });
    rect.init.put = true;
    rect.created.val = true;
    // Adds trigger for children creation/removal (remember children
    // are actually nodes, so they can be changed dynamically)
    addChildrenTrigger(rectT.children, rect);

    return rectT;
};

// If a child is dynamically removed/added from the children node's
// array its DOM element is removed/created.
const addChildrenTrigger = (children, parent) => {
    const t = tran([children], () => {
        let neu = children.val;
        let alt = children.old;

        if (!alt) alt = [];
        if (!neu) neu = [];

        const removed = alt.filter(x => !neu.includes(x));
        const created = neu.filter(x => !alt.includes(x));

        created.forEach(x => runInside(x, parent));
        removed.forEach(x => removeRect(x));
    });
    parent.renderTrans.add(t);
};

// Removes a rect, meaning its DOM is destroyed and events and node
// transitions do not work anymore
const removeRect = rectT => {
    const rect = rectT.val;
    const dom = rect.inst.dom;
    // GC removes eventListeners automatically when DOM is removed
    dom.parentNode.removeChild(dom);
    // Transitions related to DOM rendering are removed although GC
    // might be able to do it automatically
    rect.renderTrans.forEach(tran => {
        removeTran(tran);
    });
    rect.inst = null;
    rect.stop.put = true;
    rect.removed.val = true;
    rect.created.val = false;
    // recursively removes all children
    rectT.children.val = rectT.children.val.map(removeRect);
    return rectT;
};

// Some needed global CSS, only put once if not put already
const addGlobalCSSOnce = () => {
    // Only adds CSS once by checking ID of style tag
    const res = document.getElementById('dabr-style');
    if (!res) {
        const css =
            '.dabr::-webkit-scrollbar {' +
            'width: 0 !important;' +
            'height: 0 !important;' +
            '}' +
            '.dabr {' +
            'overflow: -moz-scrollbars-none;' +
            'scrollbar-width: none;' +
            '-ms-overflow-style: none;' +
            '}';
        const style = document.createElement('style');
        style.setAttribute('id', 'dabr-style');
        style.textContent = css;
        document.head.append(style);
    }
};

// Default CSS for DABR DOM elements
const addDabrCss = elem => {
    elem.className = 'dabr';
    elem.style['position'] = 'absolute';
    elem.style['overflow-y'] = 'scroll';
    elem.style['overflow-x'] = 'scroll';
};

const border = b => rect => {
    const innerPos = node();
    const innerSiz = node();
    const color = mapN([b], ({ color }) => color);
    const width = mapN([b], ({ width }) => width);
    tran([width], () => {
        const w = width.val;
        innerPos.val = rel([0, 0], [w, w]);
        innerSiz.val = rel([100, 100], [-2 * w, -2 * w]);
    });
    return Tree(
        Supp({
            layout: {
                pos: rect.layout.pos,
                siz: rect.layout.siz
            },
            data: keyed(border, {
                node: b,
                outter: true,
                inner: false
            }),
            style: {
                color: color
            }
        }),
        [
            Tree(
                preserveR(rect, {
                    layout: {
                        pos: innerPos,
                        siz: innerSiz
                    },
                    data: keyed(border, {
                        node: b,
                        inner: true,
                        outter: false
                    })
                }),
                Entry
            )
        ]
    );
};

const container = show => rect =>
    Tree(
        Dummy({
            data: keyed(container, show),
            style: {
                show
            }
        }),
        [Tree(rect, Entry)]
    );

const proportional = prop => rect => {
    const innerPos = node();
    const innerSiz = node();
    const data = keyed(proportional, {
        node: prop,
        outter: true,
        inner: false
    });
    const propRect = preserveR(rect, {
        layout: {
            pos: innerPos,
            siz: innerSiz
        },
        data
    });
    listenOnce([propRect.init], () => {
        const par = propRect.inst.par;
        const sizAbs = par.layout.sizAbs;
        tran([prop, sizAbs], () => {
            const [offset, newSize] = calcProportional(
                prop.val,
                sizAbs.val
            );
            innerPos.val = px(offset);
            innerSiz.val = px(newSize);
        });
    });
    return SuppT(
        {
            layout: {
                pos: rect.layout.pos,
                siz: rect.layout.siz
            },
            data
        },
        Tree(propRect, Entry)
    );
};

const calcProportional = (prop, siz) => {
    let w = siz[0];
    let h = siz[1];
    let s = [0, 0];
    let offset = [0, 0];
    let p = prop[0] / prop[1];

    if (prop[0] > prop[1]) {
        s[0] = w;
        s[1] = s[0] / p;

        if (s[1] > h) {
            s[1] = h;
            s[0] = s[1] * p;
            offset[1] = 0;
            offset[0] = (w - s[0]) / 2;
        } else {
            offset[0] = 0;
            offset[1] = (h - s[1]) / 2;
        }
    } else {
        w = siz[0];
        h = siz[1];
        s[1] = h;
        s[0] = s[1] * p;

        if (s[0] > w) {
            s[0] = w;
            s[1] = s[0] / p;
            offset[0] = 0;
            offset[1] = (h - s[1]) / 2;
        } else {
            offset[1] = 0;
            offset[0] = (w - s[0]) / 2;
        }
    }

    return [offset, s];
};

const switcher = (route, routeRectMap) => {
    const children = node();
    const routeMap = mapValuesObj(routeRectMap, val => {
        const destroy = val.destroy ? val.destroy : false;
        const show = node(false);
        const rectT = top(container(show))(val.content || val);
        return {
            show,
            rectT,
            destroy
        };
    });
    tran([route], () => {
        const newRoute = route.val;
        children.val = iterate(routeMap, ([rou, val]) => {
            const { show, rectT, destroy } = val;
            if (rou == newRoute) {
                show.val = true;
                return rectT;
            } else if (destroy) {
                return null;
            } else {
                show.val = false;
                return rectT;
            }
        }).filter(isNotNull);
    });
    return children;
};

// Time functions for animation control from 0 to 1
const LINEAR = t => t;
const QUADRATIC = t => t * t;
const EXPONENTIAL = a => t => Math.pow(t, a);
const FLIP = F => t => 1 - F(t);

// Change the value of a node gradually through time 'delta' is the
// rate of change in milliseconds. Returns a handle to the setTimeout.
// Timed works for any object/array with numbers inside. The idea is
// to get the difference (diff) between current and final values and
// if the difference is an object/array with only numbers, transform
// the difference into a vector (toNumbers) that will be incremented
// through time. Each step the difference vector will be added to the
// initial vector and the result will be transformed back to object
// (fromNumbers and unDiff)
const timed = (
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
const stopTimed = ({ handle, node }) => {
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
            return null;
        }
    }
};

const scrollbar = (scroll, max_) => {
    const pos = node([0, 0]);

    tran([scroll], () => {
        const h = scroll.val[1];
        pos.val = [0, (h * 95) / 100];
    });

    const click = chan();
    const sizAbs_ = node();

    listen([click], () => {
        if (sizAbs_) {
            const sizAbs = sizAbs_.val;
            const val = click.get;
            const x = val.offsetX;
            const y = val.offsetY;
            scroll.val = [
                (x / sizAbs[0]) * 100,
                (y / sizAbs[1]) * 100
            ];
        }
    });

    const a = node();

    const r = RectT(
        {
            layout: {
                pos: rel([100, 0], [-10, 0]),
                siz: a,
                sizAbs: sizAbs_
            },
            style: {
                //color: 'gray'
            },
            events: {
                click
            }
        },
        RectT({
            layout: {
                pos: pos,
                siz: [100, 5]
            },
            style: {
                color: 'blue'
            }
        })
    );

    tran([max_], () => {
        const max = max_.val;
        a.val = rel([0, (100 / 100) * max[1]], [10, 0]);
    });

    /*listenOnce(r.init, () => {
        const max_ = r.inst.par.layout.max;
        tran(max_, () => {
            const max = max_.val;
            a.val = rel([0, (100 / 100) * max[1]], [10, 0]);
        });
    });*/

    return r;
};

const hashNode = () => {
    const hn = node(location.hash.slice(1));

    window.addEventListener(
        'hashchange',
        () => {
            if ('#' + hn.val != location.hash) {
                hn.val = location.hash.slice(1);
            }
        },
        false
    );

    tran([hn], () => {
        location.hash = hn.val;
    });

    return hn;
};

window.c = hashNode();

//const keypressChannel = chan();

const text = textNode => rect => {
    listenOnce([rect.init], () => {
        mapN(
            [textNode],
            ({
                color = 'black',
                size = '16px',
                family,
                align,
                content
            }) => {
                const elem = rect.inst.dom;
                elem.style['color'] = color;
                elem.style['font-size'] = size;
                elem.style
                ['text-align'] = 'center';
                elem.style['width'] = 'max-content';
                if (align) elem.style['text-align'] = align;
                if (family) elem.style['font-family'] = family;
                elem.innerText = content;
            }
        );
    });
    return rect;
};

// Kinda smooth the number to 3 decimal places (and add a -0.02 just
// to make sure a text is never ever bigger than the rectangle size)
const smooth = num =>
    Math.round((num + Number.EPSILON) * 1000) / 1000;

const getSizeOf16pxText = ({
    color = 'black',
    family,
    align,
    content
}) => {
    // This tran is probably heavy but changing text should
    // not be super common. Create dummy DOM element and
    // append it to body to get the proportion of the text
    const elem = document.createElement('div');
    // Appropriate CSS for a hidden rect with 1 line of text
    elem.style['visibility'] = 'hidden';
    elem.style['width'] = 'max-content';
    elem.style['font-size'] = '16px';
    if (family) elem.style['font-family'] = family;
    elem.innerText = content;
    document.body.appendChild(elem);
    const w = elem.offsetWidth;
    const h = elem.offsetHeight;
    // destroy the DOM element
    elem.remove();
    return [w, h];
};

const linesTemplate = justify => textNs => rect => {
    const prop = node();
    const sizes = [];
    textNs.forEach((_, i) => {
        sizes[i] = node();
    });
    tran(textNs, () => {
        const sizs = textNs.map(tn => getSizeOf16pxText(tn.val));
        sizs.forEach((siz, i) => {
            sizes[i].val = siz;
        });
        const sizsX = sizs.map(([x, _]) => x);
        const sizsY = sizs.map(([_, y]) => y);
        const w = sizsX.reduce((sx, sy) => Math.max(sx, sy));
        const h = sizsY.reduce((sx, sy) => sx + sy);
        prop.val = [w, h];
    });
    const fontSize = node();
    const n = textNs.length;
    const children = textNs.map((textN, i) => {
        const fullTextN = nodeT([textN, fontSize], () => ({
            ...textN.val,
            ...{ size: fontSize.val }
        }));
        const stepSiz = (i / n) * 100;
        const siz = mapN([sizes[i], prop], ([w, h], [pw, ph]) => [
            (w / pw) * 100,
            (1 / n) * 100
        ]);
        const post = justify(siz, stepSiz);
        const r = Supp({
            layout: {
                pos: [0, stepSiz],
                siz
            }
        });
        return Tree(text(fullTextN)(r));
    });
    const chSizs = children.map(ch => ch.val.layout.sizAbs);
    safeTran(chSizs.concat([prop]), () => {
        const currentSizeX = chSizs
            .map(x => x.val[0])
            .reduce((x, y) => Math.max(x, y));
        const size16pxX = prop.val[0];
        const newSize = smooth((currentSizeX / size16pxX) * 16);
        fontSize.val = newSize + 'px';
    });
    const res = Tree(proportional(prop)(rect), children);
    return res;
};

const linesL = linesTemplate((siz, step) => [0, step]);
const linesR = linesTemplate((siz, step) =>
    mapN([siz], ([sx, sy]) => [100 - sx, step])
);
const linesC = linesTemplate((siz, step) =>
    mapN([siz], ([sx, sy]) => [(100 - sx) / 2, step])
);
const line = textNode => linesL([textNode]);

// export const textArea = textNode => rect => {
//     const area16 = mapN([textNode], () => {
//         const [w, h] = getSizeOf16pxText(textNode.val);
//         return w * h;
//     });
//     const fontSize = node();
//     const fullTextN = nodeT([textNode, fontSize], () => ({
//         ...textNode.val,
//         ...{ size: fontSize.val }
//     }));
//     tran([rect.layout.sizAbs, area16], () => {
//         const [w, h] = rect.layout.sizAbs.val;
//         const areaNow = w * h;
//         const newSize = smooth((areaNow / area16.val) * 16);
//         console.log(
//             'new size!',
//             area16.val,
//             [w, h],
//             areaNow / area16.val,
//             newSize
//         );
//         fontSize.val = newSize + 'px';
//     });
//     return text(fullTextN)(rect);
// };

export { Dummy, EXPONENTIAL, Entry, FLIP, LINEAR, QUADRATIC, Rect, RectT, Supp, SuppT, T, Tree, addChans, addNodes, addStyle, applyF, border, chan, chanL, cond, condElse, container, core, filterC, flatten, getFirst, hashNode, keyed, line, linesC, linesL, linesR, linesTemplate, listen, listenOnce, mapC, mapN, mapT, node, nodeT, preserveR, proportional, px, rel, removeListen, removeRect, removeTran, run, runDOM, runRect, runRectDOM, safeMapN, safeNodeT, safeTran, scrollbar, stopTimed, supp, switcher, text, timed, toNode, top, tran, tree, treePath, walkT };
