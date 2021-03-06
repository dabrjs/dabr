import { isNotNull, copyObj } from './utils/index.js';
import { node, addSubNode } from './node.js';

export const len = (rel, px) => ({
    rel,
    px
});

export const px = p => len(0, p);

export const addLen = (r1, r2) => {
    const aux1 = isNotNull(r1.rel) ? r1 : { px: 0, rel: r1 };
    const aux2 = isNotNull(r2.rel) ? r2 : { px: 0, rel: r2 };
    const res = len(aux1.rel + aux2.rel, aux1.px + aux2.px);
    return res;
};

export const mulLen = (s, r) => {
    const aux = isNotNull(r.rel) ? r : { px: 0, rel: r };
    return len(aux.rel * s, aux.px * s);
};

export const addCoord = (c1, c2) => [
    addLen(c1[0], c2[0]),
    addLen(c1[1], c2[1])
];

export const mulCoord = (s, c) => [mulLen(s, c[0]), mulLen(s, c[1])];

export const getPx = l => (isNotNull(l.px) ? l.px : 0);

export const getRel = l => (isNotNull(l.rel) ? l.rel : l);

export const toLen = l => len(getRel(l), getPx(l));

export const splitCoord = ([x, y]) => [
    [getRel(x), getRel(y)],
    [getPx(x), getPx(y)]
];

export const asPx = ([x, y]) => [px(x), px(y)];

export const copyCoord = ([x, y]) => [copyLen(x), copyLen(y)];

export const copyLen = l => (l.rel ? copyObj(l) : l);

export const x = l => coord([l, 100]);

export const y = l => coord([100, l]);

export const coord = arg => {
    const nd = arg.isNode ? arg : node(arg);
    addSubNode(nd, '0');
    addSubNode(nd, ['x', '0']);
    addSubNode(nd, '1');
    addSubNode(nd, ['y', '1']);
    return nd;
};
