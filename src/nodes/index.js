import {
    node,
    tran,
    safeTran,
    tranRef,
    toNode,
    mapN
} from '../node.js';
import { iterate, vectorPlus, copyArray } from '../utils/index.js';
import { mapT } from '../tree.js';
import { addEvent } from '../rect.js';
import {
    asPx,
    mulCoord,
    addCoord,
    coordToRel,
    coordToPx,
    copyCoord,
    copyLen
} from '../coord.js';

const scrollSizeRef = {};
const scrollRef = {};

const nodes = {
    fullSize: ({ elem, rect, tree, node: fs }) => {
        const t = tran([tree.children], () => {
            const chs = tree.children.val;
            const limits = chs.map(tCh => {
                const r = tCh.val;
                const lay = r.layout;
                const limit = node();
                tran([lay.posAbs, lay.sizAbs], () => {
                    const limitAbs = vectorPlus(
                        lay.posAbs.val,
                        lay.sizAbs.val
                    );
                    const limitLen = addCoord(
                        lay.pos.val,
                        lay.siz.val
                    );
                    limit.val = [limitAbs, limitLen];
                });
                return limit;
            });
            safeTran(limits, () => {
                fs.val = copyCoord(
                    limits
                        .map(l => l.val)
                        .reduce((l1, l2) => {
                            const [l1abs, l1len] = l1;
                            const [l2abs, l2len] = l2;
                            const [x1, y1] = l1abs;
                            const [xl1, yl1] = l1len;
                            const [x2, y2] = l2abs;
                            const [xl2, yl2] = l2len;
                            return [
                                x1 > x2 ? [x1, xl1] : [x2, xl2],
                                y1 > y2 ? [y1, yl1] : [y2, yl2]
                            ];
                        })[1]
                );
            });
        });
        rect.renderTrans.add(t);
    },
    scrollAbs: ({ elem, rect, node: scroll }) => {
        addEvent(rect, 'scroll', () => {
            scroll.val = [elem.scrollLeft, elem.scrollTop];
        });
        const t = tran([scroll], () => {
            const [l, t] = scroll.val;
            elem.scrollLeft = l;
            elem.scrollTop = t;
        });
        rect.renderTrans.add(t);
    },
    scroll: ({ elem, rect, node: scroll }) => {
        const limN = mapN([rect.layout.sizAbs], siz => [
            elem.scrollWidth - Math.round(siz[0]),
            elem.scrollHeight - Math.round(siz[1])
        ]);
        addEvent(rect, 'scroll', () => {
            const lim = limN.val;
            scroll.val = [
                lim[0] === 0 ? 0 : 100 * (elem.scrollLeft / lim[0]),
                lim[1] === 0 ? 0 : 100 * (elem.scrollTop / lim[1])
            ];
        });
        const t = tranRef(scrollRef, [scroll], () => {
            const [l, t] = scroll.val;
            const lim = limN.val;
            const res = [
                Math.round((l / 100) * lim[0]),
                Math.round((t / 100) * lim[1])
            ];
            if (elem.scrollLeft != res[0]) {
                elem.scrollLeft = res[0];
            }
            if (elem.scrollTop != res[1]) {
                elem.scrollTop = res[1];
            }
        });
        rect.renderTrans.add(t);
    }
};

export default mapT((r, t) => {
    if (r.nodes) {
        iterate(r.nodes, ([name, val]) => {
            const nd = name == 'fullSize' ? val : toNode(val);
            const ans = nodes[name];
            if (ans) {
                ans({
                    node: nd,
                    elem: r.inst.dom,
                    rect: r,
                    tree: t
                });
            }
        });
    }
    return r;
});
