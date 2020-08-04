import { tran } from '../node.js';
import { coord, addLen } from '../coord.js';
import { Supp } from '../rect.js';
import { RectT } from '../rect-tree.js';

// export const vertical = listOfRectTrees => {
//     listOfRectTrees.reduce(
//         (t1, t2) => {
//             tran(
//                 [t1.elem.layout.pos, t1.elem.layout.siz],
//                 (pos, siz) => {
//                     const y = addCoord(pos, siz);
//                     t2.elem.layout.pos.val = [
//                         t2.elem.layout.pos.val[0],
//                         y[1]
//                     ];
//                 }
//             );
//             return t2;
//         },
//         RectT({
//             layout: {
//                 pos: [0, 0],
//                 siz: [0, 0]
//             }
//         })
//     );
//     return listOfRectTrees;
// };

export const vertical = listOfRectTrees => {
    listOfRectTrees.reduce(
        (t1, t2) => {
            coord(t1.elem.layout.pos);
            coord(t1.elem.layout.siz);
            coord(t2.elem.layout.pos);
            coord(t2.elem.layout.siz);
            tran(
                [t1.elem.layout.pos.y, t1.elem.layout.siz.y],
                (p, s) => {
                    t2.elem.layout.pos.y.val = addLen(p, s);
                }
            );
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

// export const horizontal = listOfRectTrees => {
//     listOfRectTrees.reduce(
//         (t1, t2) => {
//             tran(
//                 [t1.elem.layout.pos, t1.elem.layout.siz],
//                 (pos, siz) => {
//                     const x = addCoord(pos, siz);
//                     t2.elem.layout.pos.val = [
//                         x[0],
//                         t2.elem.layout.pos.val[1]
//                     ];
//                 }
//             );
//             return t2;
//         },
//         RectT({
//             layout: {
//                 pos: [0, 0],
//                 siz: [0, 0]
//             }
//         })
//     );
//     return listOfRectTrees;
// };

export const horizontal = listOfRectTrees => {
    listOfRectTrees.reduce(
        (t1, t2) => {
            coord(t1.elem.layout.pos);
            coord(t1.elem.layout.siz);
            coord(t2.elem.layout.pos);
            coord(t2.elem.layout.siz);
            tran(
                [t1.elem.layout.pos.x, t1.elem.layout.siz.x],
                (p, s) => {
                    t2.elem.layout.pos.x.val = addLen(p, s);
                }
            );
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
    Supp({
        layout: {
            siz: s
        }
    });

export const verticalSpace = vSpace =>
    space(tran([vSpace], y => [0, y]));

export const horizontalSpace = hSpace =>
    space(tran([hSpace], x => [x, 0]));
