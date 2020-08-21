import { tran } from '../node.js';
import { coord, addLen } from '../coord.js';
import { Supp, preserveR } from '../rect.js';
import { Tree } from '../tree.js';
import { RectT } from '../rect-tree.js';
import { ExternalPos } from '../external.js';
import { flex, flexX, flexY } from './flex.js';
import { line } from './inline.js';

export const space = s =>
    Supp({
        layout: {
            siz: s
        }
    });

export const verticalSpace = vSpace =>
    space(tran([vSpace], y => [0, y]));

export const horizontalSpace = hSpace =>
    space(tran([hSpace], x => [x, 0]));

export const vertical = trees => {
    const inlineds = trees.map(t =>
        Tree(
            preserveR(t.elem, {
                css: {
                    display: 'block',
                    position: 'relative'
                }
            }),
            t.children
        )
    );

    return flexY(ExternalPos(inlineds));
};

export const horizontal = line;
