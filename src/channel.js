import { isNotNull } from './utils/index.js';

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

// Adds a listener to each channel
export const listen = (chans, func) => {
    const listener = { chans, func };
    chans.forEach(chan => {
        chan.ports.add(listener);
    });
    return listener;
};

// Same thing as listen but every listener has a ref attribute in a
// way that only 1 listener with the same 'ref' object can be inside
// a channel. When listenRef is used in node with a transition with
// the same ref, the old transition is replaced by the new one.
export const listenRef = (ref, chans, func) => {
    const listener = { chans, func, ref };
    chans.forEach(chan => {
        const ps = chan.ports;
        const res = [...ps].find(l => l.ref == ref);
        if (res) {
            removeListen(res);
            ps.add(listener);
        } else {
            ps.add(listener);
        }
    });
    return listener;
};

// Listener removal
export const removeListen = listener => {
    listener.chans.forEach(chan => {
        const target = chan.target;
        target.ports.delete(listener);
    });
};

// After first listen, listener is removed
export const listenOnce = (chans, func) => {
    const listener = listen(chans, () => {
        func();
        removeListen(listener);
    });
    return listener;
};

// Creates a channel from a listener function. If function returns
// null or undefined, the channel is not set.
export const chanL = (chans, func) => {
    const aux = chan();
    listen(chans, () => {
        const ans = func();
        if (isNotNull(ans)) {
            aux.put = ans;
        }
    });
    return aux;
};

// Maps a function to a node. Because it uses chanL, returning a null
// or undefined value filters the result.
export const mapC = (cs, f) =>
    chanL(cs, () => f(...cs.map(c => c.get)));

// Specialization of mapC to filter only
export const filterC = (chan, cond) =>
    mapC([chan], val => (cond(val) ? val : null));
