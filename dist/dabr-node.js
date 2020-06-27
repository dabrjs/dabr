// Type checking functions

const isArray = x =>
    !!x && x.constructor && x.constructor.name == 'Array';

const isNotNull = x => (x == 0 && !isArray(x)) || !!x;

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

const set = (target, prop, value, receiver) => {
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

// Same thing as tran but every transition has a ref attribute in a
// way thaat only 1 transition with the same 'ref' object can be
// inside a node. When tranRef is used in  node with a transition with
// the same ref, the old transition is replaced by the new one. This
// is useful sometimes
const tranRef = (ref, nodes, func) => {
    if (nodes.length > 0) {
        const transition = { nodes, func, ref };
        // Many transitions with the same tag is not allowed. Tags are
        // used as an indentity for dynamically created transitions.
        nodes.forEach(nd => {
            const targ = nd.target;
            const ts = targ.trans;
            if (!ts.has(transition)) {
                const res = [...ts].find(t => t.ref == ref);
                if (res) {
                    removeTran(res);
                    ts.add(transition);
                } else {
                    ts.add(transition);
                }
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

// If a node carries object information, the subNode function creates
// a 1-way sub-node, that changes when the original node's attribute
// changes. It is 1-way because changing the sub-node does not change
// the parent node.
const subNode = (nd, attr) => mapN([nd], x => x[attr]);

// Like 'subNode' but with 2-way changes. Changing the sub-node
// changes the parent node as well
const subNode2 = (nd, attr) => {
    const aux = mapN([nd], x => x[attr]);
    tran([aux], () => {
        const val = nd.val;
        val[attr] = aux.val;
        nd.val = val;
    });
    return aux;
};

export { mapN, node, nodeT, removeTran, safeMapN, safeNodeT, safeTran, subNode, subNode2, toNode, tran, tranRef };
