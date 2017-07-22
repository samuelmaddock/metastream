/*
 * lzwCompress.js
 *
 * Copyright (c) 2012-2016 floydpink
 * Licensed under the MIT license.
 */

let _lzwLoggingEnabled = false;

const _lzwLog = (message: string) => {
  try {
    console.log('lzwCompress: ' +
      (new Date()).toISOString() + ' : ' + (typeof(message) === 'object' ? JSON.stringify(message) : message));
  } catch (e) {}
};

// KeyOptimize
// http://stackoverflow.com/questions/4433402/replace-keys-json-in-javascript
class KeyOptimize {
  _keys: {[key: string]: any};

  constructor() {
    this._keys = [];
  }

  comparer(key: any) {
    return function (e: any) {
        return e === key;
    };
  }

  inArray(array: any, comparer: any) {
    for (var i = 0; i < array.length; i++) {
      if (comparer(array[i])) {
        return true;
      }
    }
    return false;
  }

  pushNew(array: any, element: any, comparer: any) {
    if (!this.inArray(array,comparer)) {
      array.push(element);
    }
  }

  _extractKeys(obj: any) {
    if (typeof obj === 'object') {
      for (var key in obj) {
        if (!Array.isArray(obj)) {
          this.pushNew(this._keys, key, this.comparer(key));
        }
        this._extractKeys(obj[key]);
      }
    }
  }

  _encode(obj: any) {
    if (typeof obj !== 'object') {
      return obj;
    }
    for (var prop in obj) {
      if (!Array.isArray(obj)) {
        if (obj.hasOwnProperty(prop)) {
          obj[this._keys.indexOf(prop)] = this._encode(obj[prop]);
          delete obj[prop];
        }
      } else {
        (obj as any)[prop] = this._encode((obj as any)[prop]);
      }
    }
    return obj;
  }

  _decode(obj: any) {
    if (typeof obj !== 'object') {
      return obj;
    }
    for (var prop in (obj as any)) {
      if (!Array.isArray(obj)) {
        if (obj.hasOwnProperty(prop) && this._keys[prop]) {
          obj[this._keys[prop]] = this._decode(obj[prop]);
          delete obj[prop];
        }
      } else {
        (obj as any)[prop] = this._decode((obj as any)[prop]);
      }
    }
    return obj;
  }

  static compress(json: string) {
    const ko = new KeyOptimize();
    var jsonObj = JSON.parse(json);
    ko._extractKeys(jsonObj);
    return JSON.stringify({ __k : ko._keys, __v : ko._encode(jsonObj) });
  }

  static decompress(minifiedJson: any) {
    const ko = new KeyOptimize();
    var obj = minifiedJson;
    if (typeof obj !== 'object') {
      return minifiedJson;
    }
    if (!obj.hasOwnProperty('__k')) {
      return JSON.stringify(obj);
    }
    ko._keys = obj.__k;
    return ko._decode(obj.__v);
  }
}

// LZWCompress
// http://stackoverflow.com/a/2252533/218882
// http://rosettacode.org/wiki/LZW_compression#JavaScript
class LZWCompress {
  static compress(uncompressed: any): string[] | string {
    if (typeof(uncompressed) !== 'string') {
      return uncompressed;
    }
    var i,
        dictionary: {[key: string]: any} = {},
        c,
        wc,
        w = '',
        result = [],
        dictSize = 256;
    for (i = 0; i < 256; i += 1) {
      dictionary[String.fromCharCode(i)] = i;
    }
    for (i = 0; i < uncompressed.length; i += 1) {
      c = uncompressed.charAt(i);
      wc = w + c;
      if (dictionary[wc]) {
        w = wc;
      } else {
        if (dictionary[w] === undefined) {
          return uncompressed;
        }
        result.push(dictionary[w]);
        dictionary[wc] = dictSize++;
        w = String(c);
      }
    }
    if (w !== '') {
      result.push(dictionary[w]);
    }
    return result;
  }

  static decompress(compressed: any): string | null {
    if (!Array.isArray(compressed)) {
      return compressed;
    }
    var i,
        dictionary = [],
        w,
        result,
        k,
        entry = '',
        dictSize = 256;
    for (i = 0; i < 256; i += 1) {
      dictionary[i] = String.fromCharCode(i);
    }
    w = String.fromCharCode(compressed[0]);
    result = w;
    for (i = 1; i < compressed.length; i += 1) {
      k = compressed[i];
      if (dictionary[k]) {
        entry = dictionary[k];
      } else {
        if (k === dictSize) {
          entry = w + w.charAt(0);
        } else {
          return null;
        }
      }
      result += entry;
      dictionary[dictSize++] = w + entry.charAt(0);
      w = entry;
    }
    return result;
  }
}

export const pack = (obj: Object) => {
  _lzwLoggingEnabled && _lzwLog('original (uncompressed) : ' + obj);
  if (!obj || obj === true || obj instanceof Date) {
    return obj;
  }
  var result = obj;
  if (typeof obj === 'object') {
    result = KeyOptimize.compress(JSON.stringify(obj));
    _lzwLoggingEnabled && _lzwLog('key optimized: ' + result);
  }
  var packedObj = LZWCompress.compress(result);
  _lzwLoggingEnabled && _lzwLog('packed   (compressed)   : ' + packedObj);
  return packedObj;
}

export const unpack = (compressedObj: Object) => {
  _lzwLoggingEnabled && _lzwLog('original (compressed)   : ' + compressedObj);
  if (!compressedObj || compressedObj === true || compressedObj instanceof Date) {
    return compressedObj;
  }
  var probableJSON, result = LZWCompress.decompress(compressedObj);
  try {
    probableJSON = JSON.parse(result!);
  } catch (e) {
    _lzwLoggingEnabled && _lzwLog('unpacked (uncompressed) : ' + result);
    return result;
  }
  if (typeof probableJSON === 'object') {
    result = KeyOptimize.decompress(probableJSON);
  }
  _lzwLoggingEnabled && _lzwLog('unpacked (uncompressed) : ' + result);
  return result;
}
