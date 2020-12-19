import {
    concatObj,
    iterate,
    mapObj,
    singleton,
    isWeakMap,
    isObj
} from './utils/index.js';
import { node, toNode, tranRef, unsafeTranRef } from './node.js';
import { listenRef, listenOnce, chan } from './channel.js';
//import { coord } from './coord.js';

// Creates the staindard Rect interface, which is a standard set of
// attrs transformations/functions can rely on. Doc:
// isRect: property to check if an object is a rect
// isSupp: check if rect is support (defined by transformations) or
//   core (defined by the user)
// isCore: opposite of isSupp
// oldVersions: array containing older references to the same rect
//   before being preserved by the preserveR function. This value
//   is important for transformations relying on correct rect.inst
//   values even after rect gets transformed by functions (and its
//   object reference changes)
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
// domEvents: events inside the rect which should be deleted when the
//   rect is removed
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
//   layout.scale: the scale (in x and y) which defined the coords of
//     inner rects. Default is [1,1]
//   layout.pos: relative position length. Obligatory in any rect.
//   layout.siz: relative size length. Obligatory in any rect.
export const Rect = (def = {}) => {
    const defaultLayout = {
        pos: [0, 0],
        siz: [100, 100],
        posAbs: node(),
        sizAbs: node(),
        scale: [1, 1],
        disablePos: node(false),
        disableSiz: node(false),
        posChanged: chan(),
        sizChanged: chan(),
        posAbsChanged: chan(),
        sizAbsChanged: chan(),
        enablePosAbs: node(false),
        enableSizAbs: node(false)
    };

    const defaultRectAttrs = {
        tag: 'div',
        isRect: true,
        isSupp: false,
        isCore: true,
        oldVersions: [],
        init: chan(),
        stop: chan(),
        created: node(),
        removed: node(),
        inst: null,
        transitions: new Set(),
        listeners: new Set(),
        domEvents: [],
        //renderListens: new Set(),
        data: new WeakMap([[Rect, {}]]),
        layout: defaultLayout,
        tran: rectTran,
        tranRef: rectTranRef,
        listen: rectListen,
        listenRef: rectListenRef,
        unsafeTran: rectUnsafeTran,
        unsafeTranRef: rectUnsafeTranRef,
        addEvent: addEvent,
        withInst,
        withDOM,
        withPar
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
        res.layout = mapObj(
            x => (x.isChan ? x : toNode(x)),
            res.layout
        );
    }
    return res;
};

const rectTranRef = function(...args) {
    // this = rect
    const res = tranRef(...args);
    this.transitions.add(res.transition);
    return res;
};

const rectTran = function(...args) {
    // this = rect
    const { transition, node: nd } = tranRef(...args);
    this.transitions.add(transition);
    return nd;
};

const rectUnsafeTranRef = function(...args) {
    // this = rect
    const res = unsafeTranRef(...args);
    this.transitions.add(res.transition);
    return res;
};

const rectUnsafeTran = function(...args) {
    // this = rect
    const { transition, node: nd } = unsafeTranRef(...args);
    this.transitions.add(transition);
    return nd;
};

const rectListenRef = function(...args) {
    // this = rect
    const res = listenRef(...args);
    this.listeners.add(res.listener);
    return res;
};

const rectListen = function(...args) {
    // this = rect
    const { listener, chan: ch } = listenRef(...args);
    this.listeners.add(listener);
    return ch;
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
    iterate(changes, ([name, key]) => {
        if (name == 'data') {
            const arr = singleton(changes.data);
            //aux.data = rect.data;
            arr.forEach(({ key, val }) => {
                if (rect.data.has(key)) {
                    const current = rect.data.get(key);
                    rect.data.set(current.concat(key));
                } else {
                    rect.data.set(key, [val]);
                }
            });
        } else if (name == 'layout') {
            rect.layout = concatObj(
                rect.layout,
                mapObj(x => (x.isChan ? x : toNode(x)), key)
            );
        } else if (rect[name] && isObj(rect[name])) {
            rect[name] = concatObj(rect[name], key);
        } else {
            rect[name] = key;
        }
    });
    //aux.inst = null; //rect.inst;
    //aux.init = chan(); //rect.init;
    //aux.created = node(); //rect.created;
    //aux.oldVersions = rect.oldVersions.concat([rect]);
    return rect;
};

// export const preserveR = (rect, changes) => {
//     const aux = {};
//     iterate(changes, ([name, key]) => {
//         if (rect[name] && isObj(rect[name])) {
//             aux[name] = concatObj(rect[name], key);
//         } else {
//             aux[name] = key;
//         }
//     });
//     if (changes.data) {
//         const arr = singleton(changes.data);
//         aux.data = rect.data;
//         arr.forEach(({ key, val }) => {
//             if (aux.data.has(key)) {
//                 const current = aux.data.get(key);
//                 aux.data.set(current.concat(key));
//             } else {
//                 aux.data.set(key, [val]);
//             }
//         });
//     }
//     aux.inst = null; //rect.inst;
//     aux.init = chan(); //rect.init;
//     aux.created = node(); //rect.created;
//     aux.oldVersions = rect.oldVersions.concat([rect]);
//     return Rect(concatObj(rect, aux));
// };

// Auxiliar function to define {key, val}, it is really only a
// more aesthetical way of defining the object (imo)
export const keyed = (key, val) => ({
    key: key,
    val: val
});

export const removeEvents = rect => {
    const elem = rect.inst.dom;
    rect.domEvents.forEach(({ name }) => {
        elem['on' + name] = null;
        //elem.removeEventListener(name, func);
    });
};

const addEvent = function(name, func) {
    // this = rect
    const elem = this.inst.dom;
    elem['on' + name] = func;
    this.domEvents.push({
        name,
        func
    });
};

const withInst = function(f) {
    const rect = this;
    listenOnce(rect.init, () => f(rect.inst));
};

const withDOM = function(f) {
    const rect = this;
    listenOnce(rect.init, () => f(rect.inst.dom));
};

const withPar = function(f) {
    const rect = this;
    listenOnce(rect.init, () => f(rect.inst.par));
};
