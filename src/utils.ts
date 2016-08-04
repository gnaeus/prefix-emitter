/**
 * Remove first occurrence of given item from the array.
 * @param array Array
 * @param item any
 */
export function removeItem(array: any[], item: any): void {
    const index = array.indexOf(item);
    if (index > 0) {
        array.splice(index, 1);
    } else if (index === 0) {
        array.shift();
    }
}

/**
 * Build new constructor from given one with injected logic at the beginning of constructor call.
 * @param target Function
 * @param logic Function
 * @returns Function
 */
export function extendConstructor(target: Function, logic: Function): Function {
    const constructor = extendFunction(target, logic);
    constructor.prototype = target.prototype;
    return constructor as any;
}

/**
 * Build new function from given one with injected logic at the beginning of function call.
 * @param target Function
 * @param logic Function
 * @returns Function
 */
export function extendFunction(target: Function, logic: Function): Function {
    return function () {
        logic.apply(this, arguments);
        return target.apply(this, arguments);
    }
}