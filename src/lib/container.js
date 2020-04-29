import { Tree, Entry } from '../tree.js';
import { keyed, Dummy } from '../rect.js';

export const container = show => rect =>
    Tree(
        Dummy({
            data: keyed(container, show),
            style: {
                show
            }
        }),
        [Tree(rect, Entry)]
    );
