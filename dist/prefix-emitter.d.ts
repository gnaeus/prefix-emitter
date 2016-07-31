declare module 'prefix-emitter' {
	export interface Subscription {
	    dispose(): void;
	}
	export interface VoidEmitter {
	    on(handler: () => void): Subscription;
	    once(handler: () => void): Subscription;
	    emit(): void;
	}
	export interface SingleEmitter<T> {
	    on(handler: (arg: T) => void): Subscription;
	    on(arg: T, handler: () => void): Subscription;
	    once(handler: (arg: T) => void): Subscription;
	    once(arg: T, handler: () => void): Subscription;
	    emit(arg: T): void;
	}
	export interface DoubleEmitter<TEvent, TArg> {
	    on(handler: (event: TEvent, arg: TArg) => void): Subscription;
	    on(event: TEvent, handler: (arg: TArg) => void): Subscription;
	    on(event: TEvent, arg: TArg, handler: () => void): Subscription;
	    once(handler: (event: TEvent, arg: TArg) => void): Subscription;
	    once(event: TEvent, handler: (arg: TArg) => void): Subscription;
	    once(event: TEvent, arg: TArg, handler: () => void): Subscription;
	    emit(event: TEvent, arg: TArg): void;
	}
	export class PrefixEmitter implements VoidEmitter, SingleEmitter<any>, DoubleEmitter<any, any> {
	    private _node;
	    constructor();
	    private _on(args, handler);
	    on(...args: Array<any | Function>): Subscription;
	    once(...args: Array<any | Function>): Subscription;
	    emit(...args: any[]): void;
	}
	export function on(emitter: VoidEmitter): MethodDecorator;
	export function on<T>(emitter: SingleEmitter<T>): MethodDecorator;
	export function on<T>(emitter: SingleEmitter<T>, arg: T): MethodDecorator;
	export function on<TEvent, TArg>(emitter: DoubleEmitter<TEvent, TArg>): MethodDecorator;
	export function on<TEvent, TArg>(emitter: DoubleEmitter<TEvent, TArg>, event: TEvent): MethodDecorator;
	export function on<TEvent, TArg>(emitter: DoubleEmitter<TEvent, TArg>, event: TEvent, arg: TArg): MethodDecorator;
	export function on(emitter: PrefixEmitter, ...args: any[]): MethodDecorator;
	export function once(emitter: VoidEmitter): MethodDecorator;
	export function once<T>(emitter: SingleEmitter<T>): MethodDecorator;
	export function once<T>(emitter: SingleEmitter<T>, arg: T): MethodDecorator;
	export function once<TEvent, TArg>(emitter: DoubleEmitter<TEvent, TArg>): MethodDecorator;
	export function once<TEvent, TArg>(emitter: DoubleEmitter<TEvent, TArg>, event: TEvent): MethodDecorator;
	export function once<TEvent, TArg>(emitter: DoubleEmitter<TEvent, TArg>, event: TEvent, arg: TArg): MethodDecorator;
	export function once(emitter: PrefixEmitter, ...args: any[]): MethodDecorator;
	export function injectSubscriptions(target: Object): void;
	export function disposeSubscriptions(target: Object): void;

}
