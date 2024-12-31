# 00007-easy-readonly

## **문제**

`T`의 모든 프로퍼티를 읽기 전용(재할당 불가)으로 바꾸는 내장 제네릭 `Readonly<T>`를 이를 사용하지 않고 구현하세요.

예시

```tsx
  interface Todo {
    title: string
    description: string
  }

  const todo: MyReadonly<Todo> = {
    title: "Hey",
    description: "foobar"
  }

  todo.title = "Hello" // Error: cannot reassign a readonly property
  todo.description = "barFoo" // Error: cannot reassign a readonly property
```

## 정답

```tsx
/* _____________ 정답 _____________ */
 
type MyReadonly<T> = {
  readonly [P in keyof T] : T[P]
}
 
/* _____________ 테스트 케이스 _____________ */
import type { Equal, Expect } from '@type-challenges/utils'

type cases = [
  Expect<Equal<MyReadonly<Todo1>, Readonly<Todo1>>>,
]
 
interface Todo1 {
  title: string
  description: string
  completed: boolean
  meta: {
    author: string
  }
}
```

설명
1. T 제네릭 받기
   - `MyReadonly<T>` 는 제네릭 타입 T를 인수로 받는다.
   - Todo1가 T 로 들어오게 된다.
2. keyof T를 순회
   - 이후 T의 프로퍼티명을 유니온 타입으로 만든 후
   - T의 모든 키를 순회하면서 새로운 타입의 키P로 만든다.
3. readonly를 붙이기
   - 이때 P에 readonly를 추가하여 읽기 속성으로 만든다.
   - 최종적으로 읽기 전용인 새로운 객체 타입이 생성된다.

 
## 노트
 ### ✅ `Readonly<T>` 내장 제네릭 
 1. 정의 : 객체 타입 T의 모든 프로퍼티를 읽기전용으로 만듦 
 2. 적용 대상 : 전체 객체의 모든 프로퍼티에 사용됨
- 특징: 타입 변환을 수행하여 새로운 객체 타입을 생성한다.
```ts
interface Todo {
  title: string;
  description: string;
}

type ReadonlyTodo = Readonly<Todo>;

const todo: ReadonlyTodo = {
  title: "Learn TypeScript",
  description: "Study daily",
};

// todo의 모든 프로퍼티가 readonly로 변환됨
todo.title = "New Title"; // Error: title is readonly
```

 ### ✅ `readonly` 키워드
 1. 정의 : 객체의 특정 프로퍼티를 읽기 전용으로 만듦
 2. 적용 대상 : 개별 프로퍼티에, 또는 인터페이스 내의 특정 프로퍼티에 사용됨
- 특징: 개별 프로퍼티에 재할당을 방지한다.
```ts
interface Todo {
  readonly title: string; // 개별적으로 readonly 선언
  description: string;
}

const todo: Todo = {
  title: "Learn TypeScript",
  description: "Study daily",
};

todo.title = "New Title"; // Error: title is readonly
```



