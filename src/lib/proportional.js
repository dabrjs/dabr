import { node, tran } from '../node.js';
import { listenOnce } from '../channel.js';
import { preserveR, keyed } from '../rect.js';
import { SuppT } from '../rect-tree.js';
import { Tree, Entry } from '../tree.js';
import { px } from '../layout.js';

export const proportional = prop => rect => {
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
