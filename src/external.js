import { px, asPx } from './coord.js';
import {
    node,
    tran,
    addSubNode,
    toNode,
    transaction
} from './node.js';
import { Rect, Supp, preserveR, keyed } from './rect.js';
import { Tree } from './tree.js';
import { withTree } from './rect-tree.js';
import { isObj } from './utils/index.js';
import { proportional } from './lib/proportional.js';

export const External = (children, parent = Rect()) => {
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

export const ExternalSiz = (children, parent = Rect()) => {
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

export const ExternalPos = (children, parent = Rect()) => {
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
