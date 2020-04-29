import { tran, toNode, mapN } from '../node.js';
import { iterate } from '../utils/index.js';
import { mapT } from '../tree.js';

const nodes = {
    scrollAbs: ({ elem, rect, node: scroll }) => {
        elem.addEventListener('scroll', () => {
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
        elem.addEventListener('scroll', () => {
            const lim = limN.val;
            scroll.val = [
                lim[0] === 0 ? 0 : 100 * (elem.scrollLeft / lim[0]),
                lim[1] === 0 ? 0 : 100 * (elem.scrollTop / lim[1])
            ];
        });
        const t = tran([scroll], () => {
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

export default mapT(r => {
    if (r.nodes) {
        iterate(r.nodes, ([name, val]) => {
            const nd = toNode(val);
            const ans = nodes[name];
            if (ans) {
                ans({
                    node: nd,
                    elem: r.inst.dom,
                    rect: r
                });
            }
        });
    }
    return r;
});
