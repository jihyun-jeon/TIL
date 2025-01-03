# 00011-easy-tuple-to-object

## **문제**

배열(튜플)을 받아, 각 원소의 값을 key/value로 갖는 오브젝트 타입을 반환하는 타입을 구현하세요.

예시

```tsx
  const tuple = ['tesla', 'model 3', 'model X', 'model Y'] as const

  type result = TupleToObject<typeof tuple> // expected { 'tesla': 'tesla', 'model 3': 'model 3', 'model X': 'model X', 'model Y': 'model Y'}
```

## 정답

```tsx
/* _____________ 정답 _____________ */

// type TupleToObject<T extends readonly any[]> = any


// keyof any => string | number | symbol
type TupleToObject<T extends readonly (keyof any)[]> = { [Key in T[number]]: Key}


/* _____________ 테스트 케이스 _____________ */
import type { Equal, Expect } from '@type-challenges/utils'

const tuple = ['tesla', 'model 3', 'model X', 'model Y'] as const
const tupleNumber = [1, 2, 3, 4] as const
const sym1 = Symbol(1)
const sym2 = Symbol(2)
const tupleSymbol = [sym1, sym2] as const
const tupleMix = [1, '2', 3, '4', sym1] as const

type cases = [
  Expect<Equal<TupleToObject<typeof tuple>, { 'tesla': 'tesla', 'model 3': 'model 3', 'model X': 'model X', 'model Y': 'model Y' }>>,
  Expect<Equal<TupleToObject<typeof tupleNumber>, { 1: 1, 2: 2, 3: 3, 4: 4 }>>,
  Expect<Equal<TupleToObject<typeof tupleSymbol>, { [sym1]: typeof sym1, [sym2]: typeof sym2 }>>,
  Expect<Equal<TupleToObject<typeof tupleMix>, { 1: 1, '2': '2', 3: 3, '4': '4', [sym1]: typeof sym1 }>>,
]

// @ts-expect-error
type error = TupleToObject<[[1, 2], {}]>

```

설명

-  TupleToObject 제네릭을 readonly , typeof any(string,number,symbol)로 제한시킨다.
-  이후 제한시킨 값 바탕으로 {key,value} 가 생성되도록 한다.


 
## 노트

✅ 정답

```tsx
const tuple = ['tesla', 'model 3', 'model X', 'model Y'] as const
const tuple = [1, 2, 3, 4] as const
const tuple = [Symbol(1),Symbol(2)] as const
TupleToObject<typeof tuple>

// type TupleToObject<T extends readonly any[]> = any
 type TupleToObject<T extends readonly (keyof any)[]>  = { [Key in T[number]]: Key}
```


<br/>

✅ 튜플

**1. 튜플과 배열의 차이**

| **특징** | **튜플** | **배열** |
| --- | --- | --- |
| 길이 | 고정됨 | 가변적 |
| 읽기 전용 여부 | `readonly`를 추가해 읽기 전용으로 사용 가능 | 읽기 전용은 별도로 설정 필요 |
| 타입 | 각 요소의 타입이 다를 수 있음 | 모든 요소가 동일한 타입일 가능성 높음 |
| 예시 | `[string, number]` | `string[]`, `number[]` |

<br/>

**2. 튜플**

- 고정된 길이 : length가 고정되어 있다.
- 요소별 타입 고정 : 배열의 모든 요소는 고정된 타입이고, 요소의 순서도 고정이다.

```jsx
let user:[string,number];
user = ['Alice', 30]; // ㅇ

user = ['Alice', 30, 40]; // 오류남 - 고정된 길이 아님
user = [true, 30]; // 오류남 - 고정된 타입이 아님
user = [30 , 'Alice']; // 오류남 - 요소 순서 고정되지 않음
```

**3. 읽기 전용 튜플**

- `readonly`를 사용하여 튜플을 읽기 전용으로 만들면, 튜플의 내용을 변경할 수 없다.

```jsx
const user: readonly [string, number] = ['Bob', 25];
user[0] = 'Alice'; // 오류: 읽기 전용이므로 수정 불가능
```

---
<br/>

✅ as const

```tsx
const tuple = ['tesla', 'model 3', 'model X', 'model Y'] as const
TupleToObject<typeof tuple>
```

1. `as const`는 배열이나 객체를 **리터럴 타입**으로 고정시킨다.<br/>
 이로 인해 배열의 각 요소나 객체의 값이 정확한 타입으로 추론된다.
- `tuple`은 `as const`로 인해 **리터럴 튜플 타입**이 된다. <br/>
즉, `tuple`은 `"tesla"`, `"model 3"`, `"model X"`, `"model Y"`라는 **구체적인 문자열**들만 포함하는 배열로 타입이 고정되는 것이다.<br/>
즉, `tuple`의 타입은 `['tesla' | 'model 3' | 'model X' | 'model Y']`와 같은 리터럴 유니온 타입이 된다.

---
<br/>


✅ `typeof` 연산자

- 자바스크립트에는 이미 `typeof` 연산자가 존재하는데, 타입을 사용하는 환경에서 `typeof` 연산자를 사용하면 이를 타입으로 나타낼 수 있다.
    
    ```jsx
    let s = "hello"; // s의 타입은 string
    
    // string이라고 표기하지 않고 typeof s로도 표현할 수 있다.
    let n: typeof s = "world";
    ```
    
