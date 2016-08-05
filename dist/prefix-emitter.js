(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else {
		var a = factory();
		for(var i in a) (typeof exports === 'object' ? exports : root)[i] = a[i];
	}
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	/**
	 * Copyright (c) 2016 Dmitry Panyushkin
	 * Available under MIT license
	 */
	var utils_ts_1 = __webpack_require__(1);
	var fallback = __webpack_require__(2);
	// we don't register polyfill - we use local scoped fallback instead
	var _Map = typeof Map !== "undefined" ? Map : fallback.Map;
	var _Symbol = typeof Symbol !== "undefined" ? Symbol : fallback.Symbol;
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
	            utils_ts_1.removeItem(this._node.handlers, this._handler);
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
	        utils_ts_1.removeItem(node.handlers, this._handler);
	        this._cleanupTrie(nodeChain, node);
	    };
	    EmitterSubscription.prototype._cleanupTrie = function (nodeChain, node) {
	        for (var i = nodeChain.length - 1; i >= 0; --i) {
	            var parent_1 = nodeChain[i];
	            if (node.children !== void 0 && node.children.size === 0) {
	                node.children = void 0;
	            }
	            if (node.children === void 0 && node.handlers.length === 0) {
	                parent_1.children.delete(this._args[i]);
	            }
	            else {
	                return;
	            }
	            node = parent_1;
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
	            args[_i - 0] = arguments[_i];
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
	            args[_i - 0] = arguments[_i];
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
	                args[_i - 0] = arguments[_i];
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
	            args[_i - 0] = arguments[_i];
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
	exports.PrefixEmitter = PrefixEmitter;
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
	exports.on = on;
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
	exports.once = once;
	function injectSubscriptions(target, key) {
	    if (key !== void 0) {
	        target[key] = utils_ts_1.decorateMethod(target[key], logic);
	        return;
	    }
	    else if (target instanceof Function) {
	        return utils_ts_1.decorateClass(target, logic);
	    }
	    else {
	        logic.call(target);
	        return;
	    }
	    function logic() {
	        var _this = this;
	        var handlers = this[_handlers];
	        if (handlers !== void 0 && !this.hasOwnProperty(_subscriptions)) {
	            this[_subscriptions] = handlers.map(function (h) {
	                var method = _this[h.key].bind(_this);
	                return h.once
	                    ? (_a = h.emitter).once.apply(_a, h.args.concat([method]))
	                    : (_b = h.emitter).on.apply(_b, h.args.concat([method]));
	                var _a, _b;
	            });
	        }
	    }
	}
	exports.injectSubscriptions = injectSubscriptions;
	function disposeSubscriptions(target, key) {
	    if (key !== void 0) {
	        target[key] = utils_ts_1.decorateMethod(target[key], logic);
	    }
	    else {
	        logic.call(target);
	    }
	    function logic() {
	        var subscriptions = this[_subscriptions];
	        if (subscriptions !== void 0) {
	            subscriptions.forEach(function (s) { s.dispose(); });
	            delete this[_subscriptions];
	        }
	    }
	}
	exports.disposeSubscriptions = disposeSubscriptions;


/***/ },
/* 1 */
/***/ function(module, exports) {

	"use strict";
	/**
	 * Remove first occurrence of given item from the array.
	 * @param array Array
	 * @param item any
	 */
	function removeItem(array, item) {
	    var index = array.indexOf(item);
	    if (index > 0) {
	        array.splice(index, 1);
	    }
	    else if (index === 0) {
	        array.shift();
	    }
	}
	exports.removeItem = removeItem;
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
	exports.decorateMethod = new Function("target", "logic", "\n    switch (target.length) {" + repeat(16, function (l) { return ("\n        " + (l < 16 ? "case " + l : "default") + ": return function (" + repeat(l, function (i) { return "v" + i; }, ", ") + ") {\n            logic.apply(this, arguments);\n            return target.apply(this, arguments);\n        };"); }) + "\n    }\n");
	/**
	 * Build new constructor from given one with injected logic at the beginning of constructor call.
	 * @param target Function: target constructor
	 * @param logic Function: injected logic
	 * @returns Function
	 */
	function decorateClass(target, logic) {
	    // unique prefix for Function constructor for
	    // eliminate conflicts with `target` functions names
	    var pr = "bvjxRy0LjL9D";
	    // Code generation is used to preserve target's `.name` and `.length`
	    // It is about 30x slower than simple funciton wrapping
	    // But it is slill less than 5 microseconds per call
	    // So if you have 200 decorated classes it took less then 1ms
	    var factory = new Function(pr + "target", pr + "logic", "\n        return function " + target.name + "(" + repeat(target.length, function (i) { return "v" + i; }, ", ") + ") {\n            " + pr + "logic.apply(this, arguments);\n            return " + pr + "target.apply(this, arguments);\n        };\n    ");
	    var constructor = factory(target, logic);
	    // preserve target's prototype and static fields
	    constructor.prototype = target.prototype;
	    assign(constructor, target);
	    return constructor;
	}
	exports.decorateClass = decorateClass;


/***/ },
/* 2 */
/***/ function(module, exports) {

	/**
	 * Copyright (c) 2016 Dmitry Panyushkin
	 * Available under MIT license
	 */
	"use strict";
	
	/**
	 * Simple fallback (not polyfill) for ES6 Map
	 */
	function MapFallback() {
	    this._store = Object.create(null);
	    this.size = 0;
	}
	
	MapFallback.prototype.has = function (key) {
	    return this._store[key] !== void 0;
	}
	
	MapFallback.prototype.get = function (key) {
	    return this._store[key];
	}
	
	MapFallback.prototype.set = function (key, value) {
	    if (this._store[key] === void 0) {
	        this.size++;
	    }
	    this._store[key] = value;
	}
	
	MapFallback.prototype.delete = function (key) {
	    if (this._store[key] !== void 0) {
	        this.size--;
	        delete this._store[key];
	    }
	}
	
	/**
	 * Fallback for ES6 Symbol
	 */
	function SymbolFallback(key) {
	    if (typeof key !== "string" && typeof key !== "number") {
	        throw new Error("Symbol not supported");
	    }
	    return key;
	}
	
	module.exports = {
	    Map: MapFallback,
	    Symbol: SymbolFallback,
	}

/***/ }
/******/ ])
});
;
//# sourceMappingURL=prefix-emitter.js.map