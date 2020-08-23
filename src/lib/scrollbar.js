import { node, tran } from '../node.js';
import { listen, chan } from '../channel.js';
import { Tree } from '../tree.js';
import { Supp, Rect, preserveR } from '../rect.js';
import { RectT } from '../rect-tree.js';
import { len } from '../coord.js';
import { timed } from './animation.js';

export const scrollbar = tree => {
    const rect = tree.elem;
    const scroll = node();
    const res = preserveR(rect, {
        nodes: {
            scroll
        }
    });

    const innerPos = node([50, 0]);
    tran([scroll], () => {
        // hack to avoid scroll-link warning
        setTimeout(() => {
            const h = scroll.val[1];
            const ans = (h * 95) / 100;
            if (ans >= 0) {
                innerPos.val = [innerPos.val[0], ans];
            }
        }, 0);
    });

    const outterSizAbs = node([0, 0]);

    // const drag = chan();
    // const over = chan();
    // const out = chan();
    let dragging = false;
    const innerSiz = node([50, 5]);
    let oldVal = null;
    const click = chan();
    //listen([click], changePos(click));
    listen([click], () => {
        if (outterSizAbs.val) {
            const val = click.get;
            //const x = val.offsetX;
            const y = val.offsetY;
            scroll.val = [
                0, //(x / outterSizAbs.val[0]) * 100,
                (y / outterSizAbs.val[1]) * 100
            ];
        }
    });
    // listen([drag], () => {
    //     const val = drag.get;
    //     if (
    //         !oldVal ||
    //         !(
    //             oldVal.clientY - val.clientY <
    //             oldVal.layerY - val.layerY
    //         )
    //     ) {
    //         if (val == false) {
    //             dragging = false;
    //             innerPos.val = [50, innerPos.val[1]];
    //             innerSiz.val = [50, 5];
    //         } else {
    //             dragging = true;
    //             innerPos.val = [0, innerPos.val[1]];
    //             innerSiz.val = [100, 5];
    //             let res = (val.layerY / outterSizAbs.val[1]) * 100;
    //             if (res < 1) res = 1;
    //             if (res > 100) res = 100;
    //             oldVal = val;
    //             //timed(scroll, { finalVal: [0, res], totalTime: 100 });
    //             scroll.val = [0, res];
    //         }
    //     }
    // });
    listen([over], () => {
        if (!dragging) {
            innerPos.val = [0, innerPos.val[1]];
            innerSiz.val = [100, 5];
        }
    });
    // listen([out], () => {
    //     if (!dragging) {
    //         innerPos.val = [50, innerPos.val[1]];
    //         innerSiz.val = [50, 5];
    //     }
    // });
    const sbar = Tree(
        Rect({
            layout: {
                pos: [len(100, -10), 0],
                siz: [len(0, 10), 100],
                sizAbs: outterSizAbs
            },
            events: {
                click
                //drag
            }
        }),
        RectT({
            layout: {
                pos: innerPos,
                siz: innerSiz
            },
            style: {
                color: 'orange'
            }
            // events: {
            //     mouseOver: over,
            //     mouseOut: out
            // }
        })
    );
    return Tree(Supp(), [Tree(res, tree.children), sbar]);
};
