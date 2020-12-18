import { isNotNull, isNull } from './utils/index.js';
import { node, removeTran } from './node.js';
import { removeListen } from './channel.js';
import {
    addLayoutTriggers,
    defaultLayoutReactivity
} from './layout.js';
import { fromStruc, mapT } from './tree.js';
import { iterate } from './utils/index.js';
import { toNode } from './node.js';
import addStyle from './style/index.js';
import addChans from './events/index.js';
import addNodes from './nodes/index.js';
//import ResizeObserver from '../node_modules/resize-observer-polyfill/src/ResizeObserver.js';
//import ResizeObserver from 'resize-observer-polyfill';
import { removeEvents } from './rect.js';

// Initializes Rect: creates DOM, adds layout, nodes, chans and style
// triggers. Runs inside 'document.body'.
export const run = rectT =>
    addCSS(addStyle(addChans(addNodes(runRect(rectT)))));

// Similar to run but runs inside any DOM element
export const runDOM = (rectT, dom) =>
    addCSS(addStyle(addChans(addNodes(runRectDOM(rectT, dom)))));

const getDeviceSize = () => [
    document.documentElement.clientWidth,
    document.documentElement.clientHeight
];

const addCSS = tree =>
    mapT(tree, r => {
        if (r.css) {
            iterate(r.css, ([attrName, attrVal]) => {
                const attrNd = toNode(attrVal);
                const dom = r.inst.dom;
                r.tran(attrNd, v => {
                    dom.style[attrName] = v;
                });
            });
        }
        return r;
    });

// Initialize Rect: creates DOM, adds only core layout triggers only.
// If one wants to use Rect but not use default nodes, chans, style,
// use this function instead of 'run'. Runs inside document.body.
export const runRect = rectT => {
    const sizAbs = node(getDeviceSize());
    const parent = {
        layout: {
            posAbs: node([0, 0]),
            sizAbs: sizAbs,
            scale: node([1, 1])
        },
        flex: false,
        inst: {
            dom: document.body
        }
    };
    if (window.onresize) {
        const f = window.onresize;
        window.onresize = () => {
            const devSize = f();
            sizAbs.val = devSize;
            return devSize;
        };
    } else {
        window.onresize = () => {
            const devSize = getDeviceSize();
            sizAbs.val = devSize;
            return devSize;
        };
    }
    // Flattens tree so that Trees of Trees of ... Trees of Rects
    // become just Trees of Rects
    return runInside(fromStruc(rectT), parent);
};

// Similar to runRect, but runs inside any DOM element. Uses
// 'ResizeObserver' to check for size changes in the DOM.
export const runRectDOM = (rectT, dom) => {
    const sizAbs = node([dom.offsetWidth, dom.offsetHeight]);
    const parent = {
        layout: {
            posAbs: node([0, 0]),
            sizAbs: sizAbs,
            scale: node([1, 1])
        },
        flex: false,
        inst: {
            dom: dom
        }
    };

    addDabrCss(dom);

    new ResizeObserver(entries => {
        const entry = entries[0];
        const { width, height } = entry.contentRect;
        sizAbs.val = [width, height];
    }).observe(dom);
    // Flattens tree so that Trees of Trees of ... Trees of Rects
    // become just Trees of Rects
    return runInside(fromStruc(rectT), parent);
};

// const findReference = parents => {
//     for (let i = parents.length - 1; i >= 0; i--) {
//         const parent = parents[i];
//         if (!parent.flex) {
//             return parent;
//         }
//     }
//     return undefined;
// };

