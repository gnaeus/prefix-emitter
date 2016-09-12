/**
 * Copyright (c) 2016 Dmitry Panyushkin
 * Available under MIT license
 */
jest.unmock("../utils.ts");

import { decorateMethod, decorateClass } from "../utils.ts";

describe("decorateMethod", () => {
    it("should extend target", () => {
        let targetCall = 0;
        let logicCall = 0;

        function target() { targetCall++; }
        function logic() { logicCall++; }

        const extended = decorateMethod(target, logic);

        extended();

        expect(targetCall).toBe(1);
        expect(logicCall).toBe(1);
    });

    it("should preserve target's length", () => {
        function target(a: any, b: any, c: any) { }

        const extended = decorateMethod(target, function () { });

        expect(extended.length).toBe(target.length);
    });
});

describe("decorateClass", () => {
   it("should extend target", () => {
        let targetCall = 0;
        let logicCall = 0;

        class Target {
            constructor() { targetCall++; }
        }

        function logic() { logicCall++; }

        const Extended = decorateClass(Target, logic) as any;

        const instance = new Extended();

        expect(targetCall).toBe(1);
        expect(logicCall).toBe(1);
    });

    it("should preserve target's prototype, name, length and static fields", () => {
        class Target {
            constructor(a: any, b: any, c: any) { }

            static Field = { foo: "bar" };
        }

        const Extended = decorateClass(Target, function () { }) as any;

        const instance = new Extended(1, 2, 3);

        expect(instance instanceof Target).toBeTruthy();
        expect(Extended.name).toBe(Target.name);
        expect(Extended.length).toBe(Target.length);
        expect(Extended.Field).toBe(Target.Field);
    });
});