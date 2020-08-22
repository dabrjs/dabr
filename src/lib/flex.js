import { node, tran } from '../node.js';
import { preserveR } from '../rect.js';
import { Tree } from '../tree.js';
import { px, asPx } from '../coord.js';
import { withTree } from '../rect-tree.js';
import {
    setParentScale,
    setParentScaleX,
    setParentScaleY
} from '../scale.js';

export const flex = tree => {
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

export const flexX = tree => {
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

export const flexY = tree => {
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
