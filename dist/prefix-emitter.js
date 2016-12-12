(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (factory((global.PrefixEmitter = global.PrefixEmitter || {})));
}(this, (function (exports) { 'use strict';

/**
* Copyright (c) 2016 Dmitry Panyushkin
* Available under MIT license
*/
/**
 * Remove first occurrence of given item from the array.
 * @param array Array
 * @param item any
 */
/**
* Copyright (c) 2016 Dmitry Panyushkin
* Available under MIT license
*/ function removeItem(array, item) {
    var index = array.indexOf(item);
    if (index > 0) {
        array.splice(index, 1);
    }
    else if (index === 0) {
        array.shift();
    }
}
function repeat(count, template, sep) {
    if (sep === void 0) { sep = ""; }
    var arr = [];
    for (var i = 1; i <= count; ++i) {
        arr.push(template(i));
    }
    return arr.join(sep);
}
function assign(target, source) {
    for (var k in source) {
        if (source.hasOwnProperty(k)) {
            target[k] = source[k];
        }
    }
}
/**
 * Build new function from given one with injected logic at the beginning of function call.
 * @param target Function: target function
 * @param logic Function: injected logic
 * @returns Function
 */

/**
 * Build new constructor from given one with injected logic at the beginning of constructor call.
 * @param target Function: target constructor
 * @param logic Function: injected logic
 * @returns Function
 */

/**
* Copyright (c) 2016 Dmitry Panyushkin
* Available under MIT license
*/
/**
 * Simple fallback (not polyfill) for ES6 Map
 */
var MapFallback = (function () {
    function MapFallback() {
        this._store = Object.create(null);
        this.size = 0;
    }
    MapFallback.prototype.has = function (key) {
        return this._store[key] !== void 0;
    };
    MapFallback.prototype.get = function (key) {
        return this._store[key];
    };
    MapFallback.prototype.set = function (key, value) {
        if (this._store[key] === void 0) {
            this.size++;
        }
        this._store[key] = value;
    };
    MapFallback.prototype.delete = function (key) {
        if (this._store[key] !== void 0) {
            this.size--;
            delete this._store[key];
        }
    };
    return MapFallback;
}());
/**
 * Fallback for ES6 Symbol
 */
function SymbolFallback(key) {
    if (typeof key !== "string" && typeof key !== "number") {
        throw new Error("Symbol not supported");
    }
    return key;
}

/**
* Copyright (c) 2016 Dmitry Panyushkin
* Available under MIT license
*/
// we don't register polyfill - we use local scoped fallback instead
var _Map = typeof Map !== "undefined" ? Map : MapFallback;
var _Symbol = typeof Symbol !== "undefined" ? Symbol : SymbolFallback;
var EmitterSubscription = (function () {
    function EmitterSubscription(node, args, handler) {
        this._node = node;
        this._args = args;
        this._handler = handler;
        this._disposed = false;
    }
    EmitterSubscription.prototype.dispose = function () {
        if (this._disposed) {
            return;
        }
        this._disposed = true;
        if (this._args.length === 0) {
            removeItem(this._node.handlers, this._handler);
            return;
        }
        var node = this._node;
        var nodeChain = new Array();
        for (var i = 0; i < this._args.length; ++i) {
            nodeChain.push(node);
            node = node.children.get(this._args[i]);
            if (node === void 0) {
                return;
            }
        }
        removeItem(node.handlers, this._handler);
        this._cleanupTrie(nodeChain, node);
    };
    EmitterSubscription.prototype._cleanupTrie = function (nodeChain, node) {
        for (var i = nodeChain.length - 1; i >= 0; --i) {
            var parent = nodeChain[i];
            if (node.children !== void 0 && node.children.size === 0) {
                node.children = void 0;
            }
            if (node.children === void 0 && node.handlers.length === 0) {
                parent.children.delete(this._args[i]);
            }
            else {
                return;
            }
            node = parent;
        }
        if (node.children !== void 0 && node.children.size === 0) {
            node.children = void 0;
        }
    };
    return EmitterSubscription;
}());
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
var PrefixEmitter = (function () {
    function PrefixEmitter() {
        this._node = { handlers: new Array() };
    }
    PrefixEmitter.prototype._on = function (args, handler) {
        var node = this._node;
        for (var i = 0; i < args.length; ++i) {
            if (node.children === void 0) {
                node.children = new _Map();
            }
            var child = node.children.get(args[i]);
            if (child === void 0) {
                child = { handlers: new Array() };
                node.children.set(args[i], child);
            }
            node = child;
        }
        node.handlers.push(handler);
        return new EmitterSubscription(this._node, args, handler);
    };
    /**
     * Subscribe to some event from this Emitter.
     * @param args Array: sequence of event prefixes and event handler function at last position
     * @returns Subscription: created subscription to event
     */
    PrefixEmitter.prototype.on = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var lastIndex = arguments.length - 1;
        if (lastIndex < 0) {
            throw new Error("last argument is not a function");
        }
        var handler = args[lastIndex];
        if (typeof handler !== "function") {
            throw new Error("last argument is not a function");
        }
        return this._on(args.slice(0, lastIndex), handler);
    };
    /**
     * Subscribe to some event from this Emitter. Subscription will be disposed after single handler call.
     * @param args Array: sequence of event prefixes and event handler function at last position
     * @returns Subscription: created subscription to event
     */
    PrefixEmitter.prototype.once = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var lastIndex = arguments.length - 1;
        if (lastIndex < 0) {
            throw new Error("last argument is not a function");
        }
        var handler = args[lastIndex];
        if (typeof handler !== "function") {
            throw new Error("last argument is not a function");
        }
        var subscription = this._on(args.slice(0, lastIndex), function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            subscription.dispose();
            handler.apply(void 0, args);
        });
        return subscription;
    };
    /**
     * Emit one event.
     * @param args Array: event prefixes then event arguments
     */
    PrefixEmitter.prototype.emit = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var node = this._node;
        var handlers = node.handlers;
        var hInd = handlers.length;
        while (hInd--) {
            handlers[hInd].apply(void 0, args);
        }
        var arg;
        var aInd = args.length;
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
    };
    return PrefixEmitter;
}());
/**
 * Alias for importing PrefixEmitter from global scope
 */
