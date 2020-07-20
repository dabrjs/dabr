import { isNull, isNotNull } from '../utils/index.js';
import { node, tran } from '../node.js';
import { listenOnce } from '../channel.js';
import { keyed, preserveR } from '../rect.js';
import { px, len, asPx, addCoord } from '../coord.js';
import { Tree } from '../tree.js';
import { RectT } from '../rect-tree.js';
import {
    setParentScale,
    setParentScaleX,
    setParentScaleY
} from '../scale.js';

export const flex = rect => {
    const s = node([100, 100]);
    listenOnce([rect.init], () => {
        rect.inst.dom.style['overflow'] = 'hidden';
    });
    return setParentScale(
        preserveR(rect, {
            layout: {
                siz: s
            },
            nodes: {
                fullSize: s
            }
        })
    );
};

export const flexX = rect => {
    const s = node([100, 100]);
    const siz = tran([s, rect.layout.siz], ([x], [, y]) => [x, y]);
    listenOnce([rect.init], () => {
        rect.inst.dom.style['overflow'] = 'hidden';
    });
    return setParentScaleX(
        preserveR(rect, {
            layout: {
                siz
            },
            nodes: {
                fullSize: s
            }
        })
    );
};

export const flexY = rect => {
    const s = node([100, 100]);
    const siz = tran([s, rect.layout.siz], ([, y], [x]) => [x, y]);
    listenOnce([rect.init], () => {
        rect.inst.dom.style['overflow'] = 'hidden';
    });
    return setParentScaleY(
        preserveR(rect, {
            layout: {
                siz
            },
            nodes: {
                fullSize: s
            }
        })
    );
};
