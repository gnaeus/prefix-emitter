/**
 * Copyright (c) 2016 Dmitry Panyushkin
 * Available under MIT license
 */
jest.unmock("../prefix-emitter");
jest.unmock("../es5-fallback.js");

import {PrefixEmitter, VoidEmitter, DoubleEmitter} from "../prefix-emitter";
import {on, once, injectSubscriptions, disposeSubscriptions} from "../prefix-emitter";

const firstEmitter: DoubleEmitter<string, string> = new PrefixEmitter();
const secondEmitter: VoidEmitter = new PrefixEmitter();

class Component {
    public onInitCalls: number;
    public onEventCalls: number;
    public onBothCalls: number;

    constructor() {
        this.onInitCalls = 0;
        this.onEventCalls = 0;
        this.onBothCalls = 0;

        injectSubscriptions(this);
    }

    dispose(): void {
        disposeSubscriptions(this);
    }

    @once(firstEmitter, "init")
    onInit(msg: string): void {
        this.onInitCalls++;
    }

    @on(firstEmitter, "event")
    @on(secondEmitter)
    onEvent(msg: string): void {
        this.onEventCalls++;
    }

    @once(firstEmitter, "init")
    @on(firstEmitter, "event")
    onBoth(msg: string): void {
        this.onBothCalls++;
    }
}

class Base {
    public onBaseCalls: number;

    constructor() {
        this.onBaseCalls = 0;

        injectSubscriptions(this);
    }

    dispose() {
        disposeSubscriptions(this);
    }

    @on(firstEmitter)
    onFirst(): void {
        this.onBaseCalls++;
    }

    @on(secondEmitter)
    onSecond(): void {
        this.onBaseCalls++;
    }
}

class Derived extends Base {
    public onOverriddenCalls: number;

    constructor() {
        super();
        this.onOverriddenCalls = 0;
    }

    onFirst(): void {
        this.onOverriddenCalls++;
    }

    @on(secondEmitter)
    onSecond(): void {
        this.onOverriddenCalls++;
    }
}

describe("Emitter Directives", () => {
    it("should inject and dispose subscriptions", () => {
        const component = new Component();

        firstEmitter.emit("init", "init-1");
        firstEmitter.emit("init", "init-2");
        firstEmitter.emit("event", "event-1");
        firstEmitter.emit("event", "event-2");
        firstEmitter.emit("event", "event-3");

        component.dispose();

        firstEmitter.emit("event", "event-4");
        firstEmitter.emit("event", "event-5");

        expect(component.onInitCalls).toBe(1);
        expect(component.onEventCalls).toBe(3);
        expect(component.onBothCalls).toBe(4);
    });

    it("should dispose @once subscriptions", () => {
        const component = new Component();
        component.dispose();

        firstEmitter.emit("init", "init-1");
        firstEmitter.emit("init", "init-2");

        expect(component.onInitCalls).toBe(0);
        expect(component.onEventCalls).toBe(0);
        expect(component.onBothCalls).toBe(0);
    });

    it("should work with multiple emitters", () => {
        const component = new Component();

        firstEmitter.emit("event", "event-1");
        firstEmitter.emit("event", "event-2");
        secondEmitter.emit();
        secondEmitter.emit();

        component.dispose();

        secondEmitter.emit();
        firstEmitter.emit("event", "event-3");

        expect(component.onEventCalls).toBe(4);
    });

    it("`injectSubscriptions()` should be idempotent", () => {
        const component = new Component();

        injectSubscriptions(component);
        disposeSubscriptions(component);

        firstEmitter.emit("event", "event-1");

        injectSubscriptions(component);
        injectSubscriptions(component);

        firstEmitter.emit("event", "event-2");
        firstEmitter.emit("event", "event-3");

        disposeSubscriptions(component);

        expect(component.onEventCalls).toBe(2);
    });

    it("should work with class inhetitance: subscribed only on Base", () => {
        const derived = new Derived();

        firstEmitter.emit("event", "event-1");
        firstEmitter.emit("event", "event-2");

        derived.dispose();

        expect(derived.onBaseCalls).toBe(0);
        expect(derived.onOverriddenCalls).toBe(2);
    });

    it("should work with class inhetitance: subscribed on Base and Derived", () => {
        const derived = new Derived();

        secondEmitter.emit();
        secondEmitter.emit();

        derived.dispose();

        expect(derived.onBaseCalls).toBe(0);
        expect(derived.onOverriddenCalls).toBe(4);
    });
});
