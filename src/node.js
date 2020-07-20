import {
    isEqual,
    isNotNull,
    isArray,
    isFunction
} from './utils/index.js';

// Node creation entry point
export const node = (val = null, info = new WeakMap()) =>
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
// export const tran = (nodes, func) => {
//     if (nodes.length > 0) {
//         const transition = { nodes, func };
//         // Many transitions with the same tag is not allowed. Tags are
//         // used as an indentity for dynamically created transitions.
//         nodes.forEach(nd => {
//             const ts = nd.target.trans;
//             if (!ts.has(transition)) {
//                 ts.add(transition);
//             }
//         });
//         // The transition runs right away if nodes are initialized with
//         // non null values.
//         if (allNodesNotNull(nodes)) {
//             func();
//         }
//         return transition;
//     } else {
//         return null;
//     }
// };

export const tranRef = (...args) => {
    const len = args.length;
    //const triggerFunc = args[len - 1];
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

export const tran = (...args) => {
    const { node } = tranRef(...args);
    return node;
};

export const unsafeTranRef = (...args) => {
    const len = args.length;
    //const triggerFunc = args[len - 1];
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

export const unsafeTran = (...args) => {
    const { node } = unsafeTranRef(...args);
    return node;
};

// // Same thing as tran but every transition has a ref attribute in a
// // way thaat only 1 transition with the same 'ref' object can be
// // inside a node. When tranRef is used in  node with a transition with
// // the same ref, the old transition is replaced by the new one. This
// // is useful sometimes
// export const tranRef = (ref, nodes, func) => {
//     if (nodes.length > 0) {
//         const transition = { nodes, func, ref };
//         // Many transitions with the same tag is not allowed. Tags are
//         // used as an indentity for dynamically created transitions.
//         nodes.forEach(nd => {
//             const targ = nd.target;
//             const ts = targ.trans;
//             if (!ts.has(transition)) {
//                 const res = [...ts].find(t => t.ref == ref);
//                 if (res) {
//                     removeTran(res);
//                     ts.add(transition);
//                 } else {
//                     ts.add(transition);
//                 }
//             }
//         });
//         // The transition runs right away if nodes are initialized with
//         // non null values.
//         if (allNodesNotNull(nodes)) {
//             func();
//         }
//         return transition;
//     } else {
//         return null;
//     }
// };

// Only runs if all binded nodes are not null
// export const safeTran = (nodes, func) =>
//     tran(nodes, () => {
//         if (allNodesNotNull(nodes)) {
//             func();
//         }
//     });

// Remove a transition from all binded nodes
export const removeTran = transition => {
    transition.nodes.forEach(nd => {
        const target = nd.target;
        target.trans.delete(transition);
    });
};

// Used when you want to make sure an obj is a node
export const toNode = x => (x.isNode ? x : node(x));

// Create a node from a transition
// export const nodeT = (nodes, func, info) => {
//     const aux = node(null, info);
//     tran(nodes, () => {
//         aux.val = func();
//     });
//     return aux;
// };

// export const safeNodeT = (nodes, func, info) => {
//     const aux = node(null, info);
//     safeTran(nodes, () => {
//         aux.val = func();
//     });
//     return aux;
// };

// Similar to nodeT but the function receives values as input
// export const mapN = (ns, f, info) =>
//     nodeT(ns, () => f(...ns.map(n => n.val)), info);

// export const safeMapN = (ns, f, info) =>
//     safeNodeT(ns, () => f(...ns.map(n => n.val)), info);

// If a node carries object information, the subNode function creates
// a 1-way sub-node, that changes when the original node's attribute
// changes. It is 1-way because changing the sub-node does not change
// the parent node.
export const subNode = (nd, attr) => mapN([nd], x => x[attr]);

// Like 'subNode' but with 2-way changes. Changing the sub-node
// changes the parent node as well
export const subNode2 = (nd, attr) => {
    const aux = tran(nd, x => x[attr]);
    tran(aux, () => {
        const val = nd.val;
        val[attr] = aux.val;
        nd.val = val;
    });
    return aux;
};
