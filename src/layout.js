import { vectorPlus } from './utils/index.js';
import { splitCoord } from './coord.js';

// Add render transitions related to layout (positioning)
export const addLayoutTriggers = (layout, elem, rect, parLayout) => {
    const sca = parLayout.scale;

    const pos = layout.pos;
    const dPos = layout.disablePos;
    const posChanged = layout.posChanged;
    const posAbsRender = layout.enablePosAbs;

    rect.tran([pos, sca, dPos, posAbsRender], () => {
        if (!posAbsRender.val) {
            if (!dPos.val) {
                const [pRel, pPx] = splitCoord(pos.val);
                const a = sca.val;
                const pc = [pRel[0] * a[0], pRel[1] * a[1]];
                if (pc[0] == 0) {
                    elem.style.left = `${pPx[0]}px`;
                } else {
                    elem.style.left = `calc(${pc[0]}% + ${pPx[0]}px)`;
                }
                if (pc[1] == 0) {
                    elem.style.top = `${pPx[1]}px`;
                } else {
                    elem.style.top = `calc(${pc[1]}% + ${pPx[1]}px)`;
                }
                posChanged.put = true;
            } else if (dPos.val == 'x') {
                const [pRel, pPx] = splitCoord(pos.val);
                const a = sca.val;
                const pc = pRel[1] * a[1];
                //elem.style.left = `calc(${pRel[0] * a[0]}% + ${
                //    pPx[0]
                //}px)`;
                if (pc == 0) {
                    elem.style.top = `${pPx[1]}px`;
                } else {
                    elem.style.top = `calc(${pc}% + ${pPx[1]}px)`;
                }
                posChanged.put = true;
            } else if (dPos.val == 'y') {
                const [pRel, pPx] = splitCoord(pos.val);
                const a = sca.val;
                const pc = pRel[0] * a[0];
                if (pc == 0) {
                    elem.style.left = `${pPx[0]}px`;
                } else {
                    elem.style.left = `calc(${pc}% + ${pPx[0]}px)`;
                }
                //elem.style.top = `calc(${pRel[1] * a[1]}% + ${pPx[1]}px)`;
                posChanged.put = true;
            }
        }
    });

    const siz = layout.siz;
    const dSiz = layout.disableSiz;
    const sizChanged = layout.sizChanged;
    const sizAbsRender = layout.enableSizAbs;

    rect.tran([siz, sca, dSiz, sizAbsRender], () => {
        if (!sizAbsRender.val) {
            if (!dSiz.val) {
                const [sRel, sPx] = splitCoord(siz.val);
                const a = sca.val;
                const pc = [sRel[0] * a[0], sRel[1] * a[1]];
                if (pc[0] == 0) {
                    elem.style.width = `${sPx[0]}px`;
                } else {
                    elem.style.width = `calc(${pc[0]}% + ${sPx[0]}px)`;
                }
                if (pc[1] == 0) {
                    elem.style.height = `${sPx[1]}px`;
                } else {
                    elem.style.height = `calc(${pc[1]}% + ${sPx[1]}px)`;
                }
                sizChanged.put = true;
            } else if (dSiz.val == 'x') {
                const [sRel, sPx] = splitCoord(siz.val);
                const a = sca.val;
                const pc = sRel[1] * a[1];
                if (pc == 0) {
                    elem.style.height = `${sPx[1]}px`;
                } else {
                    elem.style.height = `calc(${pc}% + ${sPx[1]}px)`;
                }
                sizChanged.put = true;
            } else if (dSiz.val == 'y') {
                const [sRel, sPx] = splitCoord(siz.val);
                const a = sca.val;
                const pc = sRel[0] * a[0];
                if (pc == 0) {
                    elem.style.width = `${sPx[0]}px`;
                } else {
                    elem.style.width = `calc(${pc}% + ${sPx[0]}px)`;
                }
                sizChanged.put = true;
            }
        }
    });
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
    sizAbsN, // rect's absolute size
    enPos,
    enSiz,
    dPos,
    dSiz
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
        [posN, sizN, pScaleN, pPosAbsN, pSizAbsN, enPos, enSiz],
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
            if (enPos.val) {
                if (dPos.val == 'x') {
                    rect.inst.dom.style.top =
                        posAbsN.val[1] - pPosAbs[1] + 'px';
                } else if (dPos.val == 'y') {
                    rect.inst.dom.style.left =
                        posAbsN.val[0] - pPosAbs[0] + 'px';
                } else if (dPos.val == false) {
                    rect.inst.dom.style.left =
                        posAbsN.val[0] - pPosAbs[0] + 'px';
                    rect.inst.dom.style.top =
                        posAbsN.val[1] - pPosAbs[1] + 'px';
                }
            }
            sizAbsN.val = vectorPlus(sizAbs, sizPx);
            if (enSiz.val) {
                if (dSiz.val == 'x') {
                    rect.inst.dom.style.height =
                        sizAbsN.val[1] + 'px';
                } else if (dSiz.val == 'y') {
                    rect.inst.dom.style.width = sizAbsN.val[0] + 'px';
                } else if (dSiz.val == false) {
                    rect.inst.dom.style.width = sizAbsN.val[0] + 'px';
                    rect.inst.dom.style.height =
                        sizAbsN.val[1] + 'px';
                }
            }
            rect.layout.posAbsChanged.put = true;
            rect.layout.sizAbsChanged.put = true;
        }
    );
};
