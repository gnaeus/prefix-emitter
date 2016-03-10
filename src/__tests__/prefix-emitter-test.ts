/**
 * Copyright (c) 2016 Dmitry Panyushkin
 * Available under MIT license
 */
jest.dontMock("../prefix-emitter.ts");

import {PrefixEmitter, VoidEmitter, DoubleEmitter, Subscription} from "../prefix-emitter.ts";

describe("Prefix Emitter", () => {
    it("should work without parameters", () => {
        const emitter: VoidEmitter = new PrefixEmitter();
        let handlerCalls = 0;

        emitter.on(() => { handlerCalls++; });
        emitter.once(() => { handlerCalls++; });

        emitter.emit();
        emitter.emit();

        expect(handlerCalls).toBe(3);
    });

    it("should work with string events", () => {
        const emitter: DoubleEmitter<string, any> = new PrefixEmitter();
        let handlerCalls = 0;

        emitter.on("fired", (arg: any) => {
            handlerCalls++;
            expect(arg).toBe("arg");
        });

        emitter.once("fired", (arg: any) => {
            handlerCalls++;
            expect(arg).toBe("arg");
        });

        emitter.on("not-fired", () => { throw new Error(); });
        emitter.once("not-fired", () => { throw new Error(); });

        emitter.emit("fired", "arg");
        emitter.emit("fired", "arg");

        expect(handlerCalls).toBe(3);
    });

    it("should work with rest parameters", () => {
        const emitter = new PrefixEmitter();
        let handlerCalls = 0;

        emitter.on((arg1: any, arg2: any, arg3: any, arg4: any) => {
            handlerCalls++;
            expect(arg1).toBe("arg1");
            expect(arg2).toBe("arg2");
            expect(arg3).toBe("arg3");
            expect(arg4).toBe("arg4");
        });

        emitter.on("arg1", (arg2: any, arg3: any, arg4: any) => {
            handlerCalls++;
            expect(arg2).toBe("arg2");
            expect(arg3).toBe("arg3");
            expect(arg4).toBe("arg4");
        });
        
        emitter.once("arg1", "arg2", (arg3: any, arg4: any) => {
            handlerCalls++;
            expect(arg3).toBe("arg3");
            expect(arg4).toBe("arg4");
        });

        emitter.once("arg1", "arg2", "arg3", (arg4: any) => {
            handlerCalls++;
            expect(arg4).toBe("arg4");
        });
        
        emitter.emit("arg1", "arg2", "arg3", "arg4");

        expect(handlerCalls).toBe(4);
    });

    it("should work with object prefixes", () => {
        const emitter: DoubleEmitter<Object, any> = new PrefixEmitter();
        let handlerCalls = 0;
        const params = {
            foo: { foo: "bar" },
            bar: { bar: "foo" },
        };

        emitter.on(params.foo, (arg2: any) => {
            handlerCalls++;
            expect(arg2).toBe(params.bar);
        });

        emitter.once(params.foo, params.bar, () => {
            handlerCalls++;
        });

        emitter.emit(params.foo, params.bar);
        emitter.emit(params.bar, params.foo);

        expect(handlerCalls).toBe(2);
    });

    it("should cleanup subscriptions trie", () => {
        const emitter = new PrefixEmitter();
        const subscriptions = new Array<Subscription>();

        subscriptions.push(emitter.on(() => { }));
        subscriptions.push(emitter.on("first", () => { }));
        subscriptions.push(emitter.on("first", "second", () => { }));
        subscriptions.push(emitter.on("first", "third", () => { }));
        subscriptions.push(emitter.on("first", "second", "third", "fourth", () => { }));

        expect(emitter["_node"].handlers.length).not.toEqual(0);
        expect(emitter["_node"].children.size).not.toEqual(0);

        subscriptions[4].dispose();
        subscriptions[1].dispose();
        subscriptions[2].dispose();
        subscriptions[0].dispose();
        subscriptions[3].dispose();

        expect(emitter["_node"].handlers.length).toEqual(0);
        expect(emitter["_node"].children).not.toBeDefined();
    });
});