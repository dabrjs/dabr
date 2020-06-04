import { isNotNull, copyObj } from './utils/index.js';
import { mapN } from './node.js';

export const len = (rel, px) => ({
    rel,
    px
});

//export const rel = r => len(r, 0);

export const px = p => len(0, p);

export const addLen = (r1, r2) => {
    const aux1 = isNotNull(r1.rel) ? r1 : { px: 0, rel: r1 };
    const aux2 = isNotNull(r2.rel) ? r2 : { px: 0, rel: r2 };
    const res = len(aux1.rel + aux2.rel, aux1.px + aux2.px);
    return res;
};

export const mulLen = (s, r) => {
    const aux = r.rel ? r : { px: 0, rel: r };
    return len(aux.rel * s, aux.px * s);
};

export const addCoord = (c1, c2) => [
    addLen(c1[0], c2[0]),
    addLen(c1[1], c2[1])
];

export const mulCoord = (s, c) => [mulLen(s, c[0]), mulLen(s, c[1])];

export const getPx = l => (isNotNull(l.px) ? l.px : 0);

export const getRel = l => (isNotNull(l.rel) ? l.rel : l);

const absToRel = (pSizAbs, pMax, px) =>
    (px * getRel(pMax)) / (pSizAbs - getPx(pMax));

const absToPx = (pSizAbs, pMax, rel) =>
    (rel * (pSizAbs - getPx(pMax))) / getRel(pMax);

export const lenToRel = (pSizAbs, pMax, l) => {
    if (isNotNull(l.rel)) {
        return l.rel + absToRel(pSizAbs, pMax, l.px);
    } else {
        return l;
    }
};

export const lenToPx = (pSizAbs, pMax, l) => {
    if (isNotNull(l.rel)) {
        return l.px + absToPx(pSizAbs, pMax, l.rel);
    } else {
        return absToPx(pSizAbs, pMax, l);
    }
};

export const coordToRel = ([psX, psY], [pmX, pmY], [cX, cY]) => [
    lenToRel(psX, pmX, cX),
    lenToRel(psY, pmY, cY)
];

export const coordToPx = ([psX, psY], [pmX, pmY], [cX, cY]) => [
    lenToPx(psX, pmX, cX),
    lenToPx(psY, pmY, cY)
];

export const splitCoord = ([x, y]) => [
    [getRel(x), getRel(y)],
    [getPx(x), getPx(y)]
];

export const asPx = ([x, y]) => [px(x), px(y)];

export const copyCoord = ([x, y]) => [copyLen(x), copyLen(y)];

export const copyLen = l => (l.rel ? copyObj(l) : l);
