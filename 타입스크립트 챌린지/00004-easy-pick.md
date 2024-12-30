# 00004-easy-pick

## **문제**

`T`에서 `K` 프로퍼티만 선택해 새로운 오브젝트 타입을 만드는 내장 제네릭 `Pick<T, K>`을 이를 사용하지 않고 구현하세요.

예시

```tsx
 interface Todo {
  title: string
  description: string
  completed: boolean
}

type TodoPreview = MyPick<Todo, 'title' | 'completed'>

const todo: TodoPreview = {
    title: 'Clean room',
    completed: false,
}
```

## 정답

```tsx
/* _____________ 정답 _____________ */
 
type MyPick<T, K extends keyof T> = {
	[P in K]: T[P];
};

/* _____________ 테스트 케이스 _____________ */
import type { Equal, Expect } from '@type-challenges/utils'

type cases = [
  Expect<Equal<Expected1, MyPick<Todo, 'title'>>>,
  Expect<Equal<Expected2, MyPick<Todo, 'title' | 'completed'>>>,
  // @ts-expect-error
  MyPick<Todo, 'title' | 'completed' | 'invalid'>,
]

interface Todo {
  title: string
  description: string
  completed: boolean
}

interface Expected1 {
  title: string
}

interface Expected2 {
  title: string
  completed: boolean
}
```

설명

- `K extends keyof T`
    - Pick에서 고를 수 있는 프로퍼티는 Todo의 키로 제한되야 하기 때문에
    - K를 Todo의 키만 받을 수 있도록 제한한다.
- `[P in K]: T[P]`
    - K의 모든 키를 순회하며, 각 키를 `P`로 참조하며 새로운 타입의 키로 만들어낸다.

## 노트

### ✅ Pick<T, K>

- Pick은 T에서 지정된 키 K만 선택하여 새로운 타입을 생성한다.
- 유틸리티 타입 중 하나. 일반적인 타입 변환을 쉽게 하기 위해서 몇 가지 유틸리티 타입을 제공한다.

   ```tsx
   interface Todo {
   title: string;
   description: string;
   completed: boolean;
   }

   // title과 completed만 포함한 새로운 타입 생성
   type TodoPreview = Pick<Todo, "title" | "completed">;

   // 결과 타입
   /*
   type TodoPreview = {
   title: string;
   completed: boolean;
   }
   */
   ```

### ✅ keyof

- 객체 타입으로부터 그 객체의 프로퍼티명을 모아, 유니온 타입으로 만들어주는 연산자
    
    ```tsx
    type Human = {
    	name : string;
    	age : number
    }
    
    type HumanKeys = keyof Human // name | age
    ```
    
### ✅ extends

1. **서브타입 관계를 정의할 때**
- 특정 타입이 다른 타입의 서브타입인지(또는 그 타입과 같거나 더 좁은 범위인지)를 제한함.
- `<T extends U>` : `T`는 반드시 `U` 타입이거나 그 서브타입이어야 함
- 예제1

   ```tsx
   type A = string;
   type B = string | number;

   type Result = A extends B ? true : false; // true // A는 B의 부분 집합이다
   ```

- 예제2  - `K extends keyof T`는 `K`가 `T`의 키(프로퍼티명) 중 하나여야 함을 보장한다.

   ```tsx
   function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
   return obj[key];
   }

   const user = { id: 1, name: "Alice" };

   // 올바른 호출
   const id = getProperty(user, "id"); // number
   const name = getProperty(user, "name"); // string

   // 오류 발생
   getProperty(user, "age"); // Error: 'age'는 user의 키가 아님
   ```

- 예제3

   ```tsx
   type Filter<T, U> = T extends U ? T : never;

   type Result = Filter<"a" | "b" | "c", "a" | "c">; // 결과: "a" | "c"

   // T가 U의 서브타입이면 그대로 T를 반환하고, 아니면 제거(never 반환)
   ```

2.  **인터페이스에서의 `extends`**

- `extends`를 사용하여 다른 인터페이스를 확장할 수 있다. 

   ```tsx
   interface Person {
   name: string;
   age: number;
   }

   interface Employee extends Person {
   salary: number;
   }

   const employee: Employee = {
   name: "John",
   age: 30,
   salary: 50000,
   };

   ```

### **✅ 맵드 타입 (Mapped Types)**

- 기존 타입의 키를 기반으로 새로운 타입 생성하는데 사용됨
- 기본 문법
    - **`[P in keyof T]`**: `T`의 모든 키를 순회하며, 각 키를 `P`로 참조.
    - **`T[P]`**: 각 키(`P`)에 해당하는 타입을 그대로 사용.
    
    ```tsx
    type MappedType<T> = {
      [P in keyof T]: T[P];
    };
    ```
    
- 예제
    
    ```tsx
    interface Person {
      name: string;
      age: number;
      isEmployed: boolean;
    }
    
    type Clone = {
      [P in keyof Person]: Person[P];
    };
    
    // Clone 타입 결과
    // {
    //   name: string;
    //   age: number;
    //   isEmployed: boolean;
    // }
    
    ```
    

 