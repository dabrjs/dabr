import { mapValuesObj, isNotNull, iterate } from '../utils/index.js';
import { node, tran } from '../node.js';
import { top } from '../rect-tree.js';
import { container } from './container.js';

const switcher = (route, routeRectMap) => {
    const children = node();
    const routeMap = mapValuesObj(routeRectMap, val => {
        const destroy = val.destroy ? val.destroy : false;
        const show = node(false);
        const rectT = top(container(show))(val.content || val);
        return {
            show,
            rectT,
            destroy
        };
    });
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
    });
    return children;
};

export { switcher };
