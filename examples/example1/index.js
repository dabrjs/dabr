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
    Inline,
    toInline,
    Cond,
    seamlessBorder
} from '../../src/index.js';
import { randomColor } from '../../src/utils/index.js';

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
    Text({ content: 'sdlpsdp sfpo ifosf', size: '20px' });

const t3 = () => Inline('pre', 'hel\nlo');

window.j1 = j1();
window.j2 = j2();
window.t1 = t1();

const gh = () =>
    paragraph([
        j1(),
        window.t1,
        j2(),
        //t3(),
        j1(),
        t1(),
        t1(),
        t3(),
        j2(),
        paragraph([
            Text(
                node({
                    color: randomColor(),
                    size: '20px',
                    content:
                        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur id lorem vitae purus venenatis iaculis. Etiam pharetra ligula elit, sit amet interdum eros vestibulum a. Integer pretium id odio a iaculis. Nullam id nunc interdum sem varius malesuada. Suspendisse cursus lacinia vulputate. Sed at est scelerisque, iaculis justo sed, rhoncus erat. Aenean id nisl ac magna scelerisque pretium eu ut tellus. Sed iaculis, est id aliquam consequat, diam nisl egestas libero, vel vehicula nulla ante nec nisl. Cras sed massa non diam molestie fermentum. Quisque aliquet rhoncus sem sed iaculis. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur id lorem vitae purus venenatis iaculis. Etiam pharetra ligula elit, sit amet interdum eros vestibulum a. Integer pretium id odio a iaculis. Nullam id nunc interdum sem varius malesuada. Suspendisse cursus lacinia vulputate. Sed at est scelerisque, iaculis justo sed, rhoncus erat. Aenean id nisl ac magna scelerisque pretium eu ut tellus. Sed iaculis, est id aliquam consequat, diam nisl egestas libero, vel vehicula nulla ante nec nisl. Cras sed massa non diam molestie fermentum. Quisque aliquet rhoncus sem sed iaculis.'
                })
            )
        ]),
        t1(),
        j1(),
        t3(),
        j2(),
        t1(),
        window.j1,
        j2(),
        t1(),
        window.j2
    ]);

window.c = node(1);

const ggh = () =>
    Tree(
        Rect({
            layout: {
                pos: [25, 0],
                siz: [50, 100]
            }
        }),
        Cond(window.c, { 1: gh, 2: gh, 3: gh, 4: gh, 5: gh })
    );

window.gh = gh;
//window.th = node('Heyyyyy');
//const hg = fitText2(window.th, Tree(Rect()));

const b = node({ width: 1, color: 'black' });

const styleF = t => walkT(t, x => x);

run(styleF(ggh()));
