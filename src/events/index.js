import { iterate } from '../utils/index.js';
import { mapT } from '../tree.js';

const events = {
    click: ({ rect, channel }) => {
        rect.addEvent('click', e => {
            channel.put = e;
        });
        // elem.addEventListener('click', e => {
        //     channel.put = e;
        // });
    },
    mouseOver: ({ rect, channel }) => {
        rect.addEvent('mouseover', e => {
            channel.put = e;
        });
        // elem.addEventListener('mouseover', e => {
        //     channel.put = e;
        // });
    },
    mouseEnter: ({ rect, channel }) => {
        rect.addEvent('mouseenter', e => {
            channel.put = e;
        });
        // elem.addEventListener('mouseenter', e => {
        //     channel.put = e;
        // });
    },
    mouseMove: ({ rect, channel }) => {
        rect.addEvent('mousemove', e => {
            channel.put = e;
        });
        // elem.addEventListener('mousemove', e => {
        //     channel.put = e;
        // });
    },
    drag: ({ rect, channel }) => {
        let clicking = false;
        rect.addEvent('mousedown', e => {
            clicking = true;
            channel.put = e;
        });
        rect.addEvent('mouseup', () => {
            clicking = false;
            channel.put = false;
        });
        rect.addEvent('mousemove', e => {
            if (clicking) {
                channel.put = e;
            }
        });
    },
    mouseOut: ({ rect, channel }) => {
        rect.addEvent('mouseout', e => {
            channel.put = e;
        });
    }
};

// Binds events to channels
export default tree =>
    mapT(tree, r => {
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
