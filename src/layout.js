import { vectorPlus } from './utils/index.js';
import { coord, splitCoord } from './coord.js';

// Add render transitions related to layout (positioning)
export const addLayoutTriggers = (layout, elem, rect, parLayout) => {
    const sca = coord(parLayout.scale);

    const pos = coord(layout.pos);
    const dPos = layout.disablePos;
    const posChanged = layout.posChanged;
    // rect.tran([pos[0], sca[0]], () => {
    //     const p = toLen(pos[0].val);
    //     const a = sca[0].val;
    //     elem.style.left = `calc(${p.rel * a}% + ${p.px}px)`;
    // });
    // rect.tran([pos[1], sca[1]], () => {
    //     const p = toLen(pos[1].val);
    //     const a = sca[1].val;
    //     elem.style.top = `calc(${p.rel * a}% + ${p.px}px)`;
    // });

    //const pos = coord(layout.pos);
    rect.tran([pos, sca, dPos], () => {
        if (!dPos.val) {
            const [pRel, pPx] = splitCoord(pos.val);
            const a = sca.val;
            elem.style.left = `calc(${pRel[0] * a[0]}% + ${
                pPx[0]
            }px)`;
            elem.style.top = `calc(${pRel[1] * a[1]}% + ${pPx[1]}px)`;
            posChanged.put = true;
        }
    });
    //rect.renderTrans.add(posT);

    // const siz = coord(layout.siz);
    // rect.tran([siz[0], sca[0]], () => {
    //     const s = toLen(siz[0].val);
    //     const a = sca[0].val;
    //     elem.style.width = `calc(${s.rel * a}% + ${s.px}px)`;
    // });
    // rect.tran([siz[1], sca[1]], () => {
    //     const s = toLen(siz[1].val);
    //     const a = sca[1].val;
    //     elem.style.height = `calc(${s.rel * a}% + ${s.px}px)`;
    // });

    const siz = coord(layout.siz);
    const dSiz = layout.disableSiz;
    const sizChanged = layout.sizChanged;
    rect.tran([siz, sca, dSiz], () => {
        if (!dSiz.val) {
            const [sRel, sPx] = splitCoord(siz.val);
            const a = sca.val;
            elem.style.width = `calc(${sRel[0] * a[0]}% + ${
                sPx[0]
            }px)`;
            elem.style.height = `calc(${sRel[1] * a[1]}% + ${
                sPx[1]
            }px)`;
            sizChanged.put = true;
        }
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
) => {
    // [posN, sizN, pScaleN, pPosAbsN, pSizAbsN, posAbsN, sizAbsN].map(
    //     coord
    // );

    // rect.tran(
    //     [posN.x, sizN.x, pScaleN.x, pPosAbsN.x, pSizAbsN.x],
    //     (_pos, _siz, pScale, pPosAbs, pSizAbs) => {
    //         const pos = toLen(_pos);
    //         const siz = toLen(_siz);
    //         let a = (pSizAbs * pScale) / 100;
    //         let sizAbs = siz.rel * a;
    //         let posAbs = pos.rel * a + pPosAbs;
    //         posAbsN.x.val = posAbs + pos.px;
    //         sizAbsN.x.val = sizAbs + siz.px;
    //     }
    // );

    // rect.tran(
    //     [posN.y, sizN.y, pScaleN.y, pPosAbsN.y, pSizAbsN.y],
    //     (_pos, _siz, pScale, pPosAbs, pSizAbs) => {
    //         const pos = toLen(_pos);
    //         const siz = toLen(_siz);
    //         let a = (pSizAbs * pScale) / 100;
    //         let sizAbs = siz.rel * a;
    //         let posAbs = pos.rel * a + pPosAbs;
    //         posAbsN.y.val = posAbs + pos.px;
    //         sizAbsN.y.val = sizAbs + siz.px;
    //     }
    // );

    rect.tran(
        [posN, sizN, pScaleN, pPosAbsN, pSizAbsN].map(coord),
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
            rect.layout.posAbsChanged.put = true;
            rect.layout.sizAbsChanged.put = true;
        }
    );
};
