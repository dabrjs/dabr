import { node, tran } from '../node.js';

export const screenSize = () => {
    const getDeviceSize = () => [
        document.documentElement.clientWidth,
        document.documentElement.clientHeight
    ];

    const res = node(getDeviceSize());

    if (window.onresize) {
        const f = window.onresize;
        window.onresize = () => {
            const devSize = f();
            res.val = devSize;
            return devSize;
        };
    } else {
        window.onresize = () => {
            const devSize = getDeviceSize();
            res.val = devSize;
            return devSize;
        };
    }

    return res;
};
