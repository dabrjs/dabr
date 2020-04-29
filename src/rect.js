import {
    concatObj,
    iterate,
    mapObj,
    singleton,
    isWeakMap,
    isObj
} from './utils/index.js';
import { node, toNode } from './node.js';
import { chan } from './channel.js';

// Creates the staindard Rect interface, which is a standard set of
// attrs transformations/functions can rely on. Doc:
// isRect: property to check if an object is a rect
// isSupp: check if rect is support (defined by transformations) or
//   core (defined by the user)
// isCore: opposite of isSupp
// init: channel set to true when a rect is initialized
// stop: channel set to true when a rect is initialized
// created: node equal to true after rect is initialized and
//   null/false otherwise
// removed: node equal to true after rect is destroyed and null/false
//   otherwise
// inst: object containing info about how the rect was instantiated
//   inst.dom: the DOM element binded to the rect
//   inst.par: the parent rect
// renderTrans: references to transitions related to DOM rendering.
//   Normally the user should not modify this attr.
// data: additional information/nodes/channels outside of the standard
//   attrs that the rect interacts with. It is good practice for
//   transformations to put additional data inside this attr with key
//   equal to the transformation itself. It is defined as {key, val}
//   or [{key, val}]. Examples:
//     'rect.data.get(border)' gets data put by the 'border' function.
//     'rect.data.get(Rect)' stores if a rect isMain or isAux.
// layout: information regarding positioning. All attrs are nodes.
//   layout.posAbs: absolute position in pixels, only initialized
//     after rect is ran
//   layout.sizAbs: absolute size in pixels, only initialized
//     after rect is ran
//   layout.max: maximum relative lengths for coords,
//     default is [100,100]
//   layout.pos: relative position length. Obligatory in any rect.
//   layout.siz: relative size length. Obligatory in any rect.
export const Rect = def => {
    const defaultLayout = {
        posAbs: node(),
        sizAbs: node(),
        max: node([100, 100])
    };

    const defaultRectAttrs = {
        isRect: true,
        isCore: true,
        isSupp: false,
        init: chan(),
        stop: chan(),
        created: node(),
        removed: node(),
        inst: null,
        renderTrans: new Set(),
        data: new WeakMap([[Rect, {}]]),
        layout: defaultLayout
    };

    const aux = {};
    if (def.data) {
        if (isWeakMap(def.data)) {
            aux.data = def.data;
        } else {
            const arr = singleton(def.data);
            aux.data = new WeakMap(
                arr.map(({ key, val }) => [key, [val]])
            );
        }
    }
    if (def.layout) {
        aux.layout = concatObj(defaultLayout, def.layout);
    }

    const res = concatObj(defaultRectAttrs, def, aux);
    if (res.layout) {
        res.layout = mapObj(toNode, res.layout);
    }
    return res;
};

// Same as Rect, but with isAux = true
export const Supp = def => {
    const rect = Rect(def);
    rect.isSupp = true;
    rect.isCore = false;
    return rect;
};

// Changes some Rect properties, preserving the others
export const preserveR = (rect, changes) => {
    const aux = {};
    iterate(changes, ([name, key]) => {
        if (rect[name] && isObj(rect[name])) {
            aux[name] = concatObj(rect[name], key);
        } else {
            aux[name] = key;
        }
    });
    if (changes.data) {
        const arr = singleton(changes.data);
        aux.data = rect.data;
        arr.forEach(({ key, val }) => {
            if (aux.data.has(key)) {
                const current = aux.data.get(key);
                aux.data.set(current.concat(key));
            } else {
                aux.data.set(key, [val]);
            }
        });
    }
    aux.init = rect.init;
    aux.created = rect.created;
    return Rect(concatObj(rect, aux));
};

// Auxiliar function to define {key, val}, it is really only a
// more aesthetical way of defining the object (imo)
export const keyed = (key, val) => ({
    key: key,
    val: val
});

// A dummy rectangle covering the entire parent rectangle
export const Dummy = changes =>
    preserveR(
        Supp({
            layout: {
                pos: [0, 0],
                siz: [100, 100]
            }
        }),
        changes || {}
    );
