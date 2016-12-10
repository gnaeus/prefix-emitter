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
export declare class PrefixEmitter implements VoidEmitter, SingleEmitter<any>, DoubleEmitter<any, any> {
    private _node;
    constructor();
    private _on(args, handler);
    /**
     * Subscribe to some event from this Emitter.
     * @param args Array: sequence of event prefixes and event handler function at last position
     * @returns Subscription: created subscription to event
     */
    on(...args: Array<any | Function>): Subscription;
    /**
     * Subscribe to some event from this Emitter. Subscription will be disposed after single handler call.
     * @param args Array: sequence of event prefixes and event handler function at last position
     * @returns Subscription: created subscription to event
     */
    once(...args: Array<any | Function>): Subscription;
    /**
     * Emit one event.
     * @param args Array: event prefixes then event arguments
     */
    emit(...args: any[]): void;
}
export declare function on(emitter: VoidEmitter): MethodDecorator;
export declare function on<T>(emitter: SingleEmitter<T>): MethodDecorator;
export declare function on<T>(emitter: SingleEmitter<T>, arg: T): MethodDecorator;
export declare function on<TEvent, TArg>(emitter: DoubleEmitter<TEvent, TArg>): MethodDecorator;
export declare function on<TEvent, TArg>(emitter: DoubleEmitter<TEvent, TArg>, event: TEvent): MethodDecorator;
export declare function on<TEvent, TArg>(emitter: DoubleEmitter<TEvent, TArg>, event: TEvent, arg: TArg): MethodDecorator;
export declare function on(emitter: PrefixEmitter, ...args: any[]): MethodDecorator;
export declare function once(emitter: VoidEmitter): MethodDecorator;
export declare function once<T>(emitter: SingleEmitter<T>): MethodDecorator;
export declare function once<T>(emitter: SingleEmitter<T>, arg: T): MethodDecorator;
export declare function once<TEvent, TArg>(emitter: DoubleEmitter<TEvent, TArg>): MethodDecorator;
export declare function once<TEvent, TArg>(emitter: DoubleEmitter<TEvent, TArg>, event: TEvent): MethodDecorator;
export declare function once<TEvent, TArg>(emitter: DoubleEmitter<TEvent, TArg>, event: TEvent, arg: TArg): MethodDecorator;
export declare function once(emitter: PrefixEmitter, ...args: any[]): MethodDecorator;
/**
 * Class Decorator for injecting subscriptions defined by `@on` and `@once` annotations during constructor call.
 * @example
 * @injectSubscriptions
 * class Component {
 *     constructor() { }
 * }
 */
export declare function injectSubscriptions<TConstructor extends Function>(target: TConstructor): TConstructor;
/**
 * Method Decorator for injecting subscriptions defined by `@on` and `@once` annotations during method call.
 * @example
 * class Component {
 *     @injectSubscriptions
 *     componentDidMount() { }
 * }
 */
export declare function injectSubscriptions(target: Object, key: string | symbol): void;
/**
 * Utility function for injecting subscriptions defined by `@on` and `@once` annotations.
 * @example
 * class Component {
 *     componentDidMount() {
 *         injectSubscriptions(this);
 *     }
 * }
 */
export declare function injectSubscriptions(target: Object): void;
/**
 * Method Decorator for disposing all injected subscriptions during method call.
 * @example
 * class Component {
 *     @disposeSubscriptions
 *     componentWillUnmount() { }
 * }
 */
export declare function disposeSubscriptions(target: Object, key: string | symbol): void;
/**
 * Utility function for disposing all injected subscriptions.
 * @example
 * class Component {
 *     componentWillUnmount() {
 *         disposeSubscriptions(this);
 *     }
 * }
 */
export declare function disposeSubscriptions(target: Object): void;
export as namespace PrefixEmitter;