// Main run function
const runInside = (rectT, parent) => {
    const rect = rectT.elem;

    const isNotCreated = isNull(rect.inst);

    if (isNotCreated) {

        addGlobalCSSOnce();
        const elem = document.createElement(rect.tag);
        addDabrCss(elem);
        parent.inst.dom.appendChild(elem);

        rect.inst = {
            dom: elem,
            par: parent
        };
        
    } else {
        rect.recreated = true;

        //console.log(parent.inst.dom);
        //console.log(rect.inst.dom);

        parent.inst.dom.appendChild(rect.inst.dom);
        rect.inst.par = parent;

        rect.transitions.forEach(t => {
            removeTran(t);
        });
        rect.listeners.forEach(l => {
            removeListen(l);
        });
        removeEvents(rect);
    }

    const lay = rect.layout;
    // Binds rect parameters to actual CSS properties
    addLayoutTriggers(lay, rect.inst.dom, rect, parent.layout);
    // Adds (default) resize reactivity to the rect
    defaultLayoutReactivity(
        rect,
        lay.pos,
        lay.siz,
        parent.layout.scale,
        parent.layout.posAbs,
        parent.layout.sizAbs,
        lay.posAbs,
        lay.sizAbs,
        lay.enablePosAbs,
        lay.enableSizAbs,
        lay.disablePos,
        lay.disableSiz
    );

    if (isNotCreated) {
        // Trigger events for oldVersions as well. This way functions
        // working with olderVersions of rects (before preserveR's) get
        // the correct value of inst as well
        rect.oldVersions.forEach(oldVersion => {
            oldVersion.inst = rect.inst;
            oldVersion.init.put = true;
            oldVersion.created.val = true;
        });
        rect.init.put = true;
        rect.created.val = true;
        // Adds trigger for children creation/removal (remember children
        // are actually nodes, so they can be changed dynamically)
    }

    addChildrenTrigger(rectT.children, rect);

    return rectT;
};

// If a child is dynamically removed/added from the children node's
// array its DOM element is removed/created.
const addChildrenTrigger = (children, parent) => {
    parent.tran(children, () => {
        // let bneu = base.val;
        // let balt = base.old;
        // if (!balt) balt = [];
        // if (!bneu) bneu = [];
        // let cneu = children.val;
        // let calt = children.old;

        let neu = children.val;
        let alt = children.old;
        if (!alt) alt = [];
        if (!neu) neu = [];

        const removed = alt.filter(x => !neu.includes(x));
        const created = neu.filter(x => !alt.includes(x));

        // const removed = balt
        //     .map((x, i) => (!bneu.includes(x) ? i : null))
        //     .filter(isNotNull);
        // const created = bneu
        //     .map((x, i) => (!balt.includes(x) ? i : null))
        //     .filter(isNotNull);

        // let bneu = base.val;
        // let balt = base.old;
        // if (!balt) balt = [];
        // if (!bneu) bneu = [];
        // const baseNeu = bneu
        //     .filter(x => balt.includes(x))
        //     .map(t => t.elem);

        // console.log('baseney', baseNeu);
        // console.log('removed', removed);
        // console.log('created', created);

        created.forEach(x => {
            runInside(x, parent);
        });

        removed.map(removeRect);
        //const hasRecreated =
    });
};

// Removes a rect, meaning its DOM is destroyed and events and node
// transitions do not work anymore
export const removeRect = rectT => {
    const rect = rectT.elem;

    if (!rect.recreated) {
        const dom = rect.inst.dom;
        // Transitions related to DOM rendering are removed although GC
        // might be able to do it automatically
        rect.transitions.forEach(t => {
            removeTran(t);
        });
        rect.listeners.forEach(l => {
            removeListen(l);
        });
        removeEvents(rect);

        rect.inst = null;
        rect.stop.put = true;
        rect.removed.val = true;
        rect.created.val = false;

        // GC removes eventListeners automatically when DOM is removed
        dom.parentNode.removeChild(dom);

    }

    rectT.children.val.map(removeRect);

    //rectT = null;
};

// Some needed global CSS, only put once if not put already
const addGlobalCSSOnce = () => {
    // Only adds CSS once by checking ID of style tag
    const res = document.getElementById('dabr-style');
    if (!res) {
        const css =
            '.dabr::-webkit-scrollbar {' +
            'width: 0 !important;' +
            'height: 0 !important;' +
            '}' +
            '.dabr {' +
            'overflow: -moz-scrollbars-none;' +
            'scrollbar-width: none;' +
            '-ms-overflow-style: none;' +
            '}';
        const style = document.createElement('style');
        style.setAttribute('id', 'dabr-style');
        style.textContent = css;
        document.head.append(style);
    }
};

// Default CSS for DABR DOM elements
const addDabrCss = elem => {
    elem.className = 'dabr';
    elem.style['position'] = 'absolute';
    elem.style['overflow-y'] = 'scroll';
    elem.style['overflow-x'] = 'scroll';
};
