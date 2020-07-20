import { mapValuesObj, isNotNull, iterate } from '../utils/index.js';
import { node, tran } from '../node.js';
import { Rect, Dummy, Supp } from '../rect.js';
import { Tree } from '../tree.js';
import { top } from '../rect-tree.js';
import { container } from './container.js';

export const switcher = (route, routeRectMap) => {
    const children = node();
    const routeMap = mapValuesObj(routeRectMap, val => {
        const destroy = val.destroy ? val.destroy : false;
        const show = node(false);
        const rectT = container(show, val.content || val);
        return {
            show,
            rectT,
            destroy
        };
    });
    const siz = node([100, 100]);
    tran([route], () => {
        const newRoute = route.val;
        children.val = iterate(routeMap, ([rou, val]) => {
            const { show, rectT, destroy } = val;
            if (rou == newRoute) {
                show.val = true;
                return rectT;
            } else if (destroy) {
                return null;
            } else {
                show.val = false;
                return rectT;
            }
        }).filter(isNotNull);
        // hack to fiz some problems when switch happens
        siz.val = [{ rel: 100, px: 0.01 }, 100];
        siz.val = [100, 100];
    });
    return Tree(
        Supp({
            layout: {
                pos: [0, 0],
                siz
            }
        }),
        children
    );
};
