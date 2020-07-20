import {
    Rect,
    Tree,
    linesC,
    line,
    node,
    px,
    paragraph,
    vertical,
    verticalSpace,
    proportional,
    tran,
    flexY,
    listenOnce,
    run,
    toNode,
    Dummy,
    border,
    _border,
    mapT,
    walkT,
    toStruc,
    fromStruc,
    _container,
    _proportional,
    switcher,
    text,
    pathT
} from '../dist/dabr.js';
import { randomColor } from '../src/utils/index.js';

const r = Tree(
    Rect({
        layout: {
            pos: [30, 30],
            siz: [40, 40]
        },
        style: {
            color: 'navy'
        }
    }),
    [
        Tree(
            Rect({
                layout: {
                    pos: [10, 10],
                    siz: [30, 30]
                },
                style: {
                    color: 'white'
                }
            })
        ),
        Tree(
            Rect({
                layout: {
                    pos: [60, 60],
                    siz: [30, 30]
                },
                style: {
                    color: 'black'
                }
            }),
            Tree(
                Rect({
                    layout: {
                        pos: [50, 50],
                        siz: [30, 30]
                    },
                    style: {
                        color: 'orange'
                    }
                })
            )
        )
    ]
);

const f1 = _border(node({ color: 'red', width: 1 }));

const f2 = _border(node({ color: 'green', width: 1 }));

window.s = node(true);

const f3 = _container(window.s);

const f4 = _proportional(node([1, 1]));

//run(f1(r));
//run(f2(f1(r)));
//run(walkT(r, f1));
//run(walkT(r, x => f2(f1(x))));
//run(walkT(walkT(r, f1), f2));
//run(fromStruc(mapT(mapT(toStruc(r), f1), f2)));
//run(fromStruc(mapT(mapT(toStruc(r), f2), f3)));
//run(fromStruc(mapT(mapT(toStruc(r), f4), f1)));
//run(fromStruc(mapT(mapT(toStruc(r), f1), f4)));

const txt = node({ content: 'asdasdasd' });

const k = Tree(
    Rect({
        layout: {
            pos: [30, 30],
            siz: [40, 40]
        },
        style: {
            color: 'navy'
        }
    })
);

const isSupp = t => (t.val ? t.val.isSupp : true);
const appCore = f => x => (isSupp(x) ? x : f(x));

window.va = node();
window.c = node(2);
const k2 = Tree(
    Rect({
        layout: {
            pos: [30, 30],
            siz: [40, 40]
        },
        style: {
            color: 'navy'
        }
    }),
    switcher(window.c, {
        1: Tree(
            Rect({
                layout: {
                    pos: [10, 10],
                    siz: [30, 30]
                },
                style: {
                    color: 'white'
                }
            })
        ),
        2: Tree(
            Rect({
                layout: {
                    pos: [60, 60],
                    siz: [100, 100]
                },
                style: {
                    color: 'black'
                }
            }),
            f4(
                Tree(
                    Rect({
                        layout: {
                            pos: [30, 30],
                            siz: [50, 50],
                            sizAbs: window.va
                        },
                        style: {
                            color: randomColor()
                        }
                    }) //,
                    //line(txt)(k)
                )
            )
        )
    })
);

//run(k);
//run(line(txt)(k));
run(k2);
//run(walkT(k2, x => (isSupp(x) ? x : f1(x))));
//run(fromStruc(mapT(mapT(toStruc(r), f2), f3)));
//run(fromStruc(mapT(mapT(toStruc(r), f4), f1)));
//run(fromStruc(mapT(mapT(toStruc(r), f1), f4)));
//run(walkT(line(txt)(k), x => appCore(y => f1(f2(y)))(x)));
//run(walkT(k2, x => appCore(y => f2(f1(y)))(x)));
// run(
//     walkT(
//         k2,
//         (x, s) => {
//             const newS = s
//                 ? x.val.data.get(proportional) && s
//                     ? false
//                     : true
//                 : s;
//             console.log('S', s, newS);
//             return [newS ? f2(f1(x)) : x, newS];
//         },
//         true
//     )
// );

// const cowee = function(...args) {
//     console.log(this, ...args);
// };

// const obj = number => ({
//     ...{
//         hey: number,
//         now: number - 2,
//         brown: number - 3
//     },
//     ...{
//         alo: number + 1,
//         hey: number + 5,
//         cow: cowee
//     }
// });

// window.o = obj(3);
