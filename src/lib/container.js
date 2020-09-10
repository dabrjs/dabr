import { Tree } from '../tree.js';
import { Supp, keyed, preserveR } from '../rect.js';

export const container = (show, tree) =>
    Tree(
        Supp({
            layout: {
                pos: tree.elem.layout.pos,
                siz: tree.elem.layout.siz
            },
            data: keyed(container, show),
            style: {
                show
            }
        }),
        Tree(
            preserveR(tree.elem, {
                layout: {
                    pos: [0, 0],
                    siz: [100, 100]
                }
            }),
            tree.children
        )
    );

export const _container = show => tree => container(show, tree);
