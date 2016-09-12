/**
 * Copyright (c) 2016 Dmitry Panyushkin
 * Available under MIT license
 */
import { removeItem, decorateMethod, decorateClass } from "./utils.ts";

// call `require()` from webpack
declare function require(path: string): any;
const fallback = require("./es5-fallback.js");

// we don't register polyfill - we use local scoped fallback instead
const _Map: MapConstructor = typeof Map !== "undefined" ? Map : fallback.Map;
const _Symbol: SymbolConstructor = typeof Symbol !== "undefined" ? Symbol : fallback.Symbol;

interface TrieNode {
    handlers: Function[];
    children?: Map<any, TrieNode>;
}

/**
 * Subscription to event at some prefix.
 * Used only for unsubscribe from this event by calling `dispose()` method.
 * @example
 * const subscription = emitter.on("event", (arg: any) => { console.log(arg); });
 * subscription.dispose(); // event handler will be removed
 */
export interface Subscription {
    dispose(): void;
}

class EmitterSubscription implements Subscription {
    private _node: TrieNode;
    private _args: any[];
    private _handler: Function;
    private _disposed: boolean;

    constructor(node: TrieNode, args: any[], handler: Function) {
        this._node = node;
        this._args = args;
        this._handler = handler;
        this._disposed = false;
    }

    dispose(): void {
        if (this._disposed) {
            return;
        }
        this._disposed = true;

        if (this._args.length === 0) {
            removeItem(this._node.handlers, this._handler);
            return;
        }

        let node = this._node;
        const nodeChain = new Array<TrieNode>();
        for (let i = 0; i < this._args.length; ++i) {
            nodeChain.push(node);
            node = node.children.get(this._args[i]);
            if (node === void 0) {
                return;
            }
        }
        removeItem(node.handlers, this._handler);
        this._cleanupTrie(nodeChain, node);
    }

    private _cleanupTrie(nodeChain: TrieNode[], node: TrieNode): void {
        for (let i = nodeChain.length - 1; i >= 0; --i) {
            const parent = nodeChain[i];
            if (node.children !== void 0 && node.children.size === 0) {
                node.children = void 0;
            }
            if (node.children === void 0 && node.handlers.length === 0) {
                parent.children.delete(this._args[i]);
            } else {
                return;
            }
            node = parent;
        }
        if (node.children !== void 0 && node.children.size === 0) {
            node.children = void 0;
        }
    }
}

/**
 * Typed emitter without argumens.
 * @example
 * const emitter: VoidEmitter = new PrefixEmitter();
 * const subscription = emitter.on(() => { console.log("fired"); });
 */
export interface VoidEmitter {
    on(handler: () => void): Subscription;
    once(handler: () => void): Subscription;
    emit(): void;
}

/**
 * Typed emitter with one argument.
 * @example
 * const emitter: SingleEmitter<string> = new PrefixEmitter();
 * const sub1 = emitter.on((msg: string) => { console.log(msg); });
 * const sub2 = emitter.on("some-event", () => { console.log("some-event fired"); });
 */
export interface SingleEmitter<T> {
    on(handler: (arg: T) => void): Subscription;
    on(arg: T, handler: () => void): Subscription;
    once(handler: (arg: T) => void): Subscription;
    once(arg: T, handler: () => void): Subscription;
    emit(arg: T): void;
}

/**
 * Typed emitter with two arguments.
 * @example
 * const emitter: DoubleEmitter<string, any> = new PrefixEmitter();
 * const sub1 = emitter.on("first-event", (arg: any) => { console.log("first-event:", arg); });
 * const sub2 = emitter.on("second-event", (arg: any) => { console.log("second-event:", arg); });
 */
export interface DoubleEmitter<TEvent, TArg> {
    on(handler: (event: TEvent, arg: TArg) => void): Subscription;
    on(event: TEvent, handler: (arg: TArg) => void): Subscription;
    on(event: TEvent, arg: TArg, handler: () => void): Subscription;
    once(handler: (event: TEvent, arg: TArg) => void): Subscription;
    once(event: TEvent, handler: (arg: TArg) => void): Subscription;
    once(event: TEvent, arg: TArg, handler: () => void): Subscription;
    emit(event: TEvent, arg: TArg): void;
}

