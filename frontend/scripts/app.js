/*
 IDBWrapper - A cross-browser wrapper for IndexedDB
 Copyright (c) 2011 - 2013 Jens Arps
 http://jensarps.de/

 Licensed under the MIT (X11) license
*/
(function(j,h,i){"function"===typeof define?define(h):"undefined"!==typeof module&&module.exports?module.exports=h():i[j]=h()})("IDBStore",function(){var j={storeName:"Store",storePrefix:"IDBWrapper-",dbVersion:1,keyPath:"id",autoIncrement:!0,onStoreReady:function(){},onError:function(a){throw a;},indexes:[]},h=function(a,c){for(var b in j)this[b]="undefined"!=typeof a[b]?a[b]:j[b];this.dbName=this.storePrefix+this.storeName;this.dbVersion=parseInt(this.dbVersion,10);c&&(this.onStoreReady=c);this.idb=
window.indexedDB||window.webkitIndexedDB||window.mozIndexedDB;this.keyRange=window.IDBKeyRange||window.webkitIDBKeyRange||window.mozIDBKeyRange;this.consts={READ_ONLY:"readonly",READ_WRITE:"readwrite",VERSION_CHANGE:"versionchange",NEXT:"next",NEXT_NO_DUPLICATE:"nextunique",PREV:"prev",PREV_NO_DUPLICATE:"prevunique"};this.openDB()};h.prototype={version:"1.1.0",db:null,dbName:null,dbVersion:null,store:null,storeName:null,keyPath:null,autoIncrement:null,indexes:null,features:null,onStoreReady:null,
onError:null,_insertIdCount:0,openDB:function(){(this.features={}).hasAutoIncrement=!window.mozIndexedDB;var a=this.idb.open(this.dbName,this.dbVersion),c=!1;a.onerror=function(a){var c=!1;"error"in a.target?c="VersionError"==a.target.error.name:"errorCode"in a.target&&(c=12==a.target.errorCode);if(c)this.onError(Error("The version number provided is lower than the existing one."));else this.onError(a)}.bind(this);a.onsuccess=function(a){if(!c)if(this.db)this.onStoreReady();else if(this.db=a.target.result,
"string"==typeof this.db.version)this.onError(Error("The IndexedDB implementation in this browser is outdated. Please upgrade your browser."));else if(this.db.objectStoreNames.contains(this.storeName))this.store=this.db.transaction([this.storeName],this.consts.READ_ONLY).objectStore(this.storeName),this.indexes.forEach(function(a){var b=a.name;b?(this.normalizeIndexData(a),this.hasIndex(b)?this.indexComplies(this.store.index(b),a)||(c=!0,this.onError(Error('Cannot modify index "'+b+'" for current version. Please bump version number to '+
(this.dbVersion+1)+"."))):(c=!0,this.onError(Error('Cannot create new index "'+b+'" for current version. Please bump version number to '+(this.dbVersion+1)+".")))):(c=!0,this.onError(Error("Cannot create index: No index name given.")))},this),c||this.onStoreReady();else this.onError(Error("Something is wrong with the IndexedDB implementation in this browser. Please upgrade your browser."))}.bind(this);a.onupgradeneeded=function(a){this.db=a.target.result;this.store=this.db.objectStoreNames.contains(this.storeName)?
a.target.transaction.objectStore(this.storeName):this.db.createObjectStore(this.storeName,{keyPath:this.keyPath,autoIncrement:this.autoIncrement});this.indexes.forEach(function(a){var b=a.name;b||(c=!0,this.onError(Error("Cannot create index: No index name given.")));this.normalizeIndexData(a);this.hasIndex(b)?this.indexComplies(this.store.index(b),a)||(this.store.deleteIndex(b),this.store.createIndex(b,a.keyPath,{unique:a.unique,multiEntry:a.multiEntry})):this.store.createIndex(b,a.keyPath,{unique:a.unique,
multiEntry:a.multiEntry})},this)}.bind(this)},deleteDatabase:function(){this.idb.deleteDatabase&&this.idb.deleteDatabase(this.dbName)},put:function(a,c,b){b||(b=function(a){console.error("Could not write data.",a)});c||(c=i);var d=!1,f=null;"undefined"==typeof a[this.keyPath]&&!this.features.hasAutoIncrement&&(a[this.keyPath]=this._getUID());var e=this.db.transaction([this.storeName],this.consts.READ_WRITE);e.oncomplete=function(){(d?c:b)(f)};e.onabort=b;e.onerror=b;a=e.objectStore(this.storeName).put(a);
a.onsuccess=function(a){d=!0;f=a.target.result};a.onerror=b},get:function(a,c,b){b||(b=function(a){console.error("Could not read data.",a)});c||(c=i);var d=!1,f=null,e=this.db.transaction([this.storeName],this.consts.READ_ONLY);e.oncomplete=function(){(d?c:b)(f)};e.onabort=b;e.onerror=b;a=e.objectStore(this.storeName).get(a);a.onsuccess=function(a){d=!0;f=a.target.result};a.onerror=b},remove:function(a,c,b){b||(b=function(a){console.error("Could not remove data.",a)});c||(c=i);var d=!1,f=null,e=this.db.transaction([this.storeName],
this.consts.READ_WRITE);e.oncomplete=function(){(d?c:b)(f)};e.onabort=b;e.onerror=b;a=e.objectStore(this.storeName)["delete"](a);a.onsuccess=function(a){d=!0;f=a.target.result};a.onerror=b},batch:function(a,c,b){b||(b=function(a){console.error("Could not apply batch.",a)});c||(c=i);"[object Array]"!=Object.prototype.toString.call(a)&&b(Error("dataArray argument must be of type Array."));var d=this.db.transaction([this.storeName],this.consts.READ_WRITE);d.oncomplete=function(){(g?c:b)(g)};d.onabort=
b;d.onerror=b;var f=a.length,e=!1,g=!1,h=function(){f--;0===f&&!e&&(g=e=!0)};a.forEach(function(a){var c=a.type,f=a.key,g=a.value,a=function(a){d.abort();e||(e=!0,b(a,c,f))};if("remove"==c)g=d.objectStore(this.storeName)["delete"](f),g.onsuccess=h,g.onerror=a;else if("put"==c)"undefined"==typeof g[this.keyPath]&&!this.features.hasAutoIncrement&&(g[this.keyPath]=this._getUID()),g=d.objectStore(this.storeName).put(g),g.onsuccess=h,g.onerror=a},this)},getAll:function(a,c){c||(c=function(a){console.error("Could not read data.",
a)});a||(a=i);var b=this.db.transaction([this.storeName],this.consts.READ_ONLY),d=b.objectStore(this.storeName);d.getAll?this._getAllNative(b,d,a,c):this._getAllCursor(b,d,a,c)},_getAllNative:function(a,c,b,d){var f=!1,e=null;a.oncomplete=function(){(f?b:d)(e)};a.onabort=d;a.onerror=d;a=c.getAll();a.onsuccess=function(a){f=!0;e=a.target.result};a.onerror=d},_getAllCursor:function(a,c,b,d){var f=[],e=!1,g=null;a.oncomplete=function(){(e?b:d)(g)};a.onabort=d;a.onerror=d;a=c.openCursor();a.onsuccess=
function(a){(a=a.target.result)?(f.push(a.value),a["continue"]()):(e=!0,g=f)};a.onError=d},clear:function(a,c){c||(c=function(a){console.error("Could not clear store.",a)});a||(a=i);var b=!1,d=null,f=this.db.transaction([this.storeName],this.consts.READ_WRITE);f.oncomplete=function(){(b?a:c)(d)};f.onabort=c;f.onerror=c;f=f.objectStore(this.storeName).clear();f.onsuccess=function(a){b=!0;d=a.target.result};f.onerror=c},_getUID:function(){return this._insertIdCount++ +Date.now()},getIndexList:function(){return this.store.indexNames},
hasIndex:function(a){return this.store.indexNames.contains(a)},normalizeIndexData:function(a){a.keyPath=a.keyPath||a.name;a.unique=!!a.unique;a.multiEntry=!!a.multiEntry},indexComplies:function(a,c){return["keyPath","unique","multiEntry"].every(function(b){return"multiEntry"==b&&void 0===a[b]&&!1===c[b]?!0:c[b]==a[b]})},iterate:function(a,c){var c=k({index:null,order:"ASC",filterDuplicates:!1,keyRange:null,writeAccess:!1,onEnd:null,onError:function(a){console.error("Could not open cursor.",a)}},c||
{}),b="desc"==c.order.toLowerCase()?"PREV":"NEXT";c.filterDuplicates&&(b+="_NO_DUPLICATE");var d=!1,f=this.db.transaction([this.storeName],this.consts[c.writeAccess?"READ_WRITE":"READ_ONLY"]),e=f.objectStore(this.storeName);c.index&&(e=e.index(c.index));f.oncomplete=function(){if(d)if(c.onEnd)c.onEnd();else a(null);else c.onError(null)};f.onabort=c.onError;f.onerror=c.onError;b=e.openCursor(c.keyRange,this.consts[b]);b.onerror=c.onError;b.onsuccess=function(b){(b=b.target.result)?(a(b.value,b,f),
b["continue"]()):d=!0}},query:function(a,c){var b=[],c=c||{};c.onEnd=function(){a(b)};this.iterate(function(a){b.push(a)},c)},count:function(a,c){var c=k({index:null,keyRange:null},c||{}),b=c.onError||function(a){console.error("Could not open cursor.",a)},d=!1,f=null,e=this.db.transaction([this.storeName],this.consts.READ_ONLY);e.oncomplete=function(){(d?a:b)(f)};e.onabort=b;e.onerror=b;e=e.objectStore(this.storeName);c.index&&(e=e.index(c.index));e=e.count(c.keyRange);e.onsuccess=function(a){d=!0;
f=a.target.result};e.onError=b},makeKeyRange:function(a){var c="undefined"!=typeof a.lower,b="undefined"!=typeof a.upper;switch(!0){case c&&b:a=this.keyRange.bound(a.lower,a.upper,a.excludeLower,a.excludeUpper);break;case c:a=this.keyRange.lowerBound(a.lower,a.excludeLower);break;case b:a=this.keyRange.upperBound(a.upper,a.excludeUpper);break;default:throw Error('Cannot create KeyRange. Provide one or both of "lower" or "upper" value.');}return a}};var i=function(){},l={},k=function(a,c){var b,d;
for(b in c)d=c[b],d!==l[b]&&d!==a[b]&&(a[b]=d);return a};h.version=h.prototype.version;return h},this);
;//     Underscore.js 1.4.2
//     http://underscorejs.org
//     (c) 2009-2012 Jeremy Ashkenas, DocumentCloud Inc.
//     Underscore may be freely distributed under the MIT license.

(function () {

    // Baseline setup
    // --------------

    // Establish the root object, `window` in the browser, or `global` on the server.
    var root = this;

    // Save the previous value of the `_` variable.
    var previousUnderscore = root._;

    // Establish the object that gets returned to break out of a loop iteration.
    var breaker = {};

    // Save bytes in the minified (but not gzipped) version:
    var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

    // Create quick reference variables for speed access to core prototypes.
    var push = ArrayProto.push,
      slice = ArrayProto.slice,
      concat = ArrayProto.concat,
      unshift = ArrayProto.unshift,
      toString = ObjProto.toString,
      hasOwnProperty = ObjProto.hasOwnProperty;

    // All **ECMAScript 5** native function implementations that we hope to use
    // are declared here.
    var 
    nativeForEach = ArrayProto.forEach,
    nativeMap = ArrayProto.map,
    nativeReduce = ArrayProto.reduce,
    nativeReduceRight = ArrayProto.reduceRight,
    nativeFilter = ArrayProto.filter,
    nativeEvery = ArrayProto.every,
    nativeSome = ArrayProto.some,
    nativeIndexOf = ArrayProto.indexOf,
    nativeLastIndexOf = ArrayProto.lastIndexOf,
    nativeIsArray = Array.isArray,
    nativeKeys = Object.keys,
    nativeBind = FuncProto.bind;

    // Create a safe reference to the Underscore object for use below.
    var _ = function (obj) {
        if (obj instanceof _) return obj;
        if (!(this instanceof _)) return new _(obj);
        this._wrapped = obj;
    };

    // Export the Underscore object for **Node.js**, with
    // backwards-compatibility for the old `require()` API. If we're in
    // the browser, add `_` as a global object via a string identifier,
    // for Closure Compiler "advanced" mode.
    if (typeof exports !== 'undefined') {
        if (typeof module !== 'undefined' && module.exports) {
            exports = module.exports = _;
        }
        exports._ = _;
    } else {
        root['_'] = _;
    }

    // Current version.
    _.VERSION = '1.4.2';

    // Collection Functions
    // --------------------

    // The cornerstone, an `each` implementation, aka `forEach`.
    // Handles objects with the built-in `forEach`, arrays, and raw objects.
    // Delegates to **ECMAScript 5**'s native `forEach` if available.
    var each = _.each = _.forEach = function (obj, iterator, context) {
        if (obj == null) return;
        if (nativeForEach && obj.forEach === nativeForEach) {
            obj.forEach(iterator, context);
        } else if (obj.length === +obj.length) {
            for (var i = 0, l = obj.length; i < l; i++) {
                if (iterator.call(context, obj[i], i, obj) === breaker) return;
            }
        } else {
            for (var key in obj) {
                if (_.has(obj, key)) {
                    if (iterator.call(context, obj[key], key, obj) === breaker) return;
                }
            }
        }
    };

    // Return the results of applying the iterator to each element.
    // Delegates to **ECMAScript 5**'s native `map` if available.
    _.map = _.collect = function (obj, iterator, context) {
        var results = [];
        if (obj == null) return results;
        if (nativeMap && obj.map === nativeMap) return obj.map(iterator, context);
        each(obj, function (value, index, list) {
            results[results.length] = iterator.call(context, value, index, list);
        });
        return results;
    };

    // **Reduce** builds up a single result from a list of values, aka `inject`,
    // or `foldl`. Delegates to **ECMAScript 5**'s native `reduce` if available.
    _.reduce = _.foldl = _.inject = function (obj, iterator, memo, context) {
        var initial = arguments.length > 2;
        if (obj == null) obj = [];
        if (nativeReduce && obj.reduce === nativeReduce) {
            if (context) iterator = _.bind(iterator, context);
            return initial ? obj.reduce(iterator, memo) : obj.reduce(iterator);
        }
        each(obj, function (value, index, list) {
            if (!initial) {
                memo = value;
                initial = true;
            } else {
                memo = iterator.call(context, memo, value, index, list);
            }
        });
        if (!initial) throw new TypeError('Reduce of empty array with no initial value');
        return memo;
    };

    // The right-associative version of reduce, also known as `foldr`.
    // Delegates to **ECMAScript 5**'s native `reduceRight` if available.
    _.reduceRight = _.foldr = function (obj, iterator, memo, context) {
        var initial = arguments.length > 2;
        if (obj == null) obj = [];
        if (nativeReduceRight && obj.reduceRight === nativeReduceRight) {
            if (context) iterator = _.bind(iterator, context);
            return arguments.length > 2 ? obj.reduceRight(iterator, memo) : obj.reduceRight(iterator);
        }
        var length = obj.length;
        if (length !== +length) {
            var keys = _.keys(obj);
            length = keys.length;
        }
        each(obj, function (value, index, list) {
            index = keys ? keys[--length] : --length;
            if (!initial) {
                memo = obj[index];
                initial = true;
            } else {
                memo = iterator.call(context, memo, obj[index], index, list);
            }
        });
        if (!initial) throw new TypeError('Reduce of empty array with no initial value');
        return memo;
    };

    // Return the first value which passes a truth test. Aliased as `detect`.
    _.find = _.detect = function (obj, iterator, context) {
        var result;
        any(obj, function (value, index, list) {
            if (iterator.call(context, value, index, list)) {
                result = value;
                return true;
            }
        });
        return result;
    };

    // Return all the elements that pass a truth test.
    // Delegates to **ECMAScript 5**'s native `filter` if available.
    // Aliased as `select`.
    _.filter = _.select = function (obj, iterator, context) {
        var results = [];
        if (obj == null) return results;
        if (nativeFilter && obj.filter === nativeFilter) return obj.filter(iterator, context);
        each(obj, function (value, index, list) {
            if (iterator.call(context, value, index, list)) results[results.length] = value;
        });
        return results;
    };

    // Return all the elements for which a truth test fails.
    _.reject = function (obj, iterator, context) {
        var results = [];
        if (obj == null) return results;
        each(obj, function (value, index, list) {
            if (!iterator.call(context, value, index, list)) results[results.length] = value;
        });
        return results;
    };

    // Determine whether all of the elements match a truth test.
    // Delegates to **ECMAScript 5**'s native `every` if available.
    // Aliased as `all`.
    _.every = _.all = function (obj, iterator, context) {
        iterator || (iterator = _.identity);
        var result = true;
        if (obj == null) return result;
        if (nativeEvery && obj.every === nativeEvery) return obj.every(iterator, context);
        each(obj, function (value, index, list) {
            if (!(result = result && iterator.call(context, value, index, list))) return breaker;
        });
        return !!result;
    };

    // Determine if at least one element in the object matches a truth test.
    // Delegates to **ECMAScript 5**'s native `some` if available.
    // Aliased as `any`.
    var any = _.some = _.any = function (obj, iterator, context) {
        iterator || (iterator = _.identity);
        var result = false;
        if (obj == null) return result;
        if (nativeSome && obj.some === nativeSome) return obj.some(iterator, context);
        each(obj, function (value, index, list) {
            if (result || (result = iterator.call(context, value, index, list))) return breaker;
        });
        return !!result;
    };

    // Determine if the array or object contains a given value (using `===`).
    // Aliased as `include`.
    _.contains = _.include = function (obj, target) {
        var found = false;
        if (obj == null) return found;
        if (nativeIndexOf && obj.indexOf === nativeIndexOf) return obj.indexOf(target) != -1;
        found = any(obj, function (value) {
            return value === target;
        });
        return found;
    };

    // Invoke a method (with arguments) on every item in a collection.
    _.invoke = function (obj, method) {
        var args = slice.call(arguments, 2);
        return _.map(obj, function (value) {
            return (_.isFunction(method) ? method : value[method]).apply(value, args);
        });
    };

    // Convenience version of a common use case of `map`: fetching a property.
    _.pluck = function (obj, key) {
        return _.map(obj, function (value) { return value[key]; });
    };

    // Convenience version of a common use case of `filter`: selecting only objects
    // with specific `key:value` pairs.
    _.where = function (obj, attrs) {
        if (_.isEmpty(attrs)) return [];
        return _.filter(obj, function (value) {
            for (var key in attrs) {
                if (attrs[key] !== value[key]) return false;
            }
            return true;
        });
    };

    // Return the maximum element or (element-based computation).
    // Can't optimize arrays of integers longer than 65,535 elements.
    // See: https://bugs.webkit.org/show_bug.cgi?id=80797
    _.max = function (obj, iterator, context) {
        if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
            return Math.max.apply(Math, obj);
        }
        if (!iterator && _.isEmpty(obj)) return -Infinity;
        var result = { computed: -Infinity };
        each(obj, function (value, index, list) {
            var computed = iterator ? iterator.call(context, value, index, list) : value;
            computed >= result.computed && (result = { value: value, computed: computed });
        });
        return result.value;
    };

    // Return the minimum element (or element-based computation).
    _.min = function (obj, iterator, context) {
        if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
            return Math.min.apply(Math, obj);
        }
        if (!iterator && _.isEmpty(obj)) return Infinity;
        var result = { computed: Infinity };
        each(obj, function (value, index, list) {
            var computed = iterator ? iterator.call(context, value, index, list) : value;
            computed < result.computed && (result = { value: value, computed: computed });
        });
        return result.value;
    };

    // Shuffle an array.
    _.shuffle = function (obj) {
        var rand;
        var index = 0;
        var shuffled = [];
        each(obj, function (value) {
            rand = _.random(index++);
            shuffled[index - 1] = shuffled[rand];
            shuffled[rand] = value;
        });
        return shuffled;
    };

    // An internal function to generate lookup iterators.
    var lookupIterator = function (value) {
        return _.isFunction(value) ? value : function (obj) { return obj[value]; };
    };

    // Sort the object's values by a criterion produced by an iterator.
    _.sortBy = function (obj, value, context) {
        var iterator = lookupIterator(value);
        return _.pluck(_.map(obj, function (value, index, list) {
            return {
                value: value,
                index: index,
                criteria: iterator.call(context, value, index, list)
            };
        }).sort(function (left, right) {
            var a = left.criteria;
            var b = right.criteria;
            if (a !== b) {
                if (a > b || a === void 0) return 1;
                if (a < b || b === void 0) return -1;
            }
            return left.index < right.index ? -1 : 1;
        }), 'value');
    };

    // An internal function used for aggregate "group by" operations.
    var group = function (obj, value, context, behavior) {
        var result = {};
        var iterator = lookupIterator(value);
        each(obj, function (value, index) {
            var key = iterator.call(context, value, index, obj);
            behavior(result, key, value);
        });
        return result;
    };

    // Groups the object's values by a criterion. Pass either a string attribute
    // to group by, or a function that returns the criterion.
    _.groupBy = function (obj, value, context) {
        return group(obj, value, context, function (result, key, value) {
            (_.has(result, key) ? result[key] : (result[key] = [])).push(value);
        });
    };

    // Counts instances of an object that group by a certain criterion. Pass
    // either a string attribute to count by, or a function that returns the
    // criterion.
    _.countBy = function (obj, value, context) {
        return group(obj, value, context, function (result, key, value) {
            if (!_.has(result, key)) result[key] = 0;
            result[key]++;
        });
    };

    // Use a comparator function to figure out the smallest index at which
    // an object should be inserted so as to maintain order. Uses binary search.
    _.sortedIndex = function (array, obj, iterator, context) {
        iterator = iterator == null ? _.identity : lookupIterator(iterator);
        var value = iterator.call(context, obj);
        var low = 0, high = array.length;
        while (low < high) {
            var mid = (low + high) >>> 1;
            iterator.call(context, array[mid]) < value ? low = mid + 1 : high = mid;
        }
        return low;
    };

    // Safely convert anything iterable into a real, live array.
    _.toArray = function (obj) {
        if (!obj) return [];
        if (obj.length === +obj.length) return slice.call(obj);
        return _.values(obj);
    };

    // Return the number of elements in an object.
    _.size = function (obj) {
        return (obj.length === +obj.length) ? obj.length : _.keys(obj).length;
    };

    // Array Functions
    // ---------------

    // Get the first element of an array. Passing **n** will return the first N
    // values in the array. Aliased as `head` and `take`. The **guard** check
    // allows it to work with `_.map`.
    _.first = _.head = _.take = function (array, n, guard) {
        return (n != null) && !guard ? slice.call(array, 0, n) : array[0];
    };

    // Returns everything but the last entry of the array. Especially useful on
    // the arguments object. Passing **n** will return all the values in
    // the array, excluding the last N. The **guard** check allows it to work with
    // `_.map`.
    _.initial = function (array, n, guard) {
        return slice.call(array, 0, array.length - ((n == null) || guard ? 1 : n));
    };

    // Get the last element of an array. Passing **n** will return the last N
    // values in the array. The **guard** check allows it to work with `_.map`.
    _.last = function (array, n, guard) {
        if ((n != null) && !guard) {
            return slice.call(array, Math.max(array.length - n, 0));
        } else {
            return array[array.length - 1];
        }
    };

    // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
    // Especially useful on the arguments object. Passing an **n** will return
    // the rest N values in the array. The **guard**
    // check allows it to work with `_.map`.
    _.rest = _.tail = _.drop = function (array, n, guard) {
        return slice.call(array, (n == null) || guard ? 1 : n);
    };

    // Trim out all falsy values from an array.
    _.compact = function (array) {
        return _.filter(array, function (value) { return !!value; });
    };

    // Internal implementation of a recursive `flatten` function.
    var flatten = function (input, shallow, output) {
        each(input, function (value) {
            if (_.isArray(value)) {
                shallow ? push.apply(output, value) : flatten(value, shallow, output);
            } else {
                output.push(value);
            }
        });
        return output;
    };

    // Return a completely flattened version of an array.
    _.flatten = function (array, shallow) {
        return flatten(array, shallow, []);
    };

    // Return a version of the array that does not contain the specified value(s).
    _.without = function (array) {
        return _.difference(array, slice.call(arguments, 1));
    };

    // Produce a duplicate-free version of the array. If the array has already
    // been sorted, you have the option of using a faster algorithm.
    // Aliased as `unique`.
    _.uniq = _.unique = function (array, isSorted, iterator, context) {
        var initial = iterator ? _.map(array, iterator, context) : array;
        var results = [];
        var seen = [];
        each(initial, function (value, index) {
            if (isSorted ? (!index || seen[seen.length - 1] !== value) : !_.contains(seen, value)) {
                seen.push(value);
                results.push(array[index]);
            }
        });
        return results;
    };

    // Produce an array that contains the union: each distinct element from all of
    // the passed-in arrays.
    _.union = function () {
        return _.uniq(concat.apply(ArrayProto, arguments));
    };

    // Produce an array that contains every item shared between all the
    // passed-in arrays.
    _.intersection = function (array) {
        var rest = slice.call(arguments, 1);
        return _.filter(_.uniq(array), function (item) {
            return _.every(rest, function (other) {
                return _.indexOf(other, item) >= 0;
            });
        });
    };

    // Take the difference between one array and a number of other arrays.
    // Only the elements present in just the first array will remain.
    _.difference = function (array) {
        var rest = concat.apply(ArrayProto, slice.call(arguments, 1));
        return _.filter(array, function (value) { return !_.contains(rest, value); });
    };

    // Zip together multiple lists into a single array -- elements that share
    // an index go together.
    _.zip = function () {
        var args = slice.call(arguments);
        var length = _.max(_.pluck(args, 'length'));
        var results = new Array(length);
        for (var i = 0; i < length; i++) {
            results[i] = _.pluck(args, "" + i);
        }
        return results;
    };

    // Converts lists into objects. Pass either a single array of `[key, value]`
    // pairs, or two parallel arrays of the same length -- one of keys, and one of
    // the corresponding values.
    _.object = function (list, values) {
        var result = {};
        for (var i = 0, l = list.length; i < l; i++) {
            if (values) {
                result[list[i]] = values[i];
            } else {
                result[list[i][0]] = list[i][1];
            }
        }
        return result;
    };

    // If the browser doesn't supply us with indexOf (I'm looking at you, **MSIE**),
    // we need this function. Return the position of the first occurrence of an
    // item in an array, or -1 if the item is not included in the array.
    // Delegates to **ECMAScript 5**'s native `indexOf` if available.
    // If the array is large and already in sort order, pass `true`
    // for **isSorted** to use binary search.
    _.indexOf = function (array, item, isSorted) {
        if (array == null) return -1;
        var i = 0, l = array.length;
        if (isSorted) {
            if (typeof isSorted == 'number') {
                i = (isSorted < 0 ? Math.max(0, l + isSorted) : isSorted);
            } else {
                i = _.sortedIndex(array, item);
                return array[i] === item ? i : -1;
            }
        }
        if (nativeIndexOf && array.indexOf === nativeIndexOf) return array.indexOf(item, isSorted);
        for (; i < l; i++) if (array[i] === item) return i;
        return -1;
    };

    // Delegates to **ECMAScript 5**'s native `lastIndexOf` if available.
    _.lastIndexOf = function (array, item, from) {
        if (array == null) return -1;
        var hasIndex = from != null;
        if (nativeLastIndexOf && array.lastIndexOf === nativeLastIndexOf) {
            return hasIndex ? array.lastIndexOf(item, from) : array.lastIndexOf(item);
        }
        var i = (hasIndex ? from : array.length);
        while (i--) if (array[i] === item) return i;
        return -1;
    };

    // Generate an integer Array containing an arithmetic progression. A port of
    // the native Python `range()` function. See
    // [the Python documentation](http://docs.python.org/library/functions.html#range).
    _.range = function (start, stop, step) {
        if (arguments.length <= 1) {
            stop = start || 0;
            start = 0;
        }
        step = arguments[2] || 1;

        var len = Math.max(Math.ceil((stop - start) / step), 0);
        var idx = 0;
        var range = new Array(len);

        while (idx < len) {
            range[idx++] = start;
            start += step;
        }

        return range;
    };

    // Function (ahem) Functions
    // ------------------

    // Reusable constructor function for prototype setting.
    var ctor = function () { };

    // Create a function bound to a given object (assigning `this`, and arguments,
    // optionally). Binding with arguments is also known as `curry`.
    // Delegates to **ECMAScript 5**'s native `Function.bind` if available.
    // We check for `func.bind` first, to fail fast when `func` is undefined.
    _.bind = function bind(func, context) {
        var bound, args;
        if (func.bind === nativeBind && nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
        if (!_.isFunction(func)) throw new TypeError;
        args = slice.call(arguments, 2);
        return bound = function () {
            if (!(this instanceof bound)) return func.apply(context, args.concat(slice.call(arguments)));
            ctor.prototype = func.prototype;
            var self = new ctor;
            var result = func.apply(self, args.concat(slice.call(arguments)));
            if (Object(result) === result) return result;
            return self;
        };
    };

    // Bind all of an object's methods to that object. Useful for ensuring that
    // all callbacks defined on an object belong to it.
    _.bindAll = function (obj) {
        var funcs = slice.call(arguments, 1);
        if (funcs.length == 0) funcs = _.functions(obj);
        each(funcs, function (f) { obj[f] = _.bind(obj[f], obj); });
        return obj;
    };

    // Memoize an expensive function by storing its results.
    _.memoize = function (func, hasher) {
        var memo = {};
        hasher || (hasher = _.identity);
        return function () {
            var key = hasher.apply(this, arguments);
            return _.has(memo, key) ? memo[key] : (memo[key] = func.apply(this, arguments));
        };
    };

    // Delays a function for the given number of milliseconds, and then calls
    // it with the arguments supplied.
    _.delay = function (func, wait) {
        var args = slice.call(arguments, 2);
        return setTimeout(function () { return func.apply(null, args); }, wait);
    };

    // Defers a function, scheduling it to run after the current call stack has
    // cleared.
    _.defer = function (func) {
        return _.delay.apply(_, [func, 1].concat(slice.call(arguments, 1)));
    };

    // Returns a function, that, when invoked, will only be triggered at most once
    // during a given window of time.
    _.throttle = function (func, wait) {
        var context, args, timeout, throttling, more, result;
        var whenDone = _.debounce(function () { more = throttling = false; }, wait);
        return function () {
            context = this; args = arguments;
            var later = function () {
                timeout = null;
                if (more) {
                    result = func.apply(context, args);
                }
                whenDone();
            };
            if (!timeout) timeout = setTimeout(later, wait);
            if (throttling) {
                more = true;
            } else {
                throttling = true;
                result = func.apply(context, args);
            }
            whenDone();
            return result;
        };
    };

    // Returns a function, that, as long as it continues to be invoked, will not
    // be triggered. The function will be called after it stops being called for
    // N milliseconds. If `immediate` is passed, trigger the function on the
    // leading edge, instead of the trailing.
    _.debounce = function (func, wait, immediate) {
        var timeout, result;
        return function () {
            var context = this, args = arguments;
            var later = function () {
                timeout = null;
                if (!immediate) result = func.apply(context, args);
            };
            var callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) result = func.apply(context, args);
            return result;
        };
    };

    // Returns a function that will be executed at most one time, no matter how
    // often you call it. Useful for lazy initialization.
    _.once = function (func) {
        var ran = false, memo;
        return function () {
            if (ran) return memo;
            ran = true;
            memo = func.apply(this, arguments);
            func = null;
            return memo;
        };
    };

    // Returns the first function passed as an argument to the second,
    // allowing you to adjust arguments, run code before and after, and
    // conditionally execute the original function.
    _.wrap = function (func, wrapper) {
        return function () {
            var args = [func];
            push.apply(args, arguments);
            return wrapper.apply(this, args);
        };
    };

    // Returns a function that is the composition of a list of functions, each
    // consuming the return value of the function that follows.
    _.compose = function () {
        var funcs = arguments;
        return function () {
            var args = arguments;
            for (var i = funcs.length - 1; i >= 0; i--) {
                args = [funcs[i].apply(this, args)];
            }
            return args[0];
        };
    };

    // Returns a function that will only be executed after being called N times.
    _.after = function (times, func) {
        if (times <= 0) return func();
        return function () {
            if (--times < 1) {
                return func.apply(this, arguments);
            }
        };
    };

    // Object Functions
    // ----------------

    // Retrieve the names of an object's properties.
    // Delegates to **ECMAScript 5**'s native `Object.keys`
    _.keys = nativeKeys || function (obj) {
        if (obj !== Object(obj)) throw new TypeError('Invalid object');
        var keys = [];
        for (var key in obj) if (_.has(obj, key)) keys[keys.length] = key;
        return keys;
    };

    // Retrieve the values of an object's properties.
    _.values = function (obj) {
        var values = [];
        for (var key in obj) if (_.has(obj, key)) values.push(obj[key]);
        return values;
    };

    // Convert an object into a list of `[key, value]` pairs.
    _.pairs = function (obj) {
        var pairs = [];
        for (var key in obj) if (_.has(obj, key)) pairs.push([key, obj[key]]);
        return pairs;
    };

    // Invert the keys and values of an object. The values must be serializable.
    _.invert = function (obj) {
        var result = {};
        for (var key in obj) if (_.has(obj, key)) result[obj[key]] = key;
        return result;
    };

    // Return a sorted list of the function names available on the object.
    // Aliased as `methods`
    _.functions = _.methods = function (obj) {
        var names = [];
        for (var key in obj) {
            if (_.isFunction(obj[key])) names.push(key);
        }
        return names.sort();
    };

    // Extend a given object with all the properties in passed-in object(s).
    _.extend = function (obj) {
        each(slice.call(arguments, 1), function (source) {
            for (var prop in source) {
                obj[prop] = source[prop];
            }
        });
        return obj;
    };

    // Return a copy of the object only containing the whitelisted properties.
    _.pick = function (obj) {
        var copy = {};
        var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
        each(keys, function (key) {
            if (key in obj) copy[key] = obj[key];
        });
        return copy;
    };

    // Return a copy of the object without the blacklisted properties.
    _.omit = function (obj) {
        var copy = {};
        var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
        for (var key in obj) {
            if (!_.contains(keys, key)) copy[key] = obj[key];
        }
        return copy;
    };

    // Fill in a given object with default properties.
    _.defaults = function (obj) {
        each(slice.call(arguments, 1), function (source) {
            for (var prop in source) {
                if (obj[prop] == null) obj[prop] = source[prop];
            }
        });
        return obj;
    };

    // Create a (shallow-cloned) duplicate of an object.
    _.clone = function (obj) {
        if (!_.isObject(obj)) return obj;
        return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
    };

    // Invokes interceptor with the obj, and then returns obj.
    // The primary purpose of this method is to "tap into" a method chain, in
    // order to perform operations on intermediate results within the chain.
    _.tap = function (obj, interceptor) {
        interceptor(obj);
        return obj;
    };

    // Internal recursive comparison function for `isEqual`.
    var eq = function (a, b, aStack, bStack) {
        // Identical objects are equal. `0 === -0`, but they aren't identical.
        // See the Harmony `egal` proposal: http://wiki.ecmascript.org/doku.php?id=harmony:egal.
        if (a === b) return a !== 0 || 1 / a == 1 / b;
        // A strict comparison is necessary because `null == undefined`.
        if (a == null || b == null) return a === b;
        // Unwrap any wrapped objects.
        if (a instanceof _) a = a._wrapped;
        if (b instanceof _) b = b._wrapped;
        // Compare `[[Class]]` names.
        var className = toString.call(a);
        if (className != toString.call(b)) return false;
        switch (className) {
            // Strings, numbers, dates, and booleans are compared by value. 
            case '[object String]':
                // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
                // equivalent to `new String("5")`.
                return a == String(b);
            case '[object Number]':
                // `NaN`s are equivalent, but non-reflexive. An `egal` comparison is performed for
                // other numeric values.
                return a != +a ? b != +b : (a == 0 ? 1 / a == 1 / b : a == +b);
            case '[object Date]':
            case '[object Boolean]':
                // Coerce dates and booleans to numeric primitive values. Dates are compared by their
                // millisecond representations. Note that invalid dates with millisecond representations
                // of `NaN` are not equivalent.
                return +a == +b;
                // RegExps are compared by their source patterns and flags.
            case '[object RegExp]':
                return a.source == b.source &&
               a.global == b.global &&
               a.multiline == b.multiline &&
               a.ignoreCase == b.ignoreCase;
        }
        if (typeof a != 'object' || typeof b != 'object') return false;
        // Assume equality for cyclic structures. The algorithm for detecting cyclic
        // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
        var length = aStack.length;
        while (length--) {
            // Linear search. Performance is inversely proportional to the number of
            // unique nested structures.
            if (aStack[length] == a) return bStack[length] == b;
        }
        // Add the first object to the stack of traversed objects.
        aStack.push(a);
        bStack.push(b);
        var size = 0, result = true;
        // Recursively compare objects and arrays.
        if (className == '[object Array]') {
            // Compare array lengths to determine if a deep comparison is necessary.
            size = a.length;
            result = size == b.length;
            if (result) {
                // Deep compare the contents, ignoring non-numeric properties.
                while (size--) {
                    if (!(result = eq(a[size], b[size], aStack, bStack))) break;
                }
            }
        } else {
            // Objects with different constructors are not equivalent, but `Object`s
            // from different frames are.
            var aCtor = a.constructor, bCtor = b.constructor;
            if (aCtor !== bCtor && !(_.isFunction(aCtor) && (aCtor instanceof aCtor) &&
                               _.isFunction(bCtor) && (bCtor instanceof bCtor))) {
                return false;
            }
            // Deep compare objects.
            for (var key in a) {
                if (_.has(a, key)) {
                    // Count the expected number of properties.
                    size++;
                    // Deep compare each member.
                    if (!(result = _.has(b, key) && eq(a[key], b[key], aStack, bStack))) break;
                }
            }
            // Ensure that both objects contain the same number of properties.
            if (result) {
                for (key in b) {
                    if (_.has(b, key) && !(size--)) break;
                }
                result = !size;
            }
        }
        // Remove the first object from the stack of traversed objects.
        aStack.pop();
        bStack.pop();
        return result;
    };

    // Perform a deep comparison to check if two objects are equal.
    _.isEqual = function (a, b) {
        return eq(a, b, [], []);
    };

    // Is a given array, string, or object empty?
    // An "empty" object has no enumerable own-properties.
    _.isEmpty = function (obj) {
        if (obj == null) return true;
        if (_.isArray(obj) || _.isString(obj)) return obj.length === 0;
        for (var key in obj) if (_.has(obj, key)) return false;
        return true;
    };

    // Is a given value a DOM element?
    _.isElement = function (obj) {
        return !!(obj && obj.nodeType === 1);
    };

    // Is a given value an array?
    // Delegates to ECMA5's native Array.isArray
    _.isArray = nativeIsArray || function (obj) {
        return toString.call(obj) == '[object Array]';
    };

    // Is a given variable an object?
    _.isObject = function (obj) {
        return obj === Object(obj);
    };

    // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp.
    each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp'], function (name) {
        _['is' + name] = function (obj) {
            return toString.call(obj) == '[object ' + name + ']';
        };
    });

    // Define a fallback version of the method in browsers (ahem, IE), where
    // there isn't any inspectable "Arguments" type.
    if (!_.isArguments(arguments)) {
        _.isArguments = function (obj) {
            return !!(obj && _.has(obj, 'callee'));
        };
    }

    // Optimize `isFunction` if appropriate.
    if (typeof (/./) !== 'function') {
        _.isFunction = function (obj) {
            return typeof obj === 'function';
        };
    }

    // Is a given object a finite number?
    _.isFinite = function (obj) {
        return _.isNumber(obj) && isFinite(obj);
    };

    // Is the given value `NaN`? (NaN is the only number which does not equal itself).
    _.isNaN = function (obj) {
        return _.isNumber(obj) && obj != +obj;
    };

    // Is a given value a boolean?
    _.isBoolean = function (obj) {
        return obj === true || obj === false || toString.call(obj) == '[object Boolean]';
    };

    // Is a given value equal to null?
    _.isNull = function (obj) {
        return obj === null;
    };

    // Is a given variable undefined?
    _.isUndefined = function (obj) {
        return obj === void 0;
    };

    // Shortcut function for checking if an object has a given property directly
    // on itself (in other words, not on a prototype).
    _.has = function (obj, key) {
        return hasOwnProperty.call(obj, key);
    };

    // Utility Functions
    // -----------------

    // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
    // previous owner. Returns a reference to the Underscore object.
    _.noConflict = function () {
        root._ = previousUnderscore;
        return this;
    };

    // Keep the identity function around for default iterators.
    _.identity = function (value) {
        return value;
    };

    // Run a function **n** times.
    _.times = function (n, iterator, context) {
        for (var i = 0; i < n; i++) iterator.call(context, i);
    };

    // Return a random integer between min and max (inclusive).
    _.random = function (min, max) {
        if (max == null) {
            max = min;
            min = 0;
        }
        return min + (0 | Math.random() * (max - min + 1));
    };

    // List of HTML entities for escaping.
    var entityMap = {
        escape: {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#x27;',
            '/': '&#x2F;'
        }
    };
    entityMap.unescape = _.invert(entityMap.escape);

    // Regexes containing the keys and values listed immediately above.
    var entityRegexes = {
        escape: new RegExp('[' + _.keys(entityMap.escape).join('') + ']', 'g'),
        unescape: new RegExp('(' + _.keys(entityMap.unescape).join('|') + ')', 'g')
    };

    // Functions for escaping and unescaping strings to/from HTML interpolation.
    _.each(['escape', 'unescape'], function (method) {
        _[method] = function (string) {
            if (string == null) return '';
            return ('' + string).replace(entityRegexes[method], function (match) {
                return entityMap[method][match];
            });
        };
    });

    // If the value of the named property is a function then invoke it;
    // otherwise, return it.
    _.result = function (object, property) {
        if (object == null) return null;
        var value = object[property];
        return _.isFunction(value) ? value.call(object) : value;
    };

    // Add your own custom functions to the Underscore object.
    _.mixin = function (obj) {
        each(_.functions(obj), function (name) {
            var func = _[name] = obj[name];
            _.prototype[name] = function () {
                var args = [this._wrapped];
                push.apply(args, arguments);
                return result.call(this, func.apply(_, args));
            };
        });
    };

    // Generate a unique integer id (unique within the entire client session).
    // Useful for temporary DOM ids.
    var idCounter = 0;
    _.uniqueId = function (prefix) {
        var id = idCounter++;
        return prefix ? prefix + id : id;
    };

    // By default, Underscore uses ERB-style template delimiters, change the
    // following template settings to use alternative delimiters.
    _.templateSettings = {
        evaluate: /<%([\s\S]+?)%>/g,
        interpolate: /<%=([\s\S]+?)%>/g,
        escape: /<%-([\s\S]+?)%>/g
    };

    // When customizing `templateSettings`, if you don't want to define an
    // interpolation, evaluation or escaping regex, we need one that is
    // guaranteed not to match.
    var noMatch = /(.)^/;

    // Certain characters need to be escaped so that they can be put into a
    // string literal.
    var escapes = {
        "'": "'",
        '\\': '\\',
        '\r': 'r',
        '\n': 'n',
        '\t': 't',
        '\u2028': 'u2028',
        '\u2029': 'u2029'
    };

    var escaper = /\\|'|\r|\n|\t|\u2028|\u2029/g;

    // JavaScript micro-templating, similar to John Resig's implementation.
    // Underscore templating handles arbitrary delimiters, preserves whitespace,
    // and correctly escapes quotes within interpolated code.
    _.template = function (text, data, settings) {
        settings = _.defaults({}, settings, _.templateSettings);

        // Combine delimiters into one regular expression via alternation.
        var matcher = new RegExp([
      (settings.escape || noMatch).source,
      (settings.interpolate || noMatch).source,
      (settings.evaluate || noMatch).source
    ].join('|') + '|$', 'g');

        // Compile the template source, escaping string literals appropriately.
        var index = 0;
        var source = "__p+='";
        text.replace(matcher, function (match, escape, interpolate, evaluate, offset) {
            source += text.slice(index, offset)
        .replace(escaper, function (match) { return '\\' + escapes[match]; });
            source +=
        escape ? "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'" :
        interpolate ? "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'" :
        evaluate ? "';\n" + evaluate + "\n__p+='" : '';
            index = offset + match.length;
        });
        source += "';\n";

        // If a variable is not specified, place data values in local scope.
        if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

        source = "var __t,__p='',__j=Array.prototype.join," +
      "print=function(){__p+=__j.call(arguments,'');};\n" +
      source + "return __p;\n";

        try {
            var render = new Function(settings.variable || 'obj', '_', source);
        } catch (e) {
            e.source = source;
            throw e;
        }

        if (data) return render(data, _);
        var template = function (data) {
            return render.call(this, data, _);
        };

        // Provide the compiled function source as a convenience for precompilation.
        template.source = 'function(' + (settings.variable || 'obj') + '){\n' + source + '}';

        return template;
    };

    // Add a "chain" function, which will delegate to the wrapper.
    _.chain = function (obj) {
        return _(obj).chain();
    };

    // OOP
    // ---------------
    // If Underscore is called as a function, it returns a wrapped object that
    // can be used OO-style. This wrapper holds altered versions of all the
    // underscore functions. Wrapped objects may be chained.

    // Helper function to continue chaining intermediate results.
    var result = function (obj) {
        return this._chain ? _(obj).chain() : obj;
    };

    // Add all of the Underscore functions to the wrapper object.
    _.mixin(_);

    // Add all mutator Array functions to the wrapper.
    each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function (name) {
        var method = ArrayProto[name];
        _.prototype[name] = function () {
            var obj = this._wrapped;
            method.apply(obj, arguments);
            if ((name == 'shift' || name == 'splice') && obj.length === 0) delete obj[0];
            return result.call(this, obj);
        };
    });

    // Add all accessor Array functions to the wrapper.
    each(['concat', 'join', 'slice'], function (name) {
        var method = ArrayProto[name];
        _.prototype[name] = function () {
            return result.call(this, method.apply(this._wrapped, arguments));
        };
    });

    _.extend(_.prototype, {

        // Start chaining a wrapped Underscore object.
        chain: function () {
            this._chain = true;
            return this;
        },

        // Extracts the result from a wrapped and chained object.
        value: function () {
            return this._wrapped;
        }

    });

}).call(this);


