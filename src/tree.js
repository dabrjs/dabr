import { isArray, isEqual, singleton } from './utils/index.js';
import { node, tran, toNode } from './node.js';

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

export const Tree = (elem, ...childrens) => {
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
export const T = Tree;

// (a -> b) -> Tree a -> Tree b
export const mapT = (tree, f, path = []) =>
    Tree(
        f(tree.elem, tree, path),
        tree.children.isEntry
            ? tree.children
            : tran(tree.children, chs =>
                  chs.map((ch, i) => mapT(ch, f, path.concat(i)))
              )
    );
export const _mapT = (f, path = []) => tree => mapT(tree, f, path);

// Special object used to indicate entry-points to flatten Trees of
// Trees of A into Trees of A (see 'flatten' function)
export const Entry = {
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
export const walkT = (tree, f, state = null, path = []) => {
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
export const _walkT = (f, state = null, path = []) => tree =>
    walkT(tree, f, state, path);

export const pathT = (tree, path) => {
    let res = null;
    walkT(tree, (t, s, p) => {
        if (isEqual(p, path)) {
            res = t;
        }
    });
    return res;
};
export const _pathT = path => tree => pathT(tree, path);

export const toStruc = tree => mapT(tree, x => Tree(x, Entry));

// Flattens a Tree of Trees using the Entry special object as an
// indicator of how to flatten the trees. Really useful for all sorts
// of transformations.
export const fromStruc = tree => {
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