- 이를 활용하면 특정 객체를 타입으로 사용할 수 있다.
    
    ```jsx
    const fruit = {
    	red: 'apple',
    	yellow: 'banana',
      	purple: 'grape'
    }
    
    // 객체인 fruit의 프로퍼티를 전체를 타입으로 사용하겠다고 선언
    type Fruit = typeof fruit
    
    // 즉 다음과 같다.
    type Fruit {
    	red: string,
    	yellow: string,
    	purple: string
    }
    ```
    

- 이 코드에서 `tuple`, `tupleNumber`, `tupleSymbol`, `tupleMix`는 모두 `as const`로 정의되어 있어서 각각 **리터럴 타입 튜플**로 인식된다.

    ```tsx
    const tuple = ['tesla', 'model 3', 'model X', 'model Y'] as const
    TupleToObject<typeof tuple>
    ```

- 따라서 `typeof tuple`의 타입은 `readonly ['tesla', 'model 3', 'model X', 'model Y']`이다. <br/>
즉, `tuple`은 읽기 전용 배열이고, 각 요소는 해당 문자열 리터럴 타입이다.

---
<br/>

✅ `TupleToObject<T extends readonly (keyof any)[]>` 

```jsx
TupleToObject<['tesla', 'model 3']>;  
TupleToObject<[1, 2, 3]>;             
TupleToObject<[Symbol , Symbol]>,

type TupleToObject<T extends readonly (keyof any)[]> 
 = { [Key in T[number]]: Key}
```

1. T는 타입 매개변수
- `readonly ['tesla', 'model 3', 'model X', 'model Y']` 와 같은 **리터럴 튜플**
- `readonly[1,2,3,]`와 같은 **리터럴 튜플**이다.
- 
<br/>

2. T는 반드시 읽기전용 배열이여야 한다. `T extends readonly (keyof any)[]` 
- 튜플이기 때문에 요소의 값이 고정되어야 한다. (첫번째 값은 “tesla”이고, 두번째값은 “model 3”이고 고정)
- 때문에 T가 읽기 전용 배열의 요소인지 검사해야 한다.
- 배열이 튜플인지 여부를 추론하도록 하기 위해 readonly를 붙이는 것이다.
- 만약 수정 가능한 배열을 허용한다면, 아래와 같은 문제 발생할 수 있다.
    
    ```jsx
    type TupleToObject<T extends (keyof any)[]> = { [Key in T[number]]: Key };
    
    const arr = ['tesla', 'model 3'];
    const obj: TupleToObject<typeof arr> = {
        tesla: 'tesla',
        'model 3': 'model 3',
    };
    
    arr.push('new model'); // 배열이 수정되면 obj와의 일관성이 깨진다!
    ```

<br/> 

3. `keyof any` 
- `keyof any`는 객체 키로 사용할 수 있는 모든 타입(`string | number | symbol`)을 나타낸다.
- `any`는 **모든 타입을 허용하는 타입**인데, `keyof` 연산자를 적용하면 **객체의 키**로 허용되는 타입이 무엇인지 묻는 것이 된다.
- **`any` 타입을 객체처럼 취급**하면, 객체의 **key**는 **`string`**, **`number`**, `symbol`만 될 수 있기 때문에, `keyof any`는 `string | number | symbol` 로 추론됩니다. // [질문]
- `any` 타입에 대해서 `keyof`를 실행하면, **객체의 키로 가능한 타입**만 반환됩니다.
`keyof any`는 `string | number | symbol`로 평가됩니다.
- https://stackoverflow.com/questions/55535598/why-does-keyof-any-have-type-of-string-number-symbol-in-typescript

---
<br/>

✅ `T[number]`

1. 배열 T타입이 있을때 인덱스로 특정 요소에 접근할 수 있다.
    
    ```jsx
    type ArrayType = [1, 2, 3];
    
    type FirstElement = ArrayType[0];  // 1
    type SecondElement = ArrayType[1]; // 2
    type ThirdElement = ArrayType[2];  // 3
    ```
    

1. `T[number]`는 
TypeScript에서 배열이나 튜플 타입에서 특정 **인덱스 타입**을 추출하는 방법이다.<br/>
이 표현식은 주로 **배열의 모든 원소의 타입**을 유니온 타입으로 추출하게된다.<br/>
 - `number`는 배열 인덱스를 의미한다.
 배열의 **각각의 인덱스**는 **`number`** 타입이기 때문에 `number`를 사용하여 배열에서 **모든 가능한 인덱스를 참조**할 수 있는 것이다.
 - `T[number]`는 **배열 `T`의 모든 인덱스**에 대해 그 **인덱스에 해당하는 원소**를 다루게된다.
 - 반환 - `T[number]`는 **배열 `T`의 모든 인덱스**를 순회하여 그 **인덱스에 대응하는 값의 타입**을 모두 모아서 **유니온 타입**으로 반환하게된다. <br/> 배열의 **각 원소 타입**이 모두 유니온 타입으로 모인 결과가 반환되는 것이다.
     
     ```jsx
     type ArrayType = ['tesla', 'model 3', 'model X'];
     
     type ElementType = ArrayType[number];  // 'tesla' | 'model 3' | 'model X'
     
     ```
     

---
<br/>

✅ `{ Key in T[number]]: Key }`

Mapped Type 을 사용하여 객체 타입을 생성하는데

유니온 타입을 순차적으로 key로 받아 새로운 {키:값} 형태의 새로운 타입을 생성하는 것이다.

```jsx
type Result = { [Key in 'tesla' | 'model 3']: Key };
// {
//   tesla: 'tesla';
//   'model 3': 'model 3';
// }
```