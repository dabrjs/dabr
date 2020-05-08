import { listenOnce } from '../channel.js';
import { tran, safeTran, mapN, node, nodeT } from '../node.js';
import { proportional } from './proportional.js';
import { core, top } from '../rect-tree.js';
import { Dummy, Supp } from '../rect.js';
import { Tree, treePath, Entry } from '../tree.js';

export const text = textNode => rect => {
    listenOnce([rect.init], () => {
        mapN(
            [textNode],
            ({
                color = 'black',
                size = '16px',
                family,
                align,
                content
            }) => {
                const elem = rect.inst.dom;
                elem.style['color'] = color;
                elem.style['font-size'] = size;
                elem.style
                ['text-align'] = 'center';
                elem.style['width'] = 'max-content';
                if (align) elem.style['text-align'] = align;
                if (family) elem.style['font-family'] = family;
                elem.innerText = content;
            }
        );
    });
    return rect;
};

// Kinda smooth the number to 3 decimal places (and add a -0.02 just
// to make sure a text is never ever bigger than the rectangle size)
const smooth = num =>
    Math.round((num + Number.EPSILON) * 1000) / 1000;

const getSizeOf16pxText = ({
    color = 'black',
    family,
    align,
    content
}) => {
    // This tran is probably heavy but changing text should
    // not be super common. Create dummy DOM element and
    // append it to body to get the proportion of the text
    const elem = document.createElement('div');
    // Appropriate CSS for a hidden rect with 1 line of text
    elem.style['visibility'] = 'hidden';
    elem.style['width'] = 'max-content';
    elem.style['font-size'] = '16px';
    if (family) elem.style['font-family'] = family;
    elem.innerText = content;
    document.body.appendChild(elem);
    const w = elem.offsetWidth;
    const h = elem.offsetHeight;
    // destroy the DOM element
    elem.remove();
    return [w, h];
};

export const linesTemplate = justify => textNs => rect => {
    const prop = node();
    const sizes = [];
    textNs.forEach((_, i) => {
        sizes[i] = node();
    });
    tran(textNs, () => {
        const sizs = textNs.map(tn => getSizeOf16pxText(tn.val));
        sizs.forEach((siz, i) => {
            sizes[i].val = siz;
        });
        const sizsX = sizs.map(([x, _]) => x);
        const sizsY = sizs.map(([_, y]) => y);
        const w = sizsX.reduce((sx, sy) => Math.max(sx, sy));
        const h = sizsY.reduce((sx, sy) => sx + sy);
        prop.val = [w, h];
    });
    const fontSize = node();
    const n = textNs.length;
    const children = textNs.map((textN, i) => {
        const fullTextN = nodeT([textN, fontSize], () => ({
            ...textN.val,
            ...{ size: fontSize.val }
        }));
        const stepSiz = (i / n) * 100;
        const siz = mapN([sizes[i], prop], ([w, h], [pw, ph]) => [
            (w / pw) * 100,
            (1 / n) * 100
        ]);
        const post = justify(siz, stepSiz);
        const r = Supp({
            layout: {
                pos: [0, stepSiz],
                siz
            }
        });
        return Tree(text(fullTextN)(r));
    });
    const chSizs = children.map(ch => ch.val.layout.sizAbs);
    safeTran(chSizs.concat([prop]), () => {
        const currentSizeX = chSizs
            .map(x => x.val[0])
            .reduce((x, y) => Math.max(x, y));
        const size16pxX = prop.val[0];
        const newSize = smooth((currentSizeX / size16pxX) * 16);
        fontSize.val = newSize + 'px';
    });
    const res = Tree(proportional(prop)(rect), children);
    return res;
};

export const linesL = linesTemplate((siz, step) => [0, step]);
export const linesR = linesTemplate((siz, step) =>
    mapN([siz], ([sx, sy]) => [100 - sx, step])
);
export const linesC = linesTemplate((siz, step) =>
    mapN([siz], ([sx, sy]) => [(100 - sx) / 2, step])
);
export const line = textNode => linesL([textNode]);

// export const textArea = textNode => rect => {
//     const area16 = mapN([textNode], () => {
//         const [w, h] = getSizeOf16pxText(textNode.val);
//         return w * h;
//     });
//     const fontSize = node();
//     const fullTextN = nodeT([textNode, fontSize], () => ({
//         ...textNode.val,
//         ...{ size: fontSize.val }
//     }));
//     tran([rect.layout.sizAbs, area16], () => {
//         const [w, h] = rect.layout.sizAbs.val;
//         const areaNow = w * h;
//         const newSize = smooth((areaNow / area16.val) * 16);
//         console.log(
//             'new size!',
//             area16.val,
//             [w, h],
//             areaNow / area16.val,
//             newSize
//         );
//         fontSize.val = newSize + 'px';
//     });
//     return text(fullTextN)(rect);
// };
