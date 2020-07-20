import { node, tran, toNode } from '../node.js';
import { iterate, vectorPlus, copyArray } from '../utils/index.js';
import { mapT } from '../tree.js';
import { addEvent } from '../rect.js';
import {
    asPx,
    mulCoord,
    addCoord,
    copyCoord,
    copyLen,
    splitCoord,
    len
} from '../coord.js';

const scrollSizeRef = {};
const scrollRef = {};

const nodes = {
    fullSize: ({ elem, rect, tree, node: fs }) => {
        rect.tran([tree.children], () => {
            const chs = tree.children.val;
            const limits = chs.map(tCh => {
                const r = tCh.val;
                const lay = r.layout;
                return tran([lay.posAbs, lay.sizAbs], () => {
                    const limitAbs = vectorPlus(
                        lay.posAbs.val,
                        lay.sizAbs.val
                    );
                    const limitLen = addCoord(
                        lay.pos.val,
                        lay.siz.val
                    );
                    return [limitAbs, limitLen];
                });
            });
            tran(limits, () => {
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
        //rect.renderTrans.add(t);
    },
    fullSizeCor: ({ elem, rect, tree, node: fsc }) => {
        const fs = node();
        const res = nodes.fullSize({ elem, rect, tree, node: fs });
        const siz = rect.layout.sizAbs;
        const sca = rect.layout.scale;
        const pSiz = rect.inst.par.layout.sizAbs;
        rect.tran([fs, siz, pSiz, sca], () => {
            const [[fsrx, fsry], [fspx, fspy]] = splitCoord(fs.val);
            const [sx, sy] = siz.val;
            const [psx, psy] = pSiz.val;
            fsc.val = [
                len(((fsrx * sx) / psx) * sca.val[0], fspx),
                len(((fsry * sy) / psy) * sca.val[1], fspy)
            ];
        });
    },
    scrollAbs: ({ elem, rect, node: scroll }) => {
        addEvent(rect, 'scroll', () => {
            scroll.val = [elem.scrollLeft, elem.scrollTop];
        });
        rect.tran([scroll], () => {
            const [l, t] = scroll.val;
            elem.scrollLeft = l;
            elem.scrollTop = t;
        });
        //rect.renderTrans.add(t);
    },
    scroll: ({ elem, rect, node: scroll }) => {
        const limN = rect.tran([rect.layout.sizAbs], siz => {
            const w = elem.scrollWidth;
            const h = elem.scrollHeight;
            const sw = Math.round(siz[0]);
            const sh = Math.round(siz[1]);
            return [
                w - sw >= 0 ? w - sw : 0,
                h - sh >= 0 ? h - sh : 0
            ];
        });
        addEvent(rect, 'scroll', () => {
            const lim = limN.val;
            scroll.val = [
                lim[0] === 0 ? 0 : 100 * (elem.scrollLeft / lim[0]),
                lim[1] === 0 ? 0 : 100 * (elem.scrollTop / lim[1])
            ];
        });
        rect.tran(
            [scroll],
            () => {
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
            },
            scrollRef
        );
        //rect.renderTrans.add(t);
    }
};

export default tree =>
    mapT(tree, (r, t) => {
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
