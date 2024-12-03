// <제네릭 사용하여 map , filter , flatMap 구현하기>

// 1. <map> : arr.map(callback(currentValue[, index[, array]])[, thisArg])
function map<T, U>(
  arr: T[],
  callback: (el: T, index: number, originalArr: T[]) => U,
  thisArg?
): U[] {
  const result: U[] = [];

  for (let i = 0; i < arr.length; i++) {
    const value = callback.call(thisArg, arr[i], i, arr);
    result.push(value);
  }

  return result;
}

// console.log(map([1, 2, 3, 4], (n) => (n < 2 ? true : false))); // [t,t,f,f]
// console.log(map([1, 2, 3, 4], (n) => `${n + 1}`)); // ['2','3','4',5']
// console.log(map([1, 2, 3], (n, index, array) => array[index] + n)); // [2, 4, 6]

// 2. <filter> : filter(callback(currentValue[, index[, array]]), [thisArg])
function filter<T>(
  arr: T[],
  callback: (el: T, index: number, originalArr: T[]) => boolean,
  thisArg?: any
): T[] {
  const result: T[] = [];

  for (let i = 0; i < arr.length; i++) {
    const value = callback.call(thisArg, arr[i], i, arr);
    if (value) {
      result.push(arr[i]);
    }
  }

  return result;
}

// console.log(filter([1, 2, 3, 4], (n) => n < 2)); // [1, 2]
// console.log(filter(["a", "bb", "cccc", "dddd"], (s) => s.length <= 2)); // ["a","bb"]

// 3. <flatMap> : flatMap(callbackFn(currentValue[, index[, array]]), thisArg)
function flatMap<T, U>(
  arr: T[],
  callback: (el: T, index: number, originalArr: T[]) => U[],
  thisArg?: any
): U[] {
  const result: U[] = [];

  for (let i = 0; i < arr.length; i++) {
    const value = callback.call(thisArg, arr[i], i, arr);
    result.push(...value);
  }

  return result;
}

// console.log(flatMap([1, 2, 3], (n) => [n, n * 2])); // [1, 2, 2, 4, 3, 6]
// console.log(flatMap(["hello", "world"], (word) => word.split(""))); // ['h', 'e', 'l', 'l', 'o', 'w', 'o',..]
// console.log(flatMap([[1], [2], [3], [4]], (el) => el.map((n) => n * 2))); // [ 2, 4, 6, 8 ]
