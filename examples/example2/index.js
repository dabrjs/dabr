import {
    Tree,
    Rect,
    node,
    tran,
    fitText,
    run,
    screenSize
} from '../../src/index.js';

const isPortrait = tran(screenSize(), ([w, h]) => h > w);

const tree = Tree(
    Rect({
        layout: {
            pos: [20, 20],
            siz: [60, 60]
        },
        style: {
            color: tran(isPortrait, isIt => (isIt ? 'blue' : 'red'))
        }
    })
);

const text = tran(
    isPortrait,
    isIt => 'Hello ' + (isIt ? ' portrait!' : 'landscape!')
);

run(fitText(text, tree));
