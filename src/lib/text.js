import { toNode, node, addSubNode, tran } from '../node.js';
import { isObj } from '../utils/index.js';
import { Supp, keyed, preserveR } from '../rect.js';
import { Tree } from '../tree.js';
import { proportional } from './proportional.js';
import { line, Inline } from './inline.js';

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

    const textObj = {
        content,
        size: fontSize,
        color,
        family,
        verticalAlign
    };

    return Inline(
        'div',
        { content, size: fontSize },
        Supp({
            isText: true,
            data: keyed(Text, textObj),
            layout: {
                disablePos: true,
                disableSiz: true
            },
            css: {
                position: 'relative',
                display: 'inline',
                //'font-size': fontSize,
                color: color,
                'font-family': family,
                'vertical-align': verticalAlign
            }
        })
    );
};

const smooth = num =>
    Math.round((num + Number.EPSILON) * 1000) / 1000;

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

export const fitText = (textNode, tree) => {
    const textT = Text(textNode);
    const ans = line([textT]);

    const textObj = textT.elem.data.get(Text)[0];
    const fontSize = textObj.size;
    const prop = getSizeOf16pxText(textObj);
    const res = proportional(prop, Tree(tree.elem, ans));

    tran(tree.elem.layout.sizAbs, prop, ([nowX], [propX16]) => {
        if (nowX > 0) {
            const newSize = smooth((nowX / propX16) * 16);
            fontSize.val = newSize + 'px';
        }
    });

    return res;
};
