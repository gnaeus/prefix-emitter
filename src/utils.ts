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

function repeat(count: number, template: (i: number) => string, sep = ""): string {
    const arr: any[] = [];
    for (let i = 0; i < count; ++i) {
        arr.push(template(i));
    }
    return arr.join(sep);
}

/**
 * Build new function from given one with injected logic at the beginning of function call.
 * @param target Function: target function
 * @param logic Function: injected logic
 * @returns Function
 */
export function extendFunction(target: Function, logic: Function): Function {
    // unique prefix for Function constructor for
    // eliminate conflicts with `target` functions names
    const pr = "bvjxRy0LjL9D";

    // Code generation is used to preserve target's `.name` and `.length`
    // It is about 30x slower than simple funciton wrapping
    // But it is slill less than 5 microseconds per call
    // So if you have 200 decorated classes it took less then 1ms
    const factory = new Function(pr + "target", pr + "logic", `
        return function ${target.name}(${repeat(target.length, i => "v" + i, ", ")}) {
            ${pr}logic.apply(this, arguments);
            return ${pr}target.apply(this, arguments);
        };
    `);
    return factory(target, logic);
}

/**
 * Build new constructor from given one with injected logic at the beginning of constructor call.
 * @param target Function: target constructor
 * @param logic Function: injected logic
 * @returns Function
 */
export function extendConstructor(target: Function, logic: Function): Function {
    const constructor = extendFunction(target, logic);
    constructor.prototype = target.prototype;
    return constructor as any;
}