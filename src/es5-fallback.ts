/**
 * Copyright (c) 2016 Dmitry Panyushkin
 * Available under MIT license
 */

/**
 * Simple fallback (not polyfill) for ES6 Map
 */
export class MapFallback {
    _store = Object.create(null);
    size = 0;

    has(key) {
        return this._store[key] !== void 0;
    }

    get(key) {
        return this._store[key];
    }

    set(key, value) {
        if (this._store[key] === void 0) {
            this.size++;
        }
        this._store[key] = value;
    }

    delete(key) {
        if (this._store[key] !== void 0) {
            this.size--;
            delete this._store[key];
        }
    }
}

/**
 * Fallback for ES6 Symbol
 */
export function SymbolFallback(key) {
    if (typeof key !== "string" && typeof key !== "number") {
        throw new Error("Symbol not supported");
    }
    return key;
};