//  Underscore.string
//  (c) 2010 Esa-Matti Suuronen <esa-matti aet suuronen dot org>
//  Underscore.string is freely distributable under the terms of the MIT license.
//  Documentation: https://github.com/epeli/underscore.string
//  Some code is borrowed from MooTools and Alexandru Marasteanu.
//  Version '2.3.0'

! function(root, String) {
    'use strict';

    // Defining helper functions.

    var nativeTrim = String.prototype.trim;
    var nativeTrimRight = String.prototype.trimRight;
    var nativeTrimLeft = String.prototype.trimLeft;

    var parseNumber = function(source) {
        return source * 1 || 0;
    };

    var strRepeat = function(str, qty) {
        if (qty < 1) return '';
        var result = '';
        while (qty > 0) {
            if (qty & 1) result += str;
            qty >>= 1, str += str;
        }
        return result;
    };

    var slice = [].slice;

    var defaultToWhiteSpace = function(characters) {
        if (characters == null) return '\\s';
        else if (characters.source) return characters.source;
        else return '[' + _s.escapeRegExp(characters) + ']';
    };

    var escapeChars = {
        lt: '<',
        gt: '>',
        quot: '"',
        amp: '&',
        apos: "'"
    };

    var reversedEscapeChars = {};
    for (var key in escapeChars) reversedEscapeChars[escapeChars[key]] = key;
    reversedEscapeChars["'"] = '#39';

    // sprintf() for JavaScript 0.7-beta1
    // http://www.diveintojavascript.com/projects/javascript-sprintf
    //
    // Copyright (c) Alexandru Marasteanu <alexaholic [at) gmail (dot] com>
    // All rights reserved.

    var sprintf = (function() {
        function get_type(variable) {
            return Object.prototype.toString.call(variable).slice(8, - 1).toLowerCase();
        }

        var str_repeat = strRepeat;

        var str_format = function() {
            if (!str_format.cache.hasOwnProperty(arguments[0])) {
                str_format.cache[arguments[0]] = str_format.parse(arguments[0]);
            }
            return str_format.format.call(null, str_format.cache[arguments[0]], arguments);
        };

        str_format.format = function(parse_tree, argv) {
            var cursor = 1,
                tree_length = parse_tree.length,
                node_type = '',
                arg, output = [],
                i, k, match, pad, pad_character, pad_length;
            for (i = 0; i < tree_length; i++) {
                node_type = get_type(parse_tree[i]);
                if (node_type === 'string') {
                    output.push(parse_tree[i]);
                } else if (node_type === 'array') {
                    match = parse_tree[i]; // convenience purposes only
                    if (match[2]) { // keyword argument
                        arg = argv[cursor];
                        for (k = 0; k < match[2].length; k++) {
                            if (!arg.hasOwnProperty(match[2][k])) {
                                throw new Error(sprintf('[_.sprintf] property "%s" does not exist', match[2][k]));
                            }
                            arg = arg[match[2][k]];
                        }
                    } else if (match[1]) { // positional argument (explicit)
                        arg = argv[match[1]];
                    } else { // positional argument (implicit)
                        arg = argv[cursor++];
                    }

                    if (/[^s]/.test(match[8]) && (get_type(arg) != 'number')) {
                        throw new Error(sprintf('[_.sprintf] expecting number but found %s', get_type(arg)));
                    }
                    switch (match[8]) {
                        case 'b':
                            arg = arg.toString(2);
                            break;
                        case 'c':
                            arg = String.fromCharCode(arg);
                            break;
                        case 'd':
                            arg = parseInt(arg, 10);
                            break;
                        case 'e':
                            arg = match[7] ? arg.toExponential(match[7]) : arg.toExponential();
                            break;
                        case 'f':
                            arg = match[7] ? parseFloat(arg).toFixed(match[7]) : parseFloat(arg);
                            break;
                        case 'o':
                            arg = arg.toString(8);
                            break;
                        case 's':
                            arg = ((arg = String(arg)) && match[7] ? arg.substring(0, match[7]) : arg);
                            break;
                        case 'u':
                            arg = Math.abs(arg);
                            break;
                        case 'x':
                            arg = arg.toString(16);
                            break;
                        case 'X':
                            arg = arg.toString(16).toUpperCase();
                            break;
                    }
                    arg = (/[def]/.test(match[8]) && match[3] && arg >= 0 ? '+' + arg : arg);
                    pad_character = match[4] ? match[4] == '0' ? '0' : match[4].charAt(1) : ' ';
                    pad_length = match[6] - String(arg).length;
                    pad = match[6] ? str_repeat(pad_character, pad_length) : '';
                    output.push(match[5] ? arg + pad : pad + arg);
                }
            }
            return output.join('');
        };

        str_format.cache = {};

        str_format.parse = function(fmt) {
            var _fmt = fmt,
                match = [],
                parse_tree = [],
                arg_names = 0;
            while (_fmt) {
                if ((match = /^[^\x25]+/.exec(_fmt)) !== null) {
                    parse_tree.push(match[0]);
                } else if ((match = /^\x25{2}/.exec(_fmt)) !== null) {
                    parse_tree.push('%');
                } else if ((match = /^\x25(?:([1-9]\d*)\$|\(([^\)]+)\))?(\+)?(0|'[^$])?(-)?(\d+)?(?:\.(\d+))?([b-fosuxX])/.exec(_fmt)) !== null) {
                    if (match[2]) {
                        arg_names |= 1;
                        var field_list = [],
                            replacement_field = match[2],
                            field_match = [];
                        if ((field_match = /^([a-z_][a-z_\d]*)/i.exec(replacement_field)) !== null) {
                            field_list.push(field_match[1]);
                            while ((replacement_field = replacement_field.substring(field_match[0].length)) !== '') {
                                if ((field_match = /^\.([a-z_][a-z_\d]*)/i.exec(replacement_field)) !== null) {
                                    field_list.push(field_match[1]);
                                } else if ((field_match = /^\[(\d+)\]/.exec(replacement_field)) !== null) {
                                    field_list.push(field_match[1]);
                                } else {
                                    throw new Error('[_.sprintf] huh?');
                                }
                            }
                        } else {
                            throw new Error('[_.sprintf] huh?');
                        }
                        match[2] = field_list;
                    } else {
                        arg_names |= 2;
                    }
                    if (arg_names === 3) {
                        throw new Error('[_.sprintf] mixing positional and named placeholders is not (yet) supported');
                    }
                    parse_tree.push(match);
                } else {
                    throw new Error('[_.sprintf] huh?');
                }
                _fmt = _fmt.substring(match[0].length);
            }
            return parse_tree;
        };

        return str_format;
    })();



    // Defining underscore.string

    window._s = {

        VERSION: '2.3.0',

        isBlank: function(str) {
            if (str == null) str = '';
            return (/^\s*$/).test(str);
        },

        stripTags: function(str) {
            if (str == null) return '';
            return String(str).replace(/<\/?[^>]+>/g, '');
        },

        capitalize: function(str) {
            str = str == null ? '' : String(str);
            return str.charAt(0).toUpperCase() + str.slice(1);
        },

        chop: function(str, step) {
            if (str == null) return [];
            str = String(str);
            step = ~~step;
            return step > 0 ? str.match(new RegExp('.{1,' + step + '}', 'g')) : [str];
        },

        clean: function(str) {
            return _s.strip(str).replace(/\s+/g, ' ');
        },

        count: function(str, substr) {
            if (str == null || substr == null) return 0;

            str = String(str);
            substr = String(substr);

            var count = 0,
                pos = 0,
                length = substr.length;

            while (true) {
                pos = str.indexOf(substr, pos);
                if (pos === -1) break;
                count++;
                pos += length;
            }

            return count;
        },

        chars: function(str) {
            if (str == null) return [];
            return String(str).split('');
        },

        swapCase: function(str) {
            if (str == null) return '';
            return String(str).replace(/\S/g, function(c) {
                return c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase();
            });
        },

        escapeHTML: function(str) {
            if (str == null) return '';
            return String(str).replace(/[&<>"']/g, function(m) {
                return '&' + reversedEscapeChars[m] + ';';
            });
        },

        unescapeHTML: function(str) {
            if (str == null) return '';
            return String(str).replace(/\&([^;]+);/g, function(entity, entityCode) {
                var match;

                if (entityCode in escapeChars) {
                    return escapeChars[entityCode];
                } else if (match = entityCode.match(/^#x([\da-fA-F]+)$/)) {
                    return String.fromCharCode(parseInt(match[1], 16));
                } else if (match = entityCode.match(/^#(\d+)$/)) {
                    return String.fromCharCode(~~match[1]);
                } else {
                    return entity;
                }
            });
        },

        escapeRegExp: function(str) {
            if (str == null) return '';
            return String(str).replace(/([.*+?^=!:${}()|[\]\/\\])/g, '\\$1');
        },

        splice: function(str, i, howmany, substr) {
            var arr = _s.chars(str);
            arr.splice(~~i, ~~howmany, substr);
            return arr.join('');
        },

        insert: function(str, i, substr) {
            return _s.splice(str, i, 0, substr);
        },

        include: function(str, needle) {
            if (needle === '') return true;
            if (str == null) return false;
            return String(str).indexOf(needle) !== -1;
        },

        join: function() {
            var args = slice.call(arguments),
                separator = args.shift();

            if (separator == null) separator = '';

            return args.join(separator);
        },

        lines: function(str) {
            if (str == null) return [];
            return String(str).split("\n");
        },

        reverse: function(str) {
            return _s.chars(str).reverse().join('');
        },

        startsWith: function(str, starts) {
            if (starts === '') return true;
            if (str == null || starts == null) return false;
            str = String(str);
            starts = String(starts);
            return str.length >= starts.length && str.slice(0, starts.length) === starts;
        },

        endsWith: function(str, ends) {
            if (ends === '') return true;
            if (str == null || ends == null) return false;
            str = String(str);
            ends = String(ends);
            return str.length >= ends.length && str.slice(str.length - ends.length) === ends;
        },

        succ: function(str) {
            if (str == null) return '';
            str = String(str);
            return str.slice(0, - 1) + String.fromCharCode(str.charCodeAt(str.length - 1) + 1);
        },

        titleize: function(str) {
            if (str == null) return '';
            return String(str).replace(/(?:^|\s)\S/g, function(c) {
                return c.toUpperCase();
            });
        },

        camelize: function(str) {
            return _s.trim(str).replace(/[-_\s]+(.)?/g, function(match, c) {
                return c.toUpperCase();
            });
        },

        underscored: function(str) {
            return _s.trim(str).replace(/([a-z\d])([A-Z]+)/g, '$1_$2').replace(/[-\s]+/g, '_').toLowerCase();
        },

        dasherize: function(str) {
            return _s.trim(str).replace(/([A-Z])/g, '-$1').replace(/[-_\s]+/g, '-').toLowerCase();
        },

        classify: function(str) {
            return _s.titleize(String(str).replace(/_/g, ' ')).replace(/\s/g, '');
        },

        humanize: function(str) {
            return _s.capitalize(_s.underscored(str).replace(/_id$/, '').replace(/_/g, ' '));
        },

        trim: function(str, characters) {
            if (str == null) return '';
            if (!characters && nativeTrim) return nativeTrim.call(str);
            characters = defaultToWhiteSpace(characters);
            return String(str).replace(new RegExp('\^' + characters + '+|' + characters + '+$', 'g'), '');
        },

        ltrim: function(str, characters) {
            if (str == null) return '';
            if (!characters && nativeTrimLeft) return nativeTrimLeft.call(str);
            characters = defaultToWhiteSpace(characters);
            return String(str).replace(new RegExp('^' + characters + '+'), '');
        },

        rtrim: function(str, characters) {
            if (str == null) return '';
            if (!characters && nativeTrimRight) return nativeTrimRight.call(str);
            characters = defaultToWhiteSpace(characters);
            return String(str).replace(new RegExp(characters + '+$'), '');
        },

        truncate: function(str, length, truncateStr) {
            if (str == null) return '';
            str = String(str);
            truncateStr = truncateStr || '...';
            length = ~~length;
            return str.length > length ? str.slice(0, length) + truncateStr : str;
        },

        /**
         * _s.prune: a more elegant version of truncate
         * prune extra chars, never leaving a half-chopped word.
         * @author github.com/rwz
         */
        prune: function(str, length, pruneStr) {
            if (str == null) return '';

            str = String(str);
            length = ~~length;
            pruneStr = pruneStr != null ? String(pruneStr) : '...';

            if (str.length <= length) return str;

            var tmpl = function(c) {
                return c.toUpperCase() !== c.toLowerCase() ? 'A' : ' ';
            },
            template = str.slice(0, length + 1).replace(/.(?=\W*\w*$)/g, tmpl); // 'Hello, world' -> 'HellAA AAAAA'

            if (template.slice(template.length - 2).match(/\w\w/)) template = template.replace(/\s*\S+$/, '');
            else template = _s.rtrim(template.slice(0, template.length - 1));

            return (template + pruneStr).length > str.length ? str : str.slice(0, template.length) + pruneStr;
        },

        words: function(str, delimiter) {
            if (_s.isBlank(str)) return [];
            return _s.trim(str, delimiter).split(delimiter || /\s+/);
        },

        pad: function(str, length, padStr, type) {
            str = str == null ? '' : String(str);
            length = ~~length;

            var padlen = 0;

            if (!padStr) padStr = ' ';
            else if (padStr.length > 1) padStr = padStr.charAt(0);

            switch (type) {
                case 'right':
                    padlen = length - str.length;
                    return str + strRepeat(padStr, padlen);
                case 'both':
                    padlen = length - str.length;
                    return strRepeat(padStr, Math.ceil(padlen / 2)) + str + strRepeat(padStr, Math.floor(padlen / 2));
                default:
                    // 'left'
                    padlen = length - str.length;
                    return strRepeat(padStr, padlen) + str;
            }
        },

        lpad: function(str, length, padStr) {
            return _s.pad(str, length, padStr);
        },

        rpad: function(str, length, padStr) {
            return _s.pad(str, length, padStr, 'right');
        },

        lrpad: function(str, length, padStr) {
            return _s.pad(str, length, padStr, 'both');
        },

        sprintf: sprintf,

        vsprintf: function(fmt, argv) {
            argv.unshift(fmt);
            return sprintf.apply(null, argv);
        },

        toNumber: function(str, decimals) {
            if (!str) return 0;
            str = _s.trim(str);
            if (!str.match(/^-?\d+(?:\.\d+)?$/)) return NaN;
            return parseNumber(parseNumber(str).toFixed(~~decimals));
        },

        numberFormat: function(number, dec, dsep, tsep) {
            if (isNaN(number) || number == null) return '';

            number = number.toFixed(~~dec);
            tsep = typeof tsep == 'string' ? tsep : ',';

            var parts = number.split('.'),
                fnums = parts[0],
                decimals = parts[1] ? (dsep || '.') + parts[1] : '';

            return fnums.replace(/(\d)(?=(?:\d{3})+$)/g, '$1' + tsep) + decimals;
        },

        strRight: function(str, sep) {
            if (str == null) return '';
            str = String(str);
            sep = sep != null ? String(sep) : sep;
            var pos = !sep ? -1 : str.indexOf(sep);
            return~pos ? str.slice(pos + sep.length, str.length) : str;
        },

        strRightBack: function(str, sep) {
            if (str == null) return '';
            str = String(str);
            sep = sep != null ? String(sep) : sep;
            var pos = !sep ? -1 : str.lastIndexOf(sep);
            return~pos ? str.slice(pos + sep.length, str.length) : str;
        },

        strLeft: function(str, sep) {
            if (str == null) return '';
            str = String(str);
            sep = sep != null ? String(sep) : sep;
            var pos = !sep ? -1 : str.indexOf(sep);
            return~pos ? str.slice(0, pos) : str;
        },

        strLeftBack: function(str, sep) {
            if (str == null) return '';
            str += '';
            sep = sep != null ? '' + sep : sep;
            var pos = str.lastIndexOf(sep);
            return~pos ? str.slice(0, pos) : str;
        },

        toSentence: function(array, separator, lastSeparator, serial) {
            separator = separator || ', '
            lastSeparator = lastSeparator || ' and '
            var a = array.slice(),
                lastMember = a.pop();

            if (array.length > 2 && serial) lastSeparator = _s.rtrim(separator) + lastSeparator;

            return a.length ? a.join(separator) + lastSeparator + lastMember : lastMember;
        },

        toSentenceSerial: function() {
            var args = slice.call(arguments);
            args[3] = true;
            return _s.toSentence.apply(_s, args);
        },

        slugify: function(str) {
            if (str == null) return '';

            var from = "ąàáäâãåæćęèéëêìíïîłńòóöôõøùúüûñçżź",
                to = "aaaaaaaaceeeeeiiiilnoooooouuuunczz",
                regex = new RegExp(defaultToWhiteSpace(from), 'g');

            str = String(str).toLowerCase().replace(regex, function(c) {
                var index = from.indexOf(c);
                return to.charAt(index) || '-';
            });

            return _s.dasherize(str.replace(/[^\w\s-]/g, ''));
        },

        surround: function(str, wrapper) {
            return [wrapper, str, wrapper].join('');
        },

        quote: function(str) {
            return _s.surround(str, '"');
        },

        exports: function() {
            var result = {};

            for (var prop in this) {
                if (!this.hasOwnProperty(prop) || prop.match(/^(?:include|contains|reverse)$/)) continue;
                result[prop] = this[prop];
            }

            return result;
        },

        repeat: function(str, qty, separator) {
            if (str == null) return '';

            qty = ~~qty;

            // using faster implementation if separator is not needed;
            if (separator == null) return strRepeat(String(str), qty);

            // this one is about 300x slower in Google Chrome
            for (var repeat = []; qty > 0; repeat[--qty] = str) {}
            return repeat.join(separator);
        },

        levenshtein: function(str1, str2) {
            if (str1 == null && str2 == null) return 0;
            if (str1 == null) return String(str2).length;
            if (str2 == null) return String(str1).length;

            str1 = String(str1);
            str2 = String(str2);

            var current = [],
                prev, value;

            for (var i = 0; i <= str2.length; i++)
            for (var j = 0; j <= str1.length; j++) {
                if (i && j) if (str1.charAt(j - 1) === str2.charAt(i - 1)) value = prev;
                else value = Math.min(current[j], current[j - 1], prev) + 1;
                else value = i + j;

                prev = current[j];
                current[j] = value;
            }

            return current.pop();
        }
    };

    // Aliases

    _s.strip = _s.trim;
    _s.lstrip = _s.ltrim;
    _s.rstrip = _s.rtrim;
    _s.center = _s.lrpad;
    _s.rjust = _s.lpad;
    _s.ljust = _s.rpad;
    _s.contains = _s.include;
    _s.q = _s.quote;

    // Exporting

    // CommonJS module is defined
    if (typeof exports !== 'undefined') {
        if (typeof module !== 'undefined' && module.exports) module.exports = _s;

        exports._s = _s;
    }

    // Register as a named module with AMD.
    if (typeof define === 'function' && define.amd) define('underscore.string', [], function() {
        return _s;
    });


    // Integrate with Underscore.js if defined
    // or create our own underscore object.
    root._ = root._ || {};
    root._.string = root._.str = _s;
}(this, String);
;helpers = {
	parseyear: function(timestamp) {
		return timestamp.substr(0,4);
	},
	localStorageSafety: function(key) {
		if (localStorage[key] == null || localStorage[key] == undefined || localStorage[key] == 'undefined') {
			localStorage[key] = "[]";
		}
	},
	localStorageSafetyObject: function(key) {
		if (localStorage[key] == null || localStorage[key] == undefined || localStorage[key] == 'undefined') {
			localStorage[key] = "{}";
		}
	},
	getLocalStorage: function(key) {
		this.localStorageSafety(key);
		return JSON.parse(localStorage[key]);
	},
	addToLocalStorage: function(key, obj, first) {
		this.localStorageSafety(key);
		var ls = this.getLocalStorage(key);
		if (!first) {ls.push(obj)} else {ls.unshift(obj)}
		if (key == 'history') {
			ls = _.last(ls, 50);
		}
		localStorage[key] = JSON.stringify(ls);
		return this.getLocalStorage(key);
	},
	clearLocalStorage: function(key) {
		localStorage[key] = "[]";
		return this.getLocalStorage(key);
	},
	parseDOM: function(obj) {
		/*
		Don't use jQuery .data() here, it breaks everything
		*/
		var song =  (obj instanceof HTMLElement) ? obj.dataset : obj;
		if (song) {
			song.id = parseFloat(song.id);
		}

		return song;
	},
	parsetime: function(number) {
		var divide = (number > 5000) ? 1000 : 1
		var fullseconds = Math.round(number / divide), 
			minutes = Math.floor(fullseconds/60),
			seconds = fullseconds-(minutes*60)
		if (seconds < 10) {
			seconds = "0" + seconds;
		}
		return minutes+":"+seconds;
	},
	slugify: function(str) {
		if (str == null) return '';

    	var from  = "ąàáäâãåæćęèéëêìíïîłńòóöôõøśùúüûñçżź",
    	    to    = "aaaaaaaaceeeeeiiiilnoooooosuuuunczz",
    	    regex = new RegExp(helpers.defaultToWhiteSpace(from), 'g');

    	str = String(str).toLowerCase().replace(regex, function(c){
    	  var index = from.indexOf(c);
    	  return to.charAt(index) || '-';
    	});

    	return _s.dasherize(str.replace(/[^\w\s-]/g, ''));
	},
	defaultToWhiteSpace: function(characters) {
		if (characters == null)
    	  return '\\s';
    	else if (characters.source)
    	  return characters.source;
    	else
    	  return '[' + helpers.escapeRegExp(characters) + ']';
	},
	escapeRegExp: function(str) {
		 if (str == null) return '';
      		return String(str).replace(/([.*+?^=!:${}()|[\]\/\\])/g, '\\$1');
	},
    parseYTId: function(video) {
    	return (video == undefined) ? null : video.id.$t.substr(-11);
    },
    createID: function(l) {
        var text = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    
        for( var i=0; i < l; i++ )
            text += possible.charAt(Math.floor(Math.random() * possible.length));
    
        return text;
    },
    getHQAlbumImage: function(album, size) {
    	var lq = album.image;
    	//Just in case something invalid gets passed, so the server doesn't crash then.
    	if (!lq) 	{ return 'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==' }
    	if (!size) 	{ return lq };
    	return lq.replace('100x100-75.jpg', (size+'x'+size+'-75.jpg'));
    },
    coverArrayToHQ: function(songs, size) {
    	var newarray = [];
    	for (i = 0; i < songs.length ;i++) {
			newarray.push(helpers.getHQAlbumImage({image: songs[i]}, size));
    	}
    		
    	return newarray;
    },
    parsetext: function(text) {
		/*
			Make all texts a string
		*/
		var text = text + '';
		/*
			Extract parenthesis text and wrap it in a span tag with the class 'lighttext'
		*/
		var parenthesis = (text.indexOf('(') != -1) ? '<span class="lighttext">' + ((text.substr(text.indexOf('('))).substr(1)).replace(')', '') + '</span>' : '';
		/*
			Get the text outside the parentesis
		*/
		var light 	  = (text.indexOf('(') != -1) ? text.substr(0, text.indexOf('(')) : text
		/*
			Return the text
		*/
		return light + parenthesis;
	},
	parsehours: function(number) {
		var seconds = number / 1000,
			label;
		if 			(seconds < 10) { label = 'a few seconds'} 
		else if 	(seconds < 50) { label = Math.round(seconds/10)*10 + ' seconds'}
		else if 	(seconds < 90) 	{ label = 'one minute' }
		else if 	(seconds < 3600) { label = Math.round(seconds/60) + ' minutes' }
		else if 	(3600 <= seconds) { label = Math.round(seconds/360)/10 + ' hours'}
		else 		{label = 'Unknown length'}
		
		return label;
	},
	albumRelevance: function(album, underscore) {
		var _ = underscore;
		var hidden = [
			{
				word: 'remix',
				reason: 'This album only contains Remixes of one song:'
			},
			{
				word: 'instrumental',
				reason: 'This is is the Instrumental version of'
			},
			{
				word: '- ep',
				reason: 'This album may contain duplicate tracks:'
			},
			{
				word: 'acoustic',
				reason: 'This album is an acoustic version:'
			},
			{
				word: 'itunes',
				reason: 'This album is an iTunes version:'
			},
			{
				word: 'live',
				reason: 'This is a live album:'
			},
			{
				word: 'karaoke',
				reason: 'This is a karaoke/instrumental version: '
			}
		];
		_.each(hidden, function(hide) {
			if (((album.name+'').toLowerCase()).indexOf(hide.word) != -1) {
				album.hidden = hide.reason;
			}
		});
		if (album.tracks > 30) {
			album.hidden = 'This album is very long (' + album.tracks + ' tracks):'
		}
		return album;
	},
	parseAlbumTitle: function(album) {
		var prename             = album.name+'',
			name                = prename.substr(0, (prename.indexOf("(") == -1) ? prename.length : prename.indexOf("(") -1),
			parenthesisregex    = /\(([^()]+)\)/g,
			inparenthesis       = prename.match(parenthesisregex),
			withoutbrackets     = inparenthesis ? inparenthesis[0].substr(1, inparenthesis[0].length-2) : null;
		album.name              = name;
		album.subtitle          = withoutbrackets;
		return album;
	},
	sortTracks: function(order, tracks) {
		var songs = [];
		_.each(order, function(id) {
			var song = _.find(tracks, function(item) { return item.id == id });
			if (song) {
				songs.push(song);
			}
		});
		return songs;
	},
	makeAlbum: function(data, _) {
		return {
			id: 		data.album.collectionId,
			tracks: 	data.songs.length,
			artist: 	data.album.artistName,
			artistid: 	data.album.artistId,
			release: 	data.album.releaseDate,
			image: 		data.album.artworkUrl100,
			name: 		data.album.collectionName,
			hours: 		_.reduce(_.pluck(data.songs, 'duration'), function(memo, num) {return memo + parseFloat(num)}, 0)
		}
	},
	parseReleaseLeft: function(time) {
		var release = new Date(time);
		if (release == 'Invalid Date') {
			return '';
		}
		else {
			var timeleft = release - new Date(),
				secleft  = timeleft/1000;
			if (secleft < 3600) {
				return 'Album will be released within 1 hour';
			}
			else {
				var hoursleft = secleft/3600;
				if (hoursleft < 24) {
					return 'Album will be available in ' + Math.floor(hoursleft) + ' hours';
				}
				else {
					var daysleft = Math.floor(hoursleft/24);
					if (daysleft == 1) {
						return 'Album will be available tomorrow';
					}
					else {
						return 'Album will be available in ' + ' days'; 
					}
				}
			}
		}
	},
	titleMatcher: function(title, _) {
		return _.chain(
			title
				.toLowerCase()
				.split(/[.&()\[\]\-\s]/g)
		).compact().without('ft', 'feat', 'lyric', 'lyrics', 'official', 'hd', 'music', 'audio', 'hq', 'video')._wrapped;
	}
};
this.helpers = helpers;;views = {
	artist: {
		load: function(artist) {
			$.ajax({
				url: "/api/artist/" + artist,
				dataType: "html",
				success: function(data) {
					$("#view").html(data);
					views.loadingindicator.hide()
					$.publish('new-tracks-entered-dom');
					$.publish('view-got-loaded')

				},
				error: function() {
					errors.draw(404);
				}
			})
		}
	},
	song: {
		load: function(song) {
			$.ajax({
				url: '/api/song/' + song,
				dataType: 'html',
				success: function(data) {
					$('#view').html(data);
					$.publish('new-tracks-entered-dom');
					views.loadingindicator.hide();
					$.publish('view-got-loaded')
				}
			})
		}
	},
	album: {
		load: function(id) {
			$.ajax({
				url: "/api/album/" + id,
				dataType: "html",
				success: function(data) {
					var view = $("#view");
					view.html(data);
					views.loadingindicator.hide();
					$.publish('new-tracks-entered-dom');
					$.publish('view-got-loaded')
				},
				error: function() {
					errors.draw(404);
				}
			})
		}
	},
    track: {
        load: function(id) {
            $.ajax({
                url: "/api/track/" + id,
                dataType: "html",
                success: function(data) {
                    var view = $("#view");
                    view.html(data);
                    views.loadingindicator.hide();
                    $.publish('view-got-loaded')
                },
                error: function() {
                    errors.draw(404);
                }
            });
        }
    },
    charts: {
        load: function() {
			$.ajax({
				url: "/api/charts",
				dataType: "html",
				success: function(data) {
					var view = $("#view");
					view.html(data);
					views.loadingindicator.hide();
					$.publish('new-tracks-entered-dom');
					$.publish('view-got-loaded')
				},
				error: function() {
					errors.draw(404)
				}
			})
		}
	},
	retrocharts: {
		load: function(year) {
			$.ajax({
				url: "/api/charts/" + year,
				dataType: "html",
				success: function(data) {
					var view = $("#view");
					view.html(data);
					views.loadingindicator.hide();
					$.publish('new-tracks-entered-dom');
					$.publish('view-got-loaded')
				} 
			})
		}
	},
	info: {
		load: function() {
			$.ajax({
				url: "/api/info",
				dataType: "html",
				success: function(data) {
					var view = $("#view");
					view.html(data);
					views.loadingindicator.hide();
					$.publish('view-got-loaded')
				},
				error: function() {
					errors.draw(404);
				}
			});
		}
	},
	loadingindicator: {
		hide: function() {
			$('#loading-indicator').removeClass('loading-indicator-visible');
		}
	},
	library: {
		load: function() {
			var library = chinchilla.library,
				data = {user: chinchilla.loggedin},
				afterLocalTracksFetched = function(data) {
					var fetched = data;
					var tofetch = _.difference(library, _.pluck(fetched, 'id'));
					if (tofetch.length != 0) {
						socket.emit ('/api/tracks/get', { tracks: tofetch });
						socket.on	('/api/tracks/get/response', function (tracks) {
							var alltracks = _.union(tracks, fetched);
							afterAllTracksFetched(alltracks);
							_.each(tracks, function (track) {
								DB.addTrack(track)
							})
						});
					}
					else {
						afterAllTracksFetched(fetched);
					}
				},
				afterAllTracksFetched 		= function(tracks) {
					data.tracks = (helpers.sortTracks(library, tracks)).reverse();
					var html = templates.buildLibrary(data);
					$('#view').html(html);
					views.loadingindicator.hide();
					$.publish('new-tracks-entered-dom');
					$.publish('view-got-loaded')
				}
			DB.getTracks({ids: library, callback: afterLocalTracksFetched});
		}
	},
	playlist: {
		load: function(url) {
			var playlist = _.where(chinchilla.playlists, {url: url})[0],
				data = {user: chinchilla.loggedin, playlist: playlist},
				afterLocalTracksFetched = function(data) {
					var fetched = data;
					var tofetch = _.difference(playlist.tracks, _.pluck(fetched, 'id'));
					if (tofetch.length != 0) {
						socket.emit ('/api/tracks/get', {tracks: tofetch});
						socket.on 	('/api/tracks/get/response', function (tracks) {
							var alltracks = _.union(tracks, fetched);
							var alltracksmapped = _.map(alltracks, function(track) { track.inlib = _.contains(chinchilla.library, track.id); return track });
							afterAllTracksFetched(alltracksmapped);
							_.each(tracks, function (track) {
								DB.addTrack(track)
							})
						});
					}
					else {
						afterAllTracksFetched(fetched);
					}
				},
				afterAllTracksFetched 	= function(tracks) {
					data.tracks = (helpers.sortTracks(playlist.tracks, tracks))
					if (playlist.newestattop) { data.tracks = data.tracks.reverse(); };
					var html = templates.buildPlaylist(data);
					$('#view').html(html);
					views.loadingindicator.hide();
					$.publish('new-tracks-entered-dom');
					$.publish('view-got-loaded')
				}
			if (playlist) {
				DB.getTracks({ids: playlist.tracks, callback: afterLocalTracksFetched});
			}
			else {
				$.ajax({
					url: '/api' + url,
					dataType: 'html',
					success: function(data) {
						var view = $('#view');
						view.html(data);
						views.loadingindicator.hide();
						$.publish('new-tracks-entered-dom');
						$.publish('view-got-loaded');
					}
				})
			}
		}
	},
	lyrics: {
		load: function(id) {
			$.ajax({
				url: '/api/lyrics/' + id,
				dataType: 'html',
				success: function(data) {
					var view = $('#view');
					view.html(data);
					views.loadingindicator.hide();
					$.publish('view-got-loaded')
				}
			})
		}
	},
	redditpl: {
		load: function(id) {
			$.ajax({
				url: '/api/thread/' + id,
				dataType: 'html',
				success: function(data) {
					var view = $('#view');
					view.html(data);
					views.loadingindicator.hide();
					$.publish('view-got-loaded');
					$.publish('new-tracks-entered-dom');
				} 
			})
		}
	},
	reddit: {
		load: function() {
			$.ajax({
				url: "/api/reddit",
				dataType: "html",
				success: function(data) {
					var view = $("#view");
					view.html(data);
					views.loadingindicator.hide();
					$.publish('new-tracks-entered-dom');
					$.publish('view-got-loaded')
				},
				error: function() {
					errors.draw(404);
				}
			})
		}
	},
	settings: {
		get: function() {
			$.ajax({
				url: "/api/settings",
				dataType: "html",
				success: function(data) {
					$("#view").html(data);
					views.loadingindicator.hide();
					$.publish('view-got-loaded')
				},
				error: function() {
					errors.draw(404);
				}
			})
		}
	},
	main: {
		get: function() {
			$.ajax({
				url: "/api/main",
				dataType: "html",
				success: function(data) {
					$("#view").html(data);
					views.loadingindicator.hide();
					$.publish('new-tracks-entered-dom');
					$.publish('view-got-loaded')
				},
				error: function() {
					errors.draw(404);
				}
			});
		}
	},
	remote: {
		get: function() {
			$.ajax({
				url: '/api/remote',
				dataType: 'html',
				success: function(data) {
					$('#view').html(data);
					views.loadingindicator.hide();
					$.publish('view-got-loaded');
				},
				error: function() {
					errors.draw(404);
				}
			});
		}
	}
};;routes = {
	'/charts':              	function(match) {
		views.charts.load();
	},
	'/album/:id':           	function(match) {
		views.album.load(match[1]);
	},
	'/about':               	function(match) {
		views.about.load();
	},
    '/track/:id':           	function(match) {
        views.track.load(match[1]);
    },
    '/register':        		function(match) {
        registration.facebook.load();
    },
    '/library': 				function(match) {
    	views.library.load(match[1]);
    },	
    'settings': 				function(match) {
    	views.settings.get();
    },
	'/home':                	function(match) {
		views.main.get();
	},
	'/artist/:id': 				function(match) {
		views.artist.load(match[1]);
	},
	'/lyrics/:id': 				function(match) {
		views.lyrics.load(match[1]);
	},
	'/u/:name/p/:name': 		function(match) {
		views.playlist.load(match[0]);
		$('#drop-target-label').text('this playlist')
	},
	'/thread/:name': 			function(match) {
		views.redditpl.load(match[1]);
	},
	'/reddit': 					function(match) {
		views.reddit.load();
	},
	'/': 						function(match) {
		views.main.get();
	},
	'/song/:id': 				function(match) {
		views.song.load(match[1]);
	},
	'/retro-charts/:id':		function(match) {
		views.retrocharts.load(match[1]);
	},
	'/logout': 					function(match) {
		window.location = '/logout';
	},
	'/login': 					function(match) {
		window.location = '/auth/facebook'
	},
	'/info': 					function(match) {
		views.info.load();
	},
	'/remote': 					function(match) {
		views.remote.get();
	}
};
$(document)
.on('ready', function() {
	var pathname            = window.location.pathname;
	navigation.to(pathname);
})
.on('mousedown', '[data-navigate]', function(e) {
	/* Prevent right-click navigation - for contextmenus */
	if (e.button == 2) {
		return;
	}
	var pathname            = $(this).attr('data-navigate');
	e.preventDefault();
	navigation.to(pathname);
});
var showSpinner = function() {
	$('#loading-indicator').addClass('loading-indicator-visible')
};
loader = {
	spinner: function() {
		return '<div class="loading-indicator"><div class="spinner"></div></div>';
	}
}
navigation = {
	to: function(path, prevent) {
		/*
			Highlight current view in menu
		*/
		var classname = 'menuselected';
		$('.' + classname).removeClass(classname);
		$('#sidebar').find('[data-navigate="' + path + '"]').addClass(classname);


		var currentroute = {
			path: path,
			timestamp: Date.now()
		}
		var tsdiff = currentroute.timestamp - window.currentroute.timestamp;
		var issameroute = currentroute.path == window.currentroute.path;
		if (tsdiff > 3000 || !issameroute) {
			window.currentroute = currentroute
		}
		else {
			return;
		}
		$.each(routes, function (route, callback) {
			var routeMatcher	= new RegExp(route.replace(/:[name]+/g, '([\\a-z0-9-.]+)').replace(/:[id]+/g, '([\\d]+)')),
				match           = path.match(routeMatcher);
			if ((match && match != '/') || (match == '/' && path == '/')) {
				$('#drop-target-label').text('your library')
				callback(match);
				showSpinner();
				$.publish('view-gets-loaded')
				var method = prevent ? 'replaceState' : 'pushState';
				history[method](null, null, path);
				$('#view').attr('data-route', path);
			}
		});
	}
};
window.onpopstate = function() {
	var pathname			= window.location.pathname;
	navigation.to(pathname, true);
}
window.currentroute = {
	path: '',
	timestamp: Date.now()
};
/*! Socket.IO.js build:0.9.11, development. Copyright(c) 2011 LearnBoost <dev@learnboost.com> MIT Licensed */

var io = ('undefined' === typeof module ? {} : module.exports);
(function() {

    /**
     * socket.io
     * Copyright(c) 2011 LearnBoost <dev@learnboost.com>
     * MIT Licensed
     */

    (function(exports, global) {

        /**
         * IO namespace.
         *
         * @namespace
         */

        var io = exports;

        /**
         * Socket.IO version
         *
         * @api public
         */

        io.version = '0.9.11';

        /**
         * Protocol implemented.
         *
         * @api public
         */

        io.protocol = 1;

        /**
         * Available transports, these will be populated with the available transports
         *
         * @api public
         */

        io.transports = [];

        /**
         * Keep track of jsonp callbacks.
         *
         * @api private
         */

        io.j = [];

        /**
         * Keep track of our io.Sockets
         *
         * @api private
         */
        io.sockets = {};


        /**
         * Manages connections to hosts.
         *
         * @param {String} uri
         * @Param {Boolean} force creation of new socket (defaults to false)
         * @api public
         */

        io.connect = function(host, details) {
            var uri = io.util.parseUri(host),
                uuri, socket;

            if (global && global.location) {
                uri.protocol = uri.protocol || global.location.protocol.slice(0, - 1);
                uri.host = uri.host || (global.document ? global.document.domain : global.location.hostname);
                uri.port = uri.port || global.location.port;
            }

            uuri = io.util.uniqueUri(uri);

            var options = {
                host: uri.host,
                secure: 'https' == uri.protocol,
                port: uri.port || ('https' == uri.protocol ? 443 : 80),
                query: uri.query || ''
            };

            io.util.merge(options, details);

            if (options['force new connection'] || !io.sockets[uuri]) {
                socket = new io.Socket(options);
            }

            if (!options['force new connection'] && socket) {
                io.sockets[uuri] = socket;
            }

            socket = socket || io.sockets[uuri];

            // if path is different from '' or /
            return socket.of(uri.path.length > 1 ? uri.path : '');
        };

    })('object' === typeof module ? module.exports : (this.io = {}), this);
    /**
     * socket.io
     * Copyright(c) 2011 LearnBoost <dev@learnboost.com>
     * MIT Licensed
     */

    (function(exports, global) {

        /**
         * Utilities namespace.
         *
         * @namespace
         */

        var util = exports.util = {};

        /**
         * Parses an URI
         *
         * @author Steven Levithan <stevenlevithan.com> (MIT license)
         * @api public
         */

        var re = /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/;

        var parts = ['source', 'protocol', 'authority', 'userInfo', 'user', 'password', 'host', 'port', 'relative', 'path', 'directory', 'file', 'query', 'anchor'];

        util.parseUri = function(str) {
            var m = re.exec(str || ''),
                uri = {}, i = 14;

            while (i--) {
                uri[parts[i]] = m[i] || '';
            }

            return uri;
        };

        /**
         * Produces a unique url that identifies a Socket.IO connection.
         *
         * @param {Object} uri
         * @api public
         */

        util.uniqueUri = function(uri) {
            var protocol = uri.protocol,
                host = uri.host,
                port = uri.port;

            if ('document' in global) {
                host = host || document.domain;
                port = port || (protocol == 'https' && document.location.protocol !== 'https:' ? 443 : document.location.port);
            } else {
                host = host || 'localhost';

                if (!port && protocol == 'https') {
                    port = 443;
                }
            }

            return (protocol || 'http') + '://' + host + ':' + (port || 80);
        };

        /**
         * Mergest 2 query strings in to once unique query string
         *
         * @param {String} base
         * @param {String} addition
         * @api public
         */

        util.query = function(base, addition) {
            var query = util.chunkQuery(base || ''),
                components = [];

            util.merge(query, util.chunkQuery(addition || ''));
            for (var part in query) {
                if (query.hasOwnProperty(part)) {
                    components.push(part + '=' + query[part]);
                }
            }

            return components.length ? '?' + components.join('&') : '';
        };

        /**
         * Transforms a querystring in to an object
         *
         * @param {String} qs
         * @api public
         */

        util.chunkQuery = function(qs) {
            var query = {}, params = qs.split('&'),
                i = 0,
                l = params.length,
                kv;

            for (; i < l; ++i) {
                kv = params[i].split('=');
                if (kv[0]) {
                    query[kv[0]] = kv[1];
                }
            }

            return query;
        };

        /**
         * Executes the given function when the page is loaded.
         *
         *     io.util.load(function () { console.log('page loaded'); });
         *
         * @param {Function} fn
         * @api public
         */

        var pageLoaded = false;

        util.load = function(fn) {
            if ('document' in global && document.readyState === 'complete' || pageLoaded) {
                return fn();
            }

            util.on(global, 'load', fn, false);
        };

        /**
         * Adds an event.
         *
         * @api private
         */

        util.on = function(element, event, fn, capture) {
            if (element.attachEvent) {
                element.attachEvent('on' + event, fn);
            } else if (element.addEventListener) {
                element.addEventListener(event, fn, capture);
            }
        };

        /**
         * Generates the correct `XMLHttpRequest` for regular and cross domain requests.
         *
         * @param {Boolean} [xdomain] Create a request that can be used cross domain.
         * @returns {XMLHttpRequest|false} If we can create a XMLHttpRequest.
         * @api private
         */

        util.request = function(xdomain) {

            if (xdomain && 'undefined' != typeof XDomainRequest && !util.ua.hasCORS) {
                return new XDomainRequest();
            }

            if ('undefined' != typeof XMLHttpRequest && (!xdomain || util.ua.hasCORS)) {
                return new XMLHttpRequest();
            }

            if (!xdomain) {
                try {
                    return new window[(['Active'].concat('Object').join('X'))]('Microsoft.XMLHTTP');
                } catch (e) {}
            }

            return null;
        };

        /**
         * XHR based transport constructor.
         *
         * @constructor
         * @api public
         */

        /**
         * Change the internal pageLoaded value.
         */

        if ('undefined' != typeof window) {
            util.load(function() {
                pageLoaded = true;
            });
        }

        /**
         * Defers a function to ensure a spinner is not displayed by the browser
         *
         * @param {Function} fn
         * @api public
         */

        util.defer = function(fn) {
            if (!util.ua.webkit || 'undefined' != typeof importScripts) {
                return fn();
            }

            util.load(function() {
                setTimeout(fn, 100);
            });
        };

        /**
         * Merges two objects.
         *
         * @api public
         */

        util.merge = function merge(target, additional, deep, lastseen) {
            var seen = lastseen || [],
                depth = typeof deep == 'undefined' ? 2 : deep,
                prop;

            for (prop in additional) {
                if (additional.hasOwnProperty(prop) && util.indexOf(seen, prop) < 0) {
                    if (typeof target[prop] !== 'object' || !depth) {
                        target[prop] = additional[prop];
                        seen.push(additional[prop]);
                    } else {
                        util.merge(target[prop], additional[prop], depth - 1, seen);
                    }
                }
            }

            return target;
        };

        /**
         * Merges prototypes from objects
         *
         * @api public
         */

        util.mixin = function(ctor, ctor2) {
            util.merge(ctor.prototype, ctor2.prototype);
        };

        /**
         * Shortcut for prototypical and static inheritance.
         *
         * @api private
         */

        util.inherit = function(ctor, ctor2) {
            function f() {};
            f.prototype = ctor2.prototype;
            ctor.prototype = new f;
        };

        /**
         * Checks if the given object is an Array.
         *
         *     io.util.isArray([]); // true
         *     io.util.isArray({}); // false
         *
         * @param Object obj
         * @api public
         */

        util.isArray = Array.isArray || function(obj) {
            return Object.prototype.toString.call(obj) === '[object Array]';
        };

        /**
         * Intersects values of two arrays into a third
         *
         * @api public
         */

        util.intersect = function(arr, arr2) {
            var ret = [],
                longest = arr.length > arr2.length ? arr : arr2,
                shortest = arr.length > arr2.length ? arr2 : arr;

            for (var i = 0, l = shortest.length; i < l; i++) {
                if (~util.indexOf(longest, shortest[i])) ret.push(shortest[i]);
            }

            return ret;
        };

        /**
         * Array indexOf compatibility.
         *
         * @see bit.ly/a5Dxa2
         * @api public
         */

        util.indexOf = function(arr, o, i) {

            for (var j = arr.length, i = i < 0 ? i + j < 0 ? 0 : i + j : i || 0;
            i < j && arr[i] !== o; i++) {}

            return j <= i ? -1 : i;
        };

        /**
         * Converts enumerables to array.
         *
         * @api public
         */

        util.toArray = function(enu) {
            var arr = [];

            for (var i = 0, l = enu.length; i < l; i++)
            arr.push(enu[i]);

            return arr;
        };

        /**
         * UA / engines detection namespace.
         *
         * @namespace
         */

        util.ua = {};

        /**
         * Whether the UA supports CORS for XHR.
         *
         * @api public
         */

        util.ua.hasCORS = 'undefined' != typeof XMLHttpRequest && (function() {
            try {
                var a = new XMLHttpRequest();
            } catch (e) {
                return false;
            }

            return a.withCredentials != undefined;
        })();

        /**
         * Detect webkit.
         *
         * @api public
         */

        util.ua.webkit = 'undefined' != typeof navigator && /webkit/i.test(navigator.userAgent);

        /**
         * Detect iPad/iPhone/iPod.
         *
         * @api public
         */

        util.ua.iDevice = 'undefined' != typeof navigator && /iPad|iPhone|iPod/i.test(navigator.userAgent);

    })('undefined' != typeof io ? io : module.exports, this);
    /**
     * socket.io
     * Copyright(c) 2011 LearnBoost <dev@learnboost.com>
     * MIT Licensed
     */

    (function(exports, io) {

        /**
         * Expose constructor.
         */

        exports.EventEmitter = EventEmitter;

        /**
         * Event emitter constructor.
         *
         * @api public.
         */

        function EventEmitter() {};

        /**
         * Adds a listener
         *
         * @api public
         */

        EventEmitter.prototype.on = function(name, fn) {
            if (!this.$events) {
                this.$events = {};
            }

            if (!this.$events[name]) {
                this.$events[name] = fn;
            } else if (io.util.isArray(this.$events[name])) {
                this.$events[name].push(fn);
            } else {
                this.$events[name] = [this.$events[name], fn];
            }

            return this;
        };

        EventEmitter.prototype.addListener = EventEmitter.prototype.on;

        /**
         * Adds a volatile listener.
         *
         * @api public
         */

        EventEmitter.prototype.once = function(name, fn) {
            var self = this;

            function on() {
                self.removeListener(name, on);
                fn.apply(this, arguments);
            };

            on.listener = fn;
            this.on(name, on);

            return this;
        };

        /**
         * Removes a listener.
         *
         * @api public
         */

        EventEmitter.prototype.removeListener = function(name, fn) {
            if (this.$events && this.$events[name]) {
                var list = this.$events[name];

                if (io.util.isArray(list)) {
                    var pos = -1;

                    for (var i = 0, l = list.length; i < l; i++) {
                        if (list[i] === fn || (list[i].listener && list[i].listener === fn)) {
                            pos = i;
                            break;
                        }
                    }

                    if (pos < 0) {
                        return this;
                    }

                    list.splice(pos, 1);

                    if (!list.length) {
                        delete this.$events[name];
                    }
                } else if (list === fn || (list.listener && list.listener === fn)) {
                    delete this.$events[name];
                }
            }

            return this;
        };

        /**
         * Removes all listeners for an event.
         *
         * @api public
         */

        EventEmitter.prototype.removeAllListeners = function(name) {
            if (name === undefined) {
                this.$events = {};
                return this;
            }

            if (this.$events && this.$events[name]) {
                this.$events[name] = null;
            }

            return this;
        };

        /**
         * Gets all listeners for a certain event.
         *
         * @api publci
         */

        EventEmitter.prototype.listeners = function(name) {
            if (!this.$events) {
                this.$events = {};
            }

            if (!this.$events[name]) {
                this.$events[name] = [];
            }

            if (!io.util.isArray(this.$events[name])) {
                this.$events[name] = [this.$events[name]];
            }

            return this.$events[name];
        };

        /**
         * Emits an event.
         *
         * @api public
         */

        EventEmitter.prototype.emit = function(name) {
            if (!this.$events) {
                return false;
            }

            var handler = this.$events[name];

            if (!handler) {
                return false;
            }

            var args = Array.prototype.slice.call(arguments, 1);

            if ('function' == typeof handler) {
                handler.apply(this, args);
            } else if (io.util.isArray(handler)) {
                var listeners = handler.slice();

                for (var i = 0, l = listeners.length; i < l; i++) {
                    listeners[i].apply(this, args);
                }
            } else {
                return false;
            }

            return true;
        };

    })('undefined' != typeof io ? io : module.exports, 'undefined' != typeof io ? io : module.parent.exports);

    /**
     * socket.io
     * Copyright(c) 2011 LearnBoost <dev@learnboost.com>
     * MIT Licensed
     */

    /**
     * Based on JSON2 (http://www.JSON.org/js.html).
     */

    (function(exports, nativeJSON) {
        "use strict";

        // use native JSON if it's available
        if (nativeJSON && nativeJSON.parse) {
            return exports.JSON = {
                parse: nativeJSON.parse,
                stringify: nativeJSON.stringify
            };
        }

        var JSON = exports.JSON = {};

        function f(n) {
            // Format integers to have at least two digits.
            return n < 10 ? '0' + n : n;
        }

        function date(d, key) {
            return isFinite(d.valueOf()) ? d.getUTCFullYear() + '-' + f(d.getUTCMonth() + 1) + '-' + f(d.getUTCDate()) + 'T' + f(d.getUTCHours()) + ':' + f(d.getUTCMinutes()) + ':' + f(d.getUTCSeconds()) + 'Z' : null;
        };

        var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
            escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
            gap,
            indent,
            meta = { // table of character substitutions
                '\b': '\\b',
                '\t': '\\t',
                '\n': '\\n',
                '\f': '\\f',
                '\r': '\\r',
                '"': '\\"',
                '\\': '\\\\'
            },
            rep;


        function quote(string) {

            // If the string contains no control characters, no quote characters, and no
            // backslash characters, then we can safely slap some quotes around it.
            // Otherwise we must also replace the offending characters with safe escape
            // sequences.

            escapable.lastIndex = 0;
            return escapable.test(string) ? '"' + string.replace(escapable, function(a) {
                var c = meta[a];
                return typeof c === 'string' ? c : '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
            }) + '"' : '"' + string + '"';
        }


        function str(key, holder) {

            // Produce a string from holder[key].

            var i, // The loop counter.
            k, // The member key.
            v, // The member value.
            length,
            mind = gap,
                partial,
                value = holder[key];

            // If the value has a toJSON method, call it to obtain a replacement value.

            if (value instanceof Date) {
                value = date(key);
            }

            // If we were called with a replacer function, then call the replacer to
            // obtain a replacement value.

            if (typeof rep === 'function') {
                value = rep.call(holder, key, value);
            }

            // What happens next depends on the value's type.

            switch (typeof value) {
                case 'string':
                    return quote(value);

                case 'number':

                    // JSON numbers must be finite. Encode non-finite numbers as null.

                    return isFinite(value) ? String(value) : 'null';

                case 'boolean':
                case 'null':

                    // If the value is a boolean or null, convert it to a string. Note:
                    // typeof null does not produce 'null'. The case is included here in
                    // the remote chance that this gets fixed someday.

                    return String(value);

                    // If the type is 'object', we might be dealing with an object or an array or
                    // null.

                case 'object':

                    // Due to a specification blunder in ECMAScript, typeof null is 'object',
                    // so watch out for that case.

                    if (!value) {
                        return 'null';
                    }

                    // Make an array to hold the partial results of stringifying this object value.

                    gap += indent;
                    partial = [];

                    // Is the value an array?

                    if (Object.prototype.toString.apply(value) === '[object Array]') {

                        // The value is an array. Stringify every element. Use null as a placeholder
                        // for non-JSON values.

                        length = value.length;
                        for (i = 0; i < length; i += 1) {
                            partial[i] = str(i, value) || 'null';
                        }

                        // Join all of the elements together, separated with commas, and wrap them in
                        // brackets.

                        v = partial.length === 0 ? '[]' : gap ? '[\n' + gap + partial.join(',\n' + gap) + '\n' + mind + ']' : '[' + partial.join(',') + ']';
                        gap = mind;
                        return v;
                    }

                    // If the replacer is an array, use it to select the members to be stringified.

                    if (rep && typeof rep === 'object') {
                        length = rep.length;
                        for (i = 0; i < length; i += 1) {
                            if (typeof rep[i] === 'string') {
                                k = rep[i];
                                v = str(k, value);
                                if (v) {
                                    partial.push(quote(k) + (gap ? ': ' : ':') + v);
                                }
                            }
                        }
                    } else {

                        // Otherwise, iterate through all of the keys in the object.

                        for (k in value) {
                            if (Object.prototype.hasOwnProperty.call(value, k)) {
                                v = str(k, value);
                                if (v) {
                                    partial.push(quote(k) + (gap ? ': ' : ':') + v);
                                }
                            }
                        }
                    }

                    // Join all of the member texts together, separated with commas,
                    // and wrap them in braces.

                    v = partial.length === 0 ? '{}' : gap ? '{\n' + gap + partial.join(',\n' + gap) + '\n' + mind + '}' : '{' + partial.join(',') + '}';
                    gap = mind;
                    return v;
            }
        }

        // If the JSON object does not yet have a stringify method, give it one.

        JSON.stringify = function(value, replacer, space) {

            // The stringify method takes a value and an optional replacer, and an optional
            // space parameter, and returns a JSON text. The replacer can be a function
            // that can replace values, or an array of strings that will select the keys.
            // A default replacer method can be provided. Use of the space parameter can
            // produce text that is more easily readable.

            var i;
            gap = '';
            indent = '';

            // If the space parameter is a number, make an indent string containing that
            // many spaces.

            if (typeof space === 'number') {
                for (i = 0; i < space; i += 1) {
                    indent += ' ';
                }

                // If the space parameter is a string, it will be used as the indent string.

            } else if (typeof space === 'string') {
                indent = space;
            }

            // If there is a replacer, it must be a function or an array.
            // Otherwise, throw an error.

            rep = replacer;
            if (replacer && typeof replacer !== 'function' && (typeof replacer !== 'object' || typeof replacer.length !== 'number')) {
                throw new Error('JSON.stringify');
            }

            // Make a fake root object containing our value under the key of ''.
            // Return the result of stringifying the value.

            return str('', {
                '': value
            });
        };

        // If the JSON object does not yet have a parse method, give it one.

        JSON.parse = function(text, reviver) {
            // The parse method takes a text and an optional reviver function, and returns
            // a JavaScript value if the text is a valid JSON text.

            var j;

            function walk(holder, key) {

                // The walk method is used to recursively walk the resulting structure so
                // that modifications can be made.

                var k, v, value = holder[key];
                if (value && typeof value === 'object') {
                    for (k in value) {
                        if (Object.prototype.hasOwnProperty.call(value, k)) {
                            v = walk(value, k);
                            if (v !== undefined) {
                                value[k] = v;
                            } else {
                                delete value[k];
                            }
                        }
                    }
                }
                return reviver.call(holder, key, value);
            }


            // Parsing happens in four stages. In the first stage, we replace certain
            // Unicode characters with escape sequences. JavaScript handles many characters
            // incorrectly, either silently deleting them, or treating them as line endings.

            text = String(text);
            cx.lastIndex = 0;
            if (cx.test(text)) {
                text = text.replace(cx, function(a) {
                    return '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
                });
            }

            // In the second stage, we run the text against regular expressions that look
            // for non-JSON patterns. We are especially concerned with '()' and 'new'
            // because they can cause invocation, and '=' because it can cause mutation.
            // But just to be safe, we want to reject all unexpected forms.

            // We split the second stage into 4 regexp operations in order to work around
            // crippling inefficiencies in IE's and Safari's regexp engines. First we
            // replace the JSON backslash pairs with '@' (a non-JSON character). Second, we
            // replace all simple value tokens with ']' characters. Third, we delete all
            // open brackets that follow a colon or comma or that begin the text. Finally,
            // we look to see that the remaining characters are only whitespace or ']' or
            // ',' or ':' or '{' or '}'. If that is so, then the text is safe for eval.

            if (/^[\],:{}\s]*$/.test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@')
                .replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']')
                .replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {

                // In the third stage we use the eval function to compile the text into a
                // JavaScript structure. The '{' operator is subject to a syntactic ambiguity
                // in JavaScript: it can begin a block or an object literal. We wrap the text
                // in parens to eliminate the ambiguity.

                j = eval('(' + text + ')');

                // In the optional fourth stage, we recursively walk the new structure, passing
                // each name/value pair to a reviver function for possible transformation.

                return typeof reviver === 'function' ? walk({
                    '': j
                }, '') : j;
            }

            // If the text is not JSON parseable, then a SyntaxError is thrown.

            throw new SyntaxError('JSON.parse');
        };

    })('undefined' != typeof io ? io : module.exports, typeof JSON !== 'undefined' ? JSON : undefined);

    /**
     * socket.io
     * Copyright(c) 2011 LearnBoost <dev@learnboost.com>
     * MIT Licensed
     */

    (function(exports, io) {

        /**
         * Parser namespace.
         *
         * @namespace
         */

        var parser = exports.parser = {};

        /**
         * Packet types.
         */

        var packets = parser.packets = ['disconnect', 'connect', 'heartbeat', 'message', 'json', 'event', 'ack', 'error', 'noop'];

        /**
         * Errors reasons.
         */

        var reasons = parser.reasons = ['transport not supported', 'client not handshaken', 'unauthorized'];

        /**
         * Errors advice.
         */

        var advice = parser.advice = ['reconnect'];

        /**
         * Shortcuts.
         */

        var JSON = io.JSON,
            indexOf = io.util.indexOf;

        /**
         * Encodes a packet.
         *
         * @api private
         */

        parser.encodePacket = function(packet) {
            var type = indexOf(packets, packet.type),
                id = packet.id || '',
                endpoint = packet.endpoint || '',
                ack = packet.ack,
                data = null;

            switch (packet.type) {
                case 'error':
                    var reason = packet.reason ? indexOf(reasons, packet.reason) : '',
                        adv = packet.advice ? indexOf(advice, packet.advice) : '';

                    if (reason !== '' || adv !== '') data = reason + (adv !== '' ? ('+' + adv) : '');

                    break;

                case 'message':
                    if (packet.data !== '') data = packet.data;
                    break;

                case 'event':
                    var ev = {
                        name: packet.name
                    };

                    if (packet.args && packet.args.length) {
                        ev.args = packet.args;
                    }

                    data = JSON.stringify(ev);
                    break;

                case 'json':
                    data = JSON.stringify(packet.data);
                    break;

                case 'connect':
                    if (packet.qs) data = packet.qs;
                    break;

                case 'ack':
                    data = packet.ackId + (packet.args && packet.args.length ? '+' + JSON.stringify(packet.args) : '');
                    break;
            }

            // construct packet with required fragments
            var encoded = [
            type, id + (ack == 'data' ? '+' : ''), endpoint];

            // data fragment is optional
            if (data !== null && data !== undefined) encoded.push(data);

            return encoded.join(':');
        };

        /**
         * Encodes multiple messages (payload).
         *
         * @param {Array} messages
         * @api private
         */

        parser.encodePayload = function(packets) {
            var decoded = '';

            if (packets.length == 1) return packets[0];

            for (var i = 0, l = packets.length; i < l; i++) {
                var packet = packets[i];
                decoded += '\ufffd' + packet.length + '\ufffd' + packets[i];
            }

            return decoded;
        };

        /**
         * Decodes a packet
         *
         * @api private
         */

        var regexp = /([^:]+):([0-9]+)?(\+)?:([^:]+)?:?([\s\S]*)?/;

        parser.decodePacket = function(data) {
            var pieces = data.match(regexp);

            if (!pieces) return {};

            var id = pieces[2] || '',
                data = pieces[5] || '',
                packet = {
                    type: packets[pieces[1]],
                    endpoint: pieces[4] || ''
                };

            // whether we need to acknowledge the packet
            if (id) {
                packet.id = id;
                if (pieces[3]) packet.ack = 'data';
                else packet.ack = true;
            }

            // handle different packet types
            switch (packet.type) {
                case 'error':
                    var pieces = data.split('+');
                    packet.reason = reasons[pieces[0]] || '';
                    packet.advice = advice[pieces[1]] || '';
                    break;

                case 'message':
                    packet.data = data || '';
                    break;

                case 'event':
                    try {
                        var opts = JSON.parse(data);
                        packet.name = opts.name;
                        packet.args = opts.args;
                    } catch (e) {}

                    packet.args = packet.args || [];
                    break;

                case 'json':
                    try {
                        packet.data = JSON.parse(data);
                    } catch (e) {}
                    break;

                case 'connect':
                    packet.qs = data || '';
                    break;

                case 'ack':
                    var pieces = data.match(/^([0-9]+)(\+)?(.*)/);
                    if (pieces) {
                        packet.ackId = pieces[1];
                        packet.args = [];

                        if (pieces[3]) {
                            try {
                                packet.args = pieces[3] ? JSON.parse(pieces[3]) : [];
                            } catch (e) {}
                        }
                    }
                    break;

                case 'disconnect':
                case 'heartbeat':
                    break;
            };

            return packet;
        };

        /**
         * Decodes data payload. Detects multiple messages
         *
         * @return {Array} messages
         * @api public
         */

        parser.decodePayload = function(data) {
            // IE doesn't like data[i] for unicode chars, charAt works fine
            if (data.charAt(0) == '\ufffd') {
                var ret = [];

                for (var i = 1, length = ''; i < data.length; i++) {
                    if (data.charAt(i) == '\ufffd') {
                        ret.push(parser.decodePacket(data.substr(i + 1).substr(0, length)));
                        i += Number(length) + 1;
                        length = '';
                    } else {
                        length += data.charAt(i);
                    }
                }

                return ret;
            } else {
                return [parser.decodePacket(data)];
            }
        };

    })('undefined' != typeof io ? io : module.exports, 'undefined' != typeof io ? io : module.parent.exports);
    /**
     * socket.io
     * Copyright(c) 2011 LearnBoost <dev@learnboost.com>
     * MIT Licensed
     */

    (function(exports, io) {

        /**
         * Expose constructor.
         */

        exports.Transport = Transport;

        /**
         * This is the transport template for all supported transport methods.
         *
         * @constructor
         * @api public
         */

        function Transport(socket, sessid) {
            this.socket = socket;
            this.sessid = sessid;
        };

        /**
         * Apply EventEmitter mixin.
         */

        io.util.mixin(Transport, io.EventEmitter);


        /**
         * Indicates whether heartbeats is enabled for this transport
         *
         * @api private
         */

        Transport.prototype.heartbeats = function() {
            return true;
        };

        /**
         * Handles the response from the server. When a new response is received
         * it will automatically update the timeout, decode the message and
         * forwards the response to the onMessage function for further processing.
         *
         * @param {String} data Response from the server.
         * @api private
         */

        Transport.prototype.onData = function(data) {
            this.clearCloseTimeout();

            // If the connection in currently open (or in a reopening state) reset the close
            // timeout since we have just received data. This check is necessary so
            // that we don't reset the timeout on an explicitly disconnected connection.
            if (this.socket.connected || this.socket.connecting || this.socket.reconnecting) {
                this.setCloseTimeout();
            }

            if (data !== '') {
                // todo: we should only do decodePayload for xhr transports
                var msgs = io.parser.decodePayload(data);

                if (msgs && msgs.length) {
                    for (var i = 0, l = msgs.length; i < l; i++) {
                        this.onPacket(msgs[i]);
                    }
                }
            }

            return this;
        };

        /**
         * Handles packets.
         *
         * @api private
         */

        Transport.prototype.onPacket = function(packet) {
            this.socket.setHeartbeatTimeout();

            if (packet.type == 'heartbeat') {
                return this.onHeartbeat();
            }

            if (packet.type == 'connect' && packet.endpoint == '') {
                this.onConnect();
            }

            if (packet.type == 'error' && packet.advice == 'reconnect') {
                this.isOpen = false;
            }

            this.socket.onPacket(packet);

            return this;
        };

        /**
         * Sets close timeout
         *
         * @api private
         */

        Transport.prototype.setCloseTimeout = function() {
            if (!this.closeTimeout) {
                var self = this;

                this.closeTimeout = setTimeout(function() {
                    self.onDisconnect();
                }, this.socket.closeTimeout);
            }
        };

        /**
         * Called when transport disconnects.
         *
         * @api private
         */

        Transport.prototype.onDisconnect = function() {
            if (this.isOpen) this.close();
            this.clearTimeouts();
            this.socket.onDisconnect();
            return this;
        };

        /**
         * Called when transport connects
         *
         * @api private
         */

        Transport.prototype.onConnect = function() {
            this.socket.onConnect();
            return this;
        };

        /**
         * Clears close timeout
         *
         * @api private
         */

        Transport.prototype.clearCloseTimeout = function() {
            if (this.closeTimeout) {
                clearTimeout(this.closeTimeout);
                this.closeTimeout = null;
            }
        };

        /**
         * Clear timeouts
         *
         * @api private
         */

        Transport.prototype.clearTimeouts = function() {
            this.clearCloseTimeout();

            if (this.reopenTimeout) {
                clearTimeout(this.reopenTimeout);
            }
        };

        /**
         * Sends a packet
         *
         * @param {Object} packet object.
         * @api private
         */

        Transport.prototype.packet = function(packet) {
            this.send(io.parser.encodePacket(packet));
        };

        /**
         * Send the received heartbeat message back to server. So the server
         * knows we are still connected.
         *
         * @param {String} heartbeat Heartbeat response from the server.
         * @api private
         */

        Transport.prototype.onHeartbeat = function(heartbeat) {
            this.packet({
                type: 'heartbeat'
            });
        };

        /**
         * Called when the transport opens.
         *
         * @api private
         */

        Transport.prototype.onOpen = function() {
            this.isOpen = true;
            this.clearCloseTimeout();
            this.socket.onOpen();
        };

        /**
         * Notifies the base when the connection with the Socket.IO server
         * has been disconnected.
         *
         * @api private
         */

        Transport.prototype.onClose = function() {
            var self = this;

            /* FIXME: reopen delay causing a infinit loop
    this.reopenTimeout = setTimeout(function () {
      self.open();
    }, this.socket.options['reopen delay']);*/

            this.isOpen = false;
            this.socket.onClose();
            this.onDisconnect();
        };

        /**
         * Generates a connection url based on the Socket.IO URL Protocol.
         * See <https://github.com/learnboost/socket.io-node/> for more details.
         *
         * @returns {String} Connection url
         * @api private
         */

        Transport.prototype.prepareUrl = function() {
            var options = this.socket.options;

            return this.scheme() + '://' + options.host + ':' + options.port + '/' + options.resource + '/' + io.protocol + '/' + this.name + '/' + this.sessid;
        };

        /**
         * Checks if the transport is ready to start a connection.
         *
         * @param {Socket} socket The socket instance that needs a transport
         * @param {Function} fn The callback
         * @api private
         */

        Transport.prototype.ready = function(socket, fn) {
            fn.call(this);
        };
    })('undefined' != typeof io ? io : module.exports, 'undefined' != typeof io ? io : module.parent.exports);
    /**
     * socket.io
     * Copyright(c) 2011 LearnBoost <dev@learnboost.com>
     * MIT Licensed
     */

    (function(exports, io, global) {

        /**
         * Expose constructor.
         */

        exports.Socket = Socket;

        /**
         * Create a new `Socket.IO client` which can establish a persistent
         * connection with a Socket.IO enabled server.
         *
         * @api public
         */

        function Socket(options) {
            this.options = {
                port: 80,
                secure: false,
                document: 'document' in global ? document : false,
                resource: 'socket.io',
                transports: io.transports,
                'connect timeout': 10000,
                'try multiple transports': true,
                'reconnect': true,
                'reconnection delay': 500,
                'reconnection limit': Infinity,
                'reopen delay': 3000,
                'max reconnection attempts': 10,
                'sync disconnect on unload': false,
                'auto connect': true,
                'flash policy port': 10843,
                'manualFlush': false
            };

            io.util.merge(this.options, options);

            this.connected = false;
            this.open = false;
            this.connecting = false;
            this.reconnecting = false;
            this.namespaces = {};
            this.buffer = [];
            this.doBuffer = false;

            if (this.options['sync disconnect on unload'] && (!this.isXDomain() || io.util.ua.hasCORS)) {
                var self = this;
                io.util.on(global, 'beforeunload', function() {
                    self.disconnectSync();
                }, false);
            }

            if (this.options['auto connect']) {
                this.connect();
            }
        };

        /**
         * Apply EventEmitter mixin.
         */

        io.util.mixin(Socket, io.EventEmitter);

        /**
         * Returns a namespace listener/emitter for this socket
         *
         * @api public
         */

        Socket.prototype.of = function(name) {
            if (!this.namespaces[name]) {
                this.namespaces[name] = new io.SocketNamespace(this, name);

                if (name !== '') {
                    this.namespaces[name].packet({
                        type: 'connect'
                    });
                }
            }

            return this.namespaces[name];
        };

        /**
         * Emits the given event to the Socket and all namespaces
         *
         * @api private
         */

        Socket.prototype.publish = function() {
            this.emit.apply(this, arguments);

            var nsp;

            for (var i in this.namespaces) {
                if (this.namespaces.hasOwnProperty(i)) {
                    nsp = this.of(i);
                    nsp.$emit.apply(nsp, arguments);
                }
            }
        };

        /**
         * Performs the handshake
         *
         * @api private
         */

        function empty() {};

        Socket.prototype.handshake = function(fn) {
            var self = this,
                options = this.options;

            function complete(data) {
                if (data instanceof Error) {
                    self.connecting = false;
                    self.onError(data.message);
                } else {
                    fn.apply(null, data.split(':'));
                }
            };

            var url = ['http' + (options.secure ? 's' : '') + ':/', options.host + ':' + options.port, options.resource, io.protocol, io.util.query(this.options.query, 't=' + +new Date)].join('/');

            if (this.isXDomain() && !io.util.ua.hasCORS) {
                var insertAt = document.getElementsByTagName('script')[0],
                    script = document.createElement('script');

                script.src = url + '&jsonp=' + io.j.length;
                insertAt.parentNode.insertBefore(script, insertAt);

                io.j.push(function(data) {
                    complete(data);
                    script.parentNode.removeChild(script);
                });
            } else {
                var xhr = io.util.request();

                xhr.open('GET', url, true);
                if (this.isXDomain()) {
                    xhr.withCredentials = true;
                }
                xhr.onreadystatechange = function() {
                    if (xhr.readyState == 4) {
                        xhr.onreadystatechange = empty;

                        if (xhr.status == 200) {
                            complete(xhr.responseText);
                        } else if (xhr.status == 403) {
                            self.onError(xhr.responseText);
                        } else {
                            self.connecting = false;
                            !self.reconnecting && self.onError(xhr.responseText);
                        }
                    }
                };
                xhr.send(null);
            }
        };

        /**
         * Find an available transport based on the options supplied in the constructor.
         *
         * @api private
         */

        Socket.prototype.getTransport = function(override) {
            var transports = override || this.transports,
                match;

            for (var i = 0, transport; transport = transports[i]; i++) {
                if (io.Transport[transport] && io.Transport[transport].check(this) && (!this.isXDomain() || io.Transport[transport].xdomainCheck(this))) {
                    return new io.Transport[transport](this, this.sessionid);
                }
            }

            return null;
        };

        /**
         * Connects to the server.
         *
         * @param {Function} [fn] Callback.
         * @returns {io.Socket}
         * @api public
         */

        Socket.prototype.connect = function(fn) {
            if (this.connecting) {
                return this;
            }

            var self = this;
            self.connecting = true;

            this.handshake(function(sid, heartbeat, close, transports) {
                self.sessionid = sid;
                self.closeTimeout = close * 1000;
                self.heartbeatTimeout = heartbeat * 1000;
                if (!self.transports) self.transports = self.origTransports = (transports ? io.util.intersect(
                transports.split(','), self.options.transports) : self.options.transports);

                self.setHeartbeatTimeout();

                function connect(transports) {
                    if (self.transport) self.transport.clearTimeouts();

                    self.transport = self.getTransport(transports);
                    if (!self.transport) return self.publish('connect_failed');

                    // once the transport is ready
                    self.transport.ready(self, function() {
                        self.connecting = true;
                        self.publish('connecting', self.transport.name);
                        self.transport.open();

                        if (self.options['connect timeout']) {
                            self.connectTimeoutTimer = setTimeout(function() {
                                if (!self.connected) {
                                    self.connecting = false;

                                    if (self.options['try multiple transports']) {
                                        var remaining = self.transports;

                                        while (remaining.length > 0 && remaining.splice(0, 1)[0] != self.transport.name) {}

                                        if (remaining.length) {
                                            connect(remaining);
                                        } else {
                                            self.publish('connect_failed');
                                        }
                                    }
                                }
                            }, self.options['connect timeout']);
                        }
                    });
                }

                connect(self.transports);

                self.once('connect', function() {
                    clearTimeout(self.connectTimeoutTimer);

                    fn && typeof fn == 'function' && fn();
                });
            });

            return this;
        };

        /**
         * Clears and sets a new heartbeat timeout using the value given by the
         * server during the handshake.
         *
         * @api private
         */

        Socket.prototype.setHeartbeatTimeout = function() {
            clearTimeout(this.heartbeatTimeoutTimer);
            if (this.transport && !this.transport.heartbeats()) return;

            var self = this;
            this.heartbeatTimeoutTimer = setTimeout(function() {
                self.transport.onClose();
            }, this.heartbeatTimeout);
        };

        /**
         * Sends a message.
         *
         * @param {Object} data packet.
         * @returns {io.Socket}
         * @api public
         */

        Socket.prototype.packet = function(data) {
            if (this.connected && !this.doBuffer) {
                this.transport.packet(data);
            } else {
                this.buffer.push(data);
            }

            return this;
        };

        /**
         * Sets buffer state
         *
         * @api private
         */

        Socket.prototype.setBuffer = function(v) {
            this.doBuffer = v;

            if (!v && this.connected && this.buffer.length) {
                if (!this.options['manualFlush']) {
                    this.flushBuffer();
                }
            }
        };

        /**
         * Flushes the buffer data over the wire.
         * To be invoked manually when 'manualFlush' is set to true.
         *
         * @api public
         */

        Socket.prototype.flushBuffer = function() {
            this.transport.payload(this.buffer);
            this.buffer = [];
        };


        /**
         * Disconnect the established connect.
         *
         * @returns {io.Socket}
         * @api public
         */

        Socket.prototype.disconnect = function() {
            if (this.connected || this.connecting) {
                if (this.open) {
                    this.of('').packet({
                        type: 'disconnect'
                    });
                }

                // handle disconnection immediately
                this.onDisconnect('booted');
            }

            return this;
        };

        /**
         * Disconnects the socket with a sync XHR.
         *
         * @api private
         */

        Socket.prototype.disconnectSync = function() {
            // ensure disconnection
            var xhr = io.util.request();
            var uri = ['http' + (this.options.secure ? 's' : '') + ':/', this.options.host + ':' + this.options.port, this.options.resource, io.protocol, '', this.sessionid].join('/') + '/?disconnect=1';

            xhr.open('GET', uri, false);
            xhr.send(null);

            // handle disconnection immediately
            this.onDisconnect('booted');
        };

        /**
         * Check if we need to use cross domain enabled transports. Cross domain would
         * be a different port or different domain name.
         *
         * @returns {Boolean}
         * @api private
         */

        Socket.prototype.isXDomain = function() {

            var port = global.location.port || ('https:' == global.location.protocol ? 443 : 80);

            return this.options.host !== global.location.hostname || this.options.port != port;
        };

        /**
         * Called upon handshake.
         *
         * @api private
         */

        Socket.prototype.onConnect = function() {
            if (!this.connected) {
                this.connected = true;
                this.connecting = false;
                if (!this.doBuffer) {
                    // make sure to flush the buffer
                    this.setBuffer(false);
                }
                this.emit('connect');
            }
        };

        /**
         * Called when the transport opens
         *
         * @api private
         */

        Socket.prototype.onOpen = function() {
            this.open = true;
        };

        /**
         * Called when the transport closes.
         *
         * @api private
         */

        Socket.prototype.onClose = function() {
            this.open = false;
            clearTimeout(this.heartbeatTimeoutTimer);
        };

        /**
         * Called when the transport first opens a connection
         *
         * @param text
         */

        Socket.prototype.onPacket = function(packet) {
            this.of(packet.endpoint).onPacket(packet);
        };

        /**
         * Handles an error.
         *
         * @api private
         */

        Socket.prototype.onError = function(err) {
            if (err && err.advice) {
                if (err.advice === 'reconnect' && (this.connected || this.connecting)) {
                    this.disconnect();
                    if (this.options.reconnect) {
                        this.reconnect();
                    }
                }
            }

            this.publish('error', err && err.reason ? err.reason : err);
        };

        /**
         * Called when the transport disconnects.
         *
         * @api private
         */

        Socket.prototype.onDisconnect = function(reason) {
            var wasConnected = this.connected,
                wasConnecting = this.connecting;

            this.connected = false;
            this.connecting = false;
            this.open = false;

            if (wasConnected || wasConnecting) {
                this.transport.close();
                this.transport.clearTimeouts();
                if (wasConnected) {
                    this.publish('disconnect', reason);

                    if ('booted' != reason && this.options.reconnect && !this.reconnecting) {
                        this.reconnect();
                    }
                }
            }
        };

        /**
         * Called upon reconnection.
         *
         * @api private
         */

        Socket.prototype.reconnect = function() {
            this.reconnecting = true;
            this.reconnectionAttempts = 0;
            this.reconnectionDelay = this.options['reconnection delay'];

            var self = this,
                maxAttempts = this.options['max reconnection attempts'],
                tryMultiple = this.options['try multiple transports'],
                limit = this.options['reconnection limit'];

            function reset() {
                if (self.connected) {
                    for (var i in self.namespaces) {
                        if (self.namespaces.hasOwnProperty(i) && '' !== i) {
                            self.namespaces[i].packet({
                                type: 'connect'
                            });
                        }
                    }
                    self.publish('reconnect', self.transport.name, self.reconnectionAttempts);
                }

                clearTimeout(self.reconnectionTimer);

                self.removeListener('connect_failed', maybeReconnect);
                self.removeListener('connect', maybeReconnect);

                self.reconnecting = false;

                delete self.reconnectionAttempts;
                delete self.reconnectionDelay;
                delete self.reconnectionTimer;
                delete self.redoTransports;

                self.options['try multiple transports'] = tryMultiple;
            };

            function maybeReconnect() {
                if (!self.reconnecting) {
                    return;
                }

                if (self.connected) {
                    return reset();
                };

                if (self.connecting && self.reconnecting) {
                    return self.reconnectionTimer = setTimeout(maybeReconnect, 1000);
                }

                if (self.reconnectionAttempts++ >= maxAttempts) {
                    if (!self.redoTransports) {
                        self.on('connect_failed', maybeReconnect);
                        self.options['try multiple transports'] = true;
                        self.transports = self.origTransports;
                        self.transport = self.getTransport();
                        self.redoTransports = true;
                        self.connect();
                    } else {
                        self.publish('reconnect_failed');
                        reset();
                    }
                } else {
                    if (self.reconnectionDelay < limit) {
                        self.reconnectionDelay *= 2; // exponential back off
                    }

                    self.connect();
                    self.publish('reconnecting', self.reconnectionDelay, self.reconnectionAttempts);
                    self.reconnectionTimer = setTimeout(maybeReconnect, self.reconnectionDelay);
                }
            };

            this.options['try multiple transports'] = false;
            this.reconnectionTimer = setTimeout(maybeReconnect, this.reconnectionDelay);

            this.on('connect', maybeReconnect);
        };

    })('undefined' != typeof io ? io : module.exports, 'undefined' != typeof io ? io : module.parent.exports, this);
    /**
     * socket.io
     * Copyright(c) 2011 LearnBoost <dev@learnboost.com>
     * MIT Licensed
     */

    (function(exports, io) {

        /**
         * Expose constructor.
         */

        exports.SocketNamespace = SocketNamespace;

        /**
         * Socket namespace constructor.
         *
         * @constructor
         * @api public
         */

        function SocketNamespace(socket, name) {
            this.socket = socket;
            this.name = name || '';
            this.flags = {};
            this.json = new Flag(this, 'json');
            this.ackPackets = 0;
            this.acks = {};
        };

        /**
         * Apply EventEmitter mixin.
         */

        io.util.mixin(SocketNamespace, io.EventEmitter);

        /**
         * Copies emit since we override it
         *
         * @api private
         */

        SocketNamespace.prototype.$emit = io.EventEmitter.prototype.emit;

        /**
         * Creates a new namespace, by proxying the request to the socket. This
         * allows us to use the synax as we do on the server.
         *
         * @api public
         */

        SocketNamespace.prototype.of = function() {
            return this.socket.of.apply(this.socket, arguments);
        };

        /**
         * Sends a packet.
         *
         * @api private
         */

        SocketNamespace.prototype.packet = function(packet) {
            packet.endpoint = this.name;
            this.socket.packet(packet);
            this.flags = {};
            return this;
        };

        /**
         * Sends a message
         *
         * @api public
         */

        SocketNamespace.prototype.send = function(data, fn) {
            var packet = {
                type: this.flags.json ? 'json' : 'message',
                data: data
            };

            if ('function' == typeof fn) {
                packet.id = ++this.ackPackets;
                packet.ack = true;
                this.acks[packet.id] = fn;
            }

            return this.packet(packet);
        };

        /**
         * Emits an event
         *
         * @api public
         */

        SocketNamespace.prototype.emit = function(name) {
            var args = Array.prototype.slice.call(arguments, 1),
                lastArg = args[args.length - 1],
                packet = {
                    type: 'event',
                    name: name
                };

            if ('function' == typeof lastArg) {
                packet.id = ++this.ackPackets;
                packet.ack = 'data';
                this.acks[packet.id] = lastArg;
                args = args.slice(0, args.length - 1);
            }

            packet.args = args;

            return this.packet(packet);
        };

        /**
         * Disconnects the namespace
         *
         * @api private
         */

        SocketNamespace.prototype.disconnect = function() {
            if (this.name === '') {
                this.socket.disconnect();
            } else {
                this.packet({
                    type: 'disconnect'
                });
                this.$emit('disconnect');
            }

            return this;
        };

        /**
         * Handles a packet
         *
         * @api private
         */

        SocketNamespace.prototype.onPacket = function(packet) {
            var self = this;

            function ack() {
                self.packet({
                    type: 'ack',
                    args: io.util.toArray(arguments),
                    ackId: packet.id
                });
            };

            switch (packet.type) {
                case 'connect':
                    this.$emit('connect');
                    break;

                case 'disconnect':
                    if (this.name === '') {
                        this.socket.onDisconnect(packet.reason || 'booted');
                    } else {
                        this.$emit('disconnect', packet.reason);
                    }
                    break;

                case 'message':
                case 'json':
                    var params = ['message', packet.data];

                    if (packet.ack == 'data') {
                        params.push(ack);
                    } else if (packet.ack) {
                        this.packet({
                            type: 'ack',
                            ackId: packet.id
                        });
                    }

                    this.$emit.apply(this, params);
                    break;

                case 'event':
                    var params = [packet.name].concat(packet.args);

                    if (packet.ack == 'data') params.push(ack);

                    this.$emit.apply(this, params);
                    break;

                case 'ack':
                    if (this.acks[packet.ackId]) {
                        this.acks[packet.ackId].apply(this, packet.args);
                        delete this.acks[packet.ackId];
                    }
                    break;

                case 'error':
                    if (packet.advice) {
                        this.socket.onError(packet);
                    } else {
                        if (packet.reason == 'unauthorized') {
                            this.$emit('connect_failed', packet.reason);
                        } else {
                            this.$emit('error', packet.reason);
                        }
                    }
                    break;
            }
        };

        /**
         * Flag interface.
         *
         * @api private
         */

        function Flag(nsp, name) {
            this.namespace = nsp;
            this.name = name;
        };

        /**
         * Send a message
         *
         * @api public
         */

        Flag.prototype.send = function() {
            this.namespace.flags[this.name] = true;
            this.namespace.send.apply(this.namespace, arguments);
        };

        /**
         * Emit an event
         *
         * @api public
         */

        Flag.prototype.emit = function() {
            this.namespace.flags[this.name] = true;
            this.namespace.emit.apply(this.namespace, arguments);
        };

    })('undefined' != typeof io ? io : module.exports, 'undefined' != typeof io ? io : module.parent.exports);

    /**
     * socket.io
     * Copyright(c) 2011 LearnBoost <dev@learnboost.com>
     * MIT Licensed
     */

    (function(exports, io, global) {

        /**
         * Expose constructor.
         */

        exports.websocket = WS;

        /**
         * The WebSocket transport uses the HTML5 WebSocket API to establish an
         * persistent connection with the Socket.IO server. This transport will also
         * be inherited by the FlashSocket fallback as it provides a API compatible
         * polyfill for the WebSockets.
         *
         * @constructor
         * @extends {io.Transport}
         * @api public
         */

        function WS(socket) {
            io.Transport.apply(this, arguments);
        };

        /**
         * Inherits from Transport.
         */

        io.util.inherit(WS, io.Transport);

        /**
         * Transport name
         *
         * @api public
         */

        WS.prototype.name = 'websocket';

        /**
         * Initializes a new `WebSocket` connection with the Socket.IO server. We attach
         * all the appropriate listeners to handle the responses from the server.
         *
         * @returns {Transport}
         * @api public
         */

        WS.prototype.open = function() {
            var query = io.util.query(this.socket.options.query),
                self = this,
                Socket


            if (!Socket) {
                Socket = global.MozWebSocket || global.WebSocket;
            }

            this.websocket = new Socket(this.prepareUrl() + query);

            this.websocket.onopen = function() {
                self.onOpen();
                self.socket.setBuffer(false);
            };
            this.websocket.onmessage = function(ev) {
                self.onData(ev.data);
            };
            this.websocket.onclose = function() {
                self.onClose();
                self.socket.setBuffer(true);
            };
            this.websocket.onerror = function(e) {
                self.onError(e);
            };

            return this;
        };

        /**
         * Send a message to the Socket.IO server. The message will automatically be
         * encoded in the correct message format.
         *
         * @returns {Transport}
         * @api public
         */

        // Do to a bug in the current IDevices browser, we need to wrap the send in a 
        // setTimeout, when they resume from sleeping the browser will crash if 
        // we don't allow the browser time to detect the socket has been closed
        if (io.util.ua.iDevice) {
            WS.prototype.send = function(data) {
                var self = this;
                setTimeout(function() {
                    self.websocket.send(data);
                }, 0);
                return this;
            };
        } else {
            WS.prototype.send = function(data) {
                this.websocket.send(data);
                return this;
            };
        }

        /**
         * Payload
         *
         * @api private
         */

        WS.prototype.payload = function(arr) {
            for (var i = 0, l = arr.length; i < l; i++) {
                this.packet(arr[i]);
            }
            return this;
        };

        /**
         * Disconnect the established `WebSocket` connection.
         *
         * @returns {Transport}
         * @api public
         */

        WS.prototype.close = function() {
            this.websocket.close();
            return this;
        };

        /**
         * Handle the errors that `WebSocket` might be giving when we
         * are attempting to connect or send messages.
         *
         * @param {Error} e The error.
         * @api private
         */

        WS.prototype.onError = function(e) {
            this.socket.onError(e);
        };

        /**
         * Returns the appropriate scheme for the URI generation.
         *
         * @api private
         */
        WS.prototype.scheme = function() {
            return this.socket.options.secure ? 'wss' : 'ws';
        };

        /**
         * Checks if the browser has support for native `WebSockets` and that
         * it's not the polyfill created for the FlashSocket transport.
         *
         * @return {Boolean}
         * @api public
         */

        WS.check = function() {
            return ('WebSocket' in global && !('__addTask' in WebSocket)) || 'MozWebSocket' in global;
        };

        /**
         * Check if the `WebSocket` transport support cross domain communications.
         *
         * @returns {Boolean}
         * @api public
         */

        WS.xdomainCheck = function() {
            return true;
        };

        /**
         * Add the transport to your public io.transports array.
         *
         * @api private
         */

        io.transports.push('websocket');

    })('undefined' != typeof io ? io.Transport : module.exports, 'undefined' != typeof io ? io : module.parent.exports, this);

    /**
     * socket.io
     * Copyright(c) 2011 LearnBoost <dev@learnboost.com>
     * MIT Licensed
     */

    (function(exports, io, global) {

        /**
         * Expose constructor.
         *
         * @api public
         */

        exports.XHR = XHR;

        /**
         * XHR constructor
         *
         * @costructor
         * @api public
         */

        function XHR(socket) {
            if (!socket) return;

            io.Transport.apply(this, arguments);
            this.sendBuffer = [];
        };

        /**
         * Inherits from Transport.
         */

        io.util.inherit(XHR, io.Transport);

        /**
         * Establish a connection
         *
         * @returns {Transport}
         * @api public
         */

        XHR.prototype.open = function() {
            this.socket.setBuffer(false);
            this.onOpen();
            this.get();

            // we need to make sure the request succeeds since we have no indication
            // whether the request opened or not until it succeeded.
            this.setCloseTimeout();

            return this;
        };

        /**
         * Check if we need to send data to the Socket.IO server, if we have data in our
         * buffer we encode it and forward it to the `post` method.
         *
         * @api private
         */

        XHR.prototype.payload = function(payload) {
            var msgs = [];

            for (var i = 0, l = payload.length; i < l; i++) {
                msgs.push(io.parser.encodePacket(payload[i]));
            }

            this.send(io.parser.encodePayload(msgs));
        };

        /**
         * Send data to the Socket.IO server.
         *
         * @param data The message
         * @returns {Transport}
         * @api public
         */

        XHR.prototype.send = function(data) {
            this.post(data);
            return this;
        };

        /**
         * Posts a encoded message to the Socket.IO server.
         *
         * @param {String} data A encoded message.
         * @api private
         */

        function empty() {};

        XHR.prototype.post = function(data) {
            var self = this;
            this.socket.setBuffer(true);

            function stateChange() {
                if (this.readyState == 4) {
                    this.onreadystatechange = empty;
                    self.posting = false;

                    if (this.status == 200) {
                        self.socket.setBuffer(false);
                    } else {
                        self.onClose();
                    }
                }
            }

            function onload() {
                this.onload = empty;
                self.socket.setBuffer(false);
            };

            this.sendXHR = this.request('POST');

            if (global.XDomainRequest && this.sendXHR instanceof XDomainRequest) {
                this.sendXHR.onload = this.sendXHR.onerror = onload;
            } else {
                this.sendXHR.onreadystatechange = stateChange;
            }

            this.sendXHR.send(data);
        };

        /**
         * Disconnects the established `XHR` connection.
         *
         * @returns {Transport}
         * @api public
         */

        XHR.prototype.close = function() {
            this.onClose();
            return this;
        };

        /**
         * Generates a configured XHR request
         *
         * @param {String} url The url that needs to be requested.
         * @param {String} method The method the request should use.
         * @returns {XMLHttpRequest}
         * @api private
         */

        XHR.prototype.request = function(method) {
            var req = io.util.request(this.socket.isXDomain()),
                query = io.util.query(this.socket.options.query, 't=' + +new Date);

            req.open(method || 'GET', this.prepareUrl() + query, true);

            if (method == 'POST') {
                try {
                    if (req.setRequestHeader) {
                        req.setRequestHeader('Content-type', 'text/plain;charset=UTF-8');
                    } else {
                        // XDomainRequest
                        req.contentType = 'text/plain';
                    }
                } catch (e) {}
            }

            return req;
        };

        /**
         * Returns the scheme to use for the transport URLs.
         *
         * @api private
         */

        XHR.prototype.scheme = function() {
            return this.socket.options.secure ? 'https' : 'http';
        };

        /**
         * Check if the XHR transports are supported
         *
         * @param {Boolean} xdomain Check if we support cross domain requests.
         * @returns {Boolean}
         * @api public
         */

        XHR.check = function(socket, xdomain) {
            try {
                var request = io.util.request(xdomain),
                    usesXDomReq = (global.XDomainRequest && request instanceof XDomainRequest),
                    socketProtocol = (socket && socket.options && socket.options.secure ? 'https:' : 'http:'),
                    isXProtocol = (global.location && socketProtocol != global.location.protocol);
                if (request && !(usesXDomReq && isXProtocol)) {
                    return true;
                }
            } catch (e) {}

            return false;
        };

        /**
         * Check if the XHR transport supports cross domain requests.
         *
         * @returns {Boolean}
         * @api public
         */

        XHR.xdomainCheck = function(socket) {
            return XHR.check(socket, true);
        };

    })('undefined' != typeof io ? io.Transport : module.exports, 'undefined' != typeof io ? io : module.parent.exports, this);
    /**
     * socket.io
     * Copyright(c) 2011 LearnBoost <dev@learnboost.com>
     * MIT Licensed
     */

    (function(exports, io) {

        /**
         * Expose constructor.
         */

        exports.htmlfile = HTMLFile;

        /**
         * The HTMLFile transport creates a `forever iframe` based transport
         * for Internet Explorer. Regular forever iframe implementations will 
         * continuously trigger the browsers buzy indicators. If the forever iframe
         * is created inside a `htmlfile` these indicators will not be trigged.
         *
         * @constructor
         * @extends {io.Transport.XHR}
         * @api public
         */

        function HTMLFile(socket) {
            io.Transport.XHR.apply(this, arguments);
        };

        /**
         * Inherits from XHR transport.
         */

        io.util.inherit(HTMLFile, io.Transport.XHR);

        /**
         * Transport name
         *
         * @api public
         */

        HTMLFile.prototype.name = 'htmlfile';

        /**
         * Creates a new Ac...eX `htmlfile` with a forever loading iframe
         * that can be used to listen to messages. Inside the generated
         * `htmlfile` a reference will be made to the HTMLFile transport.
         *
         * @api private
         */

        HTMLFile.prototype.get = function() {
            this.doc = new window[(['Active'].concat('Object').join('X'))]('htmlfile');
            this.doc.open();
            this.doc.write('<html></html>');
            this.doc.close();
            this.doc.parentWindow.s = this;

            var iframeC = this.doc.createElement('div');
            iframeC.className = 'socketio';

            this.doc.body.appendChild(iframeC);
            this.iframe = this.doc.createElement('iframe');

            iframeC.appendChild(this.iframe);

            var self = this,
                query = io.util.query(this.socket.options.query, 't=' + +new Date);

            this.iframe.src = this.prepareUrl() + query;

            io.util.on(window, 'unload', function() {
                self.destroy();
            });
        };

        /**
         * The Socket.IO server will write script tags inside the forever
         * iframe, this function will be used as callback for the incoming
         * information.
         *
         * @param {String} data The message
         * @param {document} doc Reference to the context
         * @api private
         */

        HTMLFile.prototype._ = function(data, doc) {
            this.onData(data);
            try {
                var script = doc.getElementsByTagName('script')[0];
                script.parentNode.removeChild(script);
            } catch (e) {}
        };

        /**
         * Destroy the established connection, iframe and `htmlfile`.
         * And calls the `CollectGarbage` function of Internet Explorer
         * to release the memory.
         *
         * @api private
         */

        HTMLFile.prototype.destroy = function() {
            if (this.iframe) {
                try {
                    this.iframe.src = 'about:blank';
                } catch (e) {}

                this.doc = null;
                this.iframe.parentNode.removeChild(this.iframe);
                this.iframe = null;

                CollectGarbage();
            }
        };

        /**
         * Disconnects the established connection.
         *
         * @returns {Transport} Chaining.
         * @api public
         */

        HTMLFile.prototype.close = function() {
            this.destroy();
            return io.Transport.XHR.prototype.close.call(this);
        };

        /**
         * Checks if the browser supports this transport. The browser
         * must have an `Ac...eXObject` implementation.
         *
         * @return {Boolean}
         * @api public
         */

        HTMLFile.check = function(socket) {
            if (typeof window != "undefined" && (['Active'].concat('Object').join('X')) in window) {
                try {
                    var a = new window[(['Active'].concat('Object').join('X'))]('htmlfile');
                    return a && io.Transport.XHR.check(socket);
                } catch (e) {}
            }
            return false;
        };

        /**
         * Check if cross domain requests are supported.
         *
         * @returns {Boolean}
         * @api public
         */

        HTMLFile.xdomainCheck = function() {
            // we can probably do handling for sub-domains, we should
            // test that it's cross domain but a subdomain here
            return false;
        };

        /**
         * Add the transport to your public io.transports array.
         *
         * @api private
         */

        io.transports.push('htmlfile');

    })('undefined' != typeof io ? io.Transport : module.exports, 'undefined' != typeof io ? io : module.parent.exports);

    /**
     * socket.io
     * Copyright(c) 2011 LearnBoost <dev@learnboost.com>
     * MIT Licensed
     */

    (function(exports, io, global) {

        /**
         * Expose constructor.
         */

        exports['xhr-polling'] = XHRPolling;

        /**
         * The XHR-polling transport uses long polling XHR requests to create a
         * "persistent" connection with the server.
         *
         * @constructor
         * @api public
         */

        function XHRPolling() {
            io.Transport.XHR.apply(this, arguments);
        };

        /**
         * Inherits from XHR transport.
         */

        io.util.inherit(XHRPolling, io.Transport.XHR);

        /**
         * Merge the properties from XHR transport
         */

        io.util.merge(XHRPolling, io.Transport.XHR);

        /**
         * Transport name
         *
         * @api public
         */

        XHRPolling.prototype.name = 'xhr-polling';

        /**
         * Indicates whether heartbeats is enabled for this transport
         *
         * @api private
         */

        XHRPolling.prototype.heartbeats = function() {
            return false;
        };

        /** 
         * Establish a connection, for iPhone and Android this will be done once the page
         * is loaded.
         *
         * @returns {Transport} Chaining.
         * @api public
         */

        XHRPolling.prototype.open = function() {
            var self = this;

            io.Transport.XHR.prototype.open.call(self);
            return false;
        };

        /**
         * Starts a XHR request to wait for incoming messages.
         *
         * @api private
         */

        function empty() {};

        XHRPolling.prototype.get = function() {
            if (!this.isOpen) return;

            var self = this;

            function stateChange() {
                if (this.readyState == 4) {
                    this.onreadystatechange = empty;

                    if (this.status == 200) {
                        self.onData(this.responseText);
                        self.get();
                    } else {
                        self.onClose();
                    }
                }
            };

            function onload() {
                this.onload = empty;
                this.onerror = empty;
                self.retryCounter = 1;
                self.onData(this.responseText);
                self.get();
            };

            function onerror() {
                self.retryCounter++;
                if (!self.retryCounter || self.retryCounter > 3) {
                    self.onClose();
                } else {
                    self.get();
                }
            };

            this.xhr = this.request();

            if (global.XDomainRequest && this.xhr instanceof XDomainRequest) {
                this.xhr.onload = onload;
                this.xhr.onerror = onerror;
            } else {
                this.xhr.onreadystatechange = stateChange;
            }

            this.xhr.send(null);
        };

        /**
         * Handle the unclean close behavior.
         *
         * @api private
         */

        XHRPolling.prototype.onClose = function() {
            io.Transport.XHR.prototype.onClose.call(this);

            if (this.xhr) {
                this.xhr.onreadystatechange = this.xhr.onload = this.xhr.onerror = empty;
                try {
                    this.xhr.abort();
                } catch (e) {}
                this.xhr = null;
            }
        };

        /**
         * Webkit based browsers show a infinit spinner when you start a XHR request
         * before the browsers onload event is called so we need to defer opening of
         * the transport until the onload event is called. Wrapping the cb in our
         * defer method solve this.
         *
         * @param {Socket} socket The socket instance that needs a transport
         * @param {Function} fn The callback
         * @api private
         */

        XHRPolling.prototype.ready = function(socket, fn) {
            var self = this;

            io.util.defer(function() {
                fn.call(self);
            });
        };

        /**
         * Add the transport to your public io.transports array.
         *
         * @api private
         */

        io.transports.push('xhr-polling');

    })('undefined' != typeof io ? io.Transport : module.exports, 'undefined' != typeof io ? io : module.parent.exports, this);

    /**
     * socket.io
     * Copyright(c) 2011 LearnBoost <dev@learnboost.com>
     * MIT Licensed
     */

    (function(exports, io, global) {
        /**
         * There is a way to hide the loading indicator in Firefox. If you create and
         * remove a iframe it will stop showing the current loading indicator.
         * Unfortunately we can't feature detect that and UA sniffing is evil.
         *
         * @api private
         */

        var indicator = global.document && "MozAppearance" in global.document.documentElement.style;

        /**
         * Expose constructor.
         */

        exports['jsonp-polling'] = JSONPPolling;

        /**
         * The JSONP transport creates an persistent connection by dynamically
         * inserting a script tag in the page. This script tag will receive the
         * information of the Socket.IO server. When new information is received
         * it creates a new script tag for the new data stream.
         *
         * @constructor
         * @extends {io.Transport.xhr-polling}
         * @api public
         */

        function JSONPPolling(socket) {
            io.Transport['xhr-polling'].apply(this, arguments);

            this.index = io.j.length;

            var self = this;

            io.j.push(function(msg) {
                self._(msg);
            });
        };

        /**
         * Inherits from XHR polling transport.
         */

        io.util.inherit(JSONPPolling, io.Transport['xhr-polling']);

        /**
         * Transport name
         *
         * @api public
         */

        JSONPPolling.prototype.name = 'jsonp-polling';

        /**
         * Posts a encoded message to the Socket.IO server using an iframe.
         * The iframe is used because script tags can create POST based requests.
         * The iframe is positioned outside of the view so the user does not
         * notice it's existence.
         *
         * @param {String} data A encoded message.
         * @api private
         */

        JSONPPolling.prototype.post = function(data) {
            var self = this,
                query = io.util.query(
                this.socket.options.query, 't=' + (+new Date) + '&i=' + this.index);

            if (!this.form) {
                var form = document.createElement('form'),
                    area = document.createElement('textarea'),
                    id = this.iframeId = 'socketio_iframe_' + this.index,
                    iframe;

                form.className = 'socketio';
                form.style.position = 'absolute';
                form.style.top = '0px';
                form.style.left = '0px';
                form.style.display = 'none';
                form.target = id;
                form.method = 'POST';
                form.setAttribute('accept-charset', 'utf-8');
                area.name = 'd';
                form.appendChild(area);
                document.body.appendChild(form);

                this.form = form;
                this.area = area;
            }

            this.form.action = this.prepareUrl() + query;

            function complete() {
                initIframe();
                self.socket.setBuffer(false);
            };

            function initIframe() {
                if (self.iframe) {
                    self.form.removeChild(self.iframe);
                }

                try {
                    // ie6 dynamic iframes with target="" support (thanks Chris Lambacher)
                    iframe = document.createElement('<iframe name="' + self.iframeId + '">');
                } catch (e) {
                    iframe = document.createElement('iframe');
                    iframe.name = self.iframeId;
                }

                iframe.id = self.iframeId;

                self.form.appendChild(iframe);
                self.iframe = iframe;
            };

            initIframe();

            // we temporarily stringify until we figure out how to prevent
            // browsers from turning `\n` into `\r\n` in form inputs
            this.area.value = io.JSON.stringify(data);

            try {
                this.form.submit();
            } catch (e) {}

            if (this.iframe.attachEvent) {
                iframe.onreadystatechange = function() {
                    if (self.iframe.readyState == 'complete') {
                        complete();
                    }
                };
            } else {
                this.iframe.onload = complete;
            }

            this.socket.setBuffer(true);
        };

        /**
         * Creates a new JSONP poll that can be used to listen
         * for messages from the Socket.IO server.
         *
         * @api private
         */

        JSONPPolling.prototype.get = function() {
            var self = this,
                script = document.createElement('script'),
                query = io.util.query(
                this.socket.options.query, 't=' + (+new Date) + '&i=' + this.index);

            if (this.script) {
                this.script.parentNode.removeChild(this.script);
                this.script = null;
            }

            script.async = true;
            script.src = this.prepareUrl() + query;
            script.onerror = function() {
                self.onClose();
            };

            var insertAt = document.getElementsByTagName('script')[0];
            insertAt.parentNode.insertBefore(script, insertAt);
            this.script = script;

            if (indicator) {
                setTimeout(function() {
                    var iframe = document.createElement('iframe');
                    document.body.appendChild(iframe);
                    document.body.removeChild(iframe);
                }, 100);
            }
        };

        /**
         * Callback function for the incoming message stream from the Socket.IO server.
         *
         * @param {String} data The message
         * @api private
         */

        JSONPPolling.prototype._ = function(msg) {
            this.onData(msg);
            if (this.isOpen) {
                this.get();
            }
            return this;
        };

        /**
         * The indicator hack only works after onload
         *
         * @param {Socket} socket The socket instance that needs a transport
         * @param {Function} fn The callback
         * @api private
         */

        JSONPPolling.prototype.ready = function(socket, fn) {
            var self = this;
            if (!indicator) return fn.call(this);

            io.util.load(function() {
                fn.call(self);
            });
        };

        /**
         * Checks if browser supports this transport.
         *
         * @return {Boolean}
         * @api public
         */

        JSONPPolling.check = function() {
            return 'document' in global;
        };

        /**
         * Check if cross domain requests are supported
         *
         * @returns {Boolean}
         * @api public
         */

        JSONPPolling.xdomainCheck = function() {
            return true;
        };

        /**
         * Add the transport to your public io.transports array.
         *
         * @api private
         */

        io.transports.push('jsonp-polling');

    })('undefined' != typeof io ? io.Transport : module.exports, 'undefined' != typeof io ? io : module.parent.exports, this);

    if (typeof define === "function" && define.amd) {
        define([], function() {
            return io;
        });
    }
})(); ;notifications = {
	create: function(html) {
		/*
			Set the given HTML as content
		*/
		$('#statusbar').html(html + ' <span class="close-notification">Dismiss</span>').css('display', 'inline');
		clearTimeout(notifications.timeout);
		notifications.timeout = setTimeout(function() {
			$('#statusbar').fadeOut()
		}, 5000);
	},
	timeout: setTimeout(function() {}, 999999999)
} ;sockets = {
	/*
		This is set false, but when an connection is established, the server sends a message and it turn to true.
	*/
	connected: false
}
/*
	Connect to the Websockets server.
*/
var socket = io.connect(window.location.origin);
/*
	The server sends an initial confirmation when you are connected to socket.io. Set. sockets.connected to true.
*/
var pladdfail = function(reason) {
	$('.new-playlist-input').hide();
	var error = $('<div>', {class: 'playlist-addition-failed'}).text(reason)
	error.prependTo('.playlists-menu').delay(3000).slideUp();
}
var pladded = function(data) {
	$('.new-playlist-input').hide();
	$('.playlists-menu').prepend(data.div);
	chinchilla.playlists.push(data.playlist);
}
socket.on('connected', function() {
	sockets.connected = true;
});
socket.on('track-added', function (data) {
	notifications.create(data.notification);
	var table = $('[data-route="/library"]  .extendedtable tbody');
	if (data.position == 'top') {
		table.find('.song').eq(0).before(data.song);
	}
	else {
		table.append(data.song);
	}
	$('.song[data-id="' + $(data.song).attr('data-id') + '"]').addClass('in-library animated').removeClass('not-in-library')
});
socket.on('tracks-added', function (data) {
	var table = $('[data-route="/library"]  .extendedtable tbody');
	$.each(data.divs, function(key, song) {
		if (data.position == 'top') {
			table.find('.song').eq(0).before(song);
		}
		else {
			table.append(song);
		}
		$('.song[data-id="' + $(song).attr('data-id') + '"]').addClass('in-library animated').removeClass('not-in-library')
	});
	_.each(data.tracks, function (track) {
		chinchilla.library.push(track);
	});
	notifications.create(data.notification)
});
socket.on('tracks-removed', function (data) {
	var table = $('[data-route="/library"]  .extendedtable tbody');
	$.each(data.tracks, function (key, song) {
		var song = table.find('[data-id="' + song + '"]').remove();
	});
	notifications.create(data.notification);
	_.each(data.tracks, function (track) {
		chinchilla.library = _.without(chinchilla.library, track);
	});
});
socket.on('track-removed', function (data) {
	notifications.create(data.notification);
	var view = $('[data-route="/library"]')
	var song = view.find('[data-id="' + data.id + '"]').remove();
	chinchilla.library = _.without(chinchilla.library, data.id);
});

socket.on('playlist-added', pladded);
socket.on('playlist-renamed', pladded)

socket.on('playlist-addition-failed', pladdfail);
socket.on('playlist-renamed-failed', pladdfail);
socket.on('playlist-removed', function (data) {
	$("#sidebar [data-navigate='" + data.url + "']").remove();
});
socket.on('notification', function (data) {
	notifications.create(data.html)
});
socket.on('tracks-added-to-collection', function (data) {
	notifications.create(data.html)
});
function listChanged(data) {
	var view = $('[data-route="' + data.view + '"]')
	var table = view.find('tbody');
	var trackcountlabel = view.find('.playlist-trackcount');
	var pldurationlabel = view.find('.playlist-duration');
	var trackslabel 	= view.find('.playlist-plural-singular-tracks');
	$(trackcountlabel).text(data.trackcount);
	var newduration = parseFloat($(pldurationlabel).attr('data-duration')) + data.lengthdifference;
	$(pldurationlabel).text(helpers.parsehours(newduration)).attr('data-duration', newduration);
	$(trackslabel).text(data.trackslabel == 1 ? 'track' : 'tracks');
	return table;
}
socket.on('playlist-song-removed', function (data) {
	var table = listChanged(data);
	var trackcountlabel2 = $("[data-url='" + data.view + "']").addClass("add-song-to-playlist-button not-in-playlist").removeClass("remove-song-from-playlist-button in-playlist contains-song").find('.song-page-playlist-trackcount').text(data.trackcount);
	var view = $('[data-route="' + data.view + '"]');
	view.find('[data-id="' + data.songid + '"]').remove();
	libdom.removeSongsFromPlaylistLocal(data.view, [data.songid])
});
socket.on('playlist-song-added', function (data) {
	var table = listChanged(data);
	var trackcountlabel2 = $("[data-url='" + data.view + "']").removeClass("add-song-to-playlist-button not-in-playlist").addClass("remove-song-from-playlist-button in-playlist contains-song").find('.song-page-playlist-trackcount').text(data.trackcount);
	if (data.position == 'top' && (table.find('.song').length != 0)) {
		table.find('.song').eq(0).before(data.song);
	}
	else {
		table.append(data.song);
	}
});
socket.on('multiple-playlist-songs-added', function (data) {
	var table = listChanged(data);
 	$.each(data.divs, function (key, div) {
		if (data.position == 'top' && (table.find('.song').length != 0)) {
			table.find('.song').eq(0).before(div);
		}
		else {
			table.append(div);
		}
	});
	libdom.addSongsToPlaylistLocal(data.view, data.tracks)
	_.each(data.tracks, function (trackid) {
		$('[data-route="/song/' + trackid + '"]')
		.find("[data-url='" + data.view + "']")
			.removeClass("add-song-to-playlist-button not-in-playlist")
			.addClass("remove-song-from-playlist-button in-playlist contains-song")
			.find('.song-page-playlist-trackcount')
				.text(data.trackcount);
	});
	notifications.create(data.notification)
});

socket.on('multiple-playlist-songs-removed', function (data) {
	var table = listChanged(data);
	libdom.removeSongsFromPlaylistLocal(data.view, data.tracks)
	_.each(data.tracks, function (song) {
		table.find('[data-id="' + song + '"]').remove();
	});
	notifications.create(data.notification);
});

socket.on('/pairing/other-device-disconnected', function () {
	console.log('Mobile disconnected');
	chinchilla.paired = false;
});
socket.on('/pairing/receive-action', function(data) {
	switch (data.action) {
		case 'play':
			player.play();
			break;
		case 'pause':
			player.pause();
			break;
		case 'previous':
			player.playLast();
			break;
		case 'next':
			player.playNext();
			break;
		default:
			break;
	}
});
socket.on('/pairing/registered', function (data) {
	chinchilla.paired = data.code;
});;_.templateSettings.variable = "tmpl";
templates = {};
templates.buildLibrary = function(data) {
	var template = _.template(
		$('#template-library').html()
	)
	data.coverstack = 	_.first(
							_.pluck(data.tracks, 'image'), 
						9);
	data.showartistalbum = true;
	data.rawduration = _.reduce(data.tracks, function(a, b) { return a + parseFloat(b.duration) }, 0)
	data.duration = helpers.parsehours(data.rawduration);
	data.trackcount = data.tracks.length;
	data.tracks = _.map(data.tracks, function(song) { song.inlib = true; return song; });
	data.tracklist 	= templates.buildTrackList(data);
	return template(data);
}
templates.buildPlaylist = function(data) {
	var template = _.template(
		$('#template-playlist').html()
	)
	data.coverstack = _.first(
							_.pluck(data.tracks, 'image'),
						9);
	data.showartistalbum = true;
	data.tracklist = templates.buildTrackList(data);
	data.playlist.rawduration = _.reduce(data.tracks, function(a, b) { return a + parseFloat(b.duration) }, 0)
	data.playlist.duration = helpers.parsehours(data.playlist.rawduration);
	data.playlist.trackcount = data.tracks.length;
	return template(data);
}
templates.buildTrackList = function(data) {
	data.album = {cds: [[data.tracks]]}
	var template = _.template(
		$('#template-tracklist').html()
	)
	return template(data)
}
templates.buildSongsInList = function(tracks, flags) {
	data = {cd: tracks}
	var template = _.template(
		$('#template-song').html()
	)
	$.each(flags, function(key, val) {
		data[key] = val;
	})
	return template(data);
}
templates.buildSongContextMenu = function(data) {
	console.log(data);
	var template = _.template(
		$('#template-contextmenu').html()
	)
	return template(data);
}
templates.buildFilter 			= function() {
	var template = [
		"<div>",
			//"<input type='checkbox'>Hip Hop/Rap",
			"<p style='color: black'>Coming soon!</p>",
		"</div>"
	].join('\n')
	return template
};player = {};
player.playSong = function(song, noautoplay, nohistory) {
	var songobj = helpers.parseDOM(song);
	if ($(song).hasClass("recognized") || songobj.ytid != undefined) {
		/*
			If user has YTID replacements, f.e. when living in Germany these are generated
		*/
		songobj = videoIdReplacements(songobj);
		/*
			Send YTID to YouTube player
		*/
		if (noautoplay) {
			ytplayer.cueVideoById(songobj.ytid);
		}
		else {
			if (ytplayer.loadVideoById) {
				ytplayer.loadVideoById(songobj.ytid);
			}
			else {
				setTimeout(function() {
					player.playSong(song, noautoplay, nohistory);
				}, 250);
				
			}
			$('#seek-bar').addClass('buffering');
		}
		/*
			Add current song to localStorage
		*/
		if (!nohistory) {
			player.history.add(player.nowPlaying.get());
		}
		/*
			Add old song to history
		*/
 		player.nowPlaying.replace(songobj, noautoplay);
 		/*
			Change the title of the page
 		*/
 		$('title').text(songobj.name + ' - ' + songobj.artist);
 		/*
			If the user wants to, set the album cover as favicon
 		*/
 		if (chinchilla.settings.favicon_album) {
 			$('#favicon').attr('href', songobj.image);
 		}
	}
	else {
		var dom = (song instanceof HTMLElement) ? $(song) : $(".song[data-id=" + song.id + "]")[0];
		$(dom).addClass("wantstobeplayed");
		recognition.stop();
		recognition.queue.unshift(songobj)
		recognition.start();
	}
}
updateHints = function() {
	var queue1    = player.queue1.get(),
			queue2    = player.queue2.get(),
			queue     = queue1.concat(queue2),
			next      = queue.shift(),
			hist      = player.history.get(),
			prev      = hist.pop(),
			nextlabel = (next != undefined) ? "<strong>" + next.name + "</strong><br>" + next.artist : "There is no track in your queue!",
			prevlabel = (prev != undefined) ? "<strong>" + prev.name + "</strong><br>" + prev.artist : "There is no track in your history!";
		$(".next-update").html(nextlabel);
		$(".prev-update").html(prevlabel);
		$("#skip").attr("data-tooltip", "<div class='next-update'>" + nextlabel + "</div>");
		$("#rewind").attr("data-tooltip", "<div class='prev-update'>" + prevlabel + "</div>");
}
player.nowPlaying = {
	replace: function(song, noautoplay) {
		var oldsong = player.nowPlaying.get();
		var song = helpers.parseDOM(song);
		localStorage['nowPlaying'] = JSON.stringify(song);
		console.log(song)
		$("#track-title a").text(song.name).attr('data-navigate', '/song/' + song.id);
		$("#track-artist a").text(song.artist).attr('data-navigate', '/artist/' + song.artistid);
		$("#track-album a").text(song.album).attr('data-navigate', '/album/' + song.albumid);
		var npimage1 = $("#nowplaying-image"), npimage2 = $("#nowplaying-image2"), cover = helpers.getHQAlbumImage(song, 225);
		if ((oldsong && oldsong.image != song.image) || (npimage1.attr('src') == '' && npimage1.attr('src') == '')) {
			if (npimage1.hasClass('np-placeholder-used')) {
				npimage1.removeClass('np-placeholder-used').attr('src', '');
				npimage2.attr('src', cover).addClass('np-placeholder-used').one('load', function() {
					$(npimage2).css({opacity: 0.7}, 400);
					$(npimage1).css({opacity: 0}, 400);
				});
			}
			else {
				npimage2.removeClass('np-placeholder-used').attr('src', '')
				npimage1.attr('src', cover).addClass('np-placeholder-used').one('load', function() {
					$(npimage1).css({opacity: 0.7}, 400);
					$(npimage2).css({opacity: 0}, 400);
				});
			}
		}
		$('.song').removeClass('now-playing hearable')
		$(".song[data-id='" + song.id + "']").addClass('now-playing');
		updateHints();
		remote.updateTrack();
	},
	get: function(song) {
		helpers.localStorageSafety('nowPlaying');
		return (localStorage['nowPlaying'] == '[]') ? null :  JSON.parse(localStorage['nowPlaying']);
	}
}
var Queue = function(name) {
	this.add = function(song, first) {
		var song = helpers.parseDOM(song)
		var lskey = name;
		helpers.localStorageSafety(lskey);
		helpers.addToLocalStorage(lskey, song, first);
		player.drawQueue();
		updateHints();
		return helpers.getLocalStorage(lskey);
	}
	this.get = function() {
		return helpers.getLocalStorage(name);
	}
	this.clear = function() {
		return helpers.clearLocalStorage(name);
	}
	this.getAndRemoveFirst = function() {
		var list = helpers.getLocalStorage(name);
		var element = list.splice(0,1);
		localStorage[name] = JSON.stringify(list);
		player.drawQueue();
		return element[0];
	}
if (name == "history") {
	this.playLast = function() {
		var list = helpers.getLocalStorage(name);
		if (list.length != 0) {
			player.queue1.add(player.nowPlaying.get(), true)
			var last = list.pop()
			localStorage[name] = JSON.stringify(list);
			player.playSong(last, false, true);
			player.drawQueue();
		}		
	}
}
}
player.queue1  = new Queue('queue1');
player.queue2  = new Queue('queue2');
player.history = new Queue('history');
player.automaticseekblocked = false;
var stateChange = function(state) {
	/*
		var states = {0: ended, 1: playing, 2: paused, 3: buffering, 5: video cued}
	*/
	if (state == 1) {
		$("#play").hide();
		$("#pause").show();
		$('#seek-bar').removeClass('buffering');
		$('.now-playing').addClass('hearable');
	}
	else {
		if (state == 0) {
			player.playNext()
		}
		if (state == 2) {
			$('.now-playing').removeClass('hearable')
		}
		$("#pause").hide();
		$("#play").show();
	}
}
var videoEnded = function() {
	player.playNext();
}
var videoIdReplacements = function(song) {
	helpers.localStorageSafetyObject('videoIdReplacements');
	var replacements 	= helpers.getLocalStorage('videoIdReplacements');
	var replacementid 	= replacements[song.ytid];
	if (replacementid 	!= undefined) {
		song.ytid = replacementid;
	}
	return song;

}
var replaceVideo = function(videoid, replacement) {
	helpers.localStorageSafety('videoIdReplacements');
	var replacements 					= JSON.parse(localStorage['videoIdReplacements']);
	replacements[videoid] 				= replacement;
	localStorage['videoIdReplacements'] = JSON.stringify(replacements);
}
var errorOccured = function(error_code) {
	if (error_code == 0) {
		notifications.create('The video could not be loaded due to some country restrictions. Looking for an alternative...');
	}
	else {
		notifications.create('A unknown error happened while trying to play the video. Looking for an altenative...')
	}
	/*
		Find an alternative video
	*/
	var song = player.nowPlaying.get()
	recognition.findVideo(song, function(video) {
		if (video != undefined) {
			var oldid = song.ytid,
				newid = video['media$group']['yt$videoid']['$t'];
			song.ytid = newid;
			replaceVideo(oldid, newid);
			player.playSong(song, false, true);
			notifications.create('Alternative found. In the future, this video will be played.');
		}
		else {
			notifications.create('No video available in your country was found. We cannot play this song, sorry.');
		}
	}, undefined, undefined, undefined, ['restricted']);
}
player.setUpEvents = function() {
	/*
		Make the play button different
	*/
	ytplayer.addEventListener('onStateChange',	'stateChange');
	ytplayer.addEventListener('onEnded',		'videoEnded' );
	ytplayer.addEventListener('onError', 		'errorOccured');
	/*
		Update time label
	*/
	var timeUpdate = function() {
			var current   		= ytplayer.getCurrentTime(),
				duration  		= ytplayer.getDuration(),
				parsedcurrent 	= helpers.parsetime(current),
				parsedduration	= helpers.parsetime(duration);
			document.getElementById('time-right').innerHTML = parsedduration;
			document.getElementById('time-left').innerHTML = parsedcurrent;
			var percent = (current/duration)*100;
			var val;
			if (!player.automaticseekblocked && percent) {
				var val = percent
			}
			if (percent == NaN) {
				var val = 0
			}
			document.getElementById('seek-progress').style.width = val + '%'
		setTimeout(timeUpdate, 500)
	}
	timeUpdate()
}
player.pause		= function() {
	ytplayer.pauseVideo();
}
player.play 		= function() {
	ytplayer.playVideo();
}
player.seek 		= function(to) {
	ytplayer.seekTo(to);
}
player.playNext 	= function() {
	/*
		Determine from which queue to get the song.
	*/
	var queue = (player.queue1.get().length == 0) ? "queue2" : "queue1";
	var firstsong = player[queue].getAndRemoveFirst();
	player.playSong(firstsong);
}
player.playLast		= function() {
	player.history.playLast();
}
player.drawQueue	= function() {
	/*
		Merge both queues
	*/
	var queue1 = player.queue1.get(),
		queue2 = player.queue2.get();
		queue  = queue1.concat(queue2);
		/*
			Shorten queue display to 10 tracks
		*/
		queue = queue.slice(0,10);
		/*
			Clear queue div
		*/
		$("#queue").empty();
	$.each(queue, function(key, song) {
		/*
			Remap song keys.
			The result will be the exact same object, but every key has a data- prefix
			so we can pass that in the jQuery DOM object.
		*/
		var remappedSong = {'data-tooltip': '<strong>' + song.name + '</strong><br>' + song.artist, 'class': 'queue-song'}
		$.each(song, function(k,v) {
			remappedSong["data-" + k] = v;
		});
		//TODO: Clean this mess up.
		var div = $("<div>", remappedSong);
		var img = $("<img>", {src: song.image}).appendTo(div);
		div.appendTo("#queue");
	})
}
player.togglePlayState 	= function() {
	var state = ytplayer.getPlayerState();
	if (state == 1) {
		player.pause();
	}
	else {
		player.play();
	}
};search = {
	calls: [],
	autocomplete: function(query) {
		var wrapper = $('#search-results-wrapper');
		search.calls = [];
		var types = {
			artist: {
				iTunesName: 'musicArtist',
				title: 		'artistName',
				sub: 		'primaryGenreName',
				element: 	$('#results-artists'),
				link: 		'/artist/$1',
				id: 		'artistId',
				image: 		'svg-artist-black'
			},
			album: {
				iTunesName: 'album',
				title: 		'collectionName',
				sub: 		'artistName',
				element: 	$('#results-albums'),
				link: 		'/album/$1',
				id: 		'collectionId',
				image: 		'svg-album-black'
			},
			track: {
				iTunesName: 'song',
				title: 		'trackName',
				sub: 		'artistName',
				element: 	$('#results-tracks'),
				link: 		'/song/$1',
				id: 		'trackId',
				image: 		'svg-music-black'
			}
		}
		var results = {
			count: 0,
			objects: []
		};
		var allResultsFetched = function(results) {
			var results = _.sortBy(results.objects, function (result, key) {
				var one = _s.levenshtein(result.title, query),
					two = _s.levenshtein(result.sub, query) + 0.5 + (key + 1) % 3; // 0.5 Because title is always more important than sub
				return Math.min(one, two);
			});
			var results = _.map(results, function (result) {
				var regex 		= new RegExp(query, 'gi');
				//result.title 	= result.title.replace(regex, '<b>' + query + '</b>');
				//result.sub 		= result.sub.replace(regex, '<b>' + query + '</b>');
				return result;
			});
			wrapper.empty();
			_.each(results, function (result, key) {
				var html 		= $('<li data-navigate="' + result.link + '"><a><img src="/api/i/pixel" class="' + result.image + '"><span>' + result.title + '</span><span class="search-result-sub">' + result.sub + '</span></a></li>');
				if (key == 0) {
					var html 	= $(html).addClass('search-selected')
				}
				endLoadingIndicator();
				wrapper.append(html);
			});
		}
		var startLoadingIndicator 	= function() {
			$('#search-spinner').show()
		}
		var endLoadingIndicator 	= function() {
			$('#search-spinner').hide();
		}
		startLoadingIndicator();
		$.each(types, function(type, info) 
			{
				var ajax = $.ajax(
					{
						url: 'http://itunes.apple.com/search',
						data: {
							term: query,
							entity: info.iTunesName,
							limit: 3
						},
						dataType: 'jsonp',
						success: function(json) {
							_.each(json.results, function(result) {
								results.objects.push({
									title: 		result[info.title],
									sub: 		result[info.sub],
									type: 		type,
									link: 		info.link.replace('$1', result[info.id]),
									image: 		info.image
								});
							});
							results.count++;
							if (results.count == 3) {
								allResultsFetched(results)
							}
						}
					}
				)
				search.calls.push(ajax);

			}
		)
	}
};addtracks = {
	calls: [],
	autocomplete: function(query) {
		search.calls = [];
		var types = {
			track: {
				iTunesName: 'song',
				title: 		'trackName',
				sub: 		'artistName',
				element: 	$('.add-tracks-results'),
				id: 		'trackId'
			}
		}
		$.each(types, function(type, info) 
			{
				var ajax = $.ajax(
					{
						url: 'http://itunes.apple.com/search',
						data: {
							term: query,
							entity: info.iTunesName,
							limit: 3
						},
						dataType: 'jsonp',
						success: function(json) {
							$(info.element).empty();
							$.each(json.results, function(key, result) {
								var div = $('<div>', { class: 'search-result' });
										  $('<div>', { class: 'search-result-title' }).text(result[info.title]).appendTo(div);
										  $('<div>', { class: 'search-result-sub' }).text(result[info.sub]).appendTo(div);
								var a   = $('<a>'  , { 'data-id' : result.trackId }).html(div).on('click', function() {
									var route = $('#view').attr('data-route');
									if (route == '/library') {
										library.add({id: result.trackId});
									} 
									else {
										playlist.add({id: result.trackId}, route);
									}
									$(".add-tracks-input").val("").focus();
									info.element.html('');
									window.lastsearchtimestamp = null;
								});
								a.appendTo(info.element);
								if (key == 0) {
									$(a).addClass('add-tracks-selected');
								}	  
							})
						}
					}
				)
				search.calls.push(ajax);
			}
		)
	}
};var addToCollections, addToImportQueue, cancelEverything, determineProvider, determineTarget, droparea, fileDropped, importqueue, queuechanged, queuestarted, recognize, recognizeFile, recognizeSpotify, recognizeTracks, startQueue, stopQueue, textDropped, weirdThingDropped;

droparea = $('#view');

importqueue = [];

queuestarted = false;

cancelEverything = function(e) {
	e.stopPropagation();
	return e.preventDefault();
};

fileDropped = function(files) {
	return _.each(files, function(file) {
		var track;
		track = {
			type: {
				provider: 'file',
				id: file
			},
			target: determineTarget()
		};
		return addToImportQueue(track);
	});
};

textDropped = function(text) {
	var links;
	links = text.split(/\n/);
	return _.each(links, function(link) {
		var track;
		track = {
			type: determineProvider(link),
			target: determineTarget()
		};
		if (track.type) {
			return addToImportQueue(track);
		}
	});
};

weirdThingDropped = function() {
	return console.log('something was dropped');
};

determineTarget = function() {
	return document.getElementById('view').dataset.route;
};

determineProvider = function(link) {
	if (link.length === 52 && link.substr(0, 30) === 'http://open.spotify.com/track/') {
		return {
			provider: 'spotify',
			id: link.substr(30)
		};
	} else if (link.substr(0, 28) === 'http://www.youtube.com/watch') {
		return {
			provider: 'youtube',
			id: link.substr(31, 11)
		};
	} else {
		return false;
	}
};

addToImportQueue = function(track) {
	importqueue.push(track);
	return queuechanged();
};

queuechanged = function() {
	if (queuestarted) {
		if (importqueue.length === 0) {
			return stopQueue();
		}
	} else {
		if (importqueue.length !== 0) {
			return startQueue();
		}
	}
};

startQueue = function() {
	queuestarted = true;
	console.log('Queue started');
	return recognizeTracks();
};

stopQueue = function() {
	queuestarted = false;
	return console.log('Queue ended');
};

recognizeTracks = function() {
	var firsttrack;
	firsttrack = importqueue.shift();
	return recognize(firsttrack, function(song) {
		addToCollections(firsttrack, song);
		queuechanged();
		if (importqueue.length !== 0) {
			return recognizeTracks();
		}
	});
};

recognize = function(track, callback) {
	if (track.type.provider === 'spotify') {
		return recognizeSpotify(track, function(song) {
			return callback(song);
		});
	} else if (track.type.provider === 'file') {
		return recognizeFile(track, function(song) {
			return callback(song);
		});
	}
};

recognizeSpotify = function(track, callback) {
	return $.getJSON('http://ws.spotify.com/lookup/1/.json?uri=spotify:track:' + track.type.id, function(json) {
		track = {
			name: json.track.name,
			artist: json.track.artists[0].name
		};
		socket.emit('request-track-info', track);
		return socket.once('receive-track-info', function(data) {
			var song;
			if (data.error) {
				return callback(null);
			} else {
				song = data.song;
				return recognition.findVideo(song, function(video) {
					song.ytid = helpers.parseYTId(video);
					socket.emit('new-track', song);
					return socket.once('track-uploaded', function(id) {
						if (id === song.id) {
							return callback(song);
						}
					});
				});
			}
		});
	});
};

recognizeFile = function(track, callback) {
	var reader;
	reader = new FileReader();
	reader.onload = function(e) {
		var dv;
		dv = new jDataView(this.result);
		if (dv.getString(3, dv.byteLength - 128) === 'TAG') {
			track = {
				name: dv.getString(30, dv.tell()),
				artist: dv.getString(30, dv.tell())
			};
			console.log(track);
			socket.emit('request-track-info', track);
			return socket.once('receive-track-info', function(data) {
				var song;
				if (data.error) {
					console.log('no track found');
					return callback(null);
				} else {
					song = data.song;
					return recognition.findVideo(song, function(video) {
						song.ytid = helpers.parseYTId(video);
						socket.emit('new-track', song);
						return socket.once('track-uploaded', function(id) {
							if (id === song.id) {
								return callback(song);
							}
						});
					});
				}
			});
		} else {
			console.log('NO ID3');
			return callback(null);
		}
	};
	return reader.readAsArrayBuffer(track.type.id);
};

addToCollections = function(info, song) {
	var target;
	target = info.target;
	if (song) {
		if (_s.contains(target, '/u/') && _s.contains(target, '/p/')) {
			return socket.emit('add-tracks-to-collection', {
				token: chinchilla.token,
				tracks: [song.id],
				destination: target,
				type: 'playlist'
			});
		} else {
			return socket.emit('add-tracks-to-collection', {
				token: chinchilla.token,
				tracks: [song.id],
				destination: 'library',
				type: 'library'
			});
		}
	}
};

$(document).ready(function() {
	document.addEventListener('dragenter', function(e) {
		return cancelEverything(e);
	});
	document.getElementById('dropfiles').addEventListener('dragleave', function() {
		document.getElementById('dropfiles').className = '';
		return document.getElementById('dropfilescontent').className = '';
	});
	document.addEventListener('dragover', function(e) {
		document.getElementById('dropfiles').className = 'drag-hover';
		document.getElementById('dropfilescontent').className = 'drag-hover';
		return cancelEverything(e);
	});
	return document.addEventListener('drop', function(e) {
		var files, text;
		document.getElementById('dropfiles').className = '';
		document.getElementById('dropfilescontent').className = '';
		cancelEverything(e);
		files = e.dataTransfer.files;
		text = e.dataTransfer.getData('Text');
		if (files.length !== 0) {
			return fileDropped(files);
		} else if (text !== '') {
			return textDropped(text);
		} else {
			return weirdThingDropped();
		}
	});
});
;errors = {
	draw: function(code) {
		$("#view").load("/api/error/" + code);
	}
};var recognitionAdditionHandler = function() {
	if (recognition.started == false) {
		recognition.start()
	}
}
recognition = {
	recognizeAlbum: function(album) {
		var tracks = $(album).find(".album-tracks table tbody tr.song.not-recognized");
		$.each(tracks, function(k,v) {
			recognition.queue.push(v);
		})
	},
  recognizeTrackList: function(list) {
    var tracks = $(list).find("tr.song.not-recognized");
    $.each(tracks, function(k,v) {
      recognition.queue.push(v)
    })
  },
	queue: new EventedArray(recognitionAdditionHandler),
	recognizeTrack: function(obj) {
		var track = obj.track,
			  cb	  = obj.cb;
		var song = helpers.parseDOM(track),
            firsttrackinarray = (track.length != undefined && track.length != 0) ? track[0] : track,
            dom   = (firsttrackinarray instanceof HTMLElement) ? $(firsttrackinarray) : $(".song[data-id=" + firsttrackinarray.id + "]")[0];
        if ($(dom).hasClass('recognized')) {
            cb();
            return;
        }
		recognition.findVideo(song, function(video) {
            if (video) {
                /*
                    Mark it as recognized
                */
                var div = $('.song[data-id="' + song.id + '"]').attr("data-ytid", video.id.$t.substr(-11));
                div.addClass("recognized").removeClass("not-recognized pending")
                recognition.uploadTrack(song, video);
                /*
                    Add YouTube ID to the dom
                */
                if ($(div).hasClass("wantstobeplayed")) {
                      $(div).removeClass("wantstobeplayed");
                      player.playSong($(div)[0]);
                }
                /*
                    If song is in an album
                */
                    var album = $(track).parents(".album");
                /*
                    Checks if song is in a n album
                */
                if (album.length != 0) {
                    /*
                        Number of tracks that are recognized
                        Album
                        Number of tracks total
                    */
                    var recognizedcount = ($(track).parents(".album").find(".recognized")).length + 1,
                        tracks      = album.data("tracks");
                    if (recognizedcount == tracks) {
                        recognition.uploadAlbum(album[0])
                    }
                }
            }
            else {
                $(dom).addClass('no-video-found')
            }
            cb();
		});
	},
	started: false,
	start: function() {
		recognition.started = true;
		var loop = function() {
			recognition.recognizeTrack({track: recognition.queue.getArray()[0], cb: function() {
                    if (recognition.started) {
                        recognition.queue.shift()
                        if (recognition.queue.getArray().length == 0) {
                            recognition.stop()
                        }
                        else {
                            loop();
                        }
                    }
					
				}
			});
		}
		loop();
	},
	stop: function() {
		recognition.started = false;
	},
	findVideo: function (song, callback, jquery, underscore, underscorestring, options) {
        if (jquery != undefined) {
            $ = jquery 
        }
        if (underscore != undefined) {
            _ = underscore;
        }
        if (underscorestring != undefined) {
            _s = underscorestring;
        }
        song.name = (song.title == undefined) ? song.name : song.title;
        var data = {
            alt: "json",
           "max-results": 15,
            q: song.artist + " " + song.name,
            v: 2
        }
        if (options != undefined && _.contains(options, 'restricted')) {
            data.restricted = 'DE';
        }
        $.ajax({
            url: "http://gdata.youtube.com/feeds/api/videos",
            data: data,
            success: function (json) {
              recognition.findBestVideo(json, song, function(video) {
                callback(video);
              }, _, _s, options);
            }
          }
        );
    },
    findBestVideo: function (json, song, callback, _, _s) {
        var videos = json.feed.entry,
            mostviewed  = 
                _.max(videos, function(video) { 
                    var views =  video.yt$statistics != undefined ? parseFloat(video.yt$statistics.viewCount) : 0;
                    return views
                })
            mostviews = mostviewed.yt$statistics ? mostviewed.yt$statistics.viewCount : 0;
        _.map(videos, function(video) {

            /*
                Every video can score between 0 and 1000 points
            */
            video.points = 0;
            var videotitle      = _s.slugify(video.title.$t),
                format1         = _s.slugify(song.artist + ' ' + song.name),
                format2         = _s.slugify(song.name + ' ' + song.artist);
            
            /*
                300 Points: Levenshtein distance
            */
            var vtfragments     = helpers.titleMatcher(video.title.$t, _),
                vtitle          = vtfragments.join(' '),
                tfragments      = helpers.titleMatcher(song.artist + ' ' + song.name, _),
                matches = [], unmatches = [];
            _.each(tfragments, function (fragment) {
                var index = vtitle.indexOf(fragment);
                if (index == -1) {
                    unmatches.push(fragment)
                }
                else {
                    matches.push(fragment);
                    vtitle = vtitle.replace(fragment, '');
                }
            });
            var levpoints = 300*(matches.length/tfragments.length) - vtitle.replace(/\s/g, '').length*2
            video.points += levpoints;

            /*
                Infinite minus Points: Duration
                -1 less or more is okay
                -For every another second, take away 5 points
            */
            var videoduration   = video.media$group.yt$duration.seconds,
                songduration    = song.duration/1000,
                difference      = Math.abs(videoduration - songduration)
                tolerance       = 1,
                minuspoints     = difference === 0 ? 0 : (difference-1),
                durpoints       = minuspoints;
            video.points -= durpoints;

            /*
                50 Points: View count
                -Best video gets 50 Points
                -All the other videos get 50 points divided by the ratio of views they have. 
            */
            var viewCount       = video.yt$statistics ? parseFloat(video.yt$statistics.viewCount) : 0,
                ratio           = viewCount / mostviews;
                viepoints       = Math.ceil(ratio*50);
            video.points += viepoints;

            /*
                150 Points: Rating
                -100% positive rating gets 150 points
                -100% negative rating gets 000 points
            */
            var rating          = video.gd$rating ? video.gd$rating.average*20 : 0
                ratpoints       = Math.ceil(rating * 1.5);
            video.points += ratpoints;

            /*
                200: Bad words
                -200 points if no bad words included
                -minus 75 points for every bad word

            */
            video.points += 200;
            var badwords = ["cover", "parod", "chipmunk", "snippet", "preview", "live", "review", "vocaloid", "dance", "remix"];
            _.each(badwords, function (word) {
                if (_s.include(videotitle.toLowerCase(), word) && !_s.include(format1, word)) {
                    video.points -= 75
                }
            });

            /*
                -300: Date
            */



            /*
                Album name included
                -If track is a skit / intro / outro, take away 50 points if there is no album name
            */
            video.points += 50
            if (_s.include(videotitle.toLowerCase()), song.album && (_s.include(format1, 'skit') || _s.include(format1, 'intro') || _s.include(format1, 'outro')) ) {
                video.points -= 50;
            }
        }); 
        var bestvideo = _.first(_.sortBy(videos, function(video) { return video.points }).reverse());
        if (bestvideo) {
            console.log('The best video has ', bestvideo.points, ' points!', song.name);
        }
        callback(bestvideo);
    },
    uploadTrack: function(track, video) {
    	var videoid = video.id.$t.substr(-11);
    	var json = track;
    	json.ytid = videoid;
        json.id = parseFloat(json.id);
        socket.emit('new-ytid', json);
    },
    uploadAlbum: function(album) {
    	var json = $(album).data();
    	var tracks = $(album).find(".song"), trackids = []
    	/*
			Don't upload whole tracks, only ID's
    	*/
    	$.each(tracks, function(k,track) {
    		trackids.push($(track).data("id"));
    	})
    	json.tracklist = trackids;
    	socket.emit('new-album', json);

    }
}
function EventedArray(handler) {
   this.stack = [];
   this.mutationHandler = handler || function() {};
   this.setHandler = function(f) {
      this.mutationHandler = f;
   };
   this.callHandler = function() { 
      if(typeof this.mutationHandler === 'function') {
         this.mutationHandler();
      }
   };
   this.push = function(obj) {
      this.stack.push(obj);
      this.callHandler();
   };
   this.shift = function() {
   	  this.stack.shift();
   }
   this.pop = function() {
      return this.stack.pop();
   };
   this.getArray = function() {
      return this.stack;
   };
   this.unshift = function(obj) {
    this.stack.unshift(obj);
    this.callHandler();
   };
   this.clear   = function() {
    this.stack = [];
    recognition.stop()
   }
}
/*
    For backend
*/
this.recognition = recognition;;
/*	SWFObject v2.2 <http://code.google.com/p/swfobject/> 
	is released under the MIT License <http://www.opensource.org/licenses/mit-license.php> 
*/
var swfobject=function(){var D="undefined",r="object",S="Shockwave Flash",W="ShockwaveFlash.ShockwaveFlash",q="application/x-shockwave-flash",R="SWFObjectExprInst",x="onreadystatechange",O=window,j=document,t=navigator,T=false,U=[h],o=[],N=[],I=[],l,Q,E,B,J=false,a=false,n,G,m=true,M=function(){var aa=typeof j.getElementById!=D&&typeof j.getElementsByTagName!=D&&typeof j.createElement!=D,ah=t.userAgent.toLowerCase(),Y=t.platform.toLowerCase(),ae=Y?/win/.test(Y):/win/.test(ah),ac=Y?/mac/.test(Y):/mac/.test(ah),af=/webkit/.test(ah)?parseFloat(ah.replace(/^.*webkit\/(\d+(\.\d+)?).*$/,"$1")):false,X=!+"\v1",ag=[0,0,0],ab=null;if(typeof t.plugins!=D&&typeof t.plugins[S]==r){ab=t.plugins[S].description;if(ab&&!(typeof t.mimeTypes!=D&&t.mimeTypes[q]&&!t.mimeTypes[q].enabledPlugin)){T=true;X=false;ab=ab.replace(/^.*\s+(\S+\s+\S+$)/,"$1");ag[0]=parseInt(ab.replace(/^(.*)\..*$/,"$1"),10);ag[1]=parseInt(ab.replace(/^.*\.(.*)\s.*$/,"$1"),10);ag[2]=/[a-zA-Z]/.test(ab)?parseInt(ab.replace(/^.*[a-zA-Z]+(.*)$/,"$1"),10):0}}else{if(typeof O.ActiveXObject!=D){try{var ad=new ActiveXObject(W);if(ad){ab=ad.GetVariable("$version");if(ab){X=true;ab=ab.split(" ")[1].split(",");ag=[parseInt(ab[0],10),parseInt(ab[1],10),parseInt(ab[2],10)]}}}catch(Z){}}}return{w3:aa,pv:ag,wk:af,ie:X,win:ae,mac:ac}}(),k=function(){if(!M.w3){return}if((typeof j.readyState!=D&&j.readyState=="complete")||(typeof j.readyState==D&&(j.getElementsByTagName("body")[0]||j.body))){f()}if(!J){if(typeof j.addEventListener!=D){j.addEventListener("DOMContentLoaded",f,false)}if(M.ie&&M.win){j.attachEvent(x,function(){if(j.readyState=="complete"){j.detachEvent(x,arguments.callee);f()}});if(O==top){(function(){if(J){return}try{j.documentElement.doScroll("left")}catch(X){setTimeout(arguments.callee,0);return}f()})()}}if(M.wk){(function(){if(J){return}if(!/loaded|complete/.test(j.readyState)){setTimeout(arguments.callee,0);return}f()})()}s(f)}}();function f(){if(J){return}try{var Z=j.getElementsByTagName("body")[0].appendChild(C("span"));Z.parentNode.removeChild(Z)}catch(aa){return}J=true;var X=U.length;for(var Y=0;Y<X;Y++){U[Y]()}}function K(X){if(J){X()}else{U[U.length]=X}}function s(Y){if(typeof O.addEventListener!=D){O.addEventListener("load",Y,false)}else{if(typeof j.addEventListener!=D){j.addEventListener("load",Y,false)}else{if(typeof O.attachEvent!=D){i(O,"onload",Y)}else{if(typeof O.onload=="function"){var X=O.onload;O.onload=function(){X();Y()}}else{O.onload=Y}}}}}function h(){if(T){V()}else{H()}}function V(){var X=j.getElementsByTagName("body")[0];var aa=C(r);aa.setAttribute("type",q);var Z=X.appendChild(aa);if(Z){var Y=0;(function(){if(typeof Z.GetVariable!=D){var ab=Z.GetVariable("$version");if(ab){ab=ab.split(" ")[1].split(",");M.pv=[parseInt(ab[0],10),parseInt(ab[1],10),parseInt(ab[2],10)]}}else{if(Y<10){Y++;setTimeout(arguments.callee,10);return}}X.removeChild(aa);Z=null;H()})()}else{H()}}function H(){var ag=o.length;if(ag>0){for(var af=0;af<ag;af++){var Y=o[af].id;var ab=o[af].callbackFn;var aa={success:false,id:Y};if(M.pv[0]>0){var ae=c(Y);if(ae){if(F(o[af].swfVersion)&&!(M.wk&&M.wk<312)){w(Y,true);if(ab){aa.success=true;aa.ref=z(Y);ab(aa)}}else{if(o[af].expressInstall&&A()){var ai={};ai.data=o[af].expressInstall;ai.width=ae.getAttribute("width")||"0";ai.height=ae.getAttribute("height")||"0";if(ae.getAttribute("class")){ai.styleclass=ae.getAttribute("class")}if(ae.getAttribute("align")){ai.align=ae.getAttribute("align")}var ah={};var X=ae.getElementsByTagName("param");var ac=X.length;for(var ad=0;ad<ac;ad++){if(X[ad].getAttribute("name").toLowerCase()!="movie"){ah[X[ad].getAttribute("name")]=X[ad].getAttribute("value")}}P(ai,ah,Y,ab)}else{p(ae);if(ab){ab(aa)}}}}}else{w(Y,true);if(ab){var Z=z(Y);if(Z&&typeof Z.SetVariable!=D){aa.success=true;aa.ref=Z}ab(aa)}}}}}function z(aa){var X=null;var Y=c(aa);if(Y&&Y.nodeName=="OBJECT"){if(typeof Y.SetVariable!=D){X=Y}else{var Z=Y.getElementsByTagName(r)[0];if(Z){X=Z}}}return X}function A(){return !a&&F("6.0.65")&&(M.win||M.mac)&&!(M.wk&&M.wk<312)}function P(aa,ab,X,Z){a=true;E=Z||null;B={success:false,id:X};var ae=c(X);if(ae){if(ae.nodeName=="OBJECT"){l=g(ae);Q=null}else{l=ae;Q=X}aa.id=R;if(typeof aa.width==D||(!/%$/.test(aa.width)&&parseInt(aa.width,10)<310)){aa.width="310"}if(typeof aa.height==D||(!/%$/.test(aa.height)&&parseInt(aa.height,10)<137)){aa.height="137"}j.title=j.title.slice(0,47)+" - Flash Player Installation";var ad=M.ie&&M.win?"ActiveX":"PlugIn",ac="MMredirectURL="+O.location.toString().replace(/&/g,"%26")+"&MMplayerType="+ad+"&MMdoctitle="+j.title;if(typeof ab.flashvars!=D){ab.flashvars+="&"+ac}else{ab.flashvars=ac}if(M.ie&&M.win&&ae.readyState!=4){var Y=C("div");X+="SWFObjectNew";Y.setAttribute("id",X);ae.parentNode.insertBefore(Y,ae);ae.style.display="none";(function(){if(ae.readyState==4){ae.parentNode.removeChild(ae)}else{setTimeout(arguments.callee,10)}})()}u(aa,ab,X)}}function p(Y){if(M.ie&&M.win&&Y.readyState!=4){var X=C("div");Y.parentNode.insertBefore(X,Y);X.parentNode.replaceChild(g(Y),X);Y.style.display="none";(function(){if(Y.readyState==4){Y.parentNode.removeChild(Y)}else{setTimeout(arguments.callee,10)}})()}else{Y.parentNode.replaceChild(g(Y),Y)}}function g(ab){var aa=C("div");if(M.win&&M.ie){aa.innerHTML=ab.innerHTML}else{var Y=ab.getElementsByTagName(r)[0];if(Y){var ad=Y.childNodes;if(ad){var X=ad.length;for(var Z=0;Z<X;Z++){if(!(ad[Z].nodeType==1&&ad[Z].nodeName=="PARAM")&&!(ad[Z].nodeType==8)){aa.appendChild(ad[Z].cloneNode(true))}}}}}return aa}function u(ai,ag,Y){var X,aa=c(Y);if(M.wk&&M.wk<312){return X}if(aa){if(typeof ai.id==D){ai.id=Y}if(M.ie&&M.win){var ah="";for(var ae in ai){if(ai[ae]!=Object.prototype[ae]){if(ae.toLowerCase()=="data"){ag.movie=ai[ae]}else{if(ae.toLowerCase()=="styleclass"){ah+=' class="'+ai[ae]+'"'}else{if(ae.toLowerCase()!="classid"){ah+=" "+ae+'="'+ai[ae]+'"'}}}}}var af="";for(var ad in ag){if(ag[ad]!=Object.prototype[ad]){af+='<param name="'+ad+'" value="'+ag[ad]+'" />'}}aa.outerHTML='<object classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000"'+ah+">"+af+"</object>";N[N.length]=ai.id;X=c(ai.id)}else{var Z=C(r);Z.setAttribute("type",q);for(var ac in ai){if(ai[ac]!=Object.prototype[ac]){if(ac.toLowerCase()=="styleclass"){Z.setAttribute("class",ai[ac])}else{if(ac.toLowerCase()!="classid"){Z.setAttribute(ac,ai[ac])}}}}for(var ab in ag){if(ag[ab]!=Object.prototype[ab]&&ab.toLowerCase()!="movie"){e(Z,ab,ag[ab])}}aa.parentNode.replaceChild(Z,aa);X=Z}}return X}function e(Z,X,Y){var aa=C("param");aa.setAttribute("name",X);aa.setAttribute("value",Y);Z.appendChild(aa)}function y(Y){var X=c(Y);if(X&&X.nodeName=="OBJECT"){if(M.ie&&M.win){X.style.display="none";(function(){if(X.readyState==4){b(Y)}else{setTimeout(arguments.callee,10)}})()}else{X.parentNode.removeChild(X)}}}function b(Z){var Y=c(Z);if(Y){for(var X in Y){if(typeof Y[X]=="function"){Y[X]=null}}Y.parentNode.removeChild(Y)}}function c(Z){var X=null;try{X=j.getElementById(Z)}catch(Y){}return X}function C(X){return j.createElement(X)}function i(Z,X,Y){Z.attachEvent(X,Y);I[I.length]=[Z,X,Y]}function F(Z){var Y=M.pv,X=Z.split(".");X[0]=parseInt(X[0],10);X[1]=parseInt(X[1],10)||0;X[2]=parseInt(X[2],10)||0;return(Y[0]>X[0]||(Y[0]==X[0]&&Y[1]>X[1])||(Y[0]==X[0]&&Y[1]==X[1]&&Y[2]>=X[2]))?true:false}function v(ac,Y,ad,ab){if(M.ie&&M.mac){return}var aa=j.getElementsByTagName("head")[0];if(!aa){return}var X=(ad&&typeof ad=="string")?ad:"screen";if(ab){n=null;G=null}if(!n||G!=X){var Z=C("style");Z.setAttribute("type","text/css");Z.setAttribute("media",X);n=aa.appendChild(Z);if(M.ie&&M.win&&typeof j.styleSheets!=D&&j.styleSheets.length>0){n=j.styleSheets[j.styleSheets.length-1]}G=X}if(M.ie&&M.win){if(n&&typeof n.addRule==r){n.addRule(ac,Y)}}else{if(n&&typeof j.createTextNode!=D){n.appendChild(j.createTextNode(ac+" {"+Y+"}"))}}}function w(Z,X){if(!m){return}var Y=X?"visible":"hidden";if(J&&c(Z)){c(Z).style.visibility=Y}else{v("#"+Z,"visibility:"+Y)}}function L(Y){var Z=/[\\\"<>\.;]/;var X=Z.exec(Y)!=null;return X&&typeof encodeURIComponent!=D?encodeURIComponent(Y):Y}var d=function(){if(M.ie&&M.win){window.attachEvent("onunload",function(){var ac=I.length;for(var ab=0;ab<ac;ab++){I[ab][0].detachEvent(I[ab][1],I[ab][2])}var Z=N.length;for(var aa=0;aa<Z;aa++){y(N[aa])}for(var Y in M){M[Y]=null}M=null;for(var X in swfobject){swfobject[X]=null}swfobject=null})}}();return{registerObject:function(ab,X,aa,Z){if(M.w3&&ab&&X){var Y={};Y.id=ab;Y.swfVersion=X;Y.expressInstall=aa;Y.callbackFn=Z;o[o.length]=Y;w(ab,false)}else{if(Z){Z({success:false,id:ab})}}},getObjectById:function(X){if(M.w3){return z(X)}},embedSWF:function(ab,ah,ae,ag,Y,aa,Z,ad,af,ac){var X={success:false,id:ah};if(M.w3&&!(M.wk&&M.wk<312)&&ab&&ah&&ae&&ag&&Y){w(ah,false);K(function(){ae+="";ag+="";var aj={};if(af&&typeof af===r){for(var al in af){aj[al]=af[al]}}aj.data=ab;aj.width=ae;aj.height=ag;var am={};if(ad&&typeof ad===r){for(var ak in ad){am[ak]=ad[ak]}}if(Z&&typeof Z===r){for(var ai in Z){if(typeof am.flashvars!=D){am.flashvars+="&"+ai+"="+Z[ai]}else{am.flashvars=ai+"="+Z[ai]}}}if(F(Y)){var an=u(aj,am,ah);if(aj.id==ah){w(ah,true)}X.success=true;X.ref=an}else{if(aa&&A()){aj.data=aa;P(aj,am,ah,ac);return}else{w(ah,true)}}if(ac){ac(X)}})}else{if(ac){ac(X)}}},switchOffAutoHideShow:function(){m=false},ua:M,getFlashPlayerVersion:function(){return{major:M.pv[0],minor:M.pv[1],release:M.pv[2]}},hasFlashPlayerVersion:F,createSWF:function(Z,Y,X){if(M.w3){return u(Z,Y,X)}else{return undefined}},showExpressInstall:function(Z,aa,X,Y){if(M.w3&&A()){P(Z,aa,X,Y)}},removeSWF:function(X){if(M.w3){y(X)}},createCSS:function(aa,Z,Y,X){if(M.w3){v(aa,Z,Y,X)}},addDomLoadEvent:K,addLoadEvent:s,getQueryParamValue:function(aa){var Z=j.location.search||j.location.hash;if(Z){if(/\?/.test(Z)){Z=Z.split("?")[1]}if(aa==null){return L(Z)}var Y=Z.split("&");for(var X=0;X<Y.length;X++){if(Y[X].substring(0,Y[X].indexOf("="))==aa){return L(Y[X].substring((Y[X].indexOf("=")+1)))}}}return""},expressInstallCallback:function(){if(a){var X=c(R);if(X&&l){X.parentNode.replaceChild(l,X);if(Q){w(Q,true);if(M.ie&&M.win){l.style.display="block"}}if(E){E(B)}}a=false}}}}();;libdom = {
	markAsNotInLibrary: function(id) {
		$('.song[data-id=' + id + ']').addClass('not-in-library').removeClass('in-library');
	},
	markAsInLibrary: function(id) {
		var song = $('.song[data-id=' + id + ']')
		song.removeClass('not-in-library').addClass('in-library');
	},
	addSongsToPlaylistLocal: function(url, tracks) {
		var playlists = chinchilla.playlists;
		chinchilla.playlists = _.map(chinchilla.playlists, function (playlist) {
			if (playlist.url == url) {
				_.each(tracks, function (track) {
					playlist.tracks.push(track);
				});
			}
			return playlist;
		});
	},
	removeSongsFromPlaylistLocal: function(url, tracks) {
		var playlists = chinchilla.playlists;
		chinchilla.playlists = _.map(chinchilla.playlists, function (playlist) {
			if (playlist.url == url) {
				_.each(tracks, function (track) {
					playlist.tracks = _.without(playlist.tracks, track);
				});
			}
			return playlist;
		});
	}
};library = {
	add: function(song) {
		var socketdata = {
			destination: 'library',
			tracks: [song.id],
			token: chinchilla.token,
			type: 'library'
		}
		socket.emit('add-tracks-to-collection', socketdata);
		libdom.markAsInLibrary(song.id);
		notifications.create('Adding...');
		$('.library-button').text("Remove from library").removeClass('library-button').addClass('library-remove-button');
	},
	batchAdd: function(songs) {
		var socketdata = {
			destination: 'library',
			tracks: _.pluck(songs, 'id'),
			token: chinchilla.token,
			type: 'library'
		}
		socket.emit('add-tracks-to-collection', socketdata);
		notifications.create('Adding...');
		_.each(songs, function(song) {
			libdom.markAsInLibrary(song.id);
		});
	},
	remove: function(song) {
		socket.emit('remove-track', 	{destination: 'library', song: song, token: chinchilla.token});
		libdom.markAsNotInLibrary(song.id);
		notifications.create('Removing...')
		$('.library-remove-button').text("Add to library").removeClass('library-remove-button').addClass('library-button');
		/*
			Remove from view
		*/
		var view = $('#view[data-route="/library"] .song[data-id="' + song.id + '"]').remove();
	}
}
playlist = {
	add: function(song, playlist) {
		var socketdata = {
			destination: playlist,
			tracks: [song.id],
			token: chinchilla.token,
			type: 'playlist'
		}
		socket.emit('add-tracks-to-collection', socketdata);
		notifications.create('Adding...');
	}
};var select      = function(e)   {
	console.log('click')
	/*
		Send to other function if batch selecting.
		Ctrl key selects all elements between already selected ones and the clicked.
	*/
	if (e.shiftKey) {
		shiftSelect(this);
		return;
	}
	/*
		Send to another function if CMD key is pressed.
		CMD key selects/deselects single elements without changing selection
	*/
	if (e.ctrlKey || e.metaKey) {
		cmdSelect(this);
		return;
	}
	/*
		If user just wants to fav songs, don't select
	*/
	var srcElement = e.srcElement || e.target;
	if ($(srcElement).hasClass('heart') || srcElement.dataset.navigate != undefined) {
		return;
	}
	/*
		If the track is already selected, make drag&drop possible
	*/
	if ($(this).hasClass('selected') && (e.button == 0 || document.getElementsByClassName('selected').length < 2)) {
		var tounselect = $(".song.selected").not(this)
		var toselect   = $(this)
		$(document).one('mouseup', function () {
			toselect.addClass("selected");
			$(tounselect).removeClass("selected");
		});
		dragsongs(e);
		return;
	}
	/*
		Deselect all the other songs.
	*/
	if (e.button == 0 || document.getElementsByClassName('selected').length < 2) {
		var tounselect = $(".song.selected").not(this);
		$(this).addClass("selected");
		$(tounselect).removeClass("selected");
		dragsongs(e);
	}
	
};
var dragsongs = function(e) {
	var original = {
			x: e.clientX,
			y: e.clientY
		},
		todrag = _.map($('.selected'), function(dom) {return dom.dataset}),
		droppableplaces = $('.playlistmenuitem, .librarymenuitem');
	if (todrag.length == 1) {
		$('#draglabel').text(todrag[0].name + ' - ' + todrag[0].artist)
	}
	else {
		$('#draglabel').text(todrag.length + ' tracks');
	}
	document.body.style.cursor = 'default'
	$(document).on('mousemove', function (e) {
		var difference = Math.sqrt(Math.pow(Math.abs(e.clientX-original.x), 2) + Math.pow(Math.abs(e.clientY-original.y), 2));
		if (difference > 20) {
			$('#draglabel').css({top: e.clientY - 30, left: e.clientX}).show();
		} 
	});
	droppableplaces.on('mouseenter', function () {
		$(this).addClass('droppableindicator');
	});
	droppableplaces.on('mouseleave', function () {
		$(this).removeClass('droppableindicator');
	});
	droppableplaces.one('mouseup', function () {
		$(this).removeClass('droppableindicator');
		var target = $(this).attr('data-navigate');
			socket.emit('add-tracks-to-collection', {
				token: chinchilla.token,
				tracks: _.pluck(todrag, 'id'),
				destination: (target == '/library' ? 'library' : target),
				type: (target == '/library' ? 'library' : 'playlist')
			});
			
	});
	$(document).one('mouseup', function (e) {
		$(document).off('mousemove');
		$('#draglabel').hide()
		droppableplaces.off('mouseenter mouseup')
	})
}
window.playSong = function(e)    {
		/*
			If user just dblclicked on the heart, don't play the song.
		*/
		if ($(e.srcElement || e.target).hasClass('heart')) {
			return
		}
		/*
			Get all next songs
			Add them to the queue.
		*/
		var nextSongs = $(this).nextAll(".song");
		player.queue2.clear();
		$.each(nextSongs, function(key, song) {
			player.queue2.add(song);
		});
		player.playSong(this);	
};
var shiftSelect         = function(obj) {
	var song         = $(obj),
		closestprev  = song.prevAll(".selected")[0],
		closestnext  = song.nextAll(".selected")[0];
	if (closestprev !== undefined) {
		song.prevUntil(closestprev, ".song").andSelf().addClass("selected");
	}
	if (closestnext !== undefined) {
		song.nextUntil(closestnext, ".song").andSelf().addClass("selected");
	}
};
var cmdSelect           = function(obj) {
	$(obj).toggleClass("selected");
};
var dragSeek			= function(obj) {
	var width = 224
	player.automaticseekblocked = true;
	var mousemove = function (e) {
		var position = e.pageX
		$('#seek-progress').css('width', (position/width)*100 + "%");
	}
	$(document).on('mousemove', mousemove);
	$(document).one('mouseup', function (e) {
		$(document).off('mousemove');
		var position = e.pageX
		if (position > 224) {
			var position = 224
		}
		player.seek((position/width)*ytplayer.getDuration());
		player.automaticseekblocked = false;
	})
};
var resume				= function(obj) {
	player.play();
};
var pause               = function(obj) {
	player.pause();
};
var skip                = function() {
	player.playNext();
};
var rewind              = function() {
	player.playLast();
};
var tooltip             = function(e) {
	var original = this;
	var tooltip = $("<div>", {
		class: "tooltip"
	}).css({
		top:    $(original).offset().top + $(original).height() + 3,
		left:   $(original).offset().left
	}).html($(original).attr("data-tooltip")).appendTo("body");
	$(original).mouseout(function() {
		$(tooltip).remove();
	});
};
var autocomplete        = function(e) {
	/*
		Trigger search method
	*/
	if (e.keyCode == 37 || e.keyCode == 38 || e.keyCode == 39 || e.keyCode == 40 || e.keyCode == 13 || e.keyCode == 16) {
		return;
	}
	var searchfield = $("#search-field"),
		value		= searchfield.val(),
		results     = $("#search-results"),
		clearinput 	= $("#clear-input");
	if (!window.lastsearchtimestamp) {
		window.lastsearchtimestamp = Date.now();
	}
	else {
		var timestamp = Date.now()
		window.lastsearchtimestamp = timestamp;
		setTimeout(function() {
			if (timestamp == window.lastsearchtimestamp) {
				search.autocomplete(value);
			}
		}, 500);
	}
	/*
		Hide/show suggestions
	*/
	if (value === "") {
		results.slideUp(300);
		clearinput.hide();

	}
	else {
		results.slideDown(300);
		clearinput.show();
	}
};
var addtrack        = function(e) {
	/*
		Trigger search method
	*/
	if (e.keyCode == 37 || e.keyCode == 38 || e.keyCode == 39 || e.keyCode == 40 || e.keyCode == 13 || e.keyCode == 16) {
		return;
	}
	var searchfield = $(".add-tracks-input"),
		value		= searchfield.val(),
		results     = $(".add-tracks-results");
	if (!window.lastsearchtimestamp) {
		window.lastsearchtimestamp = Date.now();
	}
	else {
		var timestamp = Date.now()
		window.lastsearchtimestamp = timestamp;
		setTimeout(function() {
			if (timestamp == window.lastsearchtimestamp) {
				addtracks.autocomplete(value);
			}
		}, 200);
	}
};
var logout 				= function() {
	var cookies = document.cookie.split(";");

    for (var i = 0; i < cookies.length; i++) {
    	var cookie = cookies[i];
    	var eqPos = cookie.indexOf("=");
    	var name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
    	document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }
    window.location.reload();
};
var addtolib			= function() {
	if (!$(this).hasClass('song') && !$(this).hasClass('library-button')) {
		var toadd = ($(this).parents('.song'))[0];
	}
	else {
		var toadd = this;
	}
	var song = helpers.parseDOM(toadd);
	library.add(song);
}
var remfromlib			= function() {
	if (!$(this).hasClass('song') && !$(this).hasClass('library-remove-button')) {
		var torem = ($(this).parents('.song'))[0];
	}
	else {
		var torem = this;
	}
	var song = helpers.parseDOM(torem);
	library.remove(song);
}
var clearinput 			= function() {
	$("#search-field").val("").keyup();
	window.lastsearchtimestamp = null;
}
var rightclick			= function(e) {
	e.preventDefault()
	var obj = {
		song: helpers.parseDOM(e.currentTarget),
		e: e,
		left: e.pageX
	}
	contextmenu(obj);
}
var playlistmenu 		= function(e) {
	e.preventDefault();
	var obj = {
		e: e,
		left: e.pageX,
		playlist: e.currentTarget
	}
	contextmenu(obj);
}
var contextmenu 		= function(obj) {
	/*
		First, remove all the other contextmenus
	*/
	$('.contextmenu').remove();
	/*
		Build a placeholder for the contextmenu
	*/
	var placeToAppend = obj.song ? '#view' : '#sidebar'
	var scrollHeight = $(placeToAppend)[0].scrollHeight;
	var offsets = {
		top:  obj.e.pageY,
		left: obj.left,
		bottom: document.height - obj.e.pageY
	}
	var pos = (obj.e.pageY < document.height/2) ? offsets.top : offsets.bottom;
	var toporbottom = (obj.e.pageY < (document.height/2)) ? 'top' : 'bottom'
	var menu = $('<div>', {
		class: 'contextmenu',
	}).css({
		left: 	offsets.left
	})
	.css(toporbottom, pos).
	html('<div class="loading-indicator"><div class="spinner"></div></div>').appendTo(placeToAppend);
	/*
		Remove the menu when you click on anything
	*/
	$(document).one('click', function() {
		menu.remove();
	});
	if (obj.song) {
		$(document).one('click', '.contextmenu-add-to-playlist', function(e) {
			$(this).parents('.context-options').html(loader.spinner());
			e.stopPropagation();
			socket.emit('add-playlist-dialogue', {song: this.dataset.id, token: chinchilla.token});
			socket.once('add-playlist-dialog-response', function(data) {
				$('.context-options').html(data.html);
			});
		});
		var song = obj.song;
		/*
			Fetch context menu
		*/
		var output = templates.buildSongContextMenu({song: song, inlib: _.contains(chinchilla.library, parseFloat(song.id)), loggedin: chinchilla.loggedin})
		menu.html(output);
		
	}
	else if (obj.playlist) {
		var playlist = obj.playlist.dataset.navigate;
		socket.emit('get-playlist-contextmenu', {playlist: playlist, state: chinchilla});
		socket.once('playlist-contextmenu', function(data) {
			menu.html(data.html);
		})
	}
}
var setchange			= function() {
	var dom = $('.settings .setting');
	var settings = []
	$.each(dom, function(a, setting) {
		var setting = {
			key: setting.dataset.setting,
			label: $(setting).find('span').text(),
			value: $(setting).find('input').is(':checked')
		}
		settings.push(setting);
		chinchilla.settings[setting.key] = setting.value;
	});
	socket.emit('update-settings', {settings: settings, token: chinchilla.token});
	notifications.create('Saving...')
	socket.once('settings-saved', function() {
		notifications.create('Settings saved.')
	})
}
var ordersongs			= function() {
	var mode,
		header = $(this);
	//Descending
	if 		( header.hasClass('ascending')) 	{ header.addClass('descending'); header.removeClass('ascending');  mode = 'desc'}
	//Normal
	else if ( header.hasClass('descending')) 	{ header.removeClass('descending'); mode = 'default'}
	//Ascending
	else 										{ header.addClass('ascending'); mode = 'asc'} 
	$(header).siblings('th').removeClass('ascending descending')
	var	sortby = (mode == 'default') ? 'index' : header.attr('data-value'),
		table  = header.parents('table').eq(0),
		songs  = $(table).find('.song'),
		sorted = _.sortBy(songs, function(song) { var a = song.dataset[sortby]; return (!isNaN(a) ? parseFloat(a) : a) }),
		revers = (mode == 'desc') ? sorted.reverse() : sorted;
		html   = '';
	/*
		Remove the old songs
	*/
	songs.remove();
	/*
		Add new songs
	*/
	$.each(sorted, function(k, song) {  table.append(song) }  );
}
var playalbum 			= function() {
	var album 		= $(this).parents('.album');
	var songs 		= album.find('.song.recognized');
	var firstsong 	= (songs.splice(0,1))[0];
	player.queue2.clear();
	$.each(songs, function(k, song) {
		player.queue2.add(song);
	});
	player.playSong(firstsong);
}
var findindom 			= function(dom) {
	var id = $(dom).attr("data-id");
	return ($('.song[data-id='+id+']').eq(0))[0];
}
var findandplay 		= function(e) {
	var song = findindom(this);
	if ($(e.currentTarget).hasClass('visual-play-button')) {
		playbutton(song, e);
		return;
	}
	player.playSong(song);
}
var playbutton 			= function(song, event) {
	var track = helpers.parseDOM(song), playing = player.nowPlaying.get();
	if (playing && track.id == playing.id) {
		var state = ytplayer.getPlayerState();
		if (state == 1) {
			ytplayer.pauseVideo();
		}
		else {
			ytplayer.playVideo();
			$('.now-playing').addClass('hearable');
		}
	}
	else {
		player.playSong(track);
		$('.now-playing').addClass('hearable');
	}
}
var findandqueue 		= function() {
	var duration 		= _.pluck(player.queue1.get(), 'duration'),
		totalduration 	= _.reduce(duration, function(a, b) { return a + parseFloat(b) }, 0),
		currentposition = ytplayer.getCurrentTime(),
		songlength 		= ytplayer.getDuration()
		untilplayed 	= totalduration + songlength*1000 - currentposition*1000,
		label 			= helpers.parsehours(untilplayed),
		song 			= findindom(this);
	player.queue1.add(song);
	notifications.create(helpers.parseDOM(song).name + ' was added to the queue. It will be played in ' + label + '.');
}
var addalbumtolib 		= function() {
	var album 		= $(this).parents('.album');
	var songs 		= album.find('.song.recognized');
	var array 		= [];
	$.each(songs, function(key, value) {
		array.push(helpers.parseDOM(value));
	}); 
	library.batchAdd(array);
}
var addtrackskeys 		= function(key) {
	var classname = 'add-tracks-selected'
	if (key == 13) {
		$('.'+classname).click();
	}
	else {
		var dom = $('.' + classname);
		var direction = (key == 38) ? 'prev' : 'next'
		var next = dom[direction]('a');
		if (next.length != 0) {
			$(next)	.addClass(classname);
			$(dom)	.removeClass(classname);
		}
	}
}
var searchkeys 			= function(key) {
	var classname = 'search-selected'
	if (key == 13) {
		$('.'+classname).mousedown();
	}
	else {
		var dom = $('.' + classname);
		var direction = (key == 38) ? 'prev' : 'next'
		var next = dom[direction]('li');
		if (next.length != 0) {
			$(next)	.addClass(classname);
			$(dom)	.removeClass(classname);
		}
	}
}
var keys 				= function(e) {
	var key = e.keyCode;
	/*
		Don't trigger this function when focus is in input
	*/
	var srcElement = e.srcElement || e.target;
	if ($(srcElement).is('input') && !($(srcElement).is('.add-tracks-input')) && !($(srcElement).is('#search-field'))) {
		return;
	}
	e.preventDefault();
	/*
		Down key
	*/
	if (key == 40 || key == 38) {
		e.preventDefault();
		e.stopPropagation();
		if ($('.add-tracks-dropdown').is(':visible')) {
			addtrackskeys(key)
			return;
		}
		if ($('#search-field').is(':focus')) {
			searchkeys(key)
			return;
		}
		var thissong = $('.song.selected')
		var upordown = (key == 40) ? 'next' : 'prev';
		var next = thissong[upordown]('.song').addClass('selected');
		if (!e.shiftKey && next.length != 0) {
			thissong.removeClass('selected');
		}
	}
	/*
		Enter key
	*/
	if (key == 13) {
		if ($('.add-tracks-dropdown').is(':visible')) {
			addtrackskeys(key)
			return;
		}
		if ($('#search-results').is(':visible')) {
			e.preventDefault();
			searchkeys(key)
			return;
		}
		var songs 		= $('.song.selected.recognized');
		var last 		= songs[songs.length-1];
		var firstsong 	= songs.splice(0,1);
		player.playSong(firstsong[0]);
		player.queue2.clear();
		_.each(songs, function(song) {
			player.queue1.add(song);
		});
		var queue2 = $(last).nextAll('.song.recognized');
		$.each(queue2, function(key, song) {
			player.queue2.add(helpers.parseDOM(song));
		});
	}
	if (key == 39) {
		player.playNext();
	}
	if (key == 37) {
		player.playLast();
	}
	if (key == 32) {
		if (!$('input').is(':focus')) {
			player.togglePlayState()
		}
	} 

}
var hidenotification  	= function() {
	$(this).parents('.notification').remove()
}
var warnexit 			= function() {
	if (chinchilla.loggedin && chinchilla.settings.warn_before_leave) {
		return 'You are leaving the page but the music is still playing. Do you really want to leave? (You can turn this notification off in the settings)';
	}	
}
var showalbum 			= function() {
	$(this).hide().next('.hidden-album-container').show();
}
var newplaylist 		= function() {
	$(".new-playlist-input").show().find("input").val('').focus();
	$('html').one('click', function() {
		$(".new-playlist-input").hide().off();
		$('.new-playlist-input-field').off();
	});
	$('.new-playlist-input').on('click', function(e) {
		e.stopPropagation();
	});
	$('.new-playlist-input-field').on('keypress', submitplaylist);

}
var submitplaylist 		= function(e) {
	if (e.keyCode == 13) {
		var inputfield 	= $('.new-playlist-input-field'),
			input 		= inputfield.val()
		inputfield.off();
		socket.emit('add-playlist', {name: input, token: chinchilla.token});
	}
}
var renameplaylist 		= function() {
	var url = this.dataset.id,
		name = this.dataset.name;
	var playlist = $('#sidebar [data-navigate="' + url+ '"]');
	var label = playlist.find('.pl-label').attr('contenteditable', true).focus();
	$(label).on('keypress', function(e) {
		if (e.keyCode == 13) {
			$(label).off().removeAttr('contenteditable');
			$('body').off();
			socket.emit('rename-playlist', {oldname: url, newname: $(label).text(), token: chinchilla.token});
			$(playlist).hide();
		}
	});

	function selectElementContents(el) {
	    var range = document.createRange();
	    range.selectNodeContents(el);
	    var sel = window.getSelection();
	    sel.removeAllRanges();
	    sel.addRange(range);
	}
	selectElementContents($(label)[0]);
	$('body').one('click', function() {
		$(label).off().removeAttr('contenteditable');
		$(label).text(name);
	});
	$(label).on('click', function(e) {
		e.stopPropagation();
	});
}
var deleteplaylist 		= function() {
	var url = this.dataset.id;
	var playlist = $('#sidebar [data-navigate="' + url+ '"]');
	socket.emit('delete-playlist', {url: url, token: chinchilla.token});
}
var suppressrenaming 	= function(e) {
	e.stopPropagation();
}
var addsongtopl 		= function() {
	var data = this.dataset;
	var socketdata = {
		type: 'playlist',
		tracks: [data.songid],
		token: chinchilla.token,
		destination: data.url
	}
	socket.emit('add-tracks-to-collection', socketdata);
	notifications.create('Adding...')
}
var remsongfrompl 		= function() {
	var data = this.dataset;
	data.token = chinchilla.token;
	data.songid = parseFloat(data.songid);
	socket.emit('remove-song-from-playlist', data);
}
var pldropdown 			= function() {
	$('.playlist-options-dropdown').toggle();
	if ($('.playlist-options-dropdown').is(':visible')) {
		$('body').one('click contextmenu', function() {
			$(".playlist-options-dropdown").hide();
		});
		$('.playlist-options-dropdown').html(loader.spinner());
		socket.emit('get-playlist-options', {playlist: $('#view').attr('data-route'), token: chinchilla.token });
		socket.once('playlist-options', function(data) {
			$('.playlist-options-dropdown').html(data.html);
		});
	}
}
var addtracksdd 		= function() {
	$('.add-tracks-dropdown').toggle();
	if ($('.add-tracks-dropdown').is(':visible')) {
		$('body').one('click contextmenu', function() {
			$(".add-tracks-dropdown").hide();
		});
		$('.add-tracks-dropdown').on('click contextmenu', function(e) {
			e.stopPropagation();
		});
		$('.add-tracks-input').focus();
	}
}
var mkplpublic 			= function() {
	var playlist 	= $('#view').attr('data-route');
	var label 		= $('.playlist-privacy')
	socket.emit('change-playlist-privacy', {playlist: playlist, token: chinchilla.token, 'public': true});
}
var mkplprivate 		= function() {
	var playlist 	= $('#view').attr('data-route');
	var label 		= $('.playlist-privacy');
	socket.emit('change-playlist-privacy', {playlist: playlist, token: chinchilla.token, 'public': false});
}
var mkplnwattop 		= function() {
	var url 	= $('#view').attr('data-route');
	var label 		= $('.playlist-privacy');
	socket.emit('change-playlist-order', {playlist: url, token: chinchilla.token, 'newestattop': true});
	chinchilla.playlists = _.map(chinchilla.playlists, function (playlist) {
		if (playlist.url == url) {
			playlist.newestattop = true;
		}
		return playlist;
	});
}
var mkplnwatbottom 		= function() {
	var url 	= $('#view').attr('data-route');
	var label 		= $('.playlist-privacy');
	socket.emit('change-playlist-order', {playlist: url, token: chinchilla.token, 'newestattop': false});
	chinchilla.playlists = _.map(chinchilla.playlists, function (playlist) {
		if (playlist.url == url) {
			playlist.newestattop = false;
		}
		console.log(playlist, url)
		return playlist;
	});
}
var closenotification 	= function() {
	$('#statusbar').hide();
}
var playallsongs 		= function() {
	var songs 			= $('.song'),
		songs 			= _.shuffle(songs),
		firstsong 		= songs.splice(0,1)[0];
	player.queue2.clear();
	$.each(songs, function(k, song) {
		player.queue2.add(song);
	});
	player.playSong(firstsong);
}
var hoversearchresult 	= function() {
	var classname = 'search-selected';
	$('.' + classname).removeClass(classname);
	$(this).addClass(classname);
}
var filterdropdown 		= function() {
	$('.filter-dropdown').toggle();
	if ($('.filter-dropdown').is(':visible')) {
		$('body').one('click contextmenu', function() {
			$(".filter-dropdown").hide();
		});
		$('.filter-dropdown').on('click contextmenu', function(e) {
			e.stopPropagation();
		});
	}
	$('.filter-dropdown').html(_.template(templates.buildFilter()));
} 
var tableheadersticky = false;
$(document)
.on('mousedown',    'tr.song',            				select      		) // Selecting tracks
.on('keyup',		'body',								keys				) // Keys
.on('dblclick',     '.song',            				playSong    		) // Doubleclick to play. Just POC yet.
.on('mousedown',    '#seek-bar',         				dragSeek			) // Block autmatic seeking while dragging
.on('click',        '#play',            				resume      		) // Play or resume song.
.on('click',        '#pause',           				pause				) // Pause music.
.on('click',        '#skip',            				skip				) // Skip track. Play next one.
.on('click',        '#rewind',          				rewind				) // Go back to previous track.
.on('mouseover',    '[data-tooltip]',   				tooltip     		) // Show small black tooltips.
.on('keyup',        '#search-field',    				autocomplete		) // Show suggestions when user types into search.
.on('keyup',        '.add-tracks-input',    			addtrack 			) // Show suggestions when user types into search.
.on('click',		'#clear-input',						clearinput  		) // Delete everything in the search field.
.on('click',        '.play-button',     				playSong			) // Play buttons are in track views for instance.
.on('click',		'.library-button',					addtolib			) // Sends a request to the server to save the song.
.on('click',		'.library-remove-button', 			remfromlib			) // Sends a request to the server to remove the song.
.on('click',		'.not-in-library .heart',			addtolib 			) // Inline add to library
.on('click',		'.in-library .heart',				remfromlib 			) // Inline remove from library
.on('click',		'#logout',							logout				) // Logout
.on('contextmenu',	'.song.recognized, .queue-song',	rightclick  		) // Allows users to right-click
.on('contextmenu',	'.playlistmenuitem',				playlistmenu 		) // Gives options for playlists.
.on('change',		'.settings input',					setchange			) // New settings were made
.on('click',		'[data-order]',						ordersongs			) // Click on table header to sort songs.
.on('click',		'.play-all-album',					playalbum 			) // Play all the songs on one album
.on('click', 		'.add-all-album',					addalbumtolib		) // Add all tracks to an album
.on('click',		'.findandplay',						findandplay 		) // Searches for a track in the DOM and plays it
.on('click',		'.findandqueue',					findandqueue 		) // Equivalent for 'findandplay' but for queueing
.on('click', 		'.notification .actions span',		hidenotification	) // Close notifications
.on('click',		'.albumhidden-message',				showalbum 			) // Show albums that are only instrumentals or EPs
.on('click',		'.add-new-playlist',				newplaylist 		) // New playlist
.on('click',		'.rename-playlist-button',			renameplaylist 		) // Rename playlist
.on('click', 		'.pl-label[contenteditable]',		suppressrenaming 	) // When you click on a playlist to rename, don't load the playlist
.on('click', 		'.delete-playlist-button',			deleteplaylist 		) // Delete playlist.
.on('click',		'.add-song-to-playlist-button', 	addsongtopl 		) // Add a song to a playlist 
.on('click',		'.remove-song-from-playlist-button',remsongfrompl 		) // Remove song from playlist
.on('click', 		'.playlist-privacy',		 		pldropdown 			) // click to reveal privacy options
.on('click', 		'.add-tracks-quickly',		 		addtracksdd 		) // click to reveal privacy options
.on('click', 		'.make-playlist-public', 			mkplpublic 			) // Contextmenu option to make playlist public
.on('click', 		'.make-playlist-private',			mkplprivate 		) // Contextmenu option to make playlist private
.on('click', 		'.make-playlist-newest-at-top',		mkplnwattop 		) // Puts the newest songs at the top of the playlist.
.on('click', 		'.make-playlist-newest-at-bottom',	mkplnwatbottom 		) // Puts the newest songs at the bottom of the playlist.
.on('click',		'.close-notification', 				closenotification 	) // Dismiss popup messages
.on('click', 		'.play-all-songs',					playallsongs 		) // Play all songs button
.on('hover',		'#search-results-wrapper li',		hoversearchresult 	) // Add visual indicator for search when hovering
.on('click', 		'.show-filter-dropdown', 			filterdropdown 		) // Filter dropdown
$(window)
.on('beforeunload', 									warnexit			) // Warn before exit (Only when user set it in settings!

/*
	When new tracks are in the DOM, there are some things we should do on the client-side...
*/
$(document).ready(function() {
	$.subscribe('new-tracks-entered-dom', function() {
		var unrecognized = $('.not-recognized');
		recognition.queue.clear();
	    _.each(unrecognized, function(track) {
	    	recognition.queue.push(track);
		});
		var nowPlaying = player.nowPlaying.get();
		if (nowPlaying) {
			var song = $('.song[data-id="' + nowPlaying.id + '"]')
			song.addClass('now-playing');
			if (ytplayer.getPlayerState && ytplayer.getPlayerState() == 1) {
				song.addClass('hearable')
			}
		}
		
	});
	$.subscribe('view-gets-loaded', function() {
		$('#view').addClass('view-loading');
	});
	$.subscribe('view-got-loaded', function() {
		$('#view').removeClass('view-loading');
	});
});;/*! Tiny Pub/Sub - v0.7.0 - 2013-01-29
* https://github.com/cowboy/jquery-tiny-pubsub
* Copyright (c) 2013 "Cowboy" Ben Alman; Licensed MIT */
(function($) {

  var o = $({});

  $.subscribe = function() {
    o.on.apply(o, arguments);
  };

  $.unsubscribe = function() {
    o.off.apply(o, arguments);
  };

  $.publish = function() {
    o.trigger.apply(o, arguments);
  };

}(jQuery));;var SongsCollection, PlaylistCollection
var storeReady = function() {
	SongsCollection = songsdb;
}
var plStoreReady = function() {
	PlaylistCollection = pldb;
}
var songsdb = new IDBStore({storeName: 'songs'}, storeReady),
	pldb 	= new IDBStore({storeName: 'playlists'}, plStoreReady);
DB = {};
DB.getTracks = function(obj) {
	if (SongsCollection) {
		songsdb.query(function (tracks) {
			var matches 		= _.map(tracks, function (track) { return _.contains(obj.ids, track.id) ? track : null});
			var flattened  		= _.compact(matches);
			var withinlibdata	= _.map(flattened, function(track) { track.inlib = _.contains(chinchilla.library, track.id); return track });
			obj.callback(withinlibdata);
		});
	}
	else {
		setTimeout(function() { DB.getTracks(obj) }, 100);
	}
	
}
DB.addTrack = function(obj) {
	if (SongsCollection) {
		songsdb.put(obj);
	}
	else {
		setTimeout(function() { DB.addTrack(obj) }, 100);
	}
};remote = {
	updateTrack: function() {
		if (chinchilla.paired) {
			console.log('Paired');
			socket.emit('/pairing/update-info', { playing: player.nowPlaying.get(), code: chinchilla.paired });
		}
	}
}