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