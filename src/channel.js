import { isArray, isFunction } from './utils/index.js';

// Channel creation entry point
export const chan = (val, info) =>
    mkChan({
        get: val, // current event value
        ports: new Set(), // binded listeners
        isChan: true, // to check if obj is a channel
        info: info // additional arbitray info
    });

const mkChan = target =>
    new Proxy(target, {
        get,
        set
    });

// Property 'target' can be used to retrieve the raw channel object
// 'get' is used to get the current channel value
const get = (target, prop) =>
    prop == 'target' ? target : target[prop];

// 'put' is used to set the current value of the channel
const set = (target, prop, value) => {
    if (prop == 'put') {
        // Unlike nodes, channel set is treated as an event, so the
        // function runs even if the value is equal to the current.
        // Channel networks also DON'T prevent infinite loops.
        target.get = value;
        target.ports.forEach(port => {
            port.func();
        });
        return true;
    }
    return false;
};

export const listenRef = (...args) => {
    const len = args.length;
    const lastElem = args[len - 1];
    let triggerFunc;
    let ref;
    let i;
    if (isFunction(lastElem)) {
        triggerFunc = lastElem;
        ref = null;
        i = 1;
    } else {
        triggerFunc = args[len - 2];
        ref = lastElem;
        i = 2;
    }
    const chans = args
        .splice(0, len - i)
        .map(x => (isArray(x) ? x : [x]))
        .reduce((x, y) => x.concat(y));
    if (chans.length > 0) {
        const aLength = triggerFunc.length;
        const toGetChans = [];
        for (let i = 0; i < aLength; i++) {
            toGetChans.push(chans[i]);
        }
        const result = chan();
        const func = () => {
            const ans = triggerFunc(...toGetChans.map(c => c.get));
            if (ans) {
                result.put = ans;
            }
        };
        const listener = { chans, func, ref };
        // Many transitions with the same tag is not allowed. Tags are
        // used as an indentity for dynamically created transitions.
        chans.forEach(ch => {
            const ls = ch.target.ports;
            if (!ls.has(listener)) {
                if (ref) {
                    const res = [...ls].find(l => l.ref == ref);
                    if (res) {
                        removeListen(res);
                        ls.add(listener);
                    } else {
                        ls.add(listener);
                    }
                } else {
                    if (!ls.has(listener)) {
                        ls.add(listener);
                    }
                }
            }
        });
        return { chan: result, listener };
    } else {
        return null;
    }
};

export const listen = (...args) => {
    const { chan } = listenRef(...args);
    return chan;
};

// Adds a listener to each channel
// export const listen = (chans, func) => {
//     const listener = { chans, func };
//     chans.forEach(chan => {
//         chan.ports.add(listener);
//     });
//     return listener;
// };

// Same thing as listen but every listener has a ref attribute in a
// way that only 1 listener with the same 'ref' object can be inside
// a channel. When listenRef is used in node with a transition with
// the same ref, the old transition is replaced by the new one.
// export const listenRef = (ref, chans, func) => {
//     const listener = { chans, func, ref };
//     chans.forEach(chan => {
//         const ps = chan.ports;
//         const res = [...ps].find(l => l.ref == ref);
//         if (res) {
//             removeListen(res);
//             ps.add(listener);
//         } else {
//             ps.add(listener);
//         }
//     });
//     return listener;
// };

// Listener removal
export const removeListen = listener => {
    listener.chans.forEach(chan => {
        const target = chan.target;
        target.ports.delete(listener);
    });
};

//// After first listen, listener is removed
// export const listenOnce = (chans, func) => {
//     const listener = listen(chans, () => {
//         func();
//         removeListen(listener);
//     });
//     return listener;
// };
export const listenOnce = (...args) => {
    const len = args.length;
    const lastElem = args[len - 1];
    let func;
    let ref;
    let chans;
    if (isFunction(lastElem)) {
        func = lastElem;
        ref = null;
        chans = args.splice(0, len - 1);
    } else {
        func = args[len - 2];
        ref = lastElem;
        chans = args.splice(0, len - 2);
    }
    const res = listenRef(
        ...chans,
        () => {
            func();
            removeListen(res.listener);
        },
        ref
    );
    return res;
};
