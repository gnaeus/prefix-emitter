/**
 * Copyright (c) 2016 Dmitry Panyushkin
 * Available under MIT license
 */
jest.unmock("../utils.ts");
jest.unmock("../prefix-emitter.ts");
jest.unmock("../es5-fallback.js");

import { PrefixEmitter, VoidEmitter, DoubleEmitter } from "../prefix-emitter.ts";
import { on, once, injectSubscriptions, disposeSubscriptions } from "../prefix-emitter.ts";

const firstEmitter: DoubleEmitter<string, string> = new PrefixEmitter();
const secondEmitter: VoidEmitter = new PrefixEmitter();

describe("Emitter Directives", () => {

    @injectSubscriptions
    class Component {
        onInitCalls = 0;
        onEventCalls = 0;
        onBothCalls = 0;
        
        @disposeSubscriptions
        dispose() { }

        @once(firstEmitter, "init")
        onInit(msg: string) {
            this.onInitCalls++;
        }

        @on(firstEmitter, "event")
        @on(secondEmitter)
        onEvent(msg: string) {
            this.onEventCalls++;
        }

        @once(firstEmitter, "init")
        @on(firstEmitter, "event")
        onBoth(msg: string) {
            this.onBothCalls++;
        }
    }

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

    class MountableComponent {
        onEventCalls = 0;
        
        @injectSubscriptions
        mount() { }

        @disposeSubscriptions
        unmount() { }

        @on(firstEmitter, "event")
        onEvent(msg: string) {
            this.onEventCalls++;
        }
    };

    it("should inject subscriptions by Method Decorator", () => {
        const component = new MountableComponent();

        firstEmitter.emit("event", "event-1");

        component.mount();

        firstEmitter.emit("event", "event-2");
        firstEmitter.emit("event", "event-3");

        component.unmount();

        firstEmitter.emit("event", "event-4");

        expect(component.onEventCalls).toBe(2);
    });

    @injectSubscriptions
    @injectSubscriptions
    class IdempotentComponent extends Component {}

    it("should inject subscriptions by multiple Class Decorators like by single decorator", () => {
        const component = new IdempotentComponent();
        
        firstEmitter.emit("event", "event-1");
        firstEmitter.emit("event", "event-2");

        component.dispose();

        expect(component.onEventCalls).toBe(2);
    });

    class IdempotentMountableComponent extends MountableComponent {
        @injectSubscriptions
        @injectSubscriptions
        mountIdempotent() { }
    }

    it("should inject subscriptions by multiple Method Decorators like by single decorator", () => {

        const component = new IdempotentMountableComponent();

        component.mount();
        component.unmount();

        firstEmitter.emit("event", "event-1");

        component.mount();
        component.mountIdempotent();

        firstEmitter.emit("event", "event-2");
        firstEmitter.emit("event", "event-3");

        component.unmount();

        expect(component.onEventCalls).toBe(2);
    });

    @injectSubscriptions
    class Base {
        public onBaseCalls: number;

        constructor() {
            this.onBaseCalls = 0;
        }

        @disposeSubscriptions
        dispose() { }

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
