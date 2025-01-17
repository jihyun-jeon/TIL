# 리액트 Hook은 클로저를 활용한다

1. hooks 는 : 리액트 클래스의 단점, 특히 **this 바인딩 문제**를 해결하기 위해 나옴.

2. closures란?
- 클로져는 함수가 “privte”한 변수를 갖을 수 있게 해준다. (변수 은닉화)
    
    ```jsx
    function getAdd() {
      let foo = 1;
      return function () {
        foo += 1;
        return foo;
      };
    }
    
    const add = getAdd();
    console.log(add()); // 2
    console.log(add()); // 3
    console.log(add()); // 4
    console.log(add()); // 5
    ```
    
<br/>


# useState 만들기

### 1. 클로저 사용X

- **`count`** 는 한번 가져오고 끝난 값이기 때문에 count 값은 바뀌지 않는다.

- `const state = _val;`는 한 번 할당된 값(1)을 그대로 유지한다.
따라서 `setCount(2)`로 `_val`을 업데이트해도 `state`는 바뀌지 않는다.

**[설명]**

- 외부함수(useState)가 내부함수( setState)를 반환 후
useState호출로 EC실행이 끝났고 state를 참고 하고 있는 값이 없기 때문에  useState실행컨텍스느의 state는 가비지 컬렉터 대상이 되어 바로 없어짐.
- 이후 useState실행 후 반환됨 count는, state값을 복사한 정적인 값임.
- 때문에 내부함수가 바라보는 _val을 setState로 업데이트 한다해도 state는 복사된 정적 값인 count 1로 고정된 값이 나오는 것임

```jsx
function useState(initVal) {
  let _val = initVal;
  const state = _val;  // 여기서는 클로저X
  const setState = newVal => {
    _val = newVal; 
  };
  return [state, setState];
}

const [count, setCount] = useState(1);
console.log(count); // 1
setCount(2);
console.log(count); // 1 (?)
```

<br/>

### 2. 클로저 사용하여, 변수 은닉화하면 - 제대로 작동o

- **`const state = _val`** 부분을 함수 형태로 바꾸어 주면,
호출할 때마다 값을 가져오기 때문에 **`setCount`** 가 반영된 값을 가져올 수 있다.
- `state`를 함수(`() => _val`)로 만들어, **`_val`의 최신 값을 참조**하도록 함.<br/>
때문에 `count()`를 호출할 때마다 `_val`의 현재 상태를 가져올 수 있다.

**[설명]**

- 외부함수(useState)가 내부함수(state, setState)를 반환 후
useState호출로 실행이 끝났는데 내부함수가 useState의 _val변수에 접근할 수 있음.

- **클로저의 작동 원리**<br/>
    : 외부 함수(`useState`)가 실행된 후 종료되더라도, 내부 함수(`state`, `setState`)는 외부 함수의 실행 컨텍스트에 있는 변수 `_val`을 클로저로 참조할 수 있다.
- **`setState`가 클로저로 작동**:
    - `setState`는 클로저로 작동하여 `_val`을 업데이트할 수 있다.
    - 이후 `state`를 호출하면 변경된 `_val`이 반환된다.
- **`state`가 클로저로 작동**:
    - `state`도 함수로 정의되어 있어, 호출할 때마다 `_val`의 최신 값을 반환한다.
    - 이는 내부 함수(`state`)가 외부 함수의 변수 `_val`을 동적으로 참조하기 때문이다.
- **왜 `count`는 항상 최신 값을 반환하는가?**:
    - `count`는 함수(`state`)를 참조하고, 이 함수는 클로저로 `_val`의 최신 상태를 동적으로 반환하기 때문이다.

```jsx
const React = (function () {

  function useState(initVal) {
    let _val = initVal; // 내부 변수 // 참조되는게 있어서 실행이 끝나도 여전히 유지되는 것임.
    const state = () => _val; // [클로저] setState거 _val없데이트 하면, state는 클로저로 최신_val 계속 참조 가능함.
    const setState = (newVal) => {
      _val = newVal; // 내부 변수 업데이트
    };
    return [state, setState]; // state는 함수로 반환
  }
  
  return { useState };
})();

const [count, setCount] = React.useState(1);
console.log(count()); // 1
setCount(2);
console.log(count()); // 2

```

### 3. 컴포넌트로 만들기

최종코드

```jsx
const React = (function() {
  let hooks = [];
  let idx = 0;
  
  function useState(initVal) {
    const _idx = idx;
    const state = hooks[idx] || initVal;
    const setState = newVal => {
      hooks[_idx] = newVal;
    };
    idx++;
    return [state, setState];
  }
 
  function render(Component) {
    idx = 0;
    const C = Component();
    C.render();
    return C;
  }
  
  return { useState, render };
})();

function Component() {
  const [count, setCount] = React.useState(1);
  const [text, setText] = React.useState('apple');
  
  return {
    render: () => console.log({ count, text }),
    click: () => setCount(count + 1),
    type: (word) => setText(word),
  }
}

var App = React.render(Component); // {count: 1, text: "apple")
App.click(); 
var App = React.render(Component); // {count: 2, text: "apple"}
App.type('pear');
var App = React.render(Component); // {count: 2, text: "pear"}
```

