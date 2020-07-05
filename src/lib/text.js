import { listenOnce } from '../channel.js';
import {
    tran,
    safeTran,
    safeMapN,
    mapN,
    node,
    nodeT
} from '../node.js';
import { proportional } from './proportional.js';
import { core, top } from '../rect-tree.js';
import { Dummy, Supp } from '../rect.js';
import { Tree, treePath, Entry } from '../tree.js';
import { asPx, px } from '../coord.js';
import { preserveR } from '../rect.js';

export const text = textNode => rect => {
    const textSize = node();
    const textDom = node();
    rect.data.set(text, { size: textSize, dom: textDom });
    listenOnce([rect.init], () => {
        mapN(
            [textNode],
            ({
                color,
                size,
                family,
                align,
                content,
                wordBreak,
                whiteSpace
            }) => {
                const elem = rect.inst.dom;
                const ans = elem.getElementsByClassName('dabr-text');
                let div;
                if (ans.length == 1) {
                    div = ans[0];
                } else {
                    div = document.createElement('div');
                    elem.appendChild(div);
                }
                elem.style['overflow'] = 'hidden';
                div.style['color'] = color || 'black';
                div.style['font-size'] = size || '16px';
                if (align) div.style['text-align'] = align;
                if (family) div.style['font-family'] = family;
                div.style['word-break'] = wordBreak || 'break-all';
                if (whiteSpace) div.style['white-space'] = whiteSpace;
                div.classList.add('dabr-text');
                div.innerText = content;
                textDom.val = div;
            }
        );
        tran([rect.layout.sizAbs, textNode], () => {
            const div = textDom.val;
            const newSize = [div.offsetWidth, div.offsetHeight];
            if (newSize[0] != 0 && newSize[1] != 0) {
                textSize.val = newSize;
            }
        });
    });
    return rect;
};

export const paragraph = (textNode, rect) => {
    const res = text(textNode)(rect);
    const { size: textSize } = res.data.get(text);
    safeTran([textSize], () => {
        const [, h] = asPx(textSize.val);
        const [w] = res.layout.siz.val;
        res.layout.siz.val = [w, h];
    });
    return res;
};

// export const paragraphMin = (textNode, minHeight, rect) => {
//     const res = text(textNode)(rect);
//     listenOnce([res.init], () => {
//         const lay = res.layout;
//         const pLay = res.inst.par.layout;
//         const { size: textSize } = res.data.get(text);
//         safeMapN(
//             [textSize, lay.siz, minHeight, pLay.sizAbs, pLay.max],
//             (ts, s, mh, psa, pm) => {
//                 const mhPx = lenToPx(psa[1], pm[1], mh);
//                 const [, th] = ts;
//                 const aux = [s[0], th < mhPx ? mh : px(th)];
//                 res.layout.siz.val = aux;
//             }
//         );
//     });
//     return res;
// };

////////////////////////////// Lines

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
        const sizsX = sizs.map(([x]) => x);
        const sizsY = sizs.map(([, y]) => y);
        const w = sizsX.reduce((sx, sy) => Math.max(sx, sy));
        const h = sizsY.reduce((sx, sy) => sx + sy);
        prop.val = [w, h];
    });
    const fontSize = node();
    const n = textNs.length;
    const children = textNs.map((textN, i) => {
        const fullTextN = nodeT([textN, fontSize], () => ({
            ...textN.val,
            ...{ size: fontSize.val, whiteSpace: 'nowrap' }
        }));
        const stepSiz = (i / n) * 100;
        const siz = safeMapN([sizes[i], prop], ([w, h], [pw, ph]) => [
            (w / pw) * 100,
            (1 / n) * 100
        ]);
        const post = justify(siz, stepSiz);
        const r = Supp({
            layout: {
                pos: post,
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

export const linesL = linesTemplate((siz, step) => node([0, step]));
export const linesR = linesTemplate((siz, step) =>
    mapN([siz], ([sx, sy]) => [100 - sx, step])
);
export const linesC = linesTemplate((siz, step) =>
    mapN([siz], ([sx, sy]) => [(100 - sx) / 2, step])
);
export const line = textNode => linesL([textNode]);
