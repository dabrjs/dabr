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
    // fullSize2: ({ elem, rect, tree, node: fs }) => {
    //     console.log('fsssssssssssss', fs.target.trans);
    //     window.fs = fs;
    //     const t = tran([tree.children], () => {
    //         const chs = tree.children.val;
    //         let fsAbs = [0, 0];
    //         const limits = chs.map(tCh => {
    //             const r = tCh.val;
    //             const lay = r.layout;
    //             const limit = node();
    //             tran([lay.posAbs, lay.sizAbs], () => {
    //                 const limitAbs = vectorPlus(
    //                     lay.posAbs.val,
    //                     lay.sizAbs.val
    //                 );
    //                 const limitLen = addCoord(
    //                     lay.pos.val,
    //                     lay.siz.val
    //                 );
    //                 limit.val = [limitAbs, limitLen];
    //             });
    //             return limit;
    //         });
    //         tran(limits, () => {
    //             const auxAbs = fsAbs;
    //             const aux = fs.val || [0, 0];
    //             limits.forEach(limit => {
    //                 const [limitAbs, limitLen] = limit.val;
    //                 if (limitAbs[0] > fsAbs[0]) {
    //                     auxAbs[0] = limitAbs[0];
    //                     aux[0] = limitLen[0];
    //                 }
    //                 if (limitAbs[1] > fsAbs[1]) {
    //                     auxAbs[1] = limitAbs[1];
    //                     aux[1] = limitLen[1];
    //                 }
    //             });
    //             fsAbs = auxAbs;
    //             console.log(
    //                 'alalalaallal',
    //                 aux[0],
    //                 aux[1],
    //                 fs.target.changed
    //             );
    //             fs.val = aux;
    //             console.log(
    //                 'alalalaallal',
    //                 aux[0],
    //                 aux[1],
    //                 fs.target.changed
    //             );
    //         });
    //     });
    //     window.fs2 = fs;
    //     tran([fs], () => {
    //         console.log(
    //             'rofl',
    //             fs.val[0],
    //             fs.val[1],
    //             fs.target.val[0],
    //             fs.target.val[1],
    //             fs.target.changed
    //         );
    //     });
    //     rect.renderTrans.add(t);
    // },
    fullSize: ({ elem, rect, tree, node: fs }) => {
        const t = safeTran([tree.children], () => {
            const chs = tree.children.val;
            let fsAbs = [0, 0];
            chs.forEach(tCh => {
                const r = tCh.val;
                const lay = r.layout;
                safeTran([lay.posAbs, lay.sizAbs], () => {
                    const limitAbs = vectorPlus(
                        lay.posAbs.val,
                        lay.sizAbs.val
                    );
                    const limit = addCoord(lay.pos.val, lay.siz.val);
                    let auxAbs = copyCoord(fsAbs);
                    const aux = copyCoord(fs.val) || [0, 0];
                    if (limitAbs[0] > fsAbs[0]) {
                        auxAbs[0] = copyLen(limitAbs[0]);
                        aux[0] = copyLen(limit[0]);
                    }
                    if (limitAbs[1] > fsAbs[1]) {
                        auxAbs[1] = copyLen(limitAbs[1]);
                        aux[1] = copyLen(limit[1]);
                    }
                    if (
                        limitAbs[0] > fsAbs[0] ||
                        limitAbs[1] > fsAbs[1]
                    ) {
                        fsAbs = copyCoord(auxAbs);
                        fs.val = copyCoord(aux);
                    }
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
