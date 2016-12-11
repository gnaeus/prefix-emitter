/**
 * Copyright (c) 2016 Dmitry Panyushkin
 * Available under MIT license
 */
jest.unmock("../utils");
jest.unmock("../prefix-emitter");
jest.unmock("../es5-fallback");

import { PrefixEmitter, VoidEmitter, DoubleEmitter } from "../prefix-emitter";
import { on, once, injectSubscriptions, disposeSubscriptions } from "../prefix-emitter";

const firstEmitter: DoubleEmitter<string, string> = new PrefixEmitter();
const secondEmitter: VoidEmitter = new PrefixEmitter();

describe("Emitter Directives", () => {
    class Component {
        onInitCalls = 0;
        onEventCalls = 0;
        onBothCalls = 0;

        constructor() {
            injectSubscriptions(this);
        }

        dispose() {
            disposeSubscriptions(this);
        }

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

    class DependentComponent {
        onEventCalls = 0;

        @on(firstEmitter, "event")
        onEvent(msg: string) {
            this.onEventCalls++;
        }
    };

    it("should inject and dispose subscriptions by utility functions", () => {
        const component = new DependentComponent();

        firstEmitter.emit("event", "event-1");

        injectSubscriptions(component);

        firstEmitter.emit("event", "event-2");
        firstEmitter.emit("event", "event-3");

        disposeSubscriptions(component);

        firstEmitter.emit("event", "event-4");

        expect(component.onEventCalls).toBe(2);
    });

    class IdempotentComponent extends Component {
        constructor() {
            super();
            injectSubscriptions(this);
            injectSubscriptions(this);
        }
    }

    it("should inject subscriptions once by class instance", () => {
        const component = new IdempotentComponent();

        firstEmitter.emit("event", "event-1");
        firstEmitter.emit("event", "event-2");

        component.dispose();

        expect(component.onEventCalls).toBe(2);
    });

    

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

    it("should be composable with other decorators", () => {
        let log: string[] = [];
        function logDecorator(target: Object, key: string, descriptor: PropertyDescriptor) {
            if (arguments.length === 2) {
                let old = target[key] as Function;
                target[key] = function () {
                    log.push(key);
                    return old.apply(this, arguments);
                };
            } else {
                descriptor = descriptor || Object.getOwnPropertyDescriptor(target, key);
                let old = descriptor.value as Function;
                descriptor.value = function () {
                    log.push(key);
                    return old.apply(this, arguments);
                };
            }
            return descriptor;
        }

        class MountableComponent {
            onEventCalls = 0;

            @logDecorator
            mount() {
                injectSubscriptions(this);
            }

            @logDecorator
            unmount() {
                disposeSubscriptions(this);
            }

            @on(firstEmitter, "event")
            @logDecorator
            onEvent(msg: string) {
                this.onEventCalls++;
            }
        }

        const component = new MountableComponent();

        firstEmitter.emit("event", "event-1");

        component.mount();

        firstEmitter.emit("event", "event-2");
        firstEmitter.emit("event", "event-3");

        component.unmount();

        firstEmitter.emit("event", "event-4");

        expect(component.onEventCalls).toBe(2);
        expect(log).toEqual(["mount", "onEvent", "onEvent", "unmount"]);
    });

    it("should inject additional subscriptions", () => {
        class MyComponent {
            onEventCalls = 0;

            constructor() {
                injectSubscriptions(this, [
                    firstEmitter.on("event", this.onEvent.bind(this)),
                    firstEmitter.on("event", this.onEvent.bind(this)),
                ]);
            }

            dispose() {
                disposeSubscriptions(this);
            }

            @on(firstEmitter, "event")
            onEvent(arg: string) {
                this.onEventCalls++;
            }
        }

        let component = new MyComponent();
        firstEmitter.emit("event", "arg");
        
        component.dispose();
        firstEmitter.emit("event", "arg");

        expect(component.onEventCalls).toBe(3);
    });
});
