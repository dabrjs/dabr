// Type checking functions

const isArray = x =>
    !!x && x.constructor && x.constructor.name == 'Array';

const isNotNull = x => (x == 0 && !isArray(x)) || !!x;

const isFunction = x => !!x && typeof x == 'function';

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

// Node creation entry point
const node = (val = null, info = new WeakMap()) =>
    mkNode({
        val: val, // current value
        old: null, // previous value
        trans: new Set(), // binded transitions
        changed: false, // set when node is already updated
        isNode: true, // to check if obj is a node
        info: info, // WeakMap with any info - better than strings!
        change: change,
        inTransaction: false,
        delayedTransitions: null,
        delayedChanges: null
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
            if (!target.inTransaction) {
                target.old = target.val;
                target.val = value;
                // Property 'changed' being set to true before running
                // transitions prevents infinite loops. Node nets are
                // assumed to stabilize values in 1 run always so there
                // is no reason to run the same transition twice.
                target.changed = true;
                target.trans.forEach(t => {
                    t.func();
                });
                target.changed = false;
            } else {
                const delayedTransitions = target.delayedTransitions;
                const delayedChanges = target.delayedChanges;
                delayedChanges.add({
                    target,
                    value
                });
                target.trans.forEach(t => {
                    delayedTransitions.add(t);
                });
            }
        }
        return true;
    }
    return false;
};

const allNodesNotNull = nds =>
    nds.map(x => isNotNull(x.val)).reduce((x, y) => x && y, true);

const change = function(f) {
    const nd = this;
    nd.val = f(nd.val);
};

const tranRef = (...args) => {
    const len = args.length;
    const lastElem = args[len - 1];
    let triggerFunc;
    let ref;
    let i;
    if (isFunction(lastElem)) {
        triggerFunc = lastElem;
        ref = null;
        i = 1;
    } else {
        triggerFunc = args[len - 2];
        ref = lastElem;
        i = 2;
    }
    const nodes = args
        .splice(0, len - i)
        .map(x => (isArray(x) ? x : [x]))
        .reduce((x, y) => x.concat(y));
    if (nodes.length > 0) {
        const aLength = triggerFunc.length;
        const toGetNodes = [];
        for (let i = 0; i < aLength; i++) {
            toGetNodes.push(nodes[i]);
        }
        const result = node();
        const func = () => {
            if (allNodesNotNull(nodes)) {
                result.val = triggerFunc(
                    ...toGetNodes.map(n => n.val)
                );
            }
        };
        const transition = { nodes, func, ref };
        // Many transitions with the same tag is not allowed. Tags are
        // used as an indentity for dynamically created transitions.
        nodes.forEach(nd => {
            const ts = nd.target.trans;
            if (!ts.has(transition)) {
                if (ref) {
                    const res = [...ts].find(t => t.ref == ref);
                    if (res) {
                        removeTran(res);
                        ts.add(transition);
                    } else {
                        ts.add(transition);
                    }
                } else {
                    if (!ts.has(transition)) {
                        ts.add(transition);
                    }
                }
            }
        });
        // The transition runs right away if nodes are initialized with
        // non null values.
        if (allNodesNotNull(nodes)) {
            func();
        }
        return { node: result, transition };
    } else {
        return null;
    }
};

const tran = (...args) => {
    const { node } = tranRef(...args);
    return node;
};

const unsafeTranRef = (...args) => {
    const len = args.length;
    const lastElem = args[len - 1];
    let triggerFunc;
    let ref;
    if (isFunction(lastElem)) {
        triggerFunc = lastElem;
        ref = null;
    } else {
        triggerFunc = args[len - 2];
        ref = lastElem;
    }
    const nodes = args
        .splice(0, len - 1)
        .map(x => (isArray(x) ? x : [x]))
        .reduce((x, y) => x.concat(y));
    if (nodes.length > 0) {
        const aLength = triggerFunc.length;
        const toGetNodes = [];
        for (let i = 0; i < aLength; i++) {
            toGetNodes.push(nodes[i]);
        }
        const result = node();
        const func = () => {
            result.val = triggerFunc(...toGetNodes.map(n => n.val));
        };
        const transition = { nodes, func, ref };
        // Many transitions with the same tag is not allowed. Tags are
        // used as an indentity for dynamically created transitions.
        nodes.forEach(nd => {
            const ts = nd.target.trans;
            if (!ts.has(transition)) {
                if (ref) {
                    const res = [...ts].find(t => t.ref == ref);
                    if (res) {
                        removeTran(res);
                        ts.add(transition);
                    } else {
                        ts.add(transition);
                    }
                } else {
                    if (!ts.has(transition)) {
                        ts.add(transition);
                    }
                }
            }
        });
        // The transition runs right away if nodes are initialized with
        // non null values.
        func();
        return { node: result, transition };
    } else {
        return null;
    }
};

