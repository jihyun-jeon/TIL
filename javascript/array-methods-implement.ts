// <제네릭 사용하여 map , filter , flatMap 구현하기>

// 1. <map> : arr.map(callback(currentValue[, index[, array]])[, thisArg])
function map<T, U>(
  arr: T[],
  callback: (el: T, index: number, originalArr: T[]) => U,
  thisArg?: any
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
// flatMap의 callback의 리턴값은 배열인데, 그 배열을 한단계 평탄화한 값이 flatMap의 리턴값이 된다.
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

// 4. flatMap으로 map 구현하기
// callback의 실행 결과(배열)가 이중배열이 되도록 처리
// 배열을 반환하는 기존 콜백함수 대신, 이중배열을 반환하는 새로운 callback 함수를 만들어서 flatMap 실행

function flatMapToMap<T, U>(
  arr: T[],
  callback: (el: T, index: number, originalArr: T[]) => U[],
  thisArg?: any
): U[][] {
  return flatMap(arr, (el, index, arr) => [callback(el, index, arr)]);
}

console.log(flatMap([1, 2, 3], (n) => [n, n * 2])); // [1, 2, 2, 4, 3, 6]
console.log(flatMapToMap([1, 2, 3], (n) => [n, n * 2])); // [ [ 1, 2 ], [ 2, 4 ], [ 3, 6 ] ]

/*
[노트]

[P1] flatMap이 map 보다 자유도가 높다.
왜? : map은 동일한 길이의 배열만 나와야 하는데, flatMap은 길이 다르게 나와도 된다.
때문에 flatMap으로 map을 구현할 수 있지만, map으로 flatMap을 구현할 수 없다. 

*/
