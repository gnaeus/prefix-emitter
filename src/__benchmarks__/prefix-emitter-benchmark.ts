import "lodash";
import * as Benchmark from "benchmark";
import { EventEmitter } from "events";
import { PrefixEmitter } from "../prefix-emitter.ts";

let log: (msg: string) => void;

if (typeof window !== "undefined") {
    log = (msg: string) => {
        let el = document.createElement("p");
        el.textContent  = msg;
        document.body.appendChild(el);
    }
    window['Benchmark'] = Benchmark;
} else {
    log = console.log.bind(console);
}

Benchmark.options.async = true;

const options = {
    onStart: function () {
        log("============================================================");
        log("Run [ " + this.name + " ] ...");
    },
    onCycle: (event: any) => {
        log(event.target.toString());
    },
    onComplete: function () {
        log("Fastest is " + this.filter("fastest").map("name"));        
    },
};

// benchmarks
const events = [
    "/first",
    "/second",
    "/third",
    "/fourth",
    "/fifth",
    "/sixth",
    "/seventh",
];

const objects: any[] = [];

for (let i = 0; i < 19; ++i) {
    objects.push({ foo: "bar", baz: {} });
}

const eventEmitter = new EventEmitter();
const prefixEmitter = new PrefixEmitter();

for (let i = 0; i < events.length; ++i) {
    events.slice(i).forEach(e => {
        eventEmitter.on(e, (obj: any) => { obj.foo = obj.foo });
        prefixEmitter.on(e, (obj: any) => { obj.foo = obj.foo });
    });
}

let seq = 0;

const suites = [
    new Benchmark.Suite("Adding Listeners", options)
        .add("EventEmitter", () => {
            function listener() { }
            const event = events[seq++ % events.length];
            eventEmitter.on(event, listener);
            eventEmitter.removeListener(event, listener);
        })
        .add("PrefixEmitter", () => {
            function listener() { }
            const event = events[seq++ % events.length];
            const sub = prefixEmitter.on(event, listener);
            sub.dispose();
        }),

    new Benchmark.Suite("Emitting Events", options)
        .add("EventEmitter", () => {
            const event = events[seq % events.length];
            const arg = objects[seq++ % events.length];
            eventEmitter.emit(event, arg);
        })
        .add("PrefixEmitter", () => {
            const event = events[seq % events.length];
            const arg = objects[seq++ % events.length];
            prefixEmitter.emit(event, arg);
        })
];

for (let i = 1; i < suites.length; ++i) {
    suites[i - 1].on("complete", () => { suites[i].run(); });
}

suites[0].run();