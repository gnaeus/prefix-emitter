/**
 * Copyright (c) 2016 Dmitry Panyushkin
 * Available under MIT license
 */
jest.unmock("../utils.ts");

import { extendFunction, extendConstructor } from "../utils.ts";

describe("extendFunction", () => {
    it("should extend target", () => {
        let targetCall = 0;
        let logicCall = 0;

        function target() { targetCall++; }
        function logic() { logicCall++; }
        
        const extended = extendFunction(target, logic);

        extended();

        expect(targetCall).toBe(1);
        expect(logicCall).toBe(1);
    });

    it("should preserve target's name and length", () => {
        function target(a: any, b: any, c: any) { }

        const extended = extendFunction(target, function () { });

        expect(extended.name).toEqual(target.name);
        expect(extended.length).toEqual(target.length);
    });
});

describe("extendConstructor", () => {
    it("should preserve target's prototype", () => {
        class Test { }

        const Extended = extendConstructor(Test, function () { }) as any;

        const instance = new Extended();

        expect(instance instanceof Test).toBeTruthy();
    });
});