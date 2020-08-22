// Type checking functions

const isWeakMap = xs =>
    xs.constructor && xs.constructor.name == 'WeakMap';

const isArray = x =>
    !!x && x.constructor && x.constructor.name == 'Array';

const isObj = x =>
    !!x &&
    typeof x == 'object' &&
    x.constructor &&
    x.constructor.name != 'Array';

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
const mapT = (tree, f, path = []) =>
    Tree(
        f(tree.elem, tree, path),
        tree.children.isEntry
            ? tree.children
            : tran(tree.children, chs =>
                  chs.map((ch, i) => mapT(ch, f, path.concat(i)))
              )
    );
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

const withTree = (tree, f) =>
    Tree(f(tree.elem), tree.children);

const preserveT = (tree, changes) =>
    withTree(tree, r => preserveR(r, changes));

// Add render transitions related to layout (positioning)
const addLayoutTriggers = (layout, elem, rect, parLayout) => {
    const sca = coord(parLayout.scale);

    const pos = coord(layout.pos);
    const dPos = layout.disablePos;
    const posChanged = layout.posChanged;
    const posAbsRender = layout.enablePosAbs;
    // rect.tran([pos[0], sca[0]], () => {
    //     const p = toLen(pos[0].val);
    //     const a = sca[0].val;
    //     elem.style.left = `calc(${p.rel * a}% + ${p.px}px)`;
    // });
    // rect.tran([pos[1], sca[1]], () => {
    //     const p = toLen(pos[1].val);
    //     const a = sca[1].val;
    //     elem.style.top = `calc(${p.rel * a}% + ${p.px}px)`;
    // });

    //const pos = coord(layout.pos);
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
    //rect.renderTrans.add(posT);

    // const siz = coord(layout.siz);
    // rect.tran([siz[0], sca[0]], () => {
    //     const s = toLen(siz[0].val);
    //     const a = sca[0].val;
    //     elem.style.width = `calc(${s.rel * a}% + ${s.px}px)`;
    // });
    // rect.tran([siz[1], sca[1]], () => {
    //     const s = toLen(siz[1].val);
    //     const a = sca[1].val;
    //     elem.style.height = `calc(${s.rel * a}% + ${s.px}px)`;
    // });

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
    //rect.renderTrans.add(sizT);
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
                if (!dPos.val) {
                    if (dPos.val == 'x') {
                        rect.inst.dom.style.left =
                            posAbsN.val[0] - pPosAbs[0] + 'px';
                    } else if (dPos.val == 'y') {
                        rect.inst.dom.style.top =
                            posAbsN.val[1] - pPosAbs[1] + 'px';
                    } else {
                        rect.inst.dom.style.left =
                            posAbsN.val[0] - pPosAbs[0] + 'px';
                        rect.inst.dom.style.top =
                            posAbsN.val[1] - pPosAbs[1] + 'px';
                    }
                }
            }
            sizAbsN.val = vectorPlus(sizAbs, sizPx);
            if (enSiz.val) {
                if (!dSiz.val) {
                    if (dSiz.val == 'x') {
                        rect.inst.dom.style.width =
                            sizAbsN.val[0] + 'px';
                    } else if (dSiz.val == 'y') {
                        rect.inst.dom.style.height =
                            sizAbsN.val[1] + 'px';
                    } else {
                        rect.inst.dom.style.width =
                            sizAbsN.val[0] + 'px';
                        rect.inst.dom.style.height =
                            sizAbsN.val[1] + 'px';
                    }
                }
            }
            rect.layout.posAbsChanged.put = true;
            rect.layout.sizAbsChanged.put = true;
        }
    );
};

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
var ResizeObserver$1 = /** @class */ (function () {
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
    ResizeObserver$1.prototype[method] = function () {
        var _a;
        return (_a = observers.get(this))[method].apply(_a, arguments);
    };
});

var index = (function () {
    // Export existing implementation if available.
    if (typeof global$1.ResizeObserver !== 'undefined') {
        return global$1.ResizeObserver;
    }
    return ResizeObserver$1;
})();

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

    new index(entries => {
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

const ExternalPos = children => {
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

export { Entry, External, ExternalPos, ExternalSiz, Rect, RectT, Supp, SuppT, T, Tree, _mapT, _pathT, _walkT, addChans, addCoord, addLayoutTriggers, addLen, addNodes, addStyle, addSubNode, applyF, asPx, chan, cond, condElse, coord, copyCoord, copyLen, core, defaultLayoutReactivity, endTransaction, fromStruc, getPx, getRel, keyed, len, listen, listenOnce, listenRef, mapT, mulCoord, mulLen, node, nodeObj, pathT, preserveR, preserveT, px, removeEvents, removeListen, removeRect, removeTran, run, runDOM, runRect, runRectDOM, splitCoord, startTransaction, subNode, subNode1, supp, toLen, toNode, toStruc, top, tran, tranRef, transaction, tree, unsafeTran, unsafeTranRef, walkT, withTree, x, y };
