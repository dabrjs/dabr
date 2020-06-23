import { isArray, isEqual, singleton } from './utils/index.js';
import { node, tran, mapN, toNode } from './node.js';

// A tree of anything in which every children are actually nodes (DABR
// nodes). You can define children as an array or only 1 element and
// as a node or not a node but in the end it always becomes a node
// with an array of trees inside.
export const Tree = (val, children) => {
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
export const T = Tree;

// Maps a function through the rect
export const mapT = f => (tree, path = []) =>
    Tree(
        f(tree.val, tree, path),
        tree.children.isEntry
            ? tree.children
            : mapN([tree.children], chs =>
                  chs.map((ch, i) => mapT(f)(ch, path.concat(i)))
              )
    );

export const treePath = (tree, path) => {
    let res = null;
    walkT((t, p) => {
        if (isEqual(p, path)) {
            res = t;
        }
    })(tree);
    return res;
};

export const getFirst = tree => treePath(tree, []);

// Similar to map but the output does not matter
export const walkT = f => (tree, path = []) => {
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
export const Entry = {
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
export const flatten = tree => {
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
