import { node, tran, mapN } from '../node.js';
import { listen, chan } from '../channel.js';
import { Tree, Entry } from '../tree.js';
import { Rect, preserveR, Dummy } from '../rect.js';
import { RectT } from '../rect-tree.js';
import { len } from '../coord.js';
import { timed } from './animation.js';

// export const scrollbar = (scroll, max_) => {
//     const pos = node([0, 0]);

//     tran([scroll], () => {
//         const h = scroll.val[1];
//         pos.val = [50, (h * 95) / 100];
//     });

//     const click = chan();

//     const sizAbs_ = node();

//     listen([click], () => {
//         if (sizAbs_) {
//             const sizAbs = sizAbs_.val;
//             const val = click.get;
//             const x = val.offsetX;
//             const y = val.offsetY;
//             scroll.val = [
//                 (x / sizAbs[0]) * 100,
//                 (y / sizAbs[1]) * 100
//             ];
//         }
//     });

//     const a = node();

//     const r = RectT(
//         {
//             layout: {
//                 pos: [len(100, -10), 0],
//                 siz: a,
//                 sizAbs: sizAbs_
//             },
//             style: {
//                 //color: 'gray'
//             },
//             events: {
//                 click
//             }
//         },
//         RectT({
//             layout: {
//                 pos: pos,
//                 siz: [50, 5]
//             },
//             style: {
//                 color: 'orange'
//             }
//         })
//     );

//     tran([max_], () => {
//         const max = max_.val;
//         a.val = [len(0, 10), max[1]]; //len([0, (100 / 100) * max[1]], [10, 0]);
//     });

//     return r;
// };

export const scrollbar = tree => {
    const rect = tree.val;
    const scroll = node();
    const res = preserveR(rect, {
        nodes: {
            scroll
        }
    });

    const innerPos = node([50, 0]);
    tran([scroll], () => {
        const h = scroll.val[1];
        innerPos.val = [innerPos.val[0], (h * 95) / 100];
    });

    const outterPos = node([0, 0]);
    const outterSizAbs = node([0, 0]);

    const drag = chan();
    const over = chan();
    const out = chan();
    let dragging = false;
    const innerSiz = node([50, 5]);
    let oldVal = null;
    const click = chan();
    //listen([click], changePos(click));
    // listen([click], () => {
    //     if (outterSizAbs.val) {
    //         const val = click.get;
    //         const x = val.offsetX;
    //         const y = val.offsetY;
    //         console.log('click!', val);
    //         scroll.val = [
    //             0, //(x / outterSizAbs.val[0]) * 100,
    //             (y / outterSizAbs.val[1]) * 100
    //         ];
    //     }
    // });
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
    //             timed(scroll, { finalVal: [0, res], totalTime: 100 });
    //         }
    //     }
    // });
    // listen([over], () => {
    //     if (!dragging) {
    //         innerPos.val = [0, innerPos.val[1]];
    //         innerSiz.val = [100, 5];
    //     }
    // });
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
            // events: {
            //     click,
            //     drag
            // }
        }),
        RectT({
            layout: {
                pos: innerPos,
                siz: innerSiz
            },
            style: {
                color: 'orange'
            },
            // events: {
            //     mouseOver: over,
            //     mouseOut: out
            // }
        })
    );
    return Tree(Dummy(), [Tree(res, tree.children), sbar]);
};
