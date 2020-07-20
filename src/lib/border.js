import { node, tran } from '../node.js';
import { listenOnce } from '../channel.js';
import { Supp, preserveR, keyed } from '../rect.js';
import { px, len } from '../coord.js';
import { Tree, Entry } from '../tree.js';

export const border = (b, tree) => {
    const rect = tree.val;
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

export const _border = b => tree => border(b, tree);
