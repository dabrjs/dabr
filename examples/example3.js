import {
    Rect,
    Tree,
    linesC,
    line,
    node,
    px,
    paragraph,
    flatten,
    vertical,
    verticalSpace,
    proportional,
    tran,
    flexY,
    listenOnce,
    run,
    toNode,
    mapN,
    Dummy
} from '../dist/dabr.js';
import { randomColor } from '../src/utils/index.js';
//import { image, imageProp } from './image.js';

const image = (url, rect) => {
    //const imgSize = node();
    listenOnce([rect.init], () => {
        const elem = rect.inst.dom;
        const img = document.createElement('img');
        img.style['width'] = '100%';
        img.style['height'] = '100%';
        rect.inst.dom.style['overflow'] = 'hidden';
        elem.appendChild(img);
        //img.addEventListener('load', () => {
        //    console.log('yup', img.naturalWidth, img.naturalHeight);
        //    imgSize.val = [img.naturalWidth, img.naturalHeight];
        //});
        tran([url], () => {
            img.src = url.val;
        });
        2;
    });
    //rect.data.set(image, { size: imgSize });
    return rect;
};

const imageProp = (prop, url, height) => {
    const hn = toNode(height);
    window.hn = hn;
    const rect = image(
        toNode(url),
        Layout({
            pos: [0, 0],
            siz: mapN([hn], h => [100, h])
        })
    );
    return proportional(toNode(prop))(rect);
};

const Layout = layout =>
    Rect({
        layout
    });

const title = () => {
    const textContent = node({
        content: 'Título Título Título Título '
    });
    return line(textContent)(
        Layout({
            pos: [0, 0],
            siz: [100, px(50)]
        })
    );
};

const paragraph1 = () => {
    const textContent = node({
        size: '20px',
        content:
            'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur id lorem vitae purus venenatis iaculis. Etiam pharetra ligula elit, sit amet interdum eros vestibulum a. Integer pretium id odio a iaculis. Nullam id nunc interdum sem varius malesuada. Suspendisse cursus lacinia vulputate. Sed at est scelerisque, iaculis justo sed, rhoncus erat. Aenean id nisl ac magna scelerisque pretium eu ut tellus. Sed iaculis, est id aliquam consequat, diam nisl egestas libero, vel vehicula nulla ante nec nisl. Cras sed massa non diam molestie fermentum. Quisque aliquet rhoncus sem sed iaculis. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur id lorem vitae purus venenatis iaculis. Etiam pharetra ligula elit, sit amet interdum eros vestibulum a. Integer pretium id odio a iaculis. Nullam id nunc interdum sem varius malesuada. Suspendisse cursus lacinia vulputate. Sed at est scelerisque, iaculis justo sed, rhoncus erat. Aenean id nisl ac magna scelerisque pretium eu ut tellus. Sed iaculis, est id aliquam consequat, diam nisl egestas libero, vel vehicula nulla ante nec nisl. Cras sed massa non diam molestie fermentum. Quisque aliquet rhoncus sem sed iaculis.'
    });
    return Tree(
        paragraph(
            textContent,
            Layout({
                pos: [0, 0],
                siz: [100, 30]
            })
        )
    );
};

const paragraph2 = () => {
    const textContent = node({
        color: randomColor(),
        size: '20px',
        content:
            'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur id lorem vitae purus venenatis iaculis. Etiam pharetra ligula elit, sit amet interdum eros vestibulum a. Integer pretium id odio a iaculis. Nullam id nunc interdum sem varius malesuada. Suspendisse cursus lacinia vulputate. Sed at est scelerisque, iaculis justo sed, rhoncus erat. Aenean id nisl ac magna scelerisque pretium eu ut tellus. Sed iaculis, est id aliquam consequat, diam nisl egestas libero, vel vehicula nulla ante nec nisl. Cras sed massa non diam molestie fermentum. Quisque aliquet rhoncus sem sed iaculis. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur id lorem vitae purus venenatis iaculis. Etiam pharetra ligula elit, sit amet interdum eros vestibulum a. Integer pretium id odio a iaculis. Nullam id nunc interdum sem varius malesuada. Suspendisse cursus lacinia vulputate. Sed at est scelerisque, iaculis justo sed, rhoncus erat. Aenean id nisl ac magna scelerisque pretium eu ut tellus. Sed iaculis, est id aliquam consequat, diam nisl egestas libero, vel vehicula nulla ante nec nisl. Cras sed massa non diam molestie fermentum. Quisque aliquet rhoncus sem sed iaculis.'
    });
    return Tree(
        paragraph(
            textContent,
            Layout({
                pos: [0, 0],
                siz: [100, 30]
            })
        )
    );
};

export const cell = () => {
    const vspace = l => Tree(verticalSpace(node(l)));
    const img = () =>
        imageProp(
            [750, 500],
            'https://cavernadobyte.com/wp/wp-content/uploads/2017/08/vishnu.jpg',
            50
        );
    // const contents = vertical([
    //     flatten(title()),
    //     paragraph1(),
    //     vspace(px(10)),
    //     paragraph2(),
    //     vspace(px(10)),
    //     flatten(Tree(img)),
    //     paragraph2(),
    //     vspace(px(20)),
    //     paragraph2(),
    //     vspace(px(20)),
    //     paragraph2(),
    //     vspace(px(20))
    //     // Tree(
    //     //     image(
    //     //         node(
    //     //             'https://cavernadobyte.com/wp/wp-content/uploads/2017/08/vishnu.jpg'
    //     //         ),
    //     //         Layout({
    //     //             pos: [0, 0],
    //     //             siz: [100, 100]
    //     //         })
    //     //     )
    //     // ),
    // ]);
    const contents = vertical([
        flatten(Tree(img())),
        paragraph2(),
        flatten(Tree(img())),
        paragraph2(),
        flatten(Tree(img())),
        paragraph2()
    ]);
    return Tree(
        flexY(
            Rect({
                layout: {
                    pos: [0, 0],
                    siz: [100, 70]
                }
            })
        ),
        contents
    );
};

const maia = Tree(Dummy(), cell());

run(maia);
