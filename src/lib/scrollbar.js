import { node, tran } from '../node.js';
import { listen, chan } from '../channel.js';
import { RectT } from '../rect-tree.js';
import { len } from '../coord.js';

const scrollbar = (scroll, max_) => {
    const pos = node([0, 0]);

    tran([scroll], () => {
        const h = scroll.val[1];
        pos.val = [0, (h * 95) / 100];
    });

    const click = chan();
    const sizAbs_ = node();

    listen([click], () => {
        if (sizAbs_) {
            const sizAbs = sizAbs_.val;
            const val = click.get;
            const x = val.offsetX;
            const y = val.offsetY;
            scroll.val = [
                (x / sizAbs[0]) * 100,
                (y / sizAbs[1]) * 100
            ];
        }
    });

    const a = node();

    const r = RectT(
        {
            layout: {
                pos: [len(100, -10), 0],
                siz: a,
                sizAbs: sizAbs_
            },
            style: {
                //color: 'gray'
            },
            events: {
                click
            }
        },
        RectT({
            layout: {
                pos: pos,
                siz: [100, 5]
            },
            style: {
                color: 'blue'
            }
        })
    );

    tran([max_], () => {
        const max = max_.val;
        a.val = [len(0, 10), max[1]]; //len([0, (100 / 100) * max[1]], [10, 0]);
    });

    /*listenOnce(r.init, () => {
        const max_ = r.inst.par.layout.max;
        tran(max_, () => {
            const max = max_.val;
            a.val = len([0, (100 / 100) * max[1]], [10, 0]);
        });
    });*/

    return r;
};

export { scrollbar };
