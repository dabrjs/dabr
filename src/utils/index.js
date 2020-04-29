export * from './error.js';
export * from './functional.js';
export * from './types.js';

// export const tag = info => ({
//     info
// });

// export const forUntil = (array, func) => {
//     for (let i = 0; i < array.length; i++) {
//         if (!func(array[i])) {
//             break;
//         }
//     }
// };

// vector functions

export const randomColor = () => {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
};

export const objToArray = obj => {
    let res = [];
    Object.entries(obj).forEach(function([key, val]) {
        return (res[key] = val);
    });
    return res;
};
