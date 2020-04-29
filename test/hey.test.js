import { node } from '../src/node.js';

describe('Node functionality', () => {
    it('SHOULD NOT CHANGE node value', () => {
        const n = node(5);

        n.val = 5;
        expect(n.val).toBe(5);
        expect(n.old).toBe(null);

        const obj = { testing: true };
        const m = node(obj);

        m.val = obj;
        expect(m.val).toBe(obj);
        expect(m.old).toBe(null);

        // Another reference but the value is
        // considered the same - no change should
        // happen
        const newObj = { testing: true };
        m.val = newObj;
        expect(m.val).toBe(obj);
        expect(m.old).toBe(null);
    });

    it('SHOULD CHANGE node value', () => {
        const n = node(5);

        n.val = 7;
        expect(n.val).toBe(7);
        expect(n.old).toBe(5);

        const val = { testing: { testing: true } };
        const m = node(val);

        const newVal = { testing: { testing: false } };
        m.val = newVal;
        expect(m.val).toBe(newVal);
        expect(m.old).toBe(val);
    });
});
