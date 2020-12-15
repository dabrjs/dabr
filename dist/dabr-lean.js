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

const isFunction = x => !!x && typeof x == 'function';

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

// A tree of anything in which every children are actually nodes (DABR
// nodes). You can define children as an array or only 1 element and
// as a node or not a node but in the end it always becomes a node
// with an array of trees inside.
// export const Tree2 = (elem, children) => {
//     let ch;
//     if (children) {
//         if (children.isNode) {
//             if (isArray(children.val)) {
//                 ch = children;
//             } else {
//                 ch = tran(children, singleton);
//             }
//         } else {
//             if (children.isEntry) {
//                 ch = children;
//             } else {
//                 ch = toNode(singleton(children));
//             }
//         }
//     } else {
//         ch = node([]);
//     }
//     return {
//         isTree: true,
//         elem: elem,
//         children: ch
//     };
// };

const Tree = (elem, ...childrens) => {
    const childrensN = childrens.map(children => {
        if (children) {
            if (children.isNode) {
                if (isArray(children.val)) {
                    return children;
                } else {
                    return tran(children, singleton);
                }
            } else {
                if (children.isEntry) {
                    return children;
                } else {
                    return toNode(singleton(children));
                }
            }
        } else {
            return node([]);
        }
    });
    return {
        isTree: true,
        elem: elem,
        children:
            childrensN.length == 0
                ? node([])
                : childrensN.length == 1
                ? childrensN[0]
                : tran(childrensN, () =>
                      childrensN
                          .map(ch => ch.val)
                          .reduce((x, y) => x.concat(y))
                  )
    };
};

// Shorthand only
const T = Tree;

// (a -> b) -> Tree a -> Tree b
const mapT = (tree, f, path = []) => {
    const elemRes = f(tree.elem, tree, path);
    const childrenRes = tree.children.isEntry
        ? tree.children
        : tran(tree.children, chs =>
              chs.map((ch, i) => mapT(ch, f, path.concat(i)))
          );
    tree.elem = elemRes;
    tree.children = childrenRes;
    return tree;
};

// export const mapT = (tree, f, path = []) =>
//     Tree(
//         f(tree.elem, tree, path),
//         tree.children.isEntry
//             ? tree.children
//             : tran(tree.children, chs =>
//                    chs.map((ch, i) => mapT(ch, f, path.concat(i)))
//                   )
//     );
const _mapT = (f, path = []) => tree => mapT(tree, f, path);

// Special object used to indicate entry-points to flatten Trees of
// Trees of A into Trees of A (see 'flatten' function)
const Entry = {
    isEntry: true
};

// Substitute an Entry object by children
const substEntryByChildren = (tree, val) => {
    if (tree.children.isEntry) {
        tree.children = val;
    } else {
        tree.children = tran(tree.children, chs =>
            chs.map(ch => substEntryByChildren(ch, val))
        );
    }
    return tree;
};

const substChildrenByEntry = (tree, ref) => {
    let children;
    if (tree.children == ref) {
        children = Entry;
    } else {
        children = tran(tree.children, chs =>
            chs.map(ch => substChildrenByEntry(ch, ref))
        );
    }
    return Tree(tree.elem, children);
};

// (Tree a -> Tree b) -> Tree a -> Tree b
const walkT = (tree, f, state = null, path = []) => {
    const ans = f(tree, state, path);
    const isIt = isArray(ans);
    const res = isIt ? ans[0] : ans;
    const newState = isIt ? ans[1] : state;
    const resWithEntry = res
        ? substChildrenByEntry(res, tree.children)
        : null;
    const resChildren = tran(tree.children, chs =>
        chs.map((ch, i) => walkT(ch, f, newState, path.concat(i)))
    );
    return res
        ? substEntryByChildren(resWithEntry, resChildren)
        : null;
};
const _walkT = (f, state = null, path = []) => tree =>
    walkT(tree, f, state, path);

const pathT = (tree, path) => {
    let res = null;
    walkT(tree, (t, s, p) => {
        if (isEqual(p, path)) {
            res = t;
        }
    });
    return res;
};
const _pathT = path => tree => pathT(tree, path);

const toStruc = tree => mapT(tree, x => Tree(x, Entry));

// Flattens a Tree of Trees using the Entry special object as an
// indicator of how to flatten the trees. Really useful for all sorts
// of transformations.
const fromStruc = tree => {
    const elem = tree.elem;
    if (elem.isTree) {
        return fromStruc(substEntryByChildren(elem, tree.children));
    } else {
        tree.children = tran(tree.children, chs =>
            chs.map(fromStruc)
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
var addStyle = tree =>
    mapT(tree, r => {
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
                    r.tran(nd, tr);
                }
            });
        }
        return r;
    });

const events = {
    click: ({ rect, channel }) => {
        rect.addEvent('click', e => {
            channel.put = e;
        });
        // elem.addEventListener('click', e => {
        //     channel.put = e;
        // });
    },
    mouseOver: ({ rect, channel }) => {
        rect.addEvent('mouseover', e => {
            channel.put = e;
        });
        // elem.addEventListener('mouseover', e => {
        //     channel.put = e;
        // });
    },
    mouseEnter: ({ rect, channel }) => {
        rect.addEvent('mouseenter', e => {
            channel.put = e;
        });
        // elem.addEventListener('mouseenter', e => {
        //     channel.put = e;
        // });
    },
    mouseMove: ({ rect, channel }) => {
        rect.addEvent('mousemove', e => {
            channel.put = e;
        });
        // elem.addEventListener('mousemove', e => {
        //     channel.put = e;
        // });
    },
    drag: ({ rect, channel }) => {
        let clicking = false;
        rect.addEvent('mousedown', e => {
            clicking = true;
            channel.put = e;
        });
        rect.addEvent('mouseup', () => {
            clicking = false;
            channel.put = false;
        });
        rect.addEvent('mousemove', e => {
            if (clicking) {
                channel.put = e;
            }
        });
    },
    mouseOut: ({ rect, channel }) => {
        rect.addEvent('mouseout', e => {
            channel.put = e;
        });
    }
};

