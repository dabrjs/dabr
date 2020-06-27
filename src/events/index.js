import { iterate } from '../utils/index.js';
import { mapT } from '../tree.js';

const events = {
    click: ({ elem, channel }) => {
        elem.addEventListener('click', e => {
            channel.put = e;
        });
    },
    mouseOver: ({ elem, channel }) => {
        elem.addEventListener('mouseover', e => {
            channel.put = e;
        });
    },
    mouseEnter: ({ elem, channel }) => {
        elem.addEventListener('mouseenter', e => {
            channel.put = e;
        });
    },
    mouseMove: ({ elem, channel }) => {
        elem.addEventListener('mousemove', e => {
            channel.put = e;
        });
    },
    drag: ({ elem, channel }) => {
        let clicking = false;
        elem.addEventListener('mousedown', e => {
            console.log('aAAAAAA');
            clicking = true;
            channel.put = e;
        });
        elem.addEventListener('mouseup', () => {
            console.log('BBBBBBBBB');
            clicking = false;
            channel.put = false;
        });
        elem.addEventListener('mousemove', e => {
            if (clicking) {
                channel.put = e;
            }
        });
    },
    mouseOut: ({ elem, channel }) => {
        elem.addEventListener('mouseout', e => {
            channel.put = e;
        });
    }
};

// Binds events to channels
export default mapT(r => {
    if (r.events) {
        iterate(r.events, ([name, ch]) => {
            if (ch.isChan) {
                const ans = events[name];
                if (ans) {
                    ans({
                        channel: ch,
                        elem: r.inst.dom,
                        rect: r
                    });
                }
            }
        });
    }
    return r;
});
