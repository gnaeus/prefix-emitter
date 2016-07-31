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
/***/ function(module, exports) {

	/**
	 * Copyright (c) 2016 Dmitry Panyushkin
	 * Available under MIT license
	 */
	"use strict";
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
	function removeItem(array, item) {
	    var index = array.indexOf(item);
	    if (index > 0) {
	        array.splice(index, 1);
	    }
	    else if (index === 0) {
	        array.shift();
	    }
	}
	var PrefixEmitter = (function () {
	    function PrefixEmitter() {
	        this._node = { handlers: new Array() };
	    }
	    PrefixEmitter.prototype._on = function (args, handler) {
	        var node = this._node;
	        for (var i = 0; i < args.length; ++i) {
	            if (node.children === void 0) {
	                node.children = new Map();
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
	var _handlers = Symbol("_handlers");
	var _subscriptions = Symbol("_subscriptions");
	function on(emitter) {
	    var args = [];
	    for (var _i = 1; _i < arguments.length; _i++) {
	        args[_i - 1] = arguments[_i];
	    }
	    return function (target, key, descriptor) {
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
	function once(emitter) {
	    var args = [];
	    for (var _i = 1; _i < arguments.length; _i++) {
	        args[_i - 1] = arguments[_i];
	    }
	    return function (target, key, descriptor) {
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
	function injectSubscriptions(target) {
	    var handlers = target[_handlers];
	    if (handlers !== void 0 && !target.hasOwnProperty(_subscriptions)) {
	        target[_subscriptions] = handlers.map(function (h) {
	            var method = target[h.key].bind(target);
	            return h.once
	                ? (_a = h.emitter).once.apply(_a, h.args.concat([method]))
	                : (_b = h.emitter).on.apply(_b, h.args.concat([method]));
	            var _a, _b;
	        });
	    }
	}
	exports.injectSubscriptions = injectSubscriptions;
	function disposeSubscriptions(target) {
	    var subscriptions = target[_subscriptions];
	    if (subscriptions !== void 0) {
	        subscriptions.forEach(function (s) { s.dispose(); });
	        delete target[_subscriptions];
	    }
	}
	exports.disposeSubscriptions = disposeSubscriptions;


/***/ }
/******/ ])
});
;
//# sourceMappingURL=prefix-emitter.js.map