// Binds events to channels
var addChans = tree =>
    mapT(tree, r => {
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

const len = (rel, px) => ({
    rel,
    px
});

const px = p => len(0, p);

const addLen = (r1, r2) => {
    const aux1 = isNotNull(r1.rel) ? r1 : { px: 0, rel: r1 };
    const aux2 = isNotNull(r2.rel) ? r2 : { px: 0, rel: r2 };
    const res = len(aux1.rel + aux2.rel, aux1.px + aux2.px);
    return res;
};

const mulLen = (s, r) => {
    const aux = isNotNull(r.rel) ? r : { px: 0, rel: r };
    return len(aux.rel * s, aux.px * s);
};

const addCoord = (c1, c2) => [
    addLen(c1[0], c2[0]),
    addLen(c1[1], c2[1])
];

const mulCoord = (s, c) => [mulLen(s, c[0]), mulLen(s, c[1])];

const getPx = l => (isNotNull(l.px) ? l.px : 0);

const getRel = l => (isNotNull(l.rel) ? l.rel : l);

const toLen = l => len(getRel(l), getPx(l));

const splitCoord = ([x, y]) => [
    [getRel(x), getRel(y)],
    [getPx(x), getPx(y)]
];

const asPx = ([x, y]) => [px(x), px(y)];

const copyCoord = ([x, y]) => [copyLen(x), copyLen(y)];

const copyLen = l => (l.rel ? copyObj(l) : l);

const x = l => coord([l, 100]);

const y = l => coord([100, l]);

const coord = arg => {
    const nd = arg.isNode ? arg : node(arg);
    addSubNode(nd, '0');
    addSubNode(nd, ['x', '0']);
    addSubNode(nd, '1');
    addSubNode(nd, ['y', '1']);
    return nd;
};

const scrollRef = {};

const nodes = {
    fullSize: ({ rect, tree, node: fs }) => {
        rect.tran([tree.children], () => {
            const chs = tree.children.val;
            const limits = chs.map(tCh => {
                const r = tCh.elem;
                const lay = r.layout;
                return tran(lay.posAbs, lay.sizAbs, () => {
                    const limitAbs = vectorPlus(
                        lay.posAbs.val,
                        lay.sizAbs.val
                    );
                    const limitLen = addCoord(
                        lay.pos.val,
                        lay.siz.val
                    );
                    // if (
                    //     (limitAbs[0].rel && limitAbs[0].rel > 100) ||
                    //     limitAbs[0] > 100
                    // ) {
                    //     console.log(
                    //         'yaa,',
                    //         r.inst.dom,
                    //         lay.posAbs.val,
                    //         lay.pos.val,
                    //         limitAbs,
                    //         limitLen
                    //     );
                    // }
                    return [limitAbs, limitLen];
                });
            });
            tran(limits, () => {
                const ans = copyCoord(
                    limits
                        .map(l => l.val)
                        .reduce((l1, l2) => {
                            const [l1abs, l1len] = l1;
                            const [l2abs, l2len] = l2;
                            const [x1, y1] = l1abs;
                            const [xl1, yl1] = l1len;
                            const [x2, y2] = l2abs;
                            const [xl2, yl2] = l2len;
                            // const lala = [
                            //     x1 > x2
                            //         ? [copyObj_(x1), copyObj_(xl1)]
                            //         : [copyObj_(x2), copyObj_(xl2)],
                            //     y1 > y2
                            //         ? [copyObj_(y1), copyObj_(yl1)]
                            //         : [copyObj_(y2), copyObj_(yl2)]
                            // ];
                            return [
                                [
                                    x1 > x2 ? x1 : x2,
                                    y1 > y2 ? y1 : y2
                                ],
                                [
                                    x1 > x2 ? xl1 : xl2,
                                    y1 > y2 ? yl1 : yl2
                                ]
                            ];
                            // console.log(
                            //     'lla',
                            //     l1abs,
                            //     l2abs,
                            //     l1len,
                            //     l2len,
                            //     [
                            //         x1 > x2 ? x1 : x2,
                            //         y1 > y2 ? y1 : y2
                            //     ],
                            //     [
                            //         x1 > x2 ? xl1 : xl2,
                            //         y1 > y2 ? yl1 : yl2
                            //     ]
                            //     // x1 > x2 ? [x1, xl1] : [x2, xl2],
                            //     // y1 > y2 ? [y1, yl1] : [y2, yl2]
                            // );
                            //return lala;
                        })[1]
                );
                //console.log('ans', ans);
                fs.val = ans;
            });
        });
        //rect.renderTrans.add(t);
    },
    fullSizeCor: ({ rect, node: fsc }) => {
        const fs = node();
        //const res = nodes.fullSize({ elem, rect, tree, node: fs });
        const siz = rect.layout.sizAbs;
        const sca = rect.layout.scale;
        const pSiz = rect.inst.par.layout.sizAbs;
        rect.tran([fs, siz, pSiz, sca], () => {
            const [[fsrx, fsry], [fspx, fspy]] = splitCoord(fs.val);
            const [sx, sy] = siz.val;
            const [psx, psy] = pSiz.val;
            fsc.val = [
                len(((fsrx * sx) / psx) * sca.val[0], fspx),
                len(((fsry * sy) / psy) * sca.val[1], fspy)
            ];
        });
    },
    scrollAbs: ({ elem, rect, node: scroll }) => {
        rect.addEvent('scroll', () => {
            scroll.val = [elem.scrollLeft, elem.scrollTop];
        });
        rect.tran([scroll], () => {
            const [l, t] = scroll.val;
            elem.scrollLeft = l;
            elem.scrollTop = t;
        });
        //rect.renderTrans.add(t);
    },
    id: ({ elem, rect, node: idN }) => {
        rect.unsafeTran(idN, id => {
            if (id) {
                elem.setAttribute('id', id);
            }
        });
    },
    scroll: ({ elem, rect, node: scroll }) => {
        const limN = rect.tran([rect.layout.sizAbs], siz => {
            const w = elem.scrollWidth;
            const h = elem.scrollHeight;
            const sw = Math.round(siz[0]);
            const sh = Math.round(siz[1]);
            return [
                w - sw >= 0 ? w - sw : 0,
                h - sh >= 0 ? h - sh : 0
            ];
        });
        rect.addEvent('scroll', () => {
            const lim = limN.val;
            scroll.val = [
                lim[0] === 0 ? 0 : 100 * (elem.scrollLeft / lim[0]),
                lim[1] === 0 ? 0 : 100 * (elem.scrollTop / lim[1])
            ];
        });
        rect.tran(
            [scroll],
            () => {
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
            },
            scrollRef
        );
        //rect.renderTrans.add(t);
    }
};

var addNodes = tree =>
    mapT(tree, (r, t) => {
        if (r.nodes) {
            iterate(r.nodes, ([name, val]) => {
                const nd = name == 'fullSize' ? val : toNode(val);
                const ans = nodes[name];
                if (ans) {
                    ans({
                        node: nd,
                        elem: r.inst.dom,
                        rect: r,
                        tree: t
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

const listenRef = (...args) => {
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
    const chans = args
        .splice(0, len - i)
        .map(x => (isArray(x) ? x : [x]))
        .reduce((x, y) => x.concat(y));
    if (chans.length > 0) {
        const aLength = triggerFunc.length;
        const toGetChans = [];
        for (let i = 0; i < aLength; i++) {
            toGetChans.push(chans[i]);
        }
        const result = chan();
        const func = () => {
            const ans = triggerFunc(...toGetChans.map(c => c.get));
            if (ans) {
                result.put = ans;
            }
        };
        const listener = { chans, func, ref };
        // Many transitions with the same tag is not allowed. Tags are
        // used as an indentity for dynamically created transitions.
        chans.forEach(ch => {
            const ls = ch.target.ports;
            if (!ls.has(listener)) {
                if (ref) {
                    const res = [...ls].find(l => l.ref == ref);
                    if (res) {
                        removeListen(res);
                        ls.add(listener);
                    } else {
                        ls.add(listener);
                    }
                } else {
                    if (!ls.has(listener)) {
                        ls.add(listener);
                    }
                }
            }
        });
        return { chan: result, listener };
    } else {
        return null;
    }
};

const listen = (...args) => {
    const { chan } = listenRef(...args);
    return chan;
};

// Listener removal
const removeListen = listener => {
    listener.chans.forEach(chan => {
        const target = chan.target;
        target.ports.delete(listener);
    });
};

const listenOnce = (...args) => {
    const len = args.length;
    const lastElem = args[len - 1];
    let func;
    let ref;
    let chans;
    if (isFunction(lastElem)) {
        func = lastElem;
        ref = null;
        chans = args.splice(0, len - 1);
    } else {
        func = args[len - 2];
        ref = lastElem;
        chans = args.splice(0, len - 2);
    }
    const res = listenRef(
        ...chans,
        () => {
            func();
            removeListen(res.listener);
        },
        ref
    );
    return res;
};

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
// domEvents: events inside the rect which should be deleted when the
//   rect is removed
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
//   layout.scale: the scale (in x and y) which defined the coords of
//     inner rects. Default is [1,1]
//   layout.pos: relative position length. Obligatory in any rect.
//   layout.siz: relative size length. Obligatory in any rect.
const Rect = (def = {}) => {
    const defaultLayout = {
        pos: coord([0, 0]),
        siz: coord([100, 100]),
        posAbs: node(),
        sizAbs: node(),
        scale: coord([1, 1]),
        disablePos: node(false),
        disableSiz: node(false),
        posChanged: chan(),
        sizChanged: chan(),
        posAbsChanged: chan(),
        sizAbsChanged: chan(),
        enablePosAbs: node(false),
        enableSizAbs: node(false)
    };

    const defaultRectAttrs = {
        tag: 'div',
        isRect: true,
        isSupp: false,
        isCore: true,
        oldVersions: [],
        init: chan(),
        stop: chan(),
        created: node(),
        removed: node(),
        inst: null,
        transitions: new Set(),
        listeners: new Set(),
        domEvents: [],
        //renderListens: new Set(),
        data: new WeakMap([[Rect, {}]]),
        layout: defaultLayout,
        tran: rectTran,
        tranRef: rectTranRef,
        listen: rectListen,
        listenRef: rectListenRef,
        unsafeTran: rectUnsafeTran,
        unsafeTranRef: rectUnsafeTranRef,
        addEvent: addEvent,
        withInst,
        withDOM,
        withPar
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
        res.layout = mapObj(
            x => (x.isChan ? x : toNode(x)),
            res.layout
        );
    }
    return res;
};

const rectTranRef = function(...args) {
    // this = rect
    const res = tranRef(...args);
    this.transitions.add(res.transition);
    return res;
};

const rectTran = function(...args) {
    // this = rect
    const { transition, node: nd } = tranRef(...args);
    this.transitions.add(transition);
    return nd;
};

const rectUnsafeTranRef = function(...args) {
    // this = rect
    const res = unsafeTranRef(...args);
    this.transitions.add(res.transition);
    return res;
};

const rectUnsafeTran = function(...args) {
    // this = rect
    const { transition, node: nd } = unsafeTranRef(...args);
    this.transitions.add(transition);
    return nd;
};

const rectListenRef = function(...args) {
    // this = rect
    const res = listenRef(...args);
    this.listeners.add(res.listener);
    return res;
};

const rectListen = function(...args) {
    // this = rect
    const { listener, chan: ch } = listenRef(...args);
    this.listeners.add(listener);
    return ch;
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
    iterate(changes, ([name, key]) => {
        if (name == 'data') {
            const arr = singleton(changes.data);
            //aux.data = rect.data;
            arr.forEach(({ key, val }) => {
                if (rect.data.has(key)) {
                    const current = rect.data.get(key);
                    rect.data.set(current.concat(key));
                } else {
                    rect.data.set(key, [val]);
                }
            });
        } else if (name == 'layout') {
            rect.layout = concatObj(
                rect.layout,
                mapObj(x => (x.isChan ? x : toNode(x)), key)
            );
        } else if (rect[name] && isObj(rect[name])) {
            rect[name] = concatObj(rect[name], key);
        } else {
            rect[name] = key;
        }
    });
    //aux.inst = null; //rect.inst;
    //aux.init = chan(); //rect.init;
    //aux.created = node(); //rect.created;
    //aux.oldVersions = rect.oldVersions.concat([rect]);
    return rect;
};

// export const preserveR = (rect, changes) => {
//     const aux = {};
//     iterate(changes, ([name, key]) => {
//         if (rect[name] && isObj(rect[name])) {
//             aux[name] = concatObj(rect[name], key);
//         } else {
//             aux[name] = key;
//         }
//     });
//     if (changes.data) {
//         const arr = singleton(changes.data);
//         aux.data = rect.data;
//         arr.forEach(({ key, val }) => {
//             if (aux.data.has(key)) {
//                 const current = aux.data.get(key);
//                 aux.data.set(current.concat(key));
//             } else {
//                 aux.data.set(key, [val]);
//             }
//         });
//     }
//     aux.inst = null; //rect.inst;
//     aux.init = chan(); //rect.init;
//     aux.created = node(); //rect.created;
//     aux.oldVersions = rect.oldVersions.concat([rect]);
//     return Rect(concatObj(rect, aux));
// };

// Auxiliar function to define {key, val}, it is really only a
// more aesthetical way of defining the object (imo)
const keyed = (key, val) => ({
    key: key,
    val: val
});

const removeEvents = rect => {
    const elem = rect.inst.dom;
    rect.domEvents.forEach(({ name }) => {
        elem['on' + name] = null;
        //elem.removeEventListener(name, func);
    });
};

const addEvent = function(name, func) {
    // this = rect
    const elem = this.inst.dom;
    elem['on' + name] = func;
    this.domEvents.push({
        name,
        func
    });
};

const withInst = function(f) {
    const rect = this;
    listenOnce(rect.init, () => f(rect.inst));
};

const withDOM = function(f) {
    const rect = this;
    listenOnce(rect.init, () => f(rect.inst.dom));
};

const withPar = function(f) {
    const rect = this;
    listenOnce(rect.init, () => f(rect.inst.par));
};

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
const top = f => tree => Tree(f(tree.elem), tree.children);

const withTree = (tree, f) => {
    tree.elem = f(tree.elem);
    return tree;
};

const preserveT = (tree, changes) =>
    withTree(tree, r => preserveR(r, changes));

// Add render transitions related to layout (positioning)
const addLayoutTriggers = (layout, elem, rect, parLayout) => {
    const sca = coord(parLayout.scale);

    const pos = coord(layout.pos);
    const dPos = layout.disablePos;
    const posChanged = layout.posChanged;
    const posAbsRender = layout.enablePosAbs;

    rect.tran([pos, sca, dPos, posAbsRender], () => {
        if (!posAbsRender.val) {
            if (!dPos.val) {
                const [pRel, pPx] = splitCoord(pos.val);
                const a = sca.val;
                const pc = [pRel[0] * a[0], pRel[1] * a[1]];
                if (pc[0] == 0) {
                    elem.style.left = `${pPx[0]}px`;
                } else {
                    elem.style.left = `calc(${pc[0]}% + ${pPx[0]}px)`;
                }
                if (pc[1] == 0) {
                    elem.style.top = `${pPx[1]}px`;
                } else {
                    elem.style.top = `calc(${pc[1]}% + ${pPx[1]}px)`;
                }
                posChanged.put = true;
            } else if (dPos.val == 'x') {
                const [pRel, pPx] = splitCoord(pos.val);
                const a = sca.val;
                const pc = pRel[1] * a[1];
                //elem.style.left = `calc(${pRel[0] * a[0]}% + ${
                //    pPx[0]
                //}px)`;
                if (pc == 0) {
                    elem.style.top = `${pPx[1]}px`;
                } else {
                    elem.style.top = `calc(${pc}% + ${pPx[1]}px)`;
                }
                posChanged.put = true;
            } else if (dPos.val == 'y') {
                const [pRel, pPx] = splitCoord(pos.val);
                const a = sca.val;
                const pc = pRel[0] * a[0];
                if (pc == 0) {
                    elem.style.left = `${pPx[0]}px`;
                } else {
                    elem.style.left = `calc(${pc}% + ${pPx[0]}px)`;
                }
                //elem.style.top = `calc(${pRel[1] * a[1]}% + ${pPx[1]}px)`;
                posChanged.put = true;
            }
        }
    });

    const siz = coord(layout.siz);
    const dSiz = layout.disableSiz;
    const sizChanged = layout.sizChanged;
    const sizAbsRender = layout.enableSizAbs;

    rect.tran([siz, sca, dSiz, sizAbsRender], () => {
        if (!sizAbsRender.val) {
            if (!dSiz.val) {
                const [sRel, sPx] = splitCoord(siz.val);
                const a = sca.val;
                const pc = [sRel[0] * a[0], sRel[1] * a[1]];
                if (pc[0] == 0) {
                    elem.style.width = `${sPx[0]}px`;
                } else {
                    elem.style.width = `calc(${pc[0]}% + ${sPx[0]}px)`;
                }
                if (pc[1] == 0) {
                    elem.style.height = `${sPx[1]}px`;
                } else {
                    elem.style.height = `calc(${pc[1]}% + ${sPx[1]}px)`;
                }
                sizChanged.put = true;
            } else if (dSiz.val == 'x') {
                const [sRel, sPx] = splitCoord(siz.val);
                const a = sca.val;
                const pc = sRel[1] * a[1];
                if (pc == 0) {
                    elem.style.height = `${sPx[1]}px`;
                } else {
                    elem.style.height = `calc(${pc}% + ${sPx[1]}px)`;
                }
                sizChanged.put = true;
            } else if (dSiz.val == 'y') {
                const [sRel, sPx] = splitCoord(siz.val);
                const a = sca.val;
                const pc = sRel[0] * a[0];
                if (pc == 0) {
                    elem.style.width = `${sPx[0]}px`;
                } else {
                    elem.style.width = `calc(${pc}% + ${sPx[0]}px)`;
                }
                sizChanged.put = true;
            }
        }
    });
};

// Rect's default layout reactivity updates posAbs and sizAbs whenever
// max, siz or pos changes. posAbs and sizAbs should not be changed
// directly
const defaultLayoutReactivity = (
    rect,
    posN, // rect's relative position node
    sizN, // rect's relative size node
    pScaleN, // parent's max node
    pPosAbsN, // parent's absolute position
    pSizAbsN, // parent's absolute size
    posAbsN, // rect's absolute position
    sizAbsN, // rect's absolute size
    enPos,
    enSiz,
    dPos,
    dSiz
) => {
    // [posN, sizN, pScaleN, pPosAbsN, pSizAbsN, posAbsN, sizAbsN].map(
    //     coord
    // );

    // rect.tran(
    //     [posN.x, sizN.x, pScaleN.x, pPosAbsN.x, pSizAbsN.x],
    //     (_pos, _siz, pScale, pPosAbs, pSizAbs) => {
    //         const pos = toLen(_pos);
    //         const siz = toLen(_siz);
    //         let a = (pSizAbs * pScale) / 100;
    //         let sizAbs = siz.rel * a;
    //         let posAbs = pos.rel * a + pPosAbs;
    //         posAbsN.x.val = posAbs + pos.px;
    //         sizAbsN.x.val = sizAbs + siz.px;
    //     }
    // );

    // rect.tran(
    //     [posN.y, sizN.y, pScaleN.y, pPosAbsN.y, pSizAbsN.y],
    //     (_pos, _siz, pScale, pPosAbs, pSizAbs) => {
    //         const pos = toLen(_pos);
    //         const siz = toLen(_siz);
    //         let a = (pSizAbs * pScale) / 100;
    //         let sizAbs = siz.rel * a;
    //         let posAbs = pos.rel * a + pPosAbs;
    //         posAbsN.y.val = posAbs + pos.px;
    //         sizAbsN.y.val = sizAbs + siz.px;
    //     }
    // );

    rect.tran(
        [posN, sizN, pScaleN, pPosAbsN, pSizAbsN, enPos, enSiz].map(
            coord
        ),
        (pos, siz, pScale, pPosAbs, pSizAbs) => {
            const [posRel, posPx] = splitCoord(pos);
            const [sizRel, sizPx] = splitCoord(siz);
            let a = [
                (pSizAbs[0] * pScale[0]) / 100,
                (pSizAbs[1] * pScale[1]) / 100
            ];
            let sizAbs = [sizRel[0] * a[0], sizRel[1] * a[1]];
            let posAbs = [
                posRel[0] * a[0] + pPosAbs[0],
                posRel[1] * a[1] + pPosAbs[1]
            ];
            posAbsN.val = vectorPlus(posAbs, posPx);
            if (enPos.val) {
                if (dPos.val == 'x') {
                    rect.inst.dom.style.top =
                        posAbsN.val[1] - pPosAbs[1] + 'px';
                } else if (dPos.val == 'y') {
                    rect.inst.dom.style.left =
                        posAbsN.val[0] - pPosAbs[0] + 'px';
                } else if (dPos.val == false) {
                    rect.inst.dom.style.left =
                        posAbsN.val[0] - pPosAbs[0] + 'px';
                    rect.inst.dom.style.top =
                        posAbsN.val[1] - pPosAbs[1] + 'px';
                }
            }
            sizAbsN.val = vectorPlus(sizAbs, sizPx);
            if (enSiz.val) {
                if (dSiz.val == 'x') {
                    rect.inst.dom.style.height =
                        sizAbsN.val[1] + 'px';
                } else if (dSiz.val == 'y') {
                    rect.inst.dom.style.width =
                        sizAbsN.val[0] + 'px';
                } else if (dSiz.val == false) {
                    rect.inst.dom.style.width =
                        sizAbsN.val[0] + 'px';
                    rect.inst.dom.style.height =
                        sizAbsN.val[1] + 'px';
                }
            }
            rect.layout.posAbsChanged.put = true;
            rect.layout.sizAbsChanged.put = true;
        }
    );
};

// Initializes Rect: creates DOM, adds layout, nodes, chans and style
// triggers. Runs inside 'document.body'.
const run = rectT =>
    addCSS(addStyle(addChans(addNodes(runRect(rectT)))));

// Similar to run but runs inside any DOM element
const runDOM = (rectT, dom) =>
    addCSS(addStyle(addChans(addNodes(runRectDOM(rectT, dom)))));

const getDeviceSize = () => [
    document.documentElement.clientWidth,
    document.documentElement.clientHeight
];

const addCSS = tree =>
    mapT(tree, r => {
        if (r.css) {
            iterate(r.css, ([attrName, attrVal]) => {
                const attrNd = toNode(attrVal);
                const dom = r.inst.dom;
                r.tran(attrNd, v => {
                    dom.style[attrName] = v;
                });
            });
        }
        return r;
    });

// Initialize Rect: creates DOM, adds only core layout triggers only.
// If one wants to use Rect but not use default nodes, chans, style,
// use this function instead of 'run'. Runs inside document.body.
const runRect = rectT => {
    const sizAbs = node(getDeviceSize());
    const parent = {
        layout: {
            posAbs: node([0, 0]),
            sizAbs: sizAbs,
            scale: node([1, 1])
        },
        flex: false,
        inst: {
            dom: document.body
        }
    };
    if (window.onresize) {
        const f = window.onresize;
        window.onresize = () => {
            const devSize = f();
            sizAbs.val = devSize;
            return devSize;
        };
    } else {
        window.onresize = () => {
            const devSize = getDeviceSize();
            sizAbs.val = devSize;
            return devSize;
        };
    }
    // Flattens tree so that Trees of Trees of ... Trees of Rects
    // become just Trees of Rects
    return runInside(fromStruc(rectT), parent);
};

// Similar to runRect, but runs inside any DOM element. Uses
// 'ResizeObserver' to check for size changes in the DOM.
const runRectDOM = (rectT, dom) => {
    const sizAbs = node([dom.offsetWidth, dom.offsetHeight]);
    const parent = {
        layout: {
            posAbs: node([0, 0]),
            sizAbs: sizAbs,
            scale: node([1, 1])
        },
        flex: false,
        inst: {
            dom: dom
        }
    };

    addDabrCss(dom);

    new ResizeObserver(entries => {
        const entry = entries[0];
        const { width, height } = entry.contentRect;
        sizAbs.val = [width, height];
    }).observe(dom);
    // Flattens tree so that Trees of Trees of ... Trees of Rects
    // become just Trees of Rects
    return runInside(fromStruc(rectT), parent);
};

// const findReference = parents => {
//     for (let i = parents.length - 1; i >= 0; i--) {
//         const parent = parents[i];
//         if (!parent.flex) {
//             return parent;
//         }
//     }
//     return undefined;
// };

// Main run function
const runInside = (rectT, parent) => {
    const rect = rectT.elem;

    addGlobalCSSOnce();
    const elem = document.createElement(rect.tag);
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
        rect,
        lay.pos,
        lay.siz,
        parent.layout.scale,
        parent.layout.posAbs,
        parent.layout.sizAbs,
        lay.posAbs,
        lay.sizAbs,
        lay.enablePosAbs,
        lay.enableSizAbs,
        lay.disablePos,
        lay.disableSiz
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
    parent.tran(children, () => {
        let neu = children.val;
        let alt = children.old;
        if (!alt) alt = [];
        if (!neu) neu = [];
        const removed = alt.filter(x => !neu.includes(x));
        const created = neu.filter(x => !alt.includes(x));
        created.forEach(x => runInside(x, parent));
        removed.forEach(x => removeRect(x));
    });
};

// Removes a rect, meaning its DOM is destroyed and events and node
// transitions do not work anymore
const removeRect = rectT => {
    const rect = rectT.elem;
    const dom = rect.inst.dom;
    // GC removes eventListeners automatically when DOM is removed
    dom.parentNode.removeChild(dom);
    // Transitions related to DOM rendering are removed although GC
    // might be able to do it automatically
    rect.transitions.forEach(t => {
        removeTran(t);
    });
    rect.listeners.forEach(l => {
        removeListen(l);
    });
    removeEvents(rect);
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

const proportional = (prop, tree) => {
    const innerPos = node();
    const innerSiz = node();
    const data = keyed(proportional, {
        node: prop,
        outter: true,
        inner: false
    });
    const rect = tree.elem;
    const sizAbs = node();
    const supp = Supp({
        layout: {
            pos: rect.layout.pos,
            siz: rect.layout.siz,
            sizAbs
        },
        data
    });
    const newRect = preserveR(rect, {
        layout: {
            pos: innerPos,
            siz: innerSiz
        },
        css: {
            overflow: 'hidden'
        }
    });
    tran([prop, sizAbs], () => {
        const [offset, newSize] = calcProportional(
            prop.val,
            sizAbs.val
        );
        innerPos.val = [px(offset[0]), px(offset[1])];
        innerSiz.val = [px(newSize[0]), px(newSize[1])];
    });
    return Tree(supp, Tree(newRect, tree.children));
};

const _proportional = prop => tree => proportional(prop, tree);

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

const External = children => {
    const parent = Rect();
    const sizAbs = parent.layout.sizAbs;

    const positions = new Map();
    const sizes = new Map();

    const repositionChild = child => {
        if (child.elem.inst) {
            const dom = child.elem.inst.dom;
            const { top, left } = dom.getBoundingClientRect();
            positions.get(dom).val = asPx([left, top]);
        }
    };

    const repositionAll = () => {
        const nodes = [];
        [...positions].entries(([, nd]) => {
            nodes.push(nd);
        });
        transaction(nodes, () => {
            children.forEach(repositionChild);
        });
    };

    tran(sizAbs, repositionAll);

    const resizeObs = new ResizeObserver(entries => {
        const sizNodes = [];
        [...sizes].entries(([, nd]) => {
            sizNodes.push(nd);
        });
        transaction(sizNodes, () => {
            entries.forEach(entry => {
                const { width, height } = entry.contentRect;
                if (width != 0 && height != 0) {
                    sizes.get(entry.target).val = asPx([
                        width,
                        height
                    ]);
                }
            });
        });
    });

    const childrenRes = children.map(child => {
        const rect = child.elem;

        const externalRect = preserveR(rect, {
            layout: {
                disablePos: true,
                disableSiz: true
            }
        });

        externalRect.withDOM(dom => {
            positions.set(dom, externalRect.layout.pos);
            sizes.set(dom, externalRect.layout.siz);

            setTimeout(() => repositionChild(child), 0);
            resizeObs.observe(dom);
        });

        return Tree(externalRect, child.children);
    });

    return Tree(parent, childrenRes);
};

const ExternalSiz = children => {
    const parent = Rect();

    const positions = new Map();
    const sizes = new Map();

    const resizeObs = new ResizeObserver(entries => {
        const sizNodes = [];
        [...sizes].entries(([, nd]) => {
            sizNodes.push(nd);
        });
        transaction(sizNodes, () => {
            entries.forEach(entry => {
                const { width, height } = entry.contentRect;
                if (width != 0 && height != 0)
                    sizes.get(entry.target).val = asPx([
                        width,
                        height
                    ]);
            });
        });
    });

    const childrenRes = children.map(child => {
        const rect = child.elem;

        const externalRect = preserveR(rect, {
            layout: {
                disableSiz: true
            }
        });

        externalRect.withDOM(dom => {
            positions.set(dom, externalRect.layout.pos);
            sizes.set(dom, externalRect.layout.siz);
            resizeObs.observe(dom);
        });

        return Tree(externalRect, child.children);
    });

    return Tree(parent, childrenRes);
};

// export const ExternalPos = children => {
//     const parent = Rect();
//     const sizAbs = parent.layout.sizAbs;

//     const positions = new Map();
//     const sizes = new Map();

//     const repositionChild = child => {
//         if (child.elem.inst) {
//             const dom = child.elem.inst.dom;
//             if (positions.has(dom)) {
//                 const { top, left } = dom.getBoundingClientRect();
//                 positions.get(dom).val = asPx([left, top]);
//             }
//         }
//     };

//     const repositionAll = () => {
//         const posNodes = [];
//         [...positions].entries(([, nd]) => {
//             posNodes.push(nd);
//         });
//         transaction(posNodes, () => {
//             children.forEach(repositionChild);
//         });
//     };

//     tran(sizAbs, repositionAll);

//     children.forEach(child => {
//         const rect = child.elem;
//         preserveR(rect, {
//             layout: {
//                 disablePos: true
//             }
//         });
//         rect.withDOM(dom => {
//             positions.set(dom, rect.layout.pos);
//             sizes.set(dom, rect.layout.siz);
//             setTimeout(() => repositionChild(child), 0);
//         });
//     });

//     return Tree(parent, children);
// };

const ExternalPos = children => {
    const parent = Rect();
    const sizAbs = parent.layout.sizAbs;

    const positions = new Map();
    const sizes = new Map();

    const repositionChild = child => {
        if (child.elem.inst) {
            const dom = child.elem.inst.dom;
            if (positions.has(dom)) {
                const { top, left } = dom.getBoundingClientRect();
                positions.get(dom).val = asPx([left, top]);
            }
        }
    };

    const repositionAll = () => {
        const posNodes = [];
        [...positions].entries(([, nd]) => {
            posNodes.push(nd);
        });
        transaction(posNodes, () => {
            children.forEach(repositionChild);
        });
    };

    tran(sizAbs, repositionAll);

    const childrenRes = children.map(child => {
        const rect = child.elem;

        const externalRect = preserveR(rect, {
            layout: {
                disablePos: true
            }
        });

        externalRect.withDOM(dom => {
            positions.set(dom, externalRect.layout.pos);
            sizes.set(dom, externalRect.layout.siz);

            setTimeout(() => repositionChild(child), 0);
        });

        return Tree(externalRect, child.children);
    });

    return Tree(parent, childrenRes);
};

const border = (b, tree) => {
    const rect = tree.elem;
    const innerPos = node();
    const innerSiz = node();
    const color = tran(b, ({ color }) => color);
    const width = tran(b, ({ width }) => width);
    tran([width], () => {
        const w = width.val;
        innerSiz.val = [len(100, -2 * w), len(100, -2 * w)];
        innerPos.val = [px(w), px(w)];
    });
    const s = Supp({
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
    });
    return Tree(
        s,
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
            tree.children
        )
    );
};

const _border = b => tree => border(b, tree);

const externalBorder = (b, tree) => {
    const rect = tree.elem;
    const innerPos = node();
    const innerSiz = node();
    const color = tran(b, ({ color }) => color);
    const width = tran(b, ({ width }) => width);

    const outterPos = tran(width, rect.layout.pos, (w, p) =>
        addCoord(p, [px(-w), px(-w)])
    );
    const outterSiz = tran(width, rect.layout.siz, (w, s) =>
        addCoord(s, [px(2 * w), px(2 * w)])
    );

    const s = Supp({
        layout: {
            pos: outterPos,
            siz: outterSiz
        },
        data: keyed(border, {
            node: b,
            outter: true,
            inner: false
        }),
        style: {
            color: color
        }
    });
    return Tree(
        s,
        Tree(
            preserveR(rect, {
                layout: {
                    pos: tran(width, w => [px(w), px(w)]),
                    siz: tran(width, w => [
                        len(100, -2 * w),
                        len(100, -2 * w)
                    ])
                },
                data: keyed(border, {
                    node: b,
                    inner: true,
                    outter: false
                })
            }),
            tree.children
        )
    );
};

const _externalBorder = b => tree => externalBorder(b, tree);

const seamlessBorder = (b, tree) => {
    const rect = tree.elem;
    const color = tran(b, ({ color }) => color);
    const width = tran(b, ({ width }) => width);

    const outterPos = tran(width, rect.layout.pos, (w, p) =>
        addCoord(p, [px(-w / 2), px(-w / 2)])
    );
    const outterSiz = tran(width, rect.layout.siz, (w, s) =>
        addCoord(s, [px(w), px(w)])
    );

    const innerPos = tran(width, w => [px(w), px(w)]);
    const innerSiz = tran(width, w => [
        len(100, -2 * w),
        len(100, -2 * w)
    ]);

    const s = Supp({
        layout: {
            pos: outterPos,
            siz: outterSiz
        },
        data: keyed(border, {
            node: b,
            outter: true,
            inner: false
        }),
        style: {
            color: color
        }
    });
    return Tree(
        s,
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
            tree.children
        )
    );
};

const _seamlessBorder = b => tree => seamlessBorder(b, tree);

const container = (show, tree) =>
    Tree(
        Supp({
            layout: {
                pos: tree.elem.layout.pos,
                siz: tree.elem.layout.siz
            },
            data: keyed(container, show),
            style: {
                show
            }
        }),
        Tree(
            preserveR(tree.elem, {
                layout: {
                    pos: [0, 0],
                    siz: [100, 100]
                }
            }),
            tree.children
        )
    );

const _container = show => tree => container(show, tree);

// export const switcher = (route, routeRectMap) => {
//     const children = node();
//     const routeMap = mapValuesObj(routeRectMap, val => {
//         const destroy = val.destroy ? val.destroy : false;
//         const show = node(false);
//         const rectT = container(show, val.content || val);
//         return {
//             show,
//             rectT,
//             destroy
//         };
//     });
//     const siz = node([100, 100]);
//     tran([route], () => {
//         const newRoute = route.val;
//         children.val = iterate(routeMap, ([rou, val]) => {
//             const { show, rectT, destroy } = val;
//             if (rou == newRoute) {
//                 show.val = true;
//                 return rectT;
//             } else if (destroy) {
//                 return null;
//             } else {
//                 show.val = false;
//                 return rectT;
//             }
//         }).filter(isNotNull);
//         // hack to fiz some problems when switch happens
//         siz.val = [{ rel: 100, px: 0.01 }, 100];
//         siz.val = [100, 100];
//     });
//     return Tree(
//         Supp({
//             layout: {
//                 pos: [0, 0],
//                 siz
//             }
//         }),
//         children
//     );
// };

const Cond = (route, routeRectMap) => {
    const children = node([]);
    const siz = node([100, 100]);
    const initialized = {};
    tran([route], newRoute => {
        const rectF = routeRectMap[newRoute];
        if (rectF) {
            if (initialized[newRoute]) {
                // already intiialized
                children.val.map(ch => {
                    ch.elem.style.show.val = false;
                });
                initialized[newRoute].elem.style.show.val = true;
            } else {
                // not initialized
                children.val.map(ch => {
                    ch.elem.style.show.val = false;
                });
                const show = node(true);
                const rectRef = container(show, rectF());
                children.val = children.val.concat([rectRef]);
                initialized[newRoute] = rectRef;
            }
        }
        // hack to fiz some problems when switch happens
        siz.val = [{ rel: 100, px: 0.01 }, 100];
        siz.val = [100, 100];
    });
    return Tree(
        Supp({
            layout: {
                pos: [0, 0],
                siz
            }
        }),
        children
    );
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

const scrollbar = tree => {
    const rect = tree.elem;
    const scroll = node();
    const res = preserveR(rect, {
        nodes: {
            scroll
        }
    });

    const innerPos = node([50, 0]);
    tran([scroll], () => {
        // hack to avoid scroll-link warning
        setTimeout(() => {
            const h = scroll.val[1];
            const ans = (h * 95) / 100;
            if (ans >= 0) {
                innerPos.val = [innerPos.val[0], ans];
            }
        }, 0);
    });

    const outterSizAbs = node([0, 0]);
    const innerSiz = node([50, 5]);
    const click = chan();
    //listen([click], changePos(click));
    listen([click], () => {
        if (outterSizAbs.val) {
            const val = click.get;
            //const x = val.offsetX;
            const y = val.offsetY;
            scroll.val = [
                0, //(x / outterSizAbs.val[0]) * 100,
                (y / outterSizAbs.val[1]) * 100
            ];
        }
    });
    // listen([drag], () => {
    //     const val = drag.get;
    //     if (
    //         !oldVal ||
    //         !(
    //             oldVal.clientY - val.clientY <
    //             oldVal.layerY - val.layerY
    //         )
    //     ) {
    //         if (val == false) {
    //             dragging = false;
    //             innerPos.val = [50, innerPos.val[1]];
    //             innerSiz.val = [50, 5];
    //         } else {
    //             dragging = true;
    //             innerPos.val = [0, innerPos.val[1]];
    //             innerSiz.val = [100, 5];
    //             let res = (val.layerY / outterSizAbs.val[1]) * 100;
    //             if (res < 1) res = 1;
    //             if (res > 100) res = 100;
    //             oldVal = val;
    //             //timed(scroll, { finalVal: [0, res], totalTime: 100 });
    //             scroll.val = [0, res];
    //         }
    //     }
    // });
    listen([over], () => {
        {
            innerPos.val = [0, innerPos.val[1]];
            innerSiz.val = [100, 5];
        }
    });
    // listen([out], () => {
    //     if (!dragging) {
    //         innerPos.val = [50, innerPos.val[1]];
    //         innerSiz.val = [50, 5];
    //     }
    // });
    const sbar = Tree(
        Rect({
            layout: {
                pos: [len(100, -10), 0],
                siz: [len(0, 10), 100],
                sizAbs: outterSizAbs
            },
            events: {
                click
                //drag
            }
        }),
        RectT({
            layout: {
                pos: innerPos,
                siz: innerSiz
            },
            style: {
                color: 'orange'
            }
            // events: {
            //     mouseOver: over,
            //     mouseOut: out
            // }
        })
    );
    return Tree(Supp(), [Tree(res, tree.children), sbar]);
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

//const keypressChannel = chan();

const setParentScale = rect => {
    listenOnce([rect.init], () => {
        const par = rect.inst.par;
        const parSiz = par.layout.sizAbs;
        const parScale = par.layout.scale;
        const sizAbs = rect.layout.sizAbs;
        const scale = rect.layout.scale;
        tran([parSiz, parScale, sizAbs], () => {
            scale.val = [
                (parSiz.val[0] / sizAbs.val[0]) * parScale.val[0],
                (parSiz.val[1] / sizAbs.val[1]) * parScale.val[1]
            ];
        });
    });
    return rect;
};

const setParentScaleX = rect => {
    listenOnce([rect.init], () => {
        const par = rect.inst.par;
        const parSiz = par.layout.sizAbs;
        const parScale = par.layout.scale;
        const sizAbs = rect.layout.sizAbs;
        const scale = rect.layout.scale;
        tran([parSiz, parScale, sizAbs], () => {
            scale.val = [
                (parSiz.val[0] / sizAbs.val[0]) * parScale.val[0],
                scale.val[1]
            ];
        });
    });
    return rect;
};

const setParentScaleY = rect => {
    listenOnce([rect.init], () => {
        const par = rect.inst.par;
        const parSiz = par.layout.sizAbs;
        const parScale = par.layout.scale;
        const sizAbs = rect.layout.sizAbs;
        const scale = rect.layout.scale;
        tran([parSiz, parScale, sizAbs], () => {
            scale.val = [
                scale.val[0],
                (parSiz.val[1] / sizAbs.val[1]) * parScale.val[1]
            ];
        });
    });
    return rect;
};

const flex = tree => {
    const rect = tree.elem;

    const res = setParentScale(
        preserveR(rect, {
            layout: {
                disableSiz: true
            },
            css: {
                height: 'max-content',
                width: 'max-content',
                'font-size': '0px',
                position: 'relative'
            }
        })
    );

    const resizeObs = new ResizeObserver(entries => {
        const entry = entries[0];
        const { width, height } = entry.contentRect;
        if (width != 0 && height != 0) {
            res.layout.siz.val = asPx([width, height]);
        }
    });

    res.withDOM(dom => {
        resizeObs.observe(dom);
    });

    const resChildren = tran(tree.children, chs =>
        chs.map(t =>
            withTree(t, r =>
                preserveR(r, {
                    layout: {
                        enablePosAbs: true,
                        enableSizAbs: true
                    }
                })
            )
        )
    );

    return Tree(res, resChildren);
};

const flexX = tree => {
    const rect = tree.elem;

    const res = setParentScaleX(
        preserveR(rect, {
            layout: {
                disableSiz: 'x'
            },
            css: {
                width: 'max-content',
                'font-size': '0px',
                position: 'relative'
            }
        })
    );

    const resizeObs = new ResizeObserver(entries => {
        const entry = entries[0];
        const { width, height } = entry.contentRect;
        if (width != 0 && height != 0) {
            res.layout.siz[0].val = px(width);
        }
    });

    res.withDOM(dom => {
        resizeObs.observe(dom);
    });

    const resChildren = tran(tree.children, chs =>
        chs.map(t =>
            withTree(t, r =>
                preserveR(r, {
                    layout: {
                        enablePosAbs: true,
                        enableSizAbs: true
                    }
                })
            )
        )
    );

    return Tree(res, resChildren);
};

const flexY = tree => {
    const rect = tree.elem;

    const res = setParentScaleY(
        preserveR(rect, {
            layout: {
                disableSiz: 'y'
            },
            css: {
                height: 'max-content',
                'font-size': '0px',
                position: 'relative'
            }
        })
    );

    const resizeObs = new ResizeObserver(entries => {
        const entry = entries[0];
        const { width, height } = entry.contentRect;
        if (width != 0 && height != 0) {
            res.layout.siz[1].val = px(height);
        }
    });

    res.withDOM(dom => {
        resizeObs.observe(dom);
    });

    const resChildren = tran(tree.children, chs =>
        chs.map(t =>
            withTree(t, r =>
                preserveR(r, {
                    layout: {
                        enablePosAbs: true,
                        enableSizAbs: true
                    }
                })
            )
        )
    );

    return Tree(res, resChildren);
};

const Inline = (tag, params) => {
    let size;
    let content;

    if (isObj(params)) {
        size = toNode(params.size);
        content = toNode(params.content);
    } else {
        size = node('16px');
        content = toNode(params);
    }

    const r = Rect({
        inline: true,
        tag,
        layout: {
            disablePos: true,
            disableSiz: true
        },
        css: {
            position: 'relative',
            display: 'inline',
            width: 'max-content',
            height: 'max-content',
            'font-size': size
        }
    });

    r.withDOM(dom => {
        tran(content, txt => {
            dom.innerText = txt;
        });
    });

    return Tree(r);
};

const toInline = tree =>
    preserveT(tree, {
        inline: true
    });

const paragraph = trees => {
    const inlineds = trees.map(t =>
        preserveT(t, {
            css: {
                display: t.elem.inline ? 'inline' : 'inline-block',
                position: 'relative',
                'vertical-align': 'middle'
            }
        })
    );

    return flexY(ExternalPos(inlineds));
};

const line = trees => {
    const inlineds = trees.map(t =>
        preserveT(t, {
            css: {
                display: t.elem.isText ? 'inline' : 'inline-block',
                position: 'relative',
                'vertical-align': 'middle'
            }
        })
    );

    return flex(ExternalPos(inlineds));
};

const space = s =>
    Supp({
        layout: {
            siz: s
        }
    });

const verticalSpace = vSpace =>
    space(tran([vSpace], y => [0, y]));

const horizontalSpace = hSpace =>
    space(tran([hSpace], x => [x, 0]));

const vertical = trees => {
    const inlineds = trees.map(t =>
        Tree(
            preserveR(t.elem, {
                css: {
                    display: 'block',
                    position: 'relative'
                }
            }),
            t.children
        )
    );

    return flexY(ExternalPos(inlineds));
};

const horizontal = line;

const style = (objN, tree) => {
    const cssN = tree.elem.style ? tree.elem.style.css : null;
    return Tree(
        preserveR(tree.elem, {
            style: {
                css: cssN
                    ? tran(cssN, objN, (oldCss, newCss) => ({
                          ...oldCss,
                          ...newCss
                      }))
                    : objN
            }
        }),
        tree.children
    );
};

const _style = objN => tree => style(objN, tree);

const Img = src => {
    const srcN = toNode(src);

    const imgDOM = document.createElement('img');

    const imgSiz = chan();

    const r = Supp({
        layout: {
            pos: [0, 0],
            siz: [100, 100]
        },
        css: {
            overflow: '-moz-hidden-unscrollable'
        },
        data: keyed(Img, { siz: imgSiz, dom: imgDOM })
    });

    r.withDOM(dom => {
        tran(srcN, src => {
            imgDOM.setAttribute('src', src);
            imgDOM.style['width'] = 'auto';
            imgDOM.style['height'] = 'auto';
            imgDOM.addEventListener('load', () => {
                const naturalImgSiz = asPx([
                    imgDOM.offsetWidth,
                    imgDOM.offsetHeight
                ]);
                imgSiz.put = naturalImgSiz;
                imgDOM.style['width'] = '100%';
                imgDOM.style['height'] = '100%';
            });
            dom.appendChild(imgDOM);
        });
    });

    return Tree(r);
};

const fitImg = src => {
    const imgT = Img(src);
    const [{ siz: imgSiz }] = imgT.elem.data.get(Img);
    const prop = node();
    listen(imgSiz, s => {
        prop.val = [s[0].px, s[1].px];
    });
    return proportional(prop, imgT);
};

const Text = args => {
    let fontSize;
    let content;
    let color;
    let family;
    let verticalAlign;
    if (
        (!args.isNode && isObj(args)) ||
        (args.isNode && isObj(args.val))
    ) {
        const argsObj = toNode(args);
        content = addSubNode(argsObj, 'content');
        fontSize = addSubNode(argsObj, 'fontSize');
        color = addSubNode(argsObj, 'color');
        family = addSubNode(argsObj, 'family');
        verticalAlign = addSubNode(argsObj, 'verticalAlign');
        if (!fontSize.val) fontSize.val = '16px';
        if (!color.val) color.val = 'black';
        if (!family.val) family.val = 'inherit';
        if (!verticalAlign.val) verticalAlign.val = 'middle';
    } else {
        content = toNode(args);
        fontSize = node('16px');
        color = node('black');
        family = node('inherit');
        verticalAlign = node('middle');
    }

    const textObj = {
        content,
        size: fontSize,
        color,
        family,
        verticalAlign
    };

    return preserveT(Inline('div', { content, size: fontSize }), {
        data: keyed(Text, textObj),
        layout: {
            disablePos: true,
            disableSiz: true
        },
        css: {
            position: 'relative',
            display: 'inline',
            //'font-size': fontSize,
            color: color,
            'font-family': family,
            'vertical-align': verticalAlign
        }
    });
};

const smooth = num =>
    Math.round((num + Number.EPSILON) * 1000) / 1000;

const getSizeOf16pxText = textObj => {
    const { family: familyN, content: contentN } = textObj;
    return tran(familyN, contentN, (family, content) => {
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
    });
};

const fitText = (textNode, tree) => {
    const textT = Text(textNode);
    const ans = line([textT]);

    const textObj = textT.elem.data.get(Text)[0];
    const fontSize = textObj.size;
    const prop = getSizeOf16pxText(textObj);
    const res = proportional(prop, Tree(tree.elem, ans));

    tran(tree.elem.layout.sizAbs, prop, ([nowX], [propX16]) => {
        if (nowX > 0) {
            const newSize = smooth((nowX / propX16) * 16);
            fontSize.val = newSize + 'px';
        }
    });

    return res;
};

const screenSize = () => {
    const getDeviceSize = () => [
        document.documentElement.clientWidth,
        document.documentElement.clientHeight
    ];

    const res = node(getDeviceSize());

    if (window.onresize) {
        const f = window.onresize;
        window.onresize = () => {
            const devSize = f();
            res.val = devSize;
            return devSize;
        };
    } else {
        window.onresize = () => {
            const devSize = getDeviceSize();
            res.val = devSize;
            return devSize;
        };
    }

    return res;
};

export { Cond, EXPONENTIAL, Entry, External, ExternalPos, ExternalSiz, FLIP, Img, Inline, LINEAR, QUADRATIC, Rect, RectT, Supp, SuppT, T, Text, Tree, _border, _container, _externalBorder, _mapT, _pathT, _proportional, _seamlessBorder, _style, _walkT, addChans, addCoord, addLayoutTriggers, addLen, addNodes, addStyle, addSubNode, applyF, asPx, border, chan, cond, condElse, container, coord, copyCoord, copyLen, core, defaultLayoutReactivity, endTransaction, externalBorder, fitImg, fitText, flex, flexX, flexY, fromStruc, getPx, getRel, hashNode, horizontal, horizontalSpace, keyed, len, line, listen, listenOnce, listenRef, mapT, mulCoord, mulLen, node, nodeObj, paragraph, pathT, preserveR, preserveT, proportional, px, removeEvents, removeListen, removeRect, removeTran, run, runDOM, runRect, runRectDOM, screenSize, scrollbar, seamlessBorder, space, splitCoord, startTransaction, stopTimed, style, subNode, subNode1, supp, timed, toInline, toLen, toNode, toStruc, top, tran, tranRef, transaction, tree, unsafeTran, unsafeTranRef, vertical, verticalSpace, walkT, withTree, x, y };
