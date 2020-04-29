import { vectorPlus } from './utils/index.js';
import { tran, safeMapN } from './node.js';

// Length defined by relative value plus a pixel value
export const rel = (r, p) => ({
    px: p,
    rel: r
});

// Length in pixels
export const px = p => rel([0, 0], p);

// Add render transitions related to layout (positioning)
export const addLayoutTriggers = (layout, elem, rect, parLayout) => {
    const maxN = parLayout.max;

    const posN = layout.pos;
    const posT = tran([posN, maxN], () => {
        const pos = posN.val;
        const max = maxN.val;
        if (pos.rel) {
            elem.style.left = `calc(${(pos.rel[0] * 100) /
                max[0]}% + ${pos.px[0]}px)`;
            elem.style.top = `calc(${(pos.rel[1] * 100) /
                max[1]}% + ${pos.px[1]}px)`;
        } else {
            elem.style.left = `${(pos[0] * 100) / max[0]}%`;
            elem.style.top = `${(pos[1] * 100) / max[1]}%`;
        }
    });
    rect.renderTrans.add(posT);

    const sizN = layout.siz;
    const sizT = tran([sizN, maxN], () => {
        const siz = sizN.val;
        const max = maxN.val;
        if (siz.rel) {
            elem.style.width = `calc(${(siz.rel[0] * 100) /
                max[0]}% + ${siz.px[0]}px)`;
            elem.style.height = `calc(${(siz.rel[1] * 100) /
                max[1]}% + ${siz.px[1]}px)`;
        } else {
            elem.style.width = `${(siz[0] * 100) / max[0]}%`;
            elem.style.height = `${(siz[1] * 100) / max[1]}%`;
        }
    });
    rect.renderTrans.add(sizT);
};

// Rect's default layout reactivity updates posAbs and sizAbs whenever
// max, siz or pos changes. posAbs and sizAbs should not be changed
// directly
export const defaultLayoutReactivity = (
    posN, // rect's relative position node
    sizN, // rect's relative size node
    pMaxN, // parent's max node
    pPosAbsN, // parent's absolute position
    pSizAbsN, // parent's absolute size
    posAbsN, // rect's absolute position
    sizAbsN // rect's absolute size
) =>
    safeMapN(
        [posN, sizN, pMaxN, pPosAbsN, pSizAbsN],
        (pos, siz, pMax, pPosAbs, pSizAbs) => {
            let posPx = [0, 0];
            let sizPx = [0, 0];
            let posRel = pos;
            let sizRel = siz;
            if (pos.rel) {
                posRel = pos.rel;
                posPx = pos.px;
            }
            if (siz.rel) {
                sizRel = siz.rel;
                sizPx = siz.px;
            }
            // Some simple math
            let a = [pSizAbs[0] / pMax[0], pSizAbs[1] / pMax[1]];
            let sizAbs = [sizRel[0] * a[0], sizRel[1] * a[1]];
            let posAbs = [
                posRel[0] * a[0] + pPosAbs[0],
                posRel[1] * a[1] + pPosAbs[1]
            ];
            posAbsN.val = vectorPlus(posAbs, posPx);
            sizAbsN.val = vectorPlus(sizAbs, sizPx);
        }
    );
