import { node, tran } from '../node.js';
import { Supp, preserveR, keyed } from '../rect.js';
import { px, len, addCoord } from '../coord.js';
import { Tree } from '../tree.js';

export const border = (b, tree) => {
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

export const _border = b => tree => border(b, tree);

export const externalBorder = (b, tree) => {
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

export const _externalBorder = b => tree => externalBorder(b, tree);

export const seamlessBorder = (b, tree) => {
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

export const _seamlessBorder = b => tree => seamlessBorder(b, tree);
