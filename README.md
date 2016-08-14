# Prefix Emitter [![Build Status](https://travis-ci.org/gnaeus/prefix-emitter.svg?branch=master)](https://travis-ci.org/gnaeus/prefix-emitter)

__Simple Event Emitter for ES6 and TypeScript based on Prefix Tree__

Prefix Emitter is a small library (1.7KB min+gz) with functionality like Node's Event Emitter.
But event listeners can be subscribed to any predefined sequence of anguments (topic) instead of single event name.

### Key Features
 * [Hierarchical event system](#prefix-emitter-topics) (topics)
 * Subscribing to and unsubscribing from events [by using Decorators](#prefix-emitter-decorators)
 * [Typed events](#prefix-emitter-typed-events) for usage with TypeScript
 * Small size
 * Zero dependencies
 
### <a name="prefix-emitter-topics"></a>Example
```js
import { PrefixEmitter } from "prefix-emitter";

let emitter = new PrefixEmitter();

// subscribe to events
let subscription1 = emitter.on((...args[]) => {
  console.log("global interceptor:", args);
});
let subscription2 = emitter.on("/topic", (event, arg) => {
  console.log("topic interceptor:", event, arg);
});
let subscription3 = emitter.on("/topic", "/event", (agr) => {
  console.log("event listener:", arg);
});

// emit an event
emitter.emit("/topic", "/event", 123);
// ➜ global interceptor: ["/topic", "/event", 123]
// ➜ topic interceptor: "/event", 123
// ➜ event listener: 123

// unsubscribe from events
subscription1.dispose();
subscription2.dispose();
subscription3.dispose();
```
---
## Installation and Requirements
Package supports installation as ES6 module or simply with `<script>` tag (through global variable named `PrefixEmitter`).
```html
<script src="node_modules/prefix-emitter/dist/prefix-emitter.min.js"></script>
```

Prefix Emitter can be used with NodeJS 4 and above or any ES5 compatible browser including IE9+ and Safari 7.
But internally it uses [ES6 Map](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Map) with simple fallback based on object for ES5.
So if ES6 Map is not supported (and polyfill is not used) then event prefixes should be strings or numbers.
Otherwise event prefix could be an object (if you need such strange case).

---
## Documentation

### Basic usage

We can choose any sequence of arguments (even empty) and subscribe event handler to it:
#### PrefixEmitter.on()
```js
const emitter = new PrefixEmitter();
const subscription = emitter.on("arg1", "arg2", "arg3", (arg4) => { console.log(arg4); });
```

Then we could trigger any events:
#### PrefixEmitter.emit()
```js
emitter.emit("arg1", "arg2", "arg3", "foo");   // ➜ "foo"
emitter.emit("arg1", "arg2", "arg3", "bar");   // ➜ "bar"
emitter.emit("some", "other", "event", "baz"); // ➜
```

And then we should unsubscribe from events:
#### Subscription.dispose()
```js
subscription.dispose();
```

Or we could use self-disposing subscription that will be destroyed after one call:
#### PrefixEmitter.once()
```js
const subscription = emitter.once("event", (arg) => {
  console.log("[subscription is dispoised]", arg);
});

emitter.emit("event", "foo"); // ➜ [subscription is dispoised], "foo"
emitter.emit("event", "bar"); // ➜
```

### <a name="prefix-emitter-decorators"></a>Decorators
Methods of some class can be marked as event listeners by using `@on` and `@once` Method Decprators.
Then subscriptions will be created by `@injectSubscriptions` and automatically disposed by `@disposeSubscriptions` decorators.
See example:
```js
import { on, once, injectSubscriptions, disposeSubscriptions, PrefixEmitter } from "prefix-emitter";

const emitter = new PrefixEmitter();

class Component {
  @injectSubscriptions
  componentDidMount() { }
  
  @once(emitter, "first")
  onFirstEvent(arg) { }
  
  @once(emitter, "second")
  onSecondEvent(arg) { }
  
  @disposeSubscriptions
  componentWillUnmount() { }
}
```

Subscriptions can be injected and disposed by Method Decorators (like in example above)
or manually by using `injectSubscriptions()` `disposeSubscriptions()` as functions:
```js
class Component {
  componentDidMount() {
    injectSubscriptions(this);
  }
  
  componentWillUnmount() {
    disposeSubscriptions(this);
  }
}
```

Also subscriptions can be injected by `@injectSubscriptions` as Class Decorator during constructor call:
```js
@injectSubscriptions
class Component {
  constructor() {
    // some stuff
  }
  
  @disposeSubscriptions
  dispose() { }
}
```

### <a name="prefix-emitter-typed-events"></a>Typed Emitters
For TypeScript there are three predefined generic Event Emitter interfaces:

#### VoidEmitter
Emitter without any arguments.
Can simply trigger subscriptions.
```ts
import { VoidEmitter, PrefixEmitter } from "prefix-emitter";

const emitter: VoidEmitter = new PrefixEmitter();

const sub = emitter.on(() => { console.log("fired!"); });
```

#### SingleEmitter
Emitter with one argument (or event).
```ts
import { SingleEmitter, PrefixEmitter } from "prefix-emitter";

const emitter: SingleEmitter<string> = new PrefixEmitter();

const sub1 = emitter.on("event", () => { console.log("event fired!"); });
const sub2 = emitter.on((arg: string) => { console.log(arg + "fired!"); });
```

#### DoubleEmitter
Emitter with two arguments (or prefixes).
```ts
import { DoubleEmitter, PrefixEmitter } from "prefix-emitter";

const emitter: DoubleEmitter<string, number> = new PrefixEmitter();

const sub2 = emitter.on((event: string, arg: number) => { console.log(event, arg); });
const sub2 = emitter.on("event", (arg: number) => { console.log("[event]", arg); });
const sub3 = emitter.on("event", 123, () => { console.log("[event, 123]"); });
```

### Tips
PrefixEmitter calls all listeners synchronously.

If you want define asynchronous listener, you could wrap its body to `setImmediate()` or some `asap()` function.
```js
emitter.on("event", (arg) => {
  setImmediate(() => { 
    // event listener body
  });
});
```

If you want emit some event asynchronously, you can do such thing:
```js
let a = 1, b = 2, c = 3;
// store argument values
const args = [a, b, c];
setImmediate(() => { emitter.emit(...args); });
// arguments can be changed like after synchronous `emit`
a = 4; b = 5;
```

---
### TypeScript Definitions
TypeScript definitions are packaged together with `js` files in `/dist` folder.
And it could be installed automatically with NPM package using [typings](https://www.npmjs.com/package/typings) utility.

### Benchmarks
To run benchmarks please type `npm run benchmarks` in console or open `./benchmark.html` in browser.

