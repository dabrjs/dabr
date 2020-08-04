import { node, tran } from '../node.js';
import { preserveR } from '../rect.js';
import {
    setParentScale,
    setParentScaleX,
    setParentScaleY
} from '../scale.js';

export const flex = rect => {
    const s = node([100, 100]);
    rect.withDOM(dom => {
        dom.style['overflow'] = 'hidden';
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
    rect.withDOM(dom => {
        dom.style['overflow'] = 'hidden';
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
    rect.withDOM(dom => {
        dom.style['overflow'] = 'hidden';
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
