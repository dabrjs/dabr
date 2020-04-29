import { node, tran } from '../node.js';

export const hashNode = () => {
    const hn = node(location.hash.slice(1));

    window.addEventListener(
        'hashchange',
        () => {
            if ('#' + hn.val != location.hash) {
                hn.val = location.hash.slice(1);
            }
        },
        false
    );

    tran([hn], () => {
        location.hash = hn.val;
    });

    return hn;
};

window.c = hashNode();

//const keypressChannel = chan();
