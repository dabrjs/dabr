import { Tree, mapT } from './tree.js';
import { Rect, Supp } from './rect.js';

// A set of functions for easy Tree of Rect manipulation

// Define a tree of rect and its in 1 function
export const RectT = (def, chs) => Tree(Rect(def), chs);

// Same thing as RectT but for support rects
export const SuppT = (def, chs) => Tree(Supp(def), chs);

// Apply function 'f' if condition 'cond' holds, or else do nothing
export const cond = c => f => mapT(x => (c(x) ? f(x) : x));

// Cond but with else clause as well
export const condElse = (c1, c2) => (f1, f2) =>
    mapT(x => (c1(x) ? f1(x) : c2(x) ? f2(x) : x));

// Apply function if element is Rect and is core
export const core = cond(x => x.isCore);

// Apply function if element is Rect is support
export const supp = cond(x => x.isSupp);

// Apply function if element is a Tree
export const tree = cond(x => x.isTree);

// Apply function only to the most top-level element of the tree
export const top = f => tree => Tree(f(tree.elem), tree.children);
