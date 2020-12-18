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
    _mapT,
    walkT,
    toStruc,
    fromStruc,
    _container,
    _proportional,
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
    preserveT,
    flex,
    flexY,
    flexX,
    len,
    horizontal,
    transaction,
    startTransaction,
    endTransaction,
    withTree,
    Inline,
    toInline,
    Cond,
    seamlessBorder,
    _seamlessBorder,
    externalBorder,
    _externalBorder,
    preserveR
} from '../../src/index.js';
import { randomColor } from '../../src/utils/index.js';

// let n1,n2,n3,n4,n5;

// window.gaga = () => {
//     n1 = node({hello: 'bro1'});
//     n2 = node({hello: 'bro2'});
//     n3 = node({hello: 'bro3'});
//     n4 = node({hello: 'bro4'});
//     n5 = node({hello: 'bro5'});
// };

// window.le = () => {
//     n1.revoke();
//     n2.revoke();
//     n3.revoke();
//     n4.revoke();
//     n5.revoke();
//     n1 = null;
//     n2 = null;
//     n3 = null;
//     n4 = null;
//     n5 = null;
// };

const value = node(20);

window.value = value;

const postCreationContainer = () =>
    Tree(
        Rect({
            layout: {
                pos: [0, 0],
                siz: tran(value, v => [100, px(v)])
            },
            nodes: {
                id: 'lol'
            }
        }),
        Tree(Rect({
            layout: {
                pos: [40, 0],
                siz: [30, 100]
            }
        }), Text('asdasdasda asda sfui asfiu '))
    );

const showPostsContainer = () =>
    Tree(
        Rect({
            layout: {
                pos: [0, 0],
                siz: [100, px(20)]
            }
        })
    );

const rectz = node([postCreationContainer()]);

const meat = () =>
    flexY(
        Tree(
            Rect({
                layout: {
                    pos: [10, 0],
                    siz: [80, 100]
                },
                baseChildren: rectz
            }),
            tran(rectz, vertical)
        )
    );

const sty = _mapT(r =>
    preserveR(r, {
        style: {
            color: randomColor()
        }
    })
);
const g = sty(meat());
run(g);

console.log('gggggg', g);
window.g = g;
window.vish = () => {
    const res = rectz.val;
    rectz.val = [
        res[0],
        showPostsContainer(),
        showPostsContainer(),
        showPostsContainer()
    ];
};

window.vish2 = () => {
    const res = rectz.val;
    rectz.val = [res[0], res[1]];
};

window.vish3 = () => {
    const res = rectz.val;
    rectz.val = [
        showPostsContainer(),
        showPostsContainer(),
        showPostsContainer(),
        showPostsContainer()
    ];
};
