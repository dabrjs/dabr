import * as Hel from '../src/utils/index.js';
import {
    node,
    nodeT,
    Rect,
    RectT,
    run,
    runDOM,
    chan,
    tran,
    listen,
    listenOnce,
    mapN,
    mapR,
    walkR,
    mapS,
    Tree,
    withTop,
    withMain,
    mapT
} from '../src/index.js';
import {
    toStruc,
    toRect,
    applyF,
    Later,
    Apply,
    runApply,
    mapA
} from '../src/struc.js';
import {
    switcher,
    border,
    proportional,
    scrollbar,
    hashNode,
    timed,
    stopTimed,
    container
} from '../src/lib/index.js';

const pos = node([10, 10]);
const siz = node([80, 80]);
const b = node(2);
//b2 = node(5),
const p = node([1, 1]);

const r = ch => Rect({ children: ch });

const ex1 = () =>
    Rect({
        layout: {
            pos,
            siz
        },
        style: {
            color: Hel.randomColor()
        },
        child: Rect({
            layout: {
                pos: [35, 35],
                siz: [30, 30]
            },
            style: {
                color: Hel.randomColor()
            }
        })
    });

// console.log('Starting ex1', ex1());
// const res1 = run(ex1());
// console.log('Result of ex1', res1);
// window.res1 = res1;

// const ex2 = border(b, ex1());
// console.log('Starting ex2', ex2);
// const res2 = run(ex2);
// console.log('Result of ex2', res2);
// window.res2 = res2;

//const ex4 = proportional(p, border(b, ex1()));
//console.log('Starting ex4', ex4);
//const res4 = runDOM(ex4, document.getElementById('lol'));
//console.log('Result of ex4', res4);
//window.ex4 = ex4;

// const ex5 = border(b, proportional(p, ex1()));
// console.log('Starting ex5', ex5);
// const res5 = run(ex5, res4.children.val[0].children.val[0].children.val[0]);
// console.log('Result of ex5', res5);
// window.res5 = res5;

// const ex6 = border(b, proportional([2, 1], proportional(p, ex1())));
// console.log('Starting ex6', ex6);
// const res6 = run(ex6);
// console.log('Result of ex6', res6);
// window.res6 = res6;

//setTimeout(() => { b.val = 5; p.val = [3,1]; },3000);

//window.lolo = toNode({
//    hey: pos,
//    lol: b
//});

window.pos = pos;

const h = chan();
listen([h], () => {
    s.val = [100, 1000];
    m.val = [100, 1000];
});

const m = node([100, 100]);
const s = node([100, 100]);

const k = node();
window.k = k;

const bobo = node({ color: 'red', width: 1 });
window.b = bobo;
//window.timed = timed;
const rec = () =>
    Rect({
        layout: {
            pos: [0, 40],
            siz: s,
            max: m
        },
        events: { click: h },
        style: {
            color: Hel.randomColor()
        },
        children: [
            scrollbar(k, m),
            Rect({
                layout: {
                    pos: [10, 10],
                    siz: [80, 80]
                },
                style: {
                    color: Hel.randomColor()
                },
                nodes: {
                    scroll: k
                },
                child: border(node({ color: 'cyan', width: 2 }))(
                    Rect({
                        layout: {
                            pos: [50, 50],
                            siz: [10, 1000]
                        },
                        style: {
                            color: 'black'
                        }
                    })
                )
            })
        ]
    });

const childs = node([rec()]);

const exaaaa2 = Rect({
    layout: {
        pos: [0, 0],
        siz: [100, 100]
    },
    events: {},
    style: {
        color: Hel.randomColor()
    },
    children: childs
});

const exaaaa2T = T(
    Rect({
        layout: {
            pos: [0, 0],
            siz: [100, 100]
        },
        events: {},
        style: {
            color: Hel.randomColor()
        }
    }),
    childs
);

