import { tran, node, addSubNode, toNode } from '../node.js';
import { listen } from '../channel.js';
import { proportional } from './proportional.js';
import { Supp } from '../rect.js';
import { Tree } from '../tree.js';
import { asPx, px, mulLen, addLen } from '../coord.js';
import { Rect, preserveR, keyed } from '../rect.js';
import { flex, flexY } from './flex.js';
import { isObj } from '../utils/index.js';
import { ExternalPos } from '../external.js';

export const Inline = (tag, params, rect = Rect()) => {
    let size;
    let content;

    if (isObj(params)) {
        size = toNode(params.size);
        content = toNode(params.content);
    } else {
        size = node('16px');
        content = toNode(params);
    }

    const r = preserveR(rect, {
        tag,
        layout: {
            disablePos: true,
            disableSiz: true
        },
        css: {
            position: 'relative',
            display: 'inline',
            width: 'auto', //'max-content',
            height: 'auto', //'max-content',
            'font-size': size
        }
    });

    r.withDOM(dom => {
        tran(content, txt => {
            dom.innerText = txt;
        });
    });

    return Tree(r);
};

export const paragraph = (trees, rect) => {
    const inlineds = trees.map(t =>
        Tree(
            preserveR(t.elem, {
                css: {
                    display: t.elem.isText
                        ? 'inline'
                        : 'inline-block',
                    position: 'relative',
                    'vertical-align': 'middle'
                }
            }),
            t.children
        )
    );

    return flexY(ExternalPos(inlineds, rect));
};

export const line = (trees, rect) => {
    const inlineds = trees.map(t =>
        Tree(
            preserveR(t.elem, {
                css: {
                    display: t.elem.text ? 'inline' : 'inline-block',
                    position: 'relative',
                    'vertical-align': 'middle'
                }
            }),
            t.children
        )
    );

    return flex(ExternalPos(inlineds, rect));
};
