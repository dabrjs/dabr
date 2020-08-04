import { tran, node, addSubNode, toNode } from '../node.js';
import { listen } from '../channel.js';
import { proportional } from './proportional.js';
import { Supp } from '../rect.js';
import { Tree } from '../tree.js';
import { asPx, px, mulLen, addLen } from '../coord.js';
import { Rect, preserveR, keyed } from '../rect.js';
import { flex, flexY } from './flex.js';
import { isObj } from '../utils/index.js';

// Some interactions are a bit hacky (specially using setTimeout to
// fix the order of operations) but it is working :)

export const Text = args => {
    let fontSize;
    let content;
    let color;
    let family;
    let verticalAlign;
    if (
        (!args.isNode && isObj(args)) ||
        (args.isNode && isObj(args.val))
    ) {
        const argsObj = toNode(args);
        content = addSubNode(argsObj, 'content');
        fontSize = addSubNode(argsObj, 'fontSize');
        color = addSubNode(argsObj, 'color');
        family = addSubNode(argsObj, 'family');
        verticalAlign = addSubNode(argsObj, 'verticalAlign');
        if (!fontSize.val) fontSize.val = '16px';
        if (!color.val) color.val = 'black';
        if (!family.val) family.val = 'inherit';
        if (!verticalAlign.val) verticalAlign.val = 'middle';
    } else {
        content = toNode(args);
        fontSize = node('16px');
        color = node('black');
        family = node('inherit');
        verticalAlign = node('middle');
    }

    // const css = tran(
    //     [fontSize, color, family, verticalAlign],
    //     () => ({
    //         position: 'relative',
    //         display: 'inline',
    //         'vertical-align': 'middle',
    //         'font-size': fontSize.val,
    //         color: color.val,
    //         'font-family': family.val,
    //         'vertical-align': verticalAlign.val
    //     })
    // );

    const textObj = {
        content,
        size: fontSize,
        color,
        family,
        verticalAlign
    };

    const r = Supp({
        text: textObj,
        data: keyed(Text, textObj),
        layout: {
            disablePos: true,
            disableSiz: true
        },
        css: {
            position: 'relative',
            display: 'inline',
            'font-size': fontSize,
            color: color,
            'font-family': family,
            'vertical-align': verticalAlign
        }
    });

    r.withInst(inst => {
        const dom = inst.dom;
        const lay = r.layout;
        const updateLayout = () => {
            // console.log(
            //     'pos',
            //     [lay.pos.val[0].px, lay.pos.val[1].px],
            //     [dom.offsetLeft, dom.offsetTop]
            // );
            // console.log(
            //     'siz',
            //     [lay.siz.val[0].px, lay.siz.val[1].px],
            //     [dom.offsetWidth, dom.offsetHeight]
            // );
            //// Even though I dont like these timeouts, they solve
            //// some problems right now. I wanna find a better
            //// to unify nodes with manually updating the DOM
            setTimeout(() => {
                lay.pos.val = asPx([dom.offsetLeft, dom.offsetTop]);
                lay.siz.val = asPx([
                    dom.offsetWidth,
                    dom.offsetHeight
                ]);
            });
        };
        tran(content, () => {
            dom.innerText = content.val;
        });
        tran(
            [content, fontSize, color, family, verticalAlign],
            updateLayout
        );
        listen(inst.par.layout.sizAbsChanged, updateLayout);
    });

    return Tree(r);
};

export const paragraph = rectTrees => {
    const parent = flexY(
        Rect({
            css: {
                'font-size': 0
            }
        })
    );

    const inlineds = rectTrees.map(t => {
        const rect = preserveR(t.elem, {
            layout: {
                disablePos: true
            },
            css: {
                display: 'inline-block',
                position: 'relative',
                'vertical-align': 'middle'
            }
        });
        return Tree(rect, t.children);
    });

    // parent.withDOM(dom => {
    //     dom.style['font-size'] = 0;
    // });

    const updateSiz = () => {
        inlineds.forEach(inlined => {
            const rect = inlined.elem;
            const inst = rect.inst;
            if (inst) {
                const dom = inst.dom;
                // this is a hack meant to get proper values
                // of offsetLeft and offsetTop instead of 0s
                setTimeout(() => {
                    rect.layout.pos.val = [
                        px(dom.offsetLeft),
                        px(dom.offsetTop)
                    ];
                }, 0);
            }
        });
    };

    tran(
        inlineds.map(t => t.elem.layout.siz),
        updateSiz
    );
    listen(parent.layout.sizAbsChanged, updateSiz);

    const res = Tree(parent, inlineds);

    return res;
};