### 주요 논점 정리

1. **클로저**
    1. **`hooks`, `idx` , `_idx`는 클로저 대상이다.** <br/>
    해당 값을 참조하고 있는 곳이 있으므로 가비지 컬렉팅 되상이 되지 않아 값이 유지된다.<br/>
    때문에 외부함수 실행이 끝나도, 내부함수는 외부 스코프에 저장된 변수에 계속 접근할 수 있는것이다.
    
    2. **클로저를 활용한 `setState` 인덱스 고정**<br/>
    `setState`가 호출될 때마다 인덱스가 변동되는 문제를 해결하기 위해 클로저를 이용해 
    **state 할당 당시의 인덱스**를 고정한다.<br/>
    이로써 상태가 의도한 배열 위치에 정상적으로 저장되고 업데이트 되는 것이다.

2. **hooks를 배열로 해야하는 이유**
    - hooks가 여러개 있을시 모두 저장하기 위해 (여러 상태 관리위해)
    - React는 하나의 렌더링 사이클 동안 호출된 모든 hooks를 배열에 저장한다.
    - 이를 통해 hooks 호출 순서와 상태 저장 위치가 보장되며, 여러 상태를 안전하게 관리할 수 있다.
    
3. **hooks 규칙이 있는 이유**
    1. **React Hooks 규칙<br/>
    :** "Hooks는 컴포넌트의 “최상위에서만 호출”하고 반복문이나 조건문 내부에서는 호출하지 않는다."<br/>
    ( = ”컴포넌트가 렌더링 될 때마다 항상 동일한 순서로 Hook이 호출되는 것이 보장되어야 한다”)
        
        **※ hooks가 최상위에서 호출되야 한다는 말은?** 
        코드의 위치가 컴포넌트의 최상위여야 한다는게 아니라, 중첩된 함수 내부에서 hooks가 호출되면 안된다는 말임.
        
        ```jsx
        function MyComponent() {
          const handleClick = () => {
            const [state, setState] = React.useState(0); // ❌ React Hook 규칙 위반
            console.log(state);
          };
        
          return <button onClick={handleClick}>Click Me</button>;
        }
        
        function MyComponent() {
          const [state, setState] = React.useState(0); // ✅ 최상위에서 호출
        
          const handleClick = () => {
            console.log(state); // 상태를 안전하게 참조 가능
            setState(state + 1); // 상태를 안전하게 업데이트 가능
          };
        
          return <button onClick={handleClick}>Click Me</button>;
        }
        
        ```
        
    <br/>
    
    2. **이런 hooks 규칙이 있는 이유⭐️**<br/>
    : 렌더링 시 `useState` 호출 순서와 상태 저장을 보장하기 위함.<br/>
    : 렌더링 순서가 보장되지 않으면 상태 관리가 비정상적으로 작동할 위험이 있음.
    
    - hooks 호출 순서가 보장되어야, 각 hook이 hooks 배열에 저장된 순서가 유지되고, React가 올바르게 상태를 관리할 수 있기 때문이다.
        - state1은 항상 hooks 인덱스 0번에
        - state2은 항상 hooks 인덱스 1번에 저장되야 한다.
        
        ```jsx
        function MyComponent() {
          const [state1, setState1] = React.useState(0); // hooks[0]
          const [state2, setState2] = React.useState(1); // hooks[1]
        }
        ```
        
    
    - 이런식으로 hooks 조건이 깨지면, 호출 순서가 꼬인다.
        - state2가 hooks[0]을 보게 될 수도 있는 오류 발생!
        
        ```jsx
        function MyComponent() {
          if (someCondition) {
            const [state1, setState1] = React.useState(0); // hooks[0] (조건에 따라 호출될 수도 있고 안 될 수도 있음)
          }
          const [state2, setState2] = React.useState(1); // hooks[0] 또는 hooks[1] (혼란 발생)
        }
        ```
        
<br/>

---

참고자료

https://www.youtube.com/watch?v=KJP1E-Y-xyo

https://rinae.dev/posts/getting-closure-on-react-hooks-summary/

https://medium.com/humanscape-tech/%EC%9E%90%EB%B0%94%EC%8A%A4%ED%81%AC%EB%A6%BD%ED%8A%B8-%ED%81%B4%EB%A1%9C%EC%A0%80%EB%A1%9C-hooks%EA%B5%AC%ED%98%84%ED%95%98%EA%B8%B0-3ba74e11fda7https://medium.com/humanscape-tech/%EC%9E%90%EB%B0%94%EC%8A%A4%ED%81%AC%EB%A6%BD%ED%8A%B8-%ED%81%B4%EB%A1%9C%EC%A0%80%EB%A1%9C-hooks%EA%B5%AC%ED%98%84%ED%95%98%EA%B8%B0-3ba74e11fda7

https://velog.io/@aborile/React-Hooks-with-Vanilla-JavaScript

https://ttaerrim.tistory.com/67