// window.childs = childs;
// window.ex2 = ex2;
// const c2 = run(ex2);
// destroyRect(c2);
// //console.log("alo", c2.children == childs, ex2.children == childs,  childs.val, c2.children);
// const c3 = run(ex2);
// console.log("alo", c3.children == childs, c2.children == childs, ex2.children == childs, childs.val, c3.children.val);

// window.hey = () => {

//     const r = rec();
//     childs.val = [r];

// };

///////////

const ch = (pos, siz) =>
    Rect({
        layout: {
            pos,
            siz
        },
        style: {
            color: Hel.randomColor()
        }
    });
const rou = hashNode();
const lala = node([20, 20]);
window.pos = lala;

const cl = chan();

//listenOnce([cl], () => {
//    rou.val = 'rect';
//});

const yoo = node([100, 100]);

let handle;

window.act = () => {
    handle = timed(yoo, { finalVal: [50, 50], totalTime: 1000 });
};

window.act2 = () => {
    stop(handle);
    timed(yoo, { finalVal: [100, 100], totalTime: 6000 });
};

const transformation = r =>
    applyF(r, [
        r => r
        //toStruc,
        //s => mapS(s, border(bobo))
        //s => mapS(s, border(bobo))
        //toRect
    ]);

// parei aqui: tenho que implementar maneiras de para a animação e fazer com que a mesma animação não possa ser trigada enquanto tem uma rodando
const ola = Rect({
    layout: {
        pos: [0, 0],
        siz: yoo
    },
    style: {
        color: Hel.randomColor()
    },
    events: {
        click: cl
    },
    children: switcher(rou, {
        '': {
            destroy: true,
            content: ch(lala, [90, 90])
        },
        hey: ch([40, 40], [20, 20]),
        fuck: {
            destroy: false,
            content: ch([0, 0], [100, 100])
        },
        rect: {
            destroy: true,
            content: exaaaa2
        }
    })
});

window.rou = rou;
window.ola = ola;

//const c1 = chan();
//const c2 = chan();
//const lol = (d1, d2) => {
//     const d3 = chan();

//     listen([d1], () => {
//         listenOnce([d2], () => {
//             d3.val = true;
//         });
//     });

//     return d3;
// };

//listen([lol(c1, c2)], () => {
//    console.log('yep');
//});

// window.ha = () => {
//     c1.val = 5;
//     c2.val = 7;
// };

//const g = run(transformation(ola));

window.f = node(true);
const res = border(bobo)(
    container(window.f)(
        Rect({
            layout: {
                pos: [30, 30],
                siz: [70, 70]
            },
            style: {
                color: 'blue'
            }
        })
    )
);
const res2 = container(window.f)(
    border(bobo)(
        Rect({
            layout: {
                pos: [30, 30],
                siz: [70, 70]
            },
            style: {
                color: 'blue'
            }
        })
    )
);
const res3 = border(bobo)(
    Later(container(window.f))([
        Rect({
            layout: {
                pos: [30, 30],
                siz: [70, 70]
            },
            style: {
                color: 'blue'
            }
        })
    ])
);

window.f = node(true);
const ba = border({ color: 'gray', width: 4 });
const ca = container(window.f);

const res4 = Tree(
    Rect({
        layout: {
            pos: [30, 30],
            siz: [70, 70]
        },
        style: {
            color: 'blue'
        }
    }),
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

//const resh = mapA(res4, cj);
//const res44 = mapA(resh, bj);
//const res444 = runApply(res44, [bj, cj]);
//window.p = resh;
//window.o = res44;
//console.log('hhhhhhhhhhhh', resh, res44, res444);
run(res4);

// const a1 = Apply(([x, y]) => {
//     console.log(x, y);
//     return x + y;
// });
// const a2 = Apply(x => Apply(y => y * 3)(x));
// const j = a2(a1([5, 8]));

// console.log(
//     ',,,,,,,,,,,,,,,,,',
//     j,
//     j.funcs[0].ref == a1,
//     runApply(j)
// );

//console.log(
//    'jjjjjjjjj',
//    walkR(g, r => console.log(r, r.inst)),
//    g,
//    ola
//);
