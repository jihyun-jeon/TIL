React에서 input 요소를 사용할 때 value와 defaultValue는 어떤 차이가 있을지 의문이 들었다.
단순히 보기엔, defaultValue는 초기값 설정해주는 것 같은데 이런건 또 언제 써야하는걸까?

찾아보니 이 둘의 차이는 , <br/>
**Controlled Component(제어 컴포넌트)** 와 **Uncontrolled Component(비제어 컴포넌트)** 라는 것과 관련된 것 이였다.

이건 또 뭐지! 이 두 방식의 차이에 대해 살펴보자.

> <요약>  
> 리액트에서 input과 같은 폼 요소를 다룰때,
>
> Controlled 컴포넌트는 value에 state를 넣어 상태를 관리한다.  
> 상태가 업데이트될 때마다 폼 전체가 리렌더링된다.
>
> Uncontrolled 컴포넌트는 defaultValue로 값을 설정하고, ref를 사용해 DOM에 직접 접근하여 값을 관리한다.  
> 상태를 사용하지 않아서 리렌더링 횟수를 줄여 성능을 개선할 수 있다.

<br/>

## **✅ Controlled vs Uncontrolled**

React에서는 폼 요소의 상태를 관리하는 두 가지 방식이 있다.

state와 통합하는 방식인 Controlled Component 와 DOM을 직접 제어하는 방식인 Uncontrolled Component 이다.

### **1️⃣ Controlled Component (제어 컴포넌트)**

- input 초기값을 value로 설정하고,
- 폼 요소(input)의 값(value)을 state를 통해 관리하는 방식이다.
- onChange 이벤트 핸들러를 통해 입력값을 업데이트된다.
- 장점
  - 상태 변경에 따라 UI가 업데이트되어 , 상태와 입력값이 동기화된다.
  - state만 관리하면 되서 폼 데이터를 다루기 쉽다.
- 단점 : 상태 업데이트에 따라 리렌더링이 발생해서 성능 문제생길 수 있다.

```jsx
import { useState } from "react";

function ControlledInput() {
  const [text, setText] = useState(""); // React state로 값 관리하고

  return (
    <div>
      <input
        type="text"
        value={text} // state가 input 값이 됨.
        onChange={(event) => setText(event.target.value)}
      />
      <p>입력된 값: {text}</p>
    </div>
  );
}
```

<br/>

### **2️⃣ Uncontrolled Component (비제어 컴포넌트)**

- input 초기값을 defaultValue로 설정하고,
- 폼 요소의 값을 useRef로 사용해 DOM에 직접 접근하여 값을 가져오는 방식이다.
- 값을 React가 관리하지 않고, 값의 변경을 계속 관찰하지 않는다.

- 장점 : 상태를 따로 관리하지 않아도 되므로, 리렌더링으로 인한 성능 문제 발생하지 않는다.
- 단점 : React와 DOM 간의 동기화가 번거로워 값을 추적하기 어렵다.

```jsx
import { useRef } from "react";

function UncontrolledInput() {
  const inputRef = useRef(null); // useRef로 input 요소 참조

  const handleClick = () => {
    console.log(inputRef.current.value); // input값을 직접 DOM에서 가져온다!
  };

  return (
    <div>
      <input type="text" ref={inputRef} defaultValue="초기값" />
      <button onClick={handleClick}>값 출력</button>
    </div>
  );
}
```

<br/>

## **✅ 각각 언제 사용해야 할까?**

### **1️⃣ Controlled Component를 사용해야 하는 경우**

1.  입력값을 실시간으로 관리하고 싶을때 (ex. 검색창, 실시간 폼 입력).
2.  React 상태를 기반으로 동작하는 UI가 필요할 때 (ex. 입력값을 기반으로 다른 UI 변경).
3.  동일한 입력값을 다른 컴포넌트에서도 사용해야 할 때.

### **2️⃣ Uncontrolled Component를 사용해야 하는 경우**

1.  성능이 중요해서 state 업데이트를 최소화하고 싶을 때.
2.  입력값 변경이 자주 발생하지 않을때
3.  폼 데이터를 즉각적으로 저장할 필요가 없을 때
4.  사용자가 입력한 값을 한 번만 가져오면 되는 경우 (ex. 폼 제출 시).
5.  외부 라이브러리와의 호환성이 필요할 때 (ex. jQuery, D3.js 등과 함께 사용할 경우).

<b>📍 “react-hook-form”는 uncontrolled component 기반의 라이브러리다! 📍</b>

[react-hook-form 사이트](https://react-hook-form.com/)에서, uncontrolled 기반인 폼과, controlled인 폼을 비교해볼 수 있다.

controlled 컴포넌트는 input창 입력시마다 리렌더링되지만 uncontrolled는 그렇지 않다.

---

---

폼 구현시 흔히 써왔던 react-hook-form에 이런 내용이 있는줄은 몰랐다.

input요소 하나 입력시 폼 전체의 input요소가 리렌더링 되지 않는 것이 uncontrolled 컴포넌트 방식이기 때문이라니!

이걸 몰랐다면 나는 그냥 라이브러리가 알아서 잘 구현됐다보다 라고 생각하고 편하게 쓰기만 했을것이다.

defaultValue도 단순히 초기값을 위한게 아니라는 것을 알게되어 유익한 시간이였다!
