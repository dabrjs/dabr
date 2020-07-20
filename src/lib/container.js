import { Tree, Entry } from '../tree.js';
import { keyed, Dummy, preserveR } from '../rect.js';

export const container = (show, tree) =>
    Tree(
        Dummy({
            layout: {
                pos: tree.val.layout.pos,
                siz: tree.val.layout.siz
            },
            data: keyed(container, show),
            style: {
                show
            }
        }),
        Tree(
            preserveR(tree.val, {
                layout: {
                    pos: [0, 0],
                    siz: [100, 100]
                }
            }),
            tree.children
        )
    );

export const _container = show => tree => container(show, tree);
