import { node, tran, mapN } from '../node.js';
import { Supp, preserveR, keyed } from '../rect.js';
import { px, len } from '../coord.js';
import { Tree, Entry } from '../tree.js';

export const border = b => rect => {
    const innerPos = node();
    const innerSiz = node();
    const color = mapN([b], ({ color }) => color);
    const width = mapN([b], ({ width }) => width);
    tran([width], () => {
        const w = width.val;
        innerPos.val = [px(w), px(w)]; //len([0, 0], [w, w]);
        innerSiz.val = [len(100, -2 * w), len(100, -2 * w)]; //len([100, 100], [-2 * w, -2 * w]);
    });
    return Tree(
        Supp({
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
        }),
        [
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
                Entry
            )
        ]
    );
};
