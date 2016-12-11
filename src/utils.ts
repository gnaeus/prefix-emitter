/**
 * Copyright (c) 2016 Dmitry Panyushkin
 * Available under MIT license
 */

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

export function repeat(count: number, template: (i: number) => string, sep = ""): string {
    const arr: any[] = [];
    for (let i = 1; i <= count; ++i) {
        arr.push(template(i));
    }
    return arr.join(sep);
}

export function assign(target: Object, source: Object): void {
    for (let k in source) {
        if (source.hasOwnProperty(k)) {
            target[k] = source[k];
        }
    }
}

/**
 * Build new function from given one with injected logic at the beginning of function call.
 * @param target Function: target function
 * @param logic Function: injected logic
 * @returns Function
 */
export const decorateMethod: (target: Function, logic: Function) => Function = new Function("target", "logic", `
    switch (target.length) {${repeat(16, l => `
        ${l < 16 ? `case ${l}` : `default`}: return function (${repeat(l, i => "v" + i, ", ")}) {
            logic.apply(this, arguments);
            return target.apply(this, arguments);
        };`)}
    }
`) as any;

/**
 * Build new constructor from given one with injected logic at the beginning of constructor call.
 * @param target Function: target constructor
 * @param logic Function: injected logic
 * @returns Function
 */
export function decorateClass(target: Function, logic: Function): Function {
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

    const constructor = factory(target, logic) as Function;

    // preserve target's prototype and static fields
    constructor.prototype = target.prototype;
    assign(constructor, target);

    return constructor;
}