import { node, tran } from '../node.js';
import { Supp, preserveR, keyed } from '../rect.js';
import { Tree } from '../tree.js';
import { px } from '../coord.js';

export const proportional = (prop, tree) => {
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

export const _proportional = prop => tree => proportional(prop, tree);

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
