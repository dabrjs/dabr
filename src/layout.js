import { vectorPlus, isNotNull } from './utils/index.js';
import { tran, safeMapN } from './node.js';
import { splitCoord } from './coord.js';

// Add render transitions related to layout (positioning)
export const addLayoutTriggers = (layout, elem, rect, parLayout) => {
    const maxN = parLayout.max;

    const posN = layout.pos;
    const posT = tran([posN, maxN], () => {
        const [posRel, posPx] = splitCoord(posN.val);
        const [maxRel, maxPx] = splitCoord(maxN.val);

        elem.style.left = `calc(${(posRel[0] * 100) /
            maxRel[0]}% + ${posPx[0] -
            (posRel[0] * maxPx[0]) / maxRel[0]}px)`;
        elem.style.top = `calc(${(posRel[1] * 100) /
            maxRel[1]}% + ${posPx[1] -
            (posRel[1] * maxPx[1]) / maxRel[1]}px)`;
    });
    // const posT = tran([posN, maxN], () => {
    //     const pos = posN.val;
    //     const max = maxN.val;
    //     console.log('mamammamam', pos, max);
    //     elem.style.left = isNotNull(pos[0].rel)
    //         ? `calc(${(pos[0].rel * 100) / max[0]}% + ${pos[0].px}px)`
    //         : `${(pos[0] * 100) / max[0]}%`;
    //     elem.style.top = isNotNull(pos[1].rel)
    //         ? `calc(${(pos[1].rel * 100) / max[1]}% + ${pos[1].px}px)`
    //         : `${(pos[1] * 100) / max[1]}%`;
    //     console.log('styles', elem.style.left, elem.style.top);
    // });
    rect.renderTrans.add(posT);

    const sizN = layout.siz;
    const sizT = tran([sizN, maxN], () => {
        const [sizRel, sizPx] = splitCoord(sizN.val);
        const [maxRel, maxPx] = splitCoord(maxN.val);
        elem.style.width = `calc(${(sizRel[0] * 100) /
            maxRel[0]}% + ${sizPx[0] -
            (sizRel[0] * maxPx[0]) / maxRel[0]}px)`;
        elem.style.height = `calc(${(sizRel[1] * 100) /
            maxRel[1]}% + ${sizPx[1] -
            (sizRel[1] * maxPx[1]) / maxRel[1]}px)`;
    });
    // const sizT = tran([sizN, maxN], () => {
    //     const siz = sizN.val;
    //     const max = maxN.val;
    //     elem.style.width = isNotNull(siz[0].rel)
    //         ? `calc(${(siz[0].rel * 100) / max[0]}% + ${siz[0].px}px)`
    //         : `${(siz[0] * 100) / max[0]}%`;
    //     elem.style.height = isNotNull(siz[1].rel)
    //         ? `calc(${(siz[1].rel * 100) / max[1]}% + ${siz[1].px}px)`
    //         : `${(siz[1] * 100) / max[1]}%`;
    // });
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
            const [posRel, posPx] = splitCoord(pos);
            const [sizRel, sizPx] = splitCoord(siz);
            const [maxRel, maxPx] = splitCoord(pMax);
            // Some simple math
            let a = [
                (pSizAbs[0] - maxPx[0]) / maxRel[0],
                (pSizAbs[1] - maxPx[1]) / maxRel[1]
            ];
            let sizAbs = [sizRel[0] * a[0], sizRel[1] * a[1]];
            let posAbs = [
                posRel[0] * a[0] + pPosAbs[0],
                posRel[1] * a[1] + pPosAbs[1]
            ];
            // let a = [pSizAbs[0] / pMax[0], pSizAbs[1] / pMax[1]];
            // let sizAbs = [sizRel[0] * a[0], sizRel[1] * a[1]];
            // let posAbs = [
            //     posRel[0] * a[0] + pPosAbs[0],
            //     posRel[1] * a[1] + pPosAbs[1]
            // ];
            posAbsN.val = vectorPlus(posAbs, posPx);
            sizAbsN.val = vectorPlus(sizAbs, sizPx);
        }
    );
