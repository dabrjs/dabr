import {
    applyF,
    //
    run,
    //
    border,
    container,
    switcher,
    hashNode,
    scrollbar,
    proportional,
    //
    flatten,
    walkT,
    //
    node,
    tran,
    //
    chan,
    listen,
    listenOnce,
    //
    Rect,
    Tree,
    //
    RectT,
    top,
    core,
    tree
} from '../dist/dabr.js';
import {
    text,
    line,
    linesL,
    linesR,
    linesC
} from '../src/lib/index.js';
import { randomColor } from '../src/utils/index.js';

window.b = node({ color: 'orange', width: 1 });

const ba = border(window.b);

window.f = node(true);

const ca = container(window.f);

const res4 = RectT(
    {
        layout: {
            pos: [30, 30],
            siz: [70, 70]
        },
        style: {
            color: 'blue'
        }
    },
    [
        RectT({
            layout: {
                pos: [30, 30],
                siz: [70, 70]
            },
            style: {
                color: 'cyan'
            }
        }),
        RectT({
            layout: {
                pos: [0, 0],
                siz: [30, 30]
            },
            style: {
                color: 'black'
            }
        })
    ]
);

const F = applyF([
    top(ca),
    flatten,
    core(ba),
    tree(
        core(r => {
            r.style.color = randomColor();
            return r;
        })
    )
]);

const resh = F(res4);
//console.log('hhhhhhhhhhhh', resh);
//run(resh);

/**************************/

const rou = hashNode();

const rect1 = (pos, siz) =>
    RectT({
        layout: {
            pos,
            siz
        },
        style: {
            color: randomColor()
        }
    });

const cl = chan();
listenOnce([cl], () => {
    rou.val = 'rect';
});

const h = chan();
listen([h], () => {
    s.val = [100, 1000];
    m.val = [100, 1000];
});
const m = node([100, 100]);
const s = node([100, 100]);

const k = node();
window.k = k;

const rect3 = () =>
    RectT(
        {
            layout: {
                pos: [0, 40],
                siz: s,
                max: m
            },
            events: { click: h },
            style: {
                color: randomColor()
            }
        },
        [
            scrollbar(k, m),
            RectT(
                {
                    layout: {
                        pos: [10, 10],
                        siz: [80, 80]
                    },
                    style: {
                        color: randomColor()
                    },
                    nodes: {
                        scroll: k
                    }
                },
                Tree(
                    Rect({
                        layout: {
                            pos: [50, 50],
                            siz: [1000, 1000]
                        },
                        style: {
                            color: 'black'
                        }
                    })
                )
            ),
            Tree(
                linesC([tt,tt2])(
                    Rect({
                        layout: {
                            pos: [0, 0],
                            siz: [100, 10]
                        }
                        //style: {
                        //    color: randomColor()
                        //}
                    })
                )
            )
        ]
    );

const tt = node({
    color: 'white',
    //size: '1em',
    family: 'Arial',
    content:
        'Lorem Ipsum is simply dummy text of the printing and typesetting industry.'
});
const tt2 = node({
    color: 'cyan',
    //size: '1em',
    family: 'Arial',
    content:
        'Loreasdkasdoas doaisdmaosdi aosid asodi asodiahsfoa sodiasb foaisbf.'
});
window.tt = tt;
window.tt2 = tt2;

const rect2 = RectT(
    {
        layout: {
            pos: [10, 10],
            siz: [80, 80]
        },
        style: {
            color: randomColor()
        },
        events: {
            click: cl
        }
    },
    switcher(rou, {
        '': {
            destroy: true,
            content: rect1([20, 20], [90, 90])
        },
        hey: rect1([40, 40], [20, 20]),
        fuck: {
            destroy: false,
            content: rect1([0, 0], [100, 100])
        },
        rect: {
            destroy: true,
            content: rect3() //top(proportional(node([1, 1])))(rect3())
        }
    })
);

console.log('asdasdasd', rect2);
run(rect2);
