import {
    Rect,
    Tree,
    node,
    px,
    vertical,
    verticalSpace,
    proportional,
    tran,
    listenOnce,
    run,
    toNode,
    border,
    _border,
    mapT,
    walkT,
    toStruc,
    fromStruc,
    _container,
    _proportional,
    switcher,
    pathT,
    chan,
    listen,
    Supp,
    runDOM,
    x,
    style,
    _style,
    coord,
    Text,
    line,
    paragraph,
    fitText,
    Img,
    fitImg,
    scrollbar,
    External,
    preserveR,
    flex,
    flexY,
    flexX,
    len,
    horizontal,
    transaction,
    startTransaction,
    endTransaction,
    withTree,
    Inline
} from '../dist/dabr.js';
import { randomColor } from '../src/utils/index.js';

const r = Tree(
    Rect({
        layout: {
            pos: [0, 0],
            siz: [30, 30]
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

const f1 = _border(node({ color: 'red', width: 2 }));

const f2 = _border(node({ color: 'green', width: 2 }));

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

window.heyy = node(
    'https://i.pinimg.com/originals/f8/1e/ae/f81eae71d1e86be2ede0d49af2e4d61f.png'
);

const k = siz =>
    Tree(
        Rect({
            layout: {
                pos: [0, 0],
                siz
            },
            style: {
                color: 'navy'
            }
        }),
        vertical([
            fitText(
                node({ content: 'asadaasdaslalaalal' }),
                Tree(
                    Rect({
                        layout: {
                            pos: x(0),
                            siz: [40, 20]
                        },
                        style: {
                            color: randomColor()
                        }
                    })
                )
            ),
            fitText(
                node({ content: 'haha' }),
                Tree(
                    Rect({
                        layout: {
                            pos: x(0),
                            siz: [40, 20]
                        },
                        style: {
                            color: randomColor()
                        }
                    })
                )
            ),
            fitText(
                node({ content: 'F' }),
                Tree(
                    Rect({
                        layout: {
                            pos: x(0),
                            siz: [40, 20]
                        },
                        style: {
                            color: randomColor()
                        }
                    })
                )
            )
        ])
    );

const isSupp = t => (t.elem ? t.elem.isSupp : true);
const appCore = f => x => (isSupp(x) ? x : f(x));

const click = chan();
listen([click], () => {
    console.log('click');
});

window.t = node({
    content:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed vestibulum risus at ligula molestie aliquet. Morbi commodo tortor magna, vitae aliquam nisl vehicula non. Suspendisse ut egestas nisi. Vivamus sit amet interdum arcu. Sed ut ante ut ligula consequat pharetra auctor quis quam. Suspendisse a nisi lorem.asda asd asadasdaasdsd asd asd',
    size: '8px'
});
window.va = node();
window.c = node(6);
window.n = coord([20, 10]);
window.h = node({ content: 'asdioka asd adsa sd ad sd' });
const k2 = Tree(
    Rect({
        layout: {
            pos: [30, 30],
            siz: [40, 40]
        },
        style: {
            color: 'red'
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
                    })
                )
            )
        ),
        3: scrollbar(
            Tree(
                Supp(),
                Tree(
                    Rect({
                        layout: {
                            pos: [0, 0],
                            siz: [80, 1000]
                        },
                        style: {
                            color: 'blue'
                        },
                        events: {
                            drag: click
                        }
                    })
                )
            )
        ),
        4: Tree(
            Supp(),
            line([
                Tree(
                    Rect({
                        layout: {
                            siz: [20, 10]
                        },
                        style: {
                            color: 'navy'
                        },
                        nodes: {
                            id: '3'
                        }
                    })
                ),
                //Text(window.t),
                Tree(
                    Rect({
                        layout: {
                            siz: [20, 10]
                        },
                        style: {
                            color: 'cyan'
                        },
                        nodes: {
                            id: '2'
                        }
                    })
                ),
                r,
                k([30, 30])
            ])
        ),
        5: Tree(
            Supp(),
            paragraph([
                Tree(
                    Rect({
                        layout: {
                            siz: [20, 10]
                        },
                        style: {
                            color: 'navy'
                        },
                        nodes: {
                            id: '3'
                        }
                    })
                ),
                Tree(
                    Rect({
                        layout: {
                            siz: [20, 10]
                        },
                        style: {
                            color: 'cyan'
                        },
                        nodes: {
                            id: '4'
                        }
                    })
                ),
                Tree(
                    Rect({
                        layout: {
                            siz: [20, 10]
                        },
                        style: {
                            color: 'black'
                        },
                        nodes: {
                            id: 'asd'
                        }
                    })
                ),
                Text(window.t),
                Tree(
                    Rect({
                        layout: {
                            siz: [20, 10]
                        },
                        style: {
                            color: 'cyan'
                        }
                    })
                ),
                Tree(
                    Rect({
                        layout: {
                            siz: [10, 20]
                        },
                        style: {
                            color: 'white'
                        }
                    })
                ),
                Tree(
                    Rect({
                        layout: {
                            siz: [20, 10]
                        },
                        style: {
                            color: 'orange'
                        }
                    })
                )
            ])
        ),
        6: Tree(
            Supp(),
            fitText(
                window.h,
                Tree(
                    Rect({
                        layout: {
                            pos: [0, 0],
                            siz: [100, 100]
                        }
                    })
                )
            )
        )
    })
);

