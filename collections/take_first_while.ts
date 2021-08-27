// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.

export function takeFirstWhile<T>(collection: Array<T>, predicate: (el: T) => boolean): Array<T> {
    if (collection.length === 0) {
        return [];
    }

    let newArray: Array<T> = [];
    
    for (let i of collection) {
        if (predicate(i)) {
            newArray.push(i);
        } else {
            break;
        }
    }

    return newArray;
}