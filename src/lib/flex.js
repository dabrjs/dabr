import { node, tran, tranRef, mapN } from '../node.js';
import { listenOnce } from '../channel.js';
import { keyed, preserveR } from '../rect.js';
import { px, asPx, addCoord, coordToRel } from '../coord.js';
import { Tree } from '../tree.js';
import { RectT } from '../rect-tree.js';

export const flex = rect => {
    const s = node([100, 100]);
    return preserveR(rect, {
        layout: {
            siz: s,
            max: s
        },
        nodes: {
            fullSize: s
        }
    });
};

export const flexX = rect => {
    const s = node([100, 100]);
    const siz = mapN([s, rect.layout.siz], ([x], [, y]) => [x, y]);
    const max = mapN([s, rect.layout.max], ([x], [, y]) => [x, y]);
    return preserveR(rect, {
        layout: {
            siz,
            max
        },
        nodes: {
            fullSize: s
        }
    });
};

export const flexY = rect => {
    const s = node([100, 100]);
    const siz = mapN([s, rect.layout.siz], ([, y], [x]) => [x, y]);
    const max = mapN([s, rect.layout.max], ([, y], [x]) => [x, y]);
    return preserveR(rect, {
        layout: {
            siz,
            max
        },
        nodes: {
            fullSize: s
        }
    });
};
