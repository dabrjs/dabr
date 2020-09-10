import { tran, node, addSubNode, toNode } from '../node.js';
import { listen } from '../channel.js';
import { proportional } from './proportional.js';
import { Supp } from '../rect.js';
import { Tree } from '../tree.js';
import { asPx, px, mulLen, addLen } from '../coord.js';
import { Rect, preserveR, keyed } from '../rect.js';
import { preserveT } from '../rect-tree.js';
import { flex, flexY } from './flex.js';
import { isObj } from '../utils/index.js';
import { ExternalPos } from '../external.js';

export const Inline = (tag, params) => {
    let size;
    let content;

    if (isObj(params)) {
        size = toNode(params.size);
        content = toNode(params.content);
    } else {
        size = node('16px');
        content = toNode(params);
    }

    const r = Rect({
        inline: true,
        tag,
        layout: {
            disablePos: true,
            disableSiz: true
        },
        css: {
            position: 'relative',
            display: 'inline',
            width: 'max-content',
            height: 'max-content',
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

export const toInline = tree =>
    preserveT(tree, {
        inline: true
    });

export const paragraph = trees => {
    const inlineds = trees.map(t =>
        preserveT(t, {
            css: {
                display: t.elem.inline ? 'inline' : 'inline-block',
                position: 'relative',
                'vertical-align': 'middle'
            }
        })
    );

    return flexY(ExternalPos(inlineds));
};

export const line = trees => {
    const inlineds = trees.map(t =>
        preserveT(t, {
            css: {
                display: t.elem.isText ? 'inline' : 'inline-block',
                position: 'relative',
                'vertical-align': 'middle'
            }
        })
    );

    return flex(ExternalPos(inlineds));
};
