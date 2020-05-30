import { node, tran, removeTran } from './node.js';
import {
    addLayoutTriggers,
    defaultLayoutReactivity
} from './layout.js';
import { flatten } from './tree.js';
import addStyle from './style/index.js';
import addChans from './events/index.js';
import addNodes from './nodes/index.js';
//import ResizeObserver from '../node_modules/resize-observer-polyfill/src/ResizeObserver.js';
import ResizeObserver from 'resize-observer-polyfill';
import { removeEvents } from './rect.js';

// Initializes Rect: creates DOM, adds layout, nodes, chans and style
// triggers. Runs inside 'document.body'.
export const run = rectT =>
    addStyle(addChans(addNodes(runRect(rectT))));

// Similar to run but runs inside any DOM element
export const runDOM = (rectT, dom) =>
    addStyle(addChans(addNodes(runRectDOM(rectT, dom))));

const getDeviceSize = () => [
    document.documentElement.clientWidth,
    document.documentElement.clientHeight
];

// Initialize Rect: creates DOM, adds only core layout triggers only.
// If one wants to use Rect but not use default nodes, chans, style,
// use this function instead of 'run'. Runs inside document.body.
export const runRect = rectT => {
    const sizAbs = node(getDeviceSize());
    const parent = {
        layout: {
            posAbs: node([0, 0]),
            sizAbs: sizAbs,
            max: node([100, 100])
        },
        inst: {
            dom: document.body
        }
    };

    window.onresize = () => {
        sizAbs.val = getDeviceSize();
    };
    // Flattens tree so that Trees of Trees of ... Trees of Rects
    // become just Trees of Rects
    return runInside(flatten(rectT), parent);
};

// Similar to runRect, but runs inside any DOM element. Uses
// 'ResizeObserver' to check for size changes in the DOM.
export const runRectDOM = (rectT, dom) => {
    const sizAbs = node([dom.offsetWidth, dom.offsetHeight]);
    const parent = {
        layout: {
            posAbs: node([0, 0]),
            sizAbs: sizAbs,
            max: node([100, 100])
        },
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
    return runInside(flatten(rectT), parent);
};

// Main run function
const runInside = (rectT, parent) => {
    const rect = rectT.val;

    addGlobalCSSOnce();
    const elem = document.createElement('div');
    addDabrCss(elem);
    parent.inst.dom.appendChild(elem);

    rect.inst = {
        dom: elem,
        par: parent
    };

    const lay = rect.layout;
    // Binds rect parameters to actual CSS properties
    addLayoutTriggers(lay, elem, rect, parent.layout);
    // Adds (default) resize reactivity to the rect
    defaultLayoutReactivity(
        lay.pos,
        lay.siz,
        parent.layout.max,
        parent.layout.posAbs,
        parent.layout.sizAbs,
        lay.posAbs,
        lay.sizAbs
    );
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
    addChildrenTrigger(rectT.children, rect);

    return rectT;
};

// If a child is dynamically removed/added from the children node's
// array its DOM element is removed/created.
const addChildrenTrigger = (children, parent) => {
    const t = tran([children], () => {
        let neu = children.val;
        let alt = children.old;
        if (!alt) alt = [];
        if (!neu) neu = [];
        const removed = alt.filter(x => !neu.includes(x));
        const created = neu.filter(x => !alt.includes(x));
        created.forEach(x => runInside(x, parent));
        removed.forEach(x => removeRect(x));
    });
    parent.renderTrans.add(t);
};

// Removes a rect, meaning its DOM is destroyed and events and node
// transitions do not work anymore
export const removeRect = rectT => {
    const rect = rectT.val;
    const dom = rect.inst.dom;
    // GC removes eventListeners automatically when DOM is removed
    dom.parentNode.removeChild(dom);
    // Transitions related to DOM rendering are removed although GC
    // might be able to do it automatically
    rect.renderTrans.forEach(tran => {
        removeTran(tran);
    });
    removeEvents(rect);
    rect.inst = null;
    rect.stop.put = true;
    rect.removed.val = true;
    rect.created.val = false;
    // recursively removes all children
    rectT.children.val = rectT.children.val.map(removeRect);
    return rectT;
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