// run(
//     Tree(
//         Rect({
//             layout: {
//                 pos: [20, 20],
//                 siz: [60, 60]
//             }
//         }),
//         fitImg(window.heyy)
//     )
// );

//run(k);
//run(line(txt)(k));
//run(k2);
//run(walkT(k2, appCore(f1)));
//run(fromStruc(mapT(mapT(toStruc(r), f2), f3)));
//run(fromStruc(mapT(mapT(toStruc(r), f4), f1)));
//run(fromStruc(mapT(mapT(toStruc(r), f1), f4)));
//run(walkT(line(txt)(k), x => appCore(y => f1(f2(y)))(x)));
// run(
//     walkT(
//         k2,
//         appCore(y => f2(f1(y)))
//     )
// );
// run(
//     walkT(
//         walkT(
//             k2,
//             appCore(y =>
//                 style(
//                     node({
//                         'box-shadow':
//                             'rgb(0, 210, 198) 20px 20px 50px, rgb(0, 255, 255) -30px -30px 60px'
//                     }),
//                     f2(f1(y))
//                 )
//             )
//         ),
//         _style(node({ 'border-radius': '50px' }))
//     )
// );
// run(
//     style(
//         node({
//             'box-shadow':
//                 'black 20px 20px 50px, black -30px -30px 60px'
//         }),
//         walkT(
//             walkT(k2, appCore(f1)),
//             _style(node({ 'border-radius': '25px' }))
//         )
//     )
// );
// run(
//     walkT(
//         k2,
//         (x, s) => {
//             const newS = s
//                 ? x.elem.data.get(proportional)
//                     ? false
//                     : true
//                 : s;
//             return [newS ? appCore(y => f2(f1(y)))(x) : x, newS];
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

// window.onresize = () => {
//     console.log('aaaaaaaa');
// };

// const f = window.onresize;
// window.onresize = () => {
//     f();
//     console.log('oooooooooo');
// };

const A = () =>
    paragraph([
        Text('Exmçsdçsçd'),
        Text('çsdkçsd'),
        Text('çsdkçsd'),
        Text('çsdkçsd')
    ]);

const B = () =>
    line([
        Text('Exmçsdçsçd'),
        Text('çsdkçsd'),
        Text('çsdkçsd'),
        Text('çsdkçsd')
    ]);

const page = () =>
    Tree(
        S(),
        vertical([
            A(),
            B(),
            A(),
            B(),
            A(),
            B(),
            A(),
            B(),
            A(),
            B(),
            A(),
            B(),
            A(),
            B(),
            A(),
            B()
        ])
    );

const pages = () => {
    const obj = {};
    for (let i = 0; i <= 2; i++) {
        obj[i] = page();
    }
    return obj;
};

window.ro = node(0);

const S = () =>
    Supp({
        style: {
            color: randomColor()
        }
    });

const k3 = Tree(S(), switcher(window.ro, pages()));
//const k3 = Tree(S, page());

//run(k3);

const j1 = () =>
    Tree(
        Rect({
            layout: {
                siz: [5, 5]
            },
            style: {
                color: 'blue'
            }
        })
    );

const j2 = () =>
    Tree(
        Rect({
            layout: {
                siz: [5, 10]
            },
            style: {
                color: 'orange'
            }
        })
    );

const t1 = () =>
    Text({ content: 'sdlpsdp\n sfpo ifosf', size: '20px' });

const t3 = () => Inline('pre', 'hel\nlo');

window.j1 = j1();
window.j2 = j2();

const gh = () =>
    withTree(
        paragraph(
            [
                j1(),
                t1(),
                j2(),
                t3(),
                j1(),
                t1(),
                t1(),
                t3(),
                j2(),
                t1(),
                j1(),
                t3(),
                j2(),
                t1(),
                window.j1,
                j2(),
                t1(),
                window.j2
            ],
            Rect({
                css: {
                    'text-align': 'center'
                }
            })
        ),
        r =>
            preserveR(r, {
                style: {
                    color: randomColor()
                }
            })
    );

const ggh = () =>
    Tree(
        Rect({
            layout: {
                pos: [25, 0],
                siz: [50, 100]
            }
        }),
        vertical([gh(), gh(), gh(), gh(), gh()])
    );

window.gh = gh;
//window.th = node('Heyyyyy');
//const hg = fitText2(window.th, Tree(Rect()));

run(ggh());

const b1 = node();
const b2 = node();
const b3 = node();
const br = tran(b1, b2, b3, (m1, m2, m3) => m1 + m2 + m3);

tran(br, m => {
    console.log('New val!!!', m);
});

tran(b1, m => {
    console.log('b1!!!', m);
});

tran(b2, m => {
    console.log('b2!!!', m);
});

tran(b3, m => {
    console.log('b3!!!', m);
});

b1.val = 1;
b2.val = 2;
b3.val = 3;

transaction(b1, b2, () => {
    b3.val = 1000;
    console.log('hmmmm', b3.val);
    b1.val = 44;
    b2.val = 100;
});
