(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(require('benchmark')) :
  typeof define === 'function' && define.amd ? define(['benchmark'], factory) :
  (factory(global.Benchmark));
}(this, (function (Benchmark) { 'use strict';

var domain;

// This constructor is used to store event handlers. Instantiating this is
// faster than explicitly calling `Object.create(null)` to get a "clean" empty
// object (tested with v8 v4.9).
function EventHandlers() {}
EventHandlers.prototype = Object.create(null);

function EventEmitter() {
  EventEmitter.init.call(this);
}
EventEmitter.usingDomains = false;

EventEmitter.prototype.domain = undefined;
EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

EventEmitter.init = function() {
  this.domain = null;
  if (EventEmitter.usingDomains) {
    // if there is an active domain, then attach to it.
    if (domain.active && !(this instanceof domain.Domain)) {
      this.domain = domain.active;
    }
  }

  if (!this._events || this._events === Object.getPrototypeOf(this)._events) {
    this._events = new EventHandlers();
    this._eventsCount = 0;
  }

  this._maxListeners = this._maxListeners || undefined;
};

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function setMaxListeners(n) {
  if (typeof n !== 'number' || n < 0 || isNaN(n))
    throw new TypeError('"n" argument must be a positive number');
  this._maxListeners = n;
  return this;
};

function $getMaxListeners(that) {
  if (that._maxListeners === undefined)
    return EventEmitter.defaultMaxListeners;
  return that._maxListeners;
}

EventEmitter.prototype.getMaxListeners = function getMaxListeners() {
  return $getMaxListeners(this);
};

// These standalone emit* functions are used to optimize calling of event
// handlers for fast cases because emit() itself often has a variable number of
// arguments and can be deoptimized because of that. These functions always have
// the same number of arguments and thus do not get deoptimized, so the code
// inside them can execute faster.
function emitNone(handler, isFn, self) {
  if (isFn)
    handler.call(self);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self);
  }
}
function emitOne(handler, isFn, self, arg1) {
  if (isFn)
    handler.call(self, arg1);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self, arg1);
  }
}
function emitTwo(handler, isFn, self, arg1, arg2) {
  if (isFn)
    handler.call(self, arg1, arg2);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self, arg1, arg2);
  }
}
function emitThree(handler, isFn, self, arg1, arg2, arg3) {
  if (isFn)
    handler.call(self, arg1, arg2, arg3);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self, arg1, arg2, arg3);
  }
}

function emitMany(handler, isFn, self, args) {
  if (isFn)
    handler.apply(self, args);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].apply(self, args);
  }
}

EventEmitter.prototype.emit = function emit(type) {
  var er, handler, len, args, i, events, domain;
  var needDomainExit = false;
  var doError = (type === 'error');

  events = this._events;
  if (events)
    doError = (doError && events.error == null);
  else if (!doError)
    return false;

  domain = this.domain;

  // If there is no 'error' event listener then throw.
  if (doError) {
    er = arguments[1];
    if (domain) {
      if (!er)
        er = new Error('Uncaught, unspecified "error" event');
      er.domainEmitter = this;
      er.domain = domain;
      er.domainThrown = false;
      domain.emit('error', er);
    } else if (er instanceof Error) {
      throw er; // Unhandled 'error' event
    } else {
      // At least give some kind of context to the user
      var err = new Error('Uncaught, unspecified "error" event. (' + er + ')');
      err.context = er;
      throw err;
    }
    return false;
  }

  handler = events[type];

  if (!handler)
    return false;

  var isFn = typeof handler === 'function';
  len = arguments.length;
  switch (len) {
    // fast cases
    case 1:
      emitNone(handler, isFn, this);
      break;
    case 2:
      emitOne(handler, isFn, this, arguments[1]);
      break;
    case 3:
      emitTwo(handler, isFn, this, arguments[1], arguments[2]);
      break;
    case 4:
      emitThree(handler, isFn, this, arguments[1], arguments[2], arguments[3]);
      break;
    // slower
    default:
      args = new Array(len - 1);
      for (i = 1; i < len; i++)
        args[i - 1] = arguments[i];
      emitMany(handler, isFn, this, args);
  }

  if (needDomainExit)
    domain.exit();

  return true;
};

