/**
 * Copyright (c) 2016 Dmitry Panyushkin
 * Available under MIT license
 */

interface TrieNode {
    handlers: Function[],
    children?: Map<any, TrieNode>,
}

export interface Subscription {
    dispose(): void,
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

function removeItem(array: any[], item: any): void {
    const index = array.indexOf(item);
    if (index > 0) {
        array.splice(index, 1);
    } else if (index === 0) {
        array.shift();
    }
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
    private _node: TrieNode;

    constructor() {
        this._node = { handlers: new Array<Function>() };
    }
    
    private _on(args: any[], handler: Function): Subscription {
        let node = this._node;
        for (let i = 0; i < args.length; ++i) {
            if (node.children === void 0) {
                node.children = new Map<any, TrieNode>();
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
    
    on(...args: Array<any | Function>): Subscription {
        const lastIndex = arguments.length - 1;
        if(lastIndex < 0) {
            throw new Error("last argument is not a function");
        }
        const handler = args[lastIndex] as Function;
        if(typeof handler !== "function") {
            throw new Error("last argument is not a function");
        }
        return this._on(args.slice(0, lastIndex), handler);
    }
    
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
    emitter: PrefixEmitter,
    args: any[],
    key: string | symbol,
    once?: boolean,
}

const _handlers = Symbol("_handlers");
const _subscriptions = Symbol("_subscriptions");

export function on(emitter: VoidEmitter): MethodDecorator;
export function on<T>(emitter: SingleEmitter<T>): MethodDecorator;
export function on<T>(emitter: SingleEmitter<T>, arg: T): MethodDecorator;
export function on<TEvent, TArg>(emitter: DoubleEmitter<TEvent, TArg>): MethodDecorator;
export function on<TEvent, TArg>(emitter: DoubleEmitter<TEvent, TArg>, event: TEvent): MethodDecorator;
export function on<TEvent, TArg>(emitter: DoubleEmitter<TEvent, TArg>, event: TEvent, arg: TArg): MethodDecorator;
export function on(emitter: PrefixEmitter, ...args: any[]): MethodDecorator;
export function on(emitter: PrefixEmitter, ...args: any[]): MethodDecorator {
    return (target: Object, key: string | symbol, descriptor: PropertyDescriptor) => {
        let handlers: Handler[] = target[_handlers];
        if (handlers === void 0) {
            target[_handlers] = handlers = new Array<Handler>();
        } else if (!target.hasOwnProperty(_handlers)) {
            target[_handlers] = handlers = [...handlers];
        }
        handlers.push({ emitter, args, key });
    }
}

export function once(emitter: VoidEmitter): MethodDecorator;
export function once<T>(emitter: SingleEmitter<T>): MethodDecorator;
export function once<T>(emitter: SingleEmitter<T>, arg: T): MethodDecorator;
export function once<TEvent, TArg>(emitter: DoubleEmitter<TEvent, TArg>): MethodDecorator;
export function once<TEvent, TArg>(emitter: DoubleEmitter<TEvent, TArg>, event: TEvent): MethodDecorator;
export function once<TEvent, TArg>(emitter: DoubleEmitter<TEvent, TArg>, event: TEvent, arg: TArg): MethodDecorator;
export function once(emitter: PrefixEmitter, ...args: any[]): MethodDecorator;
export function once(emitter: PrefixEmitter, ...args: any[]): MethodDecorator {
    return (target: Object, key: string | symbol, descriptor: PropertyDescriptor) => {
        let handlers: Handler[] = target[_handlers];
        if (handlers === void 0) {
            target[_handlers] = handlers = new Array<Handler>();
        } else if (!target.hasOwnProperty(_handlers)) {
            target[_handlers] = handlers = [...handlers];
        }
        handlers.push({ emitter, args, key, once: true });
    }
}

export function injectSubscriptions(target: Object): void {
    const handlers: Handler[] = target[_handlers];
    if (handlers !== void 0 && !target.hasOwnProperty(_subscriptions)) {
        target[_subscriptions] = handlers.map(h => {
            const method: Function = target[h.key].bind(target);
            return h.once
                ? h.emitter.once(...h.args, method)
                : h.emitter.on(...h.args, method);
        });
    }
}

export function disposeSubscriptions(target: Object): void {
    const subscriptions: Subscription[] = target[_subscriptions];
    if (subscriptions !== void 0) {
        subscriptions.forEach(s => { s.dispose(); });
        delete target[_subscriptions];
    }
}