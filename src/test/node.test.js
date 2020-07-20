import { node } from '../node.js';

describe('Node functionality', () => {
    it('SHOULD NOT CHANGE node value', () => {
        // testing primitive value (number)
        const n = node(5);
        n.val = 5;
        expect(n.val).toBe(5);
        expect(n.old).toBe(null);
        // testing object value
        const obj = { testing: true };
        const m = node(obj);
        m.val = obj;
        expect(m.val).toBe(obj);
        expect(m.old).toBe(null);
        // Another reference but the value is considered the same - no
        // change should happen (nodes care about value equality, not
        // reference equality)
        const newObj = { testing: true };
        m.val = newObj;
        expect(m.val).toBe(obj);
        expect(m.old).toBe(null);
    });
    it('SHOULD CHANGE node value', () => {
        // Primitive value (number)
        const n = node(5);
        n.val = 7;
        expect(n.val).toBe(7);
        expect(n.old).toBe(5);
        // Object value
        const val = { testing: { testing: true } };
        const m = node(val);
        const newVal = { testing: { testing: false } };
        m.val = newVal;
        expect(m.val).toBe(newVal);
        expect(m.old).toBe(val);
    });
    // test('toNode functionality', () => {
    //     const nd = node({ is: 5 });
    //     const val = 5;
    //     const a1 = toNode(nd);
    //     const a2 = toNode(val);
    //     expect(a1).toBe(nd);
    //     expect(a2.isNode).toBe(true);
    //     expect(a2.val).toBe(5);
    // });
    // test('nodeT', () => {
    //     const a = node(5);
    //     const b = node(6);
    //     const c = nodeT([a, b], () => a.val + b.val);
    //     expect(a.trans[0] == b.trans[0]).toBe(true);
    //     expect(c.val).toBe(11);
    // });
    // it('[safeNodeT] should yield null untill all nodes are not null', () => {
    //     const a = node();
    //     const b = node();
    //     const c = safeNodeT([a, b], () => a.val + b.val);
    //     expect(a.trans[0] == b.trans[0]).toBe(true);
    //     expect(c.val).toBe(null);
    //     a.val = 5;
    //     expect(c.val).toBe(null);
    //     b.val = 6;
    //     expect(c.val).toBe(11);
    // });
});

//describe('Transitions functionality', () => {
// test('tran', () => {
//     const a = node();
//     const b = node();
//     const c = node();
//     const t = tran([a, b], () => {
//         c.val = a.val * b.val;
//     });
//     expect(a.trans).toContain(t);
//     expect(b.trans).toContain(t);
//     expect(c.val).toBe(null);
//     a.val = 5;
//     // if you do not want this transitory value setting, you
//     // should use safeTran or initialize all nodes first
//     expect(c.val).toBe(5 * null);
//     b.val = 6;
//     expect(c.val).toBe(30);
// });
// it('safeTran', () => {
//     const a = node();
//     const b = node();
//     const c = node();
//     const t = safeTran([a, b], () => {
//         c.val = a.val * b.val;
//     });
//     expect(a.trans).toContain(t);
//     expect(b.trans).toContain(t);
//     expect(c.val).toBe(null);
//     a.val = 5;
//     expect(c.val).toBe(null);
//     b.val = 6;
//     expect(c.val).toBe(30);
// });
// test('removeTran', () => {
//     const a = node();
//     const b = node();
//     const c = node();
//     const t1 = safeTran([a, b], () => {
//         c.val = a.val * b.val;
//     });
//     const t2 = tran([a, b, c], () => {
//         console.log('test');
//     });
//     expect(a.trans).toContain(t1);
//     expect(b.trans).toContain(t1);
//     expect(a.trans).toContain(t2);
//     expect(b.trans).toContain(t2);
//     expect(c.trans).toContain(t2);
//     removeTran(t2);
//     expect(a.trans).toContain(t1);
//     expect(b.trans).toContain(t1);
//     expect(a.trans).not.toContain(t2);
//     expect(b.trans).not.toContain(t2);
//     expect(c.trans).not.toContain(t2);
//     removeTran(t1);
//     expect(a.trans).not.toContain(t1);
//     expect(b.trans).not.toContain(t1);
//     expect(a.trans).not.toContain(t2);
//     expect(b.trans).not.toContain(t2);
//     expect(c.trans).not.toContain(t2);
//     expect(c.val).toBe(null);
// });
// test('mapN', () => {
//     const a = node();
//     const b = node();
//     const c = mapN([a, b], (av, bv) => av * bv);
//     expect(c.val).toBe(null);
//     a.val = 5;
//     expect(c.val).toBe(5 * null);
//     b.val = 6;
//     expect(c.val).toBe(30);
// });
// it('safeMapN', () => {
//     const a = node();
//     const b = node();
//     const c = safeMapN([a, b], (av, bv) => av * bv);
//     expect(c.val).toBe(null);
//     a.val = 5;
//     expect(c.val).toBe(null);
//     b.val = 6;
//     expect(c.val).toBe(30);
// });
//});
