// Introduction //////////////////////////////

function sum(a: number, b: number): number {
    return a + b;
}

console.log("Eager sum:\t", sum(10 + 5, 20));

type Lazy<T> = () => T

function lazySum(a: Lazy<number>, b: Lazy<number>): Lazy<number> {
    return () => a() + b();
}

console.log("Lazy sum:\t", lazySum(() => 10 + 5, () => 20)());

// Avoiding big computations that are not needed //////////////////////////////

function hang<T>(): T {
    return hang()
}

function first(a: number, b: number): number {
    return a;
}

function lazyFirst(a: Lazy<number>, b: Lazy<number>): Lazy<number> {
    return a;
}

console.log("Lazy First: ", lazyFirst(() => 10, () => hang())());

// Short-circuit computation //////////////////////////////

console.log("\n==============================\n");

function and(a: Lazy<boolean>, b: Lazy<boolean>): Lazy<boolean> {
    return () => !a() ? false : b();
}

function trace<T>(x: Lazy<T>, message: string): Lazy<T> {
    return () => {
        console.log(message);
        return x();
    }
}

console.log("false && false ==", and(trace(()=> false, "L"),
                                     trace(()=> false, "R"))());
console.log("true && false ==", and(trace(()=> true, "L"),
                                    trace(()=> false, "R"))());
console.log("true && true ==", and(trace(()=> true, "L"),
                                   trace(()=> true, "R"))());
console.log("false && true ==", and(trace(()=> false, "L"),
                                    trace(()=> true, "R"))());

function or(a: Lazy<boolean>, b: Lazy<boolean>): Lazy<boolean> {
    return () => a() ? true : b();
}

console.log("---");
console.log("false || false ==", or(trace(()=> false, "L"),
                                    trace(()=> false, "R"))());
console.log("true || false ==", or(trace(()=> true, "L"),
                                   trace(()=> false, "R"))());
console.log("true || true ==", or(trace(()=> true, "L"),
                                  trace(()=> true, "R"))());
console.log("false || true ==", or(trace(()=> false, "L"),
                                   trace(()=> true, "R"))());

// Infinite Data Structures //////////////////////////////

type LazyList<T> = Lazy<{
    head: Lazy<T>,
    tail: LazyList<T>
} | null>

console.log("\n==============================\n");

function toList<T>(xs: T[]): LazyList<T> {
    return () => {
        if (xs.length === 0) {
            return null;
        } else {
            return {
                head: () => xs[0],
                tail: toList(xs.slice(1))
            };
        }
    };
}

console.log(toList([1, 2, 3]));
console.log(toList([1, 2, 3])());
console.log(toList([1, 2, 3])().head());
console.log(toList([1, 2, 3])().tail().head());
console.log(toList([1, 2, 3])().tail().tail().head());
console.log(toList([1, 2, 3])().tail().tail().tail());

function range(begin: Lazy<number>): LazyList<number> {
    return () => {
        let x = begin();
        return {
            head: () => x,
            tail: range(() => x + 1)
        };
    }
}

console.log("---");

console.log(range(() => 3));
console.log(range(() => 3)());
console.log(range(() => 3)().head());
console.log(range(() => 3)().tail().head());
console.log(range(() => 3)().tail().tail().head());
console.log(range(() => 3)().tail().tail().tail().head());
console.log(range(() => 3)().tail().tail().tail().tail().head());

function printList<T>(xs: LazyList<T>) {
    let pair = xs()
    while(pair !== null) {
        console.log(pair.head());
        pair = pair.tail()
    }
}

console.log("---");

printList(toList([1, 2, 3, 4, 5]));

console.log("---");

function take<T>(n: Lazy<number>, xs: LazyList<T>): LazyList<T> {
    return () => {
        let m = n();
        let pair = xs();
        if (m > 0) {
            return {
                head: pair.head,
                tail: take(() => m - 1, pair.tail)
            }
        } else {
            return null;
        }
    };
}

printList(take(() => 10, range(() => 3)));

function filter<T>(f: (T) => boolean, xs: LazyList<T>): LazyList<T> {
    return () => {
        let pair = xs();
        if (pair === null) {
            return null;
        } else {
            let x = pair.head();
            if (f(x)) {
                return {
                    head: () => x,
                    tail: filter(f, pair.tail)
                };
            } else {
                return filter(f, pair.tail)();
            }
        }
    };
}

console.log("---");

printList(
    take(() => 10,
         filter((x) => x % 2 === 0,
                range(() => 1))));


console.log("\n==============================\n");

function sieve(xs: LazyList<number>): LazyList<number> {
    return () => {
        let pair = xs();
        if (pair === null) {
            return null;
        } else {
            let y = pair.head();
            return {
                head: () => y,
                tail: sieve(filter((x) => x % y !== 0, pair.tail))
            };
        }
    };
}

let prime = sieve(range(() => 2));

printList(take(() => 10, prime));
