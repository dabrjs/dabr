// With a number for easier identification
export const error = (n, msg) => {
    throw new Error(`[DABR Error #${n}]: ${msg}`);
};

export const warn = (n, msg) =>
    console.warning(`[DABR Warning #${n}] ${msg}`);
