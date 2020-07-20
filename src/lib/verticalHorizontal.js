import { tran } from '../node.js';
import { addCoord } from '../coord.js';
import { Dummy } from '../rect.js';
import { RectT } from '../rect-tree.js';

export const vertical = listOfRectTrees => {
    listOfRectTrees.reduce(
        (t1, t2) => {
            tran([t1.val.layout.pos, t1.val.layout.siz], () => {
                const pos = t1.val.layout.pos.val;
                const siz = t1.val.layout.siz.val;
                const y = addCoord(pos, siz);
                t2.val.layout.pos.val = [
                    t2.val.layout.pos.val[0],
                    y[1]
                ];
            });
            return t2;
        },
        RectT({
            layout: {
                pos: [0, 0],
                siz: [0, 0]
            }
        })
    );
    return listOfRectTrees;
};

export const horizontal = listOfRectTrees => {
    listOfRectTrees.reduce(
        (t1, t2) => {
            tran([t1.val.layout.pos, t1.val.layout.siz], () => {
                const pos = t1.val.layout.pos.val;
                const siz = t1.val.layout.siz.val;
                const x = addCoord(pos, siz);
                t2.val.layout.pos.val = [
                    x[0],
                    t2.val.layout.pos.val[1]
                ];
            });
            return t2;
        },
        RectT({
            layout: {
                pos: [0, 0],
                siz: [0, 0]
            }
        })
    );
    return listOfRectTrees;
};

export const space = s =>
    Dummy({
        layout: {
            pos: [0, 0],
            siz: s
        }
    });

export const verticalSpace = vSpace =>
    space(tran([vSpace], y => [0, y]));

export const horizontalSpace = hSpace =>
    space(tran([hSpace], x => [x, 0]));
