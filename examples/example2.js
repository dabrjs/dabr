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
    tree,
    mapT,
    Dummy,
    vertical,
    horizontal,
    toNode,
    verticalSpace,
    horizontalSpace,
    flex,
    flexX,
    flexY,
    px,
    len,
    mapN
} from '../dist/dabr.js';
import {
    text,
    paragraph,
    paragraphMin,
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

const ss = node();

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
            },
            nodes: {
                //fullSize: ss
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
                linesC([tt, tt2])(
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
    family: 'Arial',
    content:
        'Lorem Ipsum is simply dummy text of the printing and typesetting industry.'
});
const tt2 = node({
    color: 'cyan',
    family: 'Arial',
    content:
        'Loreasdkasdoas doaisdmaosdi aosid asodi asodiahsfoa sodiasb foaisbf.'
});
window.tt = tt;
window.tt2 = tt2;

////////////////

const area = (pos, siz) =>
    Rect({
        layout: {
            pos,
            siz
        }
    });

const rect = siz => {
    const sizN = toNode(siz);
    const child = linesC([
        node({
            content: 'Título'
        })
    ])(
        Rect({
            layout: {
                pos: [0, 0],
                siz: [100, 20]
            }
        })
    );
    return RectT(
        {
            layout: {
                pos: [0, 0],
                siz: sizN
            },
            style: {
                color: randomColor()
            }
        },
        child
    );
};

const scrolla = node();
window.s = scrolla;
const max = node([100, 100]);

const textNode = node({
    color: 'black',
    size: '16px',
    content:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur id lorem vitae purus venenatis iaculis. Etiam pharetra ligula elit, sit amet interdum eros vestibulum a. Integer pretium id odio a iaculis. Nullam id nunc interdum sem varius malesuada. Suspendisse cursus lacinia vulputate. Sed at est scelerisque, iaculis justo sed, rhoncus erat. Aenean id nisl ac magna scelerisque pretium eu ut tellus. Sed iaculis, est id aliquam consequat, diam nisl egestas libero, vel vehicula nulla ante nec nisl. Cras sed massa non diam molestie fermentum. Quisque aliquet rhoncus sem sed iaculis.'
});

const lolo = () =>
    Tree(
        paragraph(
            textNode,
            //node(70),
            Rect({
                layout: {
                    pos: [0, 0],
                    siz: [70, 70]
                },
                style: {
                    color: randomColor()
                }
            })
        )
    );

const mainContent = RectT(
    {
        layout: {
            pos: [0, 0],
            siz: [100, 100],
            max
        },
        nodes: {
            scroll: scrolla
        },
        style: {
            color: randomColor()
        }
    },
    vertical([
        rect([100, 30]),
        rect([100, 30]),
        rect([100, 30]),
        Tree(verticalSpace(node(10))),
        rect([100, 30]),
        rect([100, 30]),
        rect([100, 30]),
        rect([100, 30]),
        rect([100, 30])
    ]) //.map(top(margin_(node(px([5, 5])))))
);

const navbar = Rect({
    layout: {
        pos: [0, 0],
        siz: [100, 100]
    },
    style: {
        color: randomColor()
    }
});

const sidebar = Rect({
    layout: {
        pos: [0, 0],
        siz: [100, 100]
    },
    style: {
        color: randomColor()
    }
});

const structure = Tree(Dummy(), [
    Tree(area([0, 0], [100, 5]), Tree(navbar)),
    Tree(area([0, 5], [15, 95]), Tree(sidebar)),
    Tree(area([15, 5], [85, 95]), [
        mainContent,
        scrollbar(scrolla, max)
    ])
]);

const lele = RectT(
    {
        layout: {
            pos: [0, 0],
            siz: [100, 100],
            max
        },
        style: {
            color: randomColor()
        }
    },
    horizontal([
        rect([30, 100]),
        rect([30, 100]),
        rect([30, 100]),
        Tree(
            paragraph(
                textNode,
                Rect({
                    layout: {
                        pos: [0, 0],
                        siz: [70, 70]
                    },
                    style: {
                        color: randomColor()
                    }
                })
            )
        ),
        rect([30, 100]),
        Tree(horizontalSpace(node(10))),
        rect([30, 100]),
        rect([30, 100]),
        rect([30, 100]),
        rect([30, 100])
    ]) //.map(top(margin_(node(px([5, 5])))))
);

const rects = () =>
    node([
        rect([30, 100]),
        rect([px(30), px(100)]),
        rect([px(30), px(100)]),
        lolo(),
        rect([px(30), px(100)]),
        rect([px(30), px(100)]),
        rect([px(30), px(100)]),
        rect([px(30), px(100)])
    ]);

window.add = (x, y) => {
    rects.val = rects.val.concat([rect([px(x), px(y)])]);
};

window.add2 = (x, y) => {
    rects.val = rects.val.concat([rect([x, y])]);
};

const lili = Tree(
    flexY(
        Rect({
            layout: {
                pos: [0, 0],
                siz: [70, 70]
            },
            style: {
                color: randomColor()
            }
        })
    ),
    mapN([rects()], vertical)
);

const z = node();

tran([z], () => {
    console.log('z', z);
});
const lulu = Tree(
    Rect({
        layout: {
            pos: [0, 0],
            siz: [70, 70]
        },
        nodes: {
            fullSize: z
        },
        style: {
            color: randomColor()
        }
    }),
    mapN([rects()], vertical)
);

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
        '': rect1([20, 20], [90, 90]),
        hey: rect1([40, 40], [20, 20]),
        fuck: {
            destroy: false,
            content: rect1([0, 0], [100, 100])
        },
        lala: structure,
        rect: rect3(), //top(proportional(node([1, 1])))(rect3())
        lele: lele,
        lili: lili,
        lolo: lolo(),
        lulu: lulu
    })
);

window.ss = ss;
tran([ss], () => {
    console.log('ssss', ss, ss.val);
});

console.log('asdasdasd', rect2);
run(rect2);