/**
 * Event Emitter which can bind handlers to events at some sequence of prefixes.
 * @example
 * const emitter = new PrefixEmitter();
 * const sub1 = emitter.on("/topic", "/event", (arg: any) => {
 *     console.log("/topic/event:", arg);
 * });
 * const sub2 = emitter.on("/topic", (event: string, arg: any) => {
 *     console.log("/topic:", event, arg);
 * });
 * emitter.emit("/event", "/subevent", 123);
 * // => "/topic/event:", 123
 * // => "/topic:", "/event", 123
 * sub1.dispose();
 * sub2.dispose();
 */
export class PrefixEmitter implements VoidEmitter, SingleEmitter<any>, DoubleEmitter<any, any> {
    private _node: TrieNode;

    constructor() {
        this._node = { handlers: new Array<Function>() };
    }

    private _on(args: any[], handler: Function): Subscription {
        let node = this._node;
        for (let i = 0; i < args.length; ++i) {
            if (node.children === void 0) {
                node.children = new _Map<any, TrieNode>();
            }
            let child = node.children.get(args[i]);
            if (child === void 0) {
                child = { handlers: new Array<Function>() };
                node.children.set(args[i], child);
            }
            node = child;
        }
        node.handlers.push(handler);
        return new EmitterSubscription(this._node, args, handler);
    }

    /**
     * Subscribe to some event from this Emitter.
     * @param args Array: sequence of event prefixes and event handler function at last position
     * @returns Subscription: created subscription to event
     */
    on(...args: Array<any | Function>): Subscription {
        const lastIndex = arguments.length - 1;
        if (lastIndex < 0) {
            throw new Error("last argument is not a function");
        }
        const handler = args[lastIndex] as Function;
        if (typeof handler !== "function") {
            throw new Error("last argument is not a function");
        }
        return this._on(args.slice(0, lastIndex), handler);
    }

    /**
     * Subscribe to some event from this Emitter. Subscription will be disposed after single handler call.
     * @param args Array: sequence of event prefixes and event handler function at last position
     * @returns Subscription: created subscription to event
     */
    once(...args: Array<any | Function>): Subscription {
        const lastIndex = arguments.length - 1;
        if (lastIndex < 0) {
            throw new Error("last argument is not a function");
        }
        const handler = args[lastIndex] as Function;
        if (typeof handler !== "function") {
            throw new Error("last argument is not a function");
        }
        const subscription = this._on(args.slice(0, lastIndex), (...args: any[]) => {
            subscription.dispose();
            handler(...args);
        });
        return subscription;
    }

    /**
     * Emit one event.
     * @param args Array: event prefixes then event arguments
     */
    emit(...args: any[]): void {
        let node = this._node;
        let handlers = node.handlers;
        let hInd = handlers.length;
        while (hInd--) {
            handlers[hInd].apply(void 0, args);
        }
        let arg: any;
        let aInd = args.length;
        while (node.children !== void 0 && aInd--) {
            arg = args.shift();
            node = node.children.get(arg);
            if (node === void 0) {
                return;
            }
            handlers = node.handlers;
            hInd = handlers.length;
            while (hInd--) {
                handlers[hInd].apply(void 0, args);
            }
        }
    }
}

interface Handler {
    emitter: PrefixEmitter;
    args: any[];
    key: string | symbol;
    once?: boolean;
}

const _handlers = _Symbol("__prefix_emitter_handlers_");
const _subscriptions = _Symbol("__prefix_emitter_subscriptions_");

// overloads for different interfaces
export function on(emitter: VoidEmitter): MethodDecorator;
export function on<T>(emitter: SingleEmitter<T>): MethodDecorator;
export function on<T>(emitter: SingleEmitter<T>, arg: T): MethodDecorator;
export function on<TEvent, TArg>(emitter: DoubleEmitter<TEvent, TArg>): MethodDecorator;
export function on<TEvent, TArg>(emitter: DoubleEmitter<TEvent, TArg>, event: TEvent): MethodDecorator;
export function on<TEvent, TArg>(emitter: DoubleEmitter<TEvent, TArg>, event: TEvent, arg: TArg): MethodDecorator;
export function on(emitter: PrefixEmitter, ...args: any[]): MethodDecorator;

/**
 * Method Decorator for subscribe to Emitter at some prefix described by rest parameters.
 * @param emitter PrefixEmitter: some emitter
 * @param args Array: sequence of event prefixes
 * @example
 * class Component {
 *     @on(emitter, "event")
 *     eventHandler(arg: any) { }
 * }
 */
