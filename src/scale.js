import { tran } from './node.js';
import { listenOnce } from './channel.js';

export const setParentScale = rect => {
    listenOnce([rect.init], () => {
        const par = rect.inst.par;
        const parSiz = par.layout.sizAbs;
        const parScale = par.layout.scale;
        const sizAbs = rect.layout.sizAbs;
        const scale = rect.layout.scale;
        tran([parSiz, parScale, sizAbs], () => {
            scale.val = [
                (parSiz.val[0] / sizAbs.val[0]) * parScale.val[0],
                (parSiz.val[1] / sizAbs.val[1]) * parScale.val[1]
            ];
        });
    });
    return rect;
};

export const setParentScaleX = rect => {
    listenOnce([rect.init], () => {
        const par = rect.inst.par;
        const parSiz = par.layout.sizAbs;
        const parScale = par.layout.scale;
        const sizAbs = rect.layout.sizAbs;
        const scale = rect.layout.scale;
        tran([parSiz, parScale, sizAbs], () => {
            scale.val = [
                (parSiz.val[0] / sizAbs.val[0]) * parScale.val[0],
                scale.val[1]
            ];
        });
    });
    return rect;
};

export const setParentScaleY = rect => {
    listenOnce([rect.init], () => {
        const par = rect.inst.par;
        const parSiz = par.layout.sizAbs;
        const parScale = par.layout.scale;
        const sizAbs = rect.layout.sizAbs;
        const scale = rect.layout.scale;
        tran([parSiz, parScale, sizAbs], () => {
            scale.val = [
                scale.val[0],
                (parSiz.val[1] / sizAbs.val[1]) * parScale.val[1]
            ];
        });
    });
    return rect;
};
