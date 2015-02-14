'use strict';

/* global angular: true */

function parseHeaders(headers) {
    var parsed = {},
    key, val, i;
    if (!headers) return parsed;
    angular.forEach(headers.split('\n'), function(line) {
        i = line.indexOf(':');
        key = angular.lowercase(trim(line.substr(0, i)));
        val = trim(line.substr(i + 1));
        if (key) {
            parsed[key] = parsed[key] ? parsed[key] + ', ' + val : val;
        }
    });

    return parsed;
}

function trim(value) {
    return angular.isString(value) ? value.trim() : value;
}

function isPromiseLike (obj){
    return obj && angular.isFunction(obj.then);
}

// copied from angular
function headersGetter(headers) {
    var headersObj = angular.isObject(headers) ? headers : undefined;
    return function(name) {
        if (!headersObj) headersObj = parseHeaders(headers);
        if (name) {
            var value = headersObj[angular.lowercase(name)];
            if (value === void 0) {
                value = null;
            }
            return value;
        }
        return headersObj;
    };
}
