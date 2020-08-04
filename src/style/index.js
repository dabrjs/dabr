import { iterate } from '../utils/index.js';
import { toNode } from '../node.js';
import { mapT } from '../tree.js';

const styleAttrs = {
    color: ({ elem, node: col }) => () => {
        elem.style['background-color'] = col.val;
    },
    show: ({ elem, node: sh }) => () => {
        if (sh.val) {
            elem.style['display'] = 'block';
        } else {
            elem.style['display'] = 'none';
        }
    } // ,
    // css: ({ elem, node: obj }) => () => {
    //     Object.entries(obj.val).forEach(([attr, val]) => {
    //         elem.style[attr] = val;
    //     });
    // }
};

// Binds CSS properties to nodes
export default tree =>
    mapT(tree, r => {
        if (r.style) {
            iterate(r.style, ([name, val]) => {
                const nd = toNode(val);
                const ans = styleAttrs[name];
                if (ans) {
                    const tr = ans({
                        node: nd,
                        elem: r.inst.dom,
                        rect: r
                    });
                    r.tran(nd, tr);
                }
            });
        }
        return r;
    });