export function on(emitter: PrefixEmitter, ...args: any[]): MethodDecorator {
    return (target: Object, key: string | symbol) => {
        let handlers: Handler[] = target[_handlers];
        if (handlers === void 0) {
            target[_handlers] = handlers = new Array<Handler>();
        } else if (!target.hasOwnProperty(_handlers)) {
            target[_handlers] = handlers = [...handlers];
        }
        handlers.push({ emitter, args, key });
    };
}


// overloads for different interfaces
export function once(emitter: VoidEmitter): MethodDecorator;
export function once<T>(emitter: SingleEmitter<T>): MethodDecorator;
export function once<T>(emitter: SingleEmitter<T>, arg: T): MethodDecorator;
export function once<TEvent, TArg>(emitter: DoubleEmitter<TEvent, TArg>): MethodDecorator;
export function once<TEvent, TArg>(emitter: DoubleEmitter<TEvent, TArg>, event: TEvent): MethodDecorator;
export function once<TEvent, TArg>(emitter: DoubleEmitter<TEvent, TArg>, event: TEvent, arg: TArg): MethodDecorator;
export function once(emitter: PrefixEmitter, ...args: any[]): MethodDecorator;

/**
 * Method Decorator for subscribe to Emitter at some prefix described by rest parameters.
 * Subscription will be disposed after single method call.
 * @param emitter PrefixEmitter: some emitter
 * @param args Array: sequence of event prefixes
 * @example
 * class Component {
 *     @once(emitter, "event")
 *     selfDisposingHandler(arg: any) { }
 * }
 */
export function once(emitter: PrefixEmitter, ...args: any[]): MethodDecorator {
    return (target: Object, key: string | symbol) => {
        let handlers: Handler[] = target[_handlers];
        if (handlers === void 0) {
            target[_handlers] = handlers = new Array<Handler>();
        } else if (!target.hasOwnProperty(_handlers)) {
            target[_handlers] = handlers = [...handlers];
        }
        handlers.push({ emitter, args, key, once: true });
    };
}

/**
 * Class Decorator for injecting subscriptions defined by `@on` and `@once` annotations during constructor call.
 * @example
 * @injectSubscriptions
 * class Component {
 *     constructor() { }
 * }
 */
export function injectSubscriptions<TConstructor extends Function>(target: TConstructor): TConstructor;

/**
 * Method Decorator for injecting subscriptions defined by `@on` and `@once` annotations during method call.
 * @example
 * class Component {
 *     @injectSubscriptions
 *     componentDidMount() { }
 * }
 */
export function injectSubscriptions(target: Object, key: string | symbol): void;

/**
 * Utility function for injecting subscriptions defined by `@on` and `@once` annotations.
 * @example
 * class Component {
 *     componentDidMount() {
 *         injectSubscriptions(this);
 *     }
 * }
 */
export function injectSubscriptions(target: Object): void;

export function injectSubscriptions(target: Function | Object, key?: string | symbol) {
    if (key !== void 0) {
        target[key] = decorateMethod(target[key], logic);
        return;
    } else if (target instanceof Function) {
        return decorateClass(target, logic);
    } else {
        logic.call(target);
        return;
    }

    function logic() {
        const handlers: Handler[] = this[_handlers];
        if (handlers !== void 0 && !this.hasOwnProperty(_subscriptions)) {
            this[_subscriptions] = handlers.map(h => {
                const method: Function = this[h.key].bind(this);
                return h.once
                    ? h.emitter.once(...h.args, method)
                    : h.emitter.on(...h.args, method);
            });
        }
    }
}

/**
 * Method Decorator for disposing all injected subscriptions during method call.
 * @example
 * class Component {
 *     @disposeSubscriptions
 *     componentWillUnmount() { }
 * }
 */
export function disposeSubscriptions(target: Object, key: string | symbol): void;

/**
 * Utility function for disposing all injected subscriptions.
 * @example
 * class Component {
 *     componentWillUnmount() {
 *         disposeSubscriptions(this);
 *     }
 * }
 */
export function disposeSubscriptions(target: Object): void;

export function disposeSubscriptions(target: Object, key?: string | symbol) {
    if (key !== void 0) {
        target[key] = decorateMethod(target[key], logic);
    } else {
        logic.call(target);
    }

    function logic() {
        const subscriptions: Subscription[] = this[_subscriptions];
        if (subscriptions !== void 0) {
            subscriptions.forEach(s => { s.dispose(); });
            delete this[_subscriptions];
        }
    }
}