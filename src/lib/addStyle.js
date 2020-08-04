import { Tree } from '../tree.js';
import { tran } from '../node.js';
import { preserveR } from '../rect.js';

export const style = (objN, tree) => {
    const cssN = tree.elem.style ? tree.elem.style.css : null;
    return Tree(
        preserveR(tree.elem, {
            style: {
                css: cssN
                    ? tran(cssN, objN, (oldCss, newCss) => ({
                          ...oldCss,
                          ...newCss
                      }))
                    : objN
            }
        }),
        tree.children
    );
};

export const _style = objN => tree => style(objN, tree);