var Emitter = PrefixEmitter;
var _handlers = _Symbol("__prefix_emitter_handlers_");
var _subscriptions = _Symbol("__prefix_emitter_subscriptions_");
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
function on(emitter) {
    var args = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args[_i - 1] = arguments[_i];
    }
    return function (target, key) {
        var handlers = target[_handlers];
        if (handlers === void 0) {
            target[_handlers] = handlers = new Array();
        }
        else if (!target.hasOwnProperty(_handlers)) {
            target[_handlers] = handlers = handlers.slice();
        }
        handlers.push({ emitter: emitter, args: args, key: key });
    };
}
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
function once(emitter) {
    var args = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args[_i - 1] = arguments[_i];
    }
    return function (target, key) {
        var handlers = target[_handlers];
        if (handlers === void 0) {
            target[_handlers] = handlers = new Array();
        }
        else if (!target.hasOwnProperty(_handlers)) {
            target[_handlers] = handlers = handlers.slice();
        }
        handlers.push({ emitter: emitter, args: args, key: key, once: true });
    };
}
/**
 * Utility function for injecting subscriptions defined by `@on` and `@once` annotations.
 * @example
 * class Component {
 *     componentDidMount() {
 *         injectSubscriptions(this);
 *     }
 * }
 * class Service {
 *     constructor() {
 *         injectSubscriptions(this, [
 *             Emitter.on("firstEvent", this.onFirstEvent.bind(this)),
 *         ]);
 *     }
 * }
 */
function injectSubscriptions(target, subscriptions) {
    var handlers = target[_handlers];
    if (handlers !== void 0 && !target.hasOwnProperty(_subscriptions)) {
        target[_subscriptions] = handlers.map(function (h) {
            var method = target[h.key].bind(target);
            return h.once
                ? (_a = h.emitter).once.apply(_a, h.args.concat([method])) : (_b = h.emitter).on.apply(_b, h.args.concat([method]));
            var _a, _b;
        });
    }
    if (subscriptions !== void 0) {
        if (!target.hasOwnProperty(_subscriptions)) {
            target[_subscriptions] = subscriptions;
        }
        else {
            (_a = target[_subscriptions]).push.apply(_a, subscriptions);
        }
    }
    var _a;
}
/**
 * Utility function for disposing all injected subscriptions.
 * @example
 * class Component {
 *     componentWillUnmount() {
 *         disposeSubscriptions(this);
 *     }
 * }
 */
function disposeSubscriptions(target) {
    var subscriptions = target[_subscriptions];
    if (subscriptions !== void 0) {
        subscriptions.forEach(function (s) { s.dispose(); });
        delete target[_subscriptions];
    }
}

exports.Emitter = Emitter;
exports.on = on;
exports.once = once;
exports.injectSubscriptions = injectSubscriptions;
exports.disposeSubscriptions = disposeSubscriptions;
exports.PrefixEmitter = PrefixEmitter;

Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=prefix-emitter.js.map