function _addListener(target, type, listener, prepend) {
  var m;
  var events;
  var existing;

  if (typeof listener !== 'function')
    throw new TypeError('"listener" argument must be a function');

  events = target._events;
  if (!events) {
    events = target._events = new EventHandlers();
    target._eventsCount = 0;
  } else {
    // To avoid recursion in the case that type === "newListener"! Before
    // adding it to the listeners, first emit "newListener".
    if (events.newListener) {
      target.emit('newListener', type,
                  listener.listener ? listener.listener : listener);

      // Re-assign `events` because a newListener handler could have caused the
      // this._events to be assigned to a new object
      events = target._events;
    }
    existing = events[type];
  }

  if (!existing) {
    // Optimize the case of one listener. Don't need the extra array object.
    existing = events[type] = listener;
    ++target._eventsCount;
  } else {
    if (typeof existing === 'function') {
      // Adding the second element, need to change to array.
      existing = events[type] = prepend ? [listener, existing] :
                                          [existing, listener];
    } else {
      // If we've already got an array, just append.
      if (prepend) {
        existing.unshift(listener);
      } else {
        existing.push(listener);
      }
    }

    // Check for listener leak
    if (!existing.warned) {
      m = $getMaxListeners(target);
      if (m && m > 0 && existing.length > m) {
        existing.warned = true;
        var w = new Error('Possible EventEmitter memory leak detected. ' +
                            existing.length + ' ' + type + ' listeners added. ' +
                            'Use emitter.setMaxListeners() to increase limit');
        w.name = 'MaxListenersExceededWarning';
        w.emitter = target;
        w.type = type;
        w.count = existing.length;
        emitWarning(w);
      }
    }
  }

  return target;
}
function emitWarning(e) {
  typeof console.warn === 'function' ? console.warn(e) : console.log(e);
}
EventEmitter.prototype.addListener = function addListener(type, listener) {
  return _addListener(this, type, listener, false);
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.prependListener =
    function prependListener(type, listener) {
      return _addListener(this, type, listener, true);
    };

function _onceWrap(target, type, listener) {
  var fired = false;
  function g() {
    target.removeListener(type, g);
    if (!fired) {
      fired = true;
      listener.apply(target, arguments);
    }
  }
  g.listener = listener;
  return g;
}

EventEmitter.prototype.once = function once(type, listener) {
  if (typeof listener !== 'function')
    throw new TypeError('"listener" argument must be a function');
  this.on(type, _onceWrap(this, type, listener));
  return this;
};

EventEmitter.prototype.prependOnceListener =
    function prependOnceListener(type, listener) {
      if (typeof listener !== 'function')
        throw new TypeError('"listener" argument must be a function');
      this.prependListener(type, _onceWrap(this, type, listener));
      return this;
    };

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener =
    function removeListener(type, listener) {
      var list, events, position, i, originalListener;

      if (typeof listener !== 'function')
        throw new TypeError('"listener" argument must be a function');

      events = this._events;
      if (!events)
        return this;

      list = events[type];
      if (!list)
        return this;

      if (list === listener || (list.listener && list.listener === listener)) {
        if (--this._eventsCount === 0)
          this._events = new EventHandlers();
        else {
          delete events[type];
          if (events.removeListener)
            this.emit('removeListener', type, list.listener || listener);
        }
      } else if (typeof list !== 'function') {
        position = -1;

        for (i = list.length; i-- > 0;) {
          if (list[i] === listener ||
              (list[i].listener && list[i].listener === listener)) {
            originalListener = list[i].listener;
            position = i;
            break;
          }
        }

        if (position < 0)
          return this;

        if (list.length === 1) {
          list[0] = undefined;
          if (--this._eventsCount === 0) {
            this._events = new EventHandlers();
            return this;
          } else {
            delete events[type];
          }
        } else {
          spliceOne(list, position);
        }

        if (events.removeListener)
          this.emit('removeListener', type, originalListener || listener);
      }

      return this;
    };

EventEmitter.prototype.removeAllListeners =
    function removeAllListeners(type) {
      var listeners, events;

      events = this._events;
      if (!events)
        return this;

      // not listening for removeListener, no need to emit
      if (!events.removeListener) {
        if (arguments.length === 0) {
          this._events = new EventHandlers();
          this._eventsCount = 0;
        } else if (events[type]) {
          if (--this._eventsCount === 0)
            this._events = new EventHandlers();
          else
            delete events[type];
        }
        return this;
      }

      // emit removeListener for all listeners on all events
      if (arguments.length === 0) {
        var keys = Object.keys(events);
        for (var i = 0, key; i < keys.length; ++i) {
          key = keys[i];
          if (key === 'removeListener') continue;
          this.removeAllListeners(key);
        }
        this.removeAllListeners('removeListener');
        this._events = new EventHandlers();
        this._eventsCount = 0;
        return this;
      }

      listeners = events[type];

      if (typeof listeners === 'function') {
        this.removeListener(type, listeners);
      } else if (listeners) {
        // LIFO order
        do {
          this.removeListener(type, listeners[listeners.length - 1]);
        } while (listeners[0]);
      }

      return this;
    };

EventEmitter.prototype.listeners = function listeners(type) {
  var evlistener;
  var ret;
  var events = this._events;

  if (!events)
    ret = [];
  else {
    evlistener = events[type];
    if (!evlistener)
      ret = [];
    else if (typeof evlistener === 'function')
      ret = [evlistener.listener || evlistener];
    else
      ret = unwrapListeners(evlistener);
  }

  return ret;
};

EventEmitter.listenerCount = function(emitter, type) {
  if (typeof emitter.listenerCount === 'function') {
    return emitter.listenerCount(type);
  } else {
    return listenerCount.call(emitter, type);
  }
};

EventEmitter.prototype.listenerCount = listenerCount;
function listenerCount(type) {
  var events = this._events;

  if (events) {
    var evlistener = events[type];

    if (typeof evlistener === 'function') {
      return 1;
    } else if (evlistener) {
      return evlistener.length;
    }
  }

  return 0;
}

EventEmitter.prototype.eventNames = function eventNames() {
  return this._eventsCount > 0 ? Reflect.ownKeys(this._events) : [];
};

// About 1.5x faster than the two-arg version of Array#splice().
function spliceOne(list, index) {
  for (var i = index, k = i + 1, n = list.length; k < n; i += 1, k += 1)
    list[i] = list[k];
  list.pop();
}

function arrayClone(arr, i) {
  var copy = new Array(i);
  while (i--)
    copy[i] = arr[i];
  return copy;
}

function unwrapListeners(arr) {
  var ret = new Array(arr.length);
  for (var i = 0; i < ret.length; ++i) {
    ret[i] = arr[i].listener || arr[i];
  }
  return ret;
}

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
var decorateMethod = new Function("target", "logic", "\n    switch (target.length) {" + repeat(16, function (l) { return "\n        " + (l < 16 ? "case " + l : "default") + ": return function (" + repeat(l, function (i) { return "v" + i; }, ", ") + ") {\n            logic.apply(this, arguments);\n            return target.apply(this, arguments);\n        };"; }) + "\n    }\n");
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

var log;
if (typeof window !== "undefined") {
    log = function (msg) {
        var el = document.createElement("p");
        el.textContent = msg;
        document.body.appendChild(el);
    };
}
else {
    log = console.log.bind(console);
}
Benchmark.options.async = true;
var options$1 = {
    onStart: function () {
        log("============================================================");
        log("Run [ " + this.name + " ] ...");
    },
    onCycle: function (event) {
        log(event.target.toString());
    },
    onComplete: function () {
        log("Fastest is " + this.filter("fastest").map("name"));
    },
};
// benchmarks
var events = [
    "/first",
    "/second",
    "/third",
    "/fourth",
    "/fifth",
    "/sixth",
    "/seventh",
];
var objects = [];
for (var i = 0; i < 19; ++i) {
    objects.push({ foo: "bar", baz: {} });
}
var eventEmitter = new EventEmitter();
var prefixEmitter = new PrefixEmitter();
for (var i = 0; i < events.length; ++i) {
    events.slice(i).forEach(function (e) {
        eventEmitter.on(e, function (obj) { obj.foo = obj.foo; });
        prefixEmitter.on(e, function (obj) { obj.foo = obj.foo; });
    });
}
var seq = 0;
var suites = [
    new Benchmark.Suite("Adding Listeners", options$1)
        .add("EventEmitter", function () {
        function listener() { }
        var event = events[seq++ % events.length];
        eventEmitter.on(event, listener);
        eventEmitter.removeListener(event, listener);
    })
        .add("PrefixEmitter", function () {
        function listener() { }
        var event = events[seq++ % events.length];
        var sub = prefixEmitter.on(event, listener);
        sub.dispose();
    }),
    new Benchmark.Suite("Emitting Events", options$1)
        .add("EventEmitter", function () {
        var event = events[seq % events.length];
        var arg = objects[seq++ % events.length];
        eventEmitter.emit(event, arg);
    })
        .add("PrefixEmitter", function () {
        var event = events[seq % events.length];
        var arg = objects[seq++ % events.length];
        prefixEmitter.emit(event, arg);
    })
];
var _loop_1 = function (i) {
    suites[i - 1].on("complete", function () { suites[i].run(); });
};
for (var i = 1; i < suites.length; ++i) {
    _loop_1(i);
}
suites[0].run();

})));