const unsafeTran = (...args) => {
    const { node } = unsafeTranRef(...args);
    return node;
};

// Remove a transition from all binded nodes
const removeTran = transition => {
    transition.nodes.forEach(nd => {
        const target = nd.target;
        target.trans.delete(transition);
    });
};

// Used when you want to make sure an obj is a node
const toNode = x => (x.isNode ? x : node(x));

// If a node carries object information, the subNode function creates
// a 1-way sub-node, that changes when the original node's attribute
// changes. It is 1-way because changing the sub-node does not change
// the parent node.
const subNode1 = (nd, attr) => tran([nd], x => x[attr]);

// Like 'subNode' but with 2-way changes. Changing the sub-node
// changes the parent node as well
const subNode = (nd, attr) => {
    const aux = unsafeTran(nd, x => (isNotNull(x) ? x[attr] : null));
    unsafeTran(aux, () => {
        const val = nd.val;
        if (val && typeof val == 'object') {
            const valC = isArray(val) ? copyArray(val) : copyObj(val);
            valC[attr] = aux.val;
            nd.val = valC;
        } else if (isNotNull(aux.val)) {
            const initObj = {};
            initObj[attr] = aux.val;
            nd.val = initObj;
        }
    });
    return aux;
};

const addSubNode = (nd, attrArg) => {
    let ndAttr;
    let attr;
    if (isArray(attrArg)) {
        [ndAttr, attr] = attrArg;
    } else {
        ndAttr = attrArg;
        attr = attrArg;
    }
    const subNd = subNode(nd, attr);
    const target = nd.target;
    target[ndAttr] = subNd;
    return subNd;
};

// Create a node and subnodes according to atttributes: only works
// correctly if the structure of the value does not change over time
const nodeObj = initVal => {
    const nd = node(initVal);
    if (typeof initVal == 'object') {
        const attrs = new Set(Object.keys(initVal));
        attrs.forEach(attr => {
            addSubNode(nd, attr);
        });
    }
    return nd;
};

const transaction = (...args) => {
    const len = args.length;
    const func = args[len - 1];
    const nodes = args
        .splice(0, len - 1)
        .map(x => (isArray(x) ? x : [x]))
        .reduce((x, y) => x.concat(y));

    const transactionReference = startTransaction(...nodes);
    func();
    endTransaction(transactionReference);
};

const startTransaction = (...nodes) => {
    const delayedTransitions = new Set();
    const delayedChanges = new Set();
    nodes.forEach(nd => {
        nd.target.inTransaction = true;
        nd.target.delayedTransitions = delayedTransitions;
        nd.target.delayedChanges = delayedChanges;
    });
    const transactionReference = {
        nodes,
        delayedTransitions,
        delayedChanges
    };
    return transactionReference;
};

const endTransaction = transactionReference => {
    const {
        nodes,
        delayedTransitions,
        delayedChanges
    } = transactionReference;
    delayedChanges.forEach(({ target, value }) => {
        target.old = target.val;
        target.val = value;
        target.changed = true;
    });
    delayedTransitions.forEach(tr => {
        tr.func();
    });
    nodes.forEach(nd => {
        nd.target.inTransaction = false;
        nd.target.changed = false;
        nd.target.delayedTransitions = null;
        nd.target.delayedChanges = null;
    });
};

export { addSubNode, endTransaction, node, nodeObj, removeTran, startTransaction, subNode, subNode1, toNode, tran, tranRef, transaction, unsafeTran, unsafeTranRef };
