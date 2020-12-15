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

const rect = (pos, siz) =>
    Tree(
        Rect({
            layout: {
                pos,
                siz
            },
            style: {
                color: 'gray' //randomColor()
            }
        })
    );

const b = node({ width: 1, color: 'red' });

const model = () =>
    Tree(
        Supp({
            layout: {
                pos: [10, 10],
                siz: [80, 80]
            },
            style: {
                color: 'white'
            },
            css: {
                overflow: 'hidden'
            }
        }),
        [
            rect([0, 0], [50, 50]),
            Tree(
                Supp({
                    layout: {
                        pos: [0, 50],
                        siz: [50, 50]
                    },
                    style: {
                        color: 'white'
                    },
                    css: {
                        overflow: 'hidden'
                    }
                }),
                [
                    rect([0, 0], [50, 50]),
                    rect([0, 50], [50, 50]),
                    //rect([50, 0], [50, 50]),
                    rect([50, 50], [50, 50])
                ]
            ),
            rect([50, 0], [50, 50]),
            rect([50, 50], [50, 50])
        ]
    );

const styleF = t =>
    walkT(t, x => (x.elem.isSupp ? x : seamlessBorder(b, x)));

run(styleF(model()));
