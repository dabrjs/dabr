import { tran, tranRef, toNode, mapN } from '../node.js';
import { iterate, vectorPlus } from '../utils/index.js';
import { mapT } from '../tree.js';
import { addEvent } from '../rect.js';
import {
    asPx,
    mulCoord,
    addCoord,
    coordToRel,
    coordToPx
} from '../coord.js';

const scrollSizeRef = {};
const scrollRef = {};

const nodes = {
    fullSize: ({ elem, rect, tree, node: fs }) => {
        const t = tran([tree.children], () => {
            const chs = tree.children.val;
            let fsAbs = [0, 0];
            chs.forEach(t => {
                const r = t.val;
                const lay = r.layout;
                tranRef(t, [lay.posAbs, lay.sizAbs], () => {
                    const limitAbs = vectorPlus(
                        lay.posAbs.val,
                        lay.sizAbs.val
                    );
                    const limit = addCoord(lay.pos.val, lay.siz.val);
                    const auxAbs = fsAbs;
                    const aux = fs.val || [0, 0];
                    if (limitAbs[0] > fsAbs[0]) {
                        auxAbs[0] = limitAbs[0];
                        aux[0] = limit[0];
                    }
                    if (limitAbs[1] > fsAbs[1]) {
                        auxAbs[1] = limitAbs[1];
                        aux[1] = limit[1];
                    }
                    fsAbs = auxAbs;
                    fs.val = aux;
                });
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
            const nd = toNode(val);
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