export const line = rectTrees => {
    const parent = flex(
        Rect({
            css: {
                'font-size': 0,
                'white-space': 'nowrap'
            }
        })
    );

    const inlineds = rectTrees.map(t => {
        const rect = preserveR(t.elem, {
            layout: {
                disablePos: true
            },
            css: {
                display: 'inline-block',
                position: 'relative',
                'vertical-align': 'middle'
            }
        });
        return Tree(rect, t.children);
    });

    // // TODO: substituir por css
    // parent.withDOM(dom => {
    //     dom.style['font-size'] = 0;
    //     dom.style['white-space'] = 'nowrap';
    // });

    const updateSiz = () => {
        inlineds.forEach(inlined => {
            const rect = inlined.elem;
            const inst = rect.inst;
            if (inst) {
                const dom = inst.dom;
                // this is a hack meant to get proper values
                // of offsetLeft and offsetTop instead of 0s
                setTimeout(() => {
                    rect.layout.pos.val = [
                        px(dom.offsetLeft),
                        px(dom.offsetTop)
                    ];
                }, 0);
            }
        });
    };

    tran(
        inlineds.map(t => t.elem.layout.siz),
        inlineds.map(t => t.elem.layout.pos),
        updateSiz
    );
    listen(parent.layout.sizAbsChanged, updateSiz);

    const res = Tree(parent, inlineds);

    return res;
};

// export const linesO = (textNodes, trees) => {
//     textNodes = textNodes.map(toNode);
//     const textTs = textNodes.map(Text);
//     const sizs = textTs.map(textT => textT.elem.layout.sizAbs);
//     console.log('aaaa', sizs);
//     const prop = tran(sizs, () => {
//         const sizsV = sizs.map(s => s.val);
//         console.log('hmmmmmm', sizV);
//         const sizsX = sizsV.map(([x]) => x);
//         const sizsY = sizsV.map(([, y]) => y);
//         const w = sizsX.reduce((sx, sy) => Math.max(sx, sy));
//         const h = sizsY.reduce((sx, sy) => sx + sy);
//         return [w, h];
//     });
//     console.log('tetetet', textNodes, prop);
//     const fontSizs = textNodes.map(tn => tn.size);
//     const n = textNodes.length;
//     const children = textNodes.map((textN, i) => {
//         const stepSiz = (i / n) * 100;

//         const siz = tran([sizs[i], prop], ([w, h], [pw, ph]) => [
//             (w / pw) * 100,
//             (1 / n) * 100
//         ]);
//         const post = ((siz, step) => node([0, step]))(siz, stepSiz);
//         const r = Supp({
//             layout: {
//                 pos: post,
//                 siz
//             }
//         });
//         return Tree(r, textTs[i]);
//     });
//     return proportional(prop, Tree(tree.elem, children));
// };

const getSizeOf16pxText = textObj => {
    const { family: familyN, content: contentN } = textObj;
    return tran(familyN, contentN, (family, content) => {
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
    });
};

const smooth = num =>
    Math.round((num + Number.EPSILON) * 1000) / 1000;

export const fitText = (textNode, tree) => {
    const textT = Text(textNode);
    const ans = line([textT]);

    const textObj = textT.elem.text;
    const fontSize = textObj.size;
    const prop = getSizeOf16pxText(textObj);
    const res = proportional(prop, Tree(tree.elem, ans));

    tran(ans.elem.layout.sizAbs, ([w]) => {
        ans.elem.layout.pos.val = [
            mulLen(0.5, addLen(100, px(-1 * w))),
            0
        ];
    });

    tran(tree.elem.layout.sizAbs, prop, ([nowX], [propX16]) => {
        if (nowX > 0) {
            const newSize = smooth((nowX / propX16) * 16);
            fontSize.val = newSize + 'px';
        }
    });

    return res;
};
