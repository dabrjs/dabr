import { vectorPlus, isNotNull } from './utils/index.js';
import { tran } from './node.js';
import { splitCoord } from './coord.js';

// Add render transitions related to layout (positioning)
export const addLayoutTriggers = (layout, elem, rect, parLayout) => {
    const scaN = parLayout.scale;

    const posN = layout.pos;
    rect.tran([posN, scaN], () => {
        const [posRel, posPx] = splitCoord(posN.val);
        const sca = scaN.val;
        elem.style.left = `calc(${posRel[0] * sca[0]}% + ${
            posPx[0]
        }px)`;
        elem.style.top = `calc(${posRel[1] * sca[1]}% + ${
            posPx[1]
        }px)`;
    });
    //rect.renderTrans.add(posT);

    const sizN = layout.siz;
    rect.tran([sizN, scaN], () => {
        const [sizRel, sizPx] = splitCoord(sizN.val);
        const sca = scaN.val;
        elem.style.width = `calc(${sizRel[0] * sca[0]}% + ${
            sizPx[0]
        }px)`;
        elem.style.height = `calc(${sizRel[1] * sca[1]}% + ${
            sizPx[1]
        }px)`;
    });
    //rect.renderTrans.add(sizT);
};

// Rect's default layout reactivity updates posAbs and sizAbs whenever
// max, siz or pos changes. posAbs and sizAbs should not be changed
// directly
export const defaultLayoutReactivity = (
    rect,
    posN, // rect's relative position node
    sizN, // rect's relative size node
    pScaleN, // parent's max node
    pPosAbsN, // parent's absolute position
    pSizAbsN, // parent's absolute size
    posAbsN, // rect's absolute position
    sizAbsN // rect's absolute size
) =>
    tran(
        [posN, sizN, pScaleN, pPosAbsN, pSizAbsN],
        (pos, siz, pScale, pPosAbs, pSizAbs) => {
            const [posRel, posPx] = splitCoord(pos);
            const [sizRel, sizPx] = splitCoord(siz);
            let a = [
                (pSizAbs[0] * pScale[0]) / 100,
                (pSizAbs[1] * pScale[1]) / 100
            ];
            let sizAbs = [sizRel[0] * a[0], sizRel[1] * a[1]];
            let posAbs = [
                posRel[0] * a[0] + pPosAbs[0],
                posRel[1] * a[1] + pPosAbs[1]
            ];
            posAbsN.val = vectorPlus(posAbs, posPx);
            sizAbsN.val = vectorPlus(sizAbs, sizPx);
        }
    );
