import { tran, node, toNode } from '../node.js';
import { chan, listen } from '../channel.js';
import { proportional } from './proportional.js';
import { Supp } from '../rect.js';
import { Tree } from '../tree.js';
import { asPx } from '../coord.js';
import { keyed } from '../rect.js';

export const Img = src => {
    const srcN = toNode(src);

    const imgDOM = document.createElement('img');

    const imgSiz = chan();

    const r = Supp({
        layout: {
            pos: [0, 0],
            siz: [100, 100]
        },
        css: {
            overflow: '-moz-hidden-unscrollable'
        },
        data: keyed(Img, { siz: imgSiz, dom: imgDOM })
    });

    r.withDOM(dom => {
        tran(srcN, src => {
            imgDOM.setAttribute('src', src);
            imgDOM.style['width'] = 'auto';
            imgDOM.style['height'] = 'auto';
            imgDOM.addEventListener('load', () => {
                const naturalImgSiz = asPx([
                    imgDOM.offsetWidth,
                    imgDOM.offsetHeight
                ]);
                imgSiz.put = naturalImgSiz;
                imgDOM.style['width'] = '100%';
                imgDOM.style['height'] = '100%';
            });
            dom.appendChild(imgDOM);
        });
    });

    return Tree(r);
};

//
export const fitImg = src => {
    const imgT = Img(src);
    const [{ siz: imgSiz }] = imgT.elem.data.get(Img);
    const prop = node();
    listen(imgSiz, s => {
        prop.val = [s[0].px, s[1].px];
    });
    return proportional(prop, imgT);
};
