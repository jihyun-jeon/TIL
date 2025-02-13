# Context api VS 전역 상태 라이브러리(redux 등)의 차이

Context API는 상태 관리 도구 역할을 하는건 아니라고 한다.<br/>
나는 전역 상태가 아니더라도, 특정 부분을 위한 상태관리로 사용될 수 있는건 아닐까? 라는 의문이 들었다.<br/>
그러나 나는 애초에 "상태관리"의 의미를 제대로 알고있지 못했던 것 같다.<br/>
이번 계기로 context api와 상태관리 라이브러리의 차이에 대해 좀 더 알아보고자 한다.

<br/>
<br/>

# 1️⃣ context api는 상태관리를 위한것이 아니다!

1. 상태관리라 함은,

- “**시간이 지남에 따라 상태가 변경되는 방식을 관리하는 것”을 의미한다.**
- 상태관리는 아래의 조건을 충족해야 한다.
  1. 초기 값을 저장한다.
  2. 현재 값을 읽을 수 있다.
  3. 값 업데이트가 가능하다.

2. 그러나 Context API는 데이터를 저장하거나 관리하는 기능이 없다.

- Context 는 단순히 데이터를 컴포넌트에 전달하는 "수단"일 뿐이고, 상태를 저장,업데이트 하는 것은 아니다.
- 상태를 저장하고 업데이트하려면, useState, useReducer를 같이 사용하해야 한다.
  ⇒ 때문에 Context API는 단순히 “값을 공유” 할 뿐, 상태관리라고 할 수 없는 것이다.

3. 코드 예제

   📍 Context api - 상태관리 도구가 아니다.

   ```jsx
   const CountContext = createContext(null);

   function reducer(state, action) {
     switch (action.type) {
       case "increment":
         return { count: state.count + 1 };
       case "decrement":
         return { count: state.count - 1 };
       default:
         return state;
     }
   }

   export function CountProvider({ children }) {
     const [state, dispatch] = useReducer(reducer, { count: 0 }); // useReducer로 상태 저장

     return (
       <CountContext.Provider value={{ state, dispatch }}>
         {children}
       </CountContext.Provider>
     );
   }

   function Counter() {
     const { state, dispatch } = useContext(CountContext);

     return (
       <div>
         <h3>Count: {state.count}</h3>
         <button onClick={() => dispatch({ type: "increment" })}>+</button>
         <button onClick={() => dispatch({ type: "decrement" })}>-</button>
         // useReducer의 dispatch(action)을 통해 전역 상태를 변경하는 것임.
       </div>
     );
   }
   ```

   📍 Redux - 상태관리 도구가 맞다.

   - Redux는 **애플리케이션 전체에서 공유되는 전역 상태를 중앙에서 관리**한다.
   - 복잡한 상태를 다루는 데 최적화되어 있다.
   - 상태를 변경할 때는 **dispatch(action) → reducer 실행 → 새로운 상태 반환** 과정을 따른다.
   - useSelector를 통해 필요한 부분만 가져올 수 있다.

   ```jsx
   import { createStore } from "redux";
   import { Provider, useSelector, useDispatch } from "react-redux";

   const initialState = { count: 0, text: "Hello" };

   // redux의 reducer를 통해 상태 업데이트함.
   function reducer(state = initialState, action) {
     switch (action.type) {
       case "INCREMENT":
         return { ...state, count: state.count + 1 };
       case "CHANGE_TEXT":
         return { ...state, text: action.payload };
       default:
         return state;
     }
   }

   const store = createStore(reducer); // Redux 스토어 생성 (전역 상태 저장)

   function Counter() {
     const count = useSelector((state) => state.count); // reducer를 통해 상태 읽음
     const dispatch = useDispatch();
     console.log("Counter 리렌더링됨!");

     return <button onClick={() => dispatch({ type: "INCREMENT" })}>+</button>;
   }

   function TextDisplay() {
     const text = useSelector((state) => state.text);
     const dispatch = useDispatch();
     console.log("TextDisplay 리렌더링됨!");

     return (
       <input
         value={text}
         onChange={(e) =>
           dispatch({ type: "CHANGE_TEXT", payload: e.target.value })
         }
       />
     );
   }

   function App() {
     return (
       <Provider store={store}>
         <Counter />
         <TextDisplay />
       </Provider>
     );
   }
   ```

<br/><br/>

# **2️⃣ Context API와 Redux의 차이점**

✅ Redux를 사용하는 이유<br/>
: Redux 에서 제공하는 패턴과 도구들을 사용하면 상태가 언제, 어디서, 어떻게, 왜 업데이트 되었는지 쉽게 이해 할 수 있다

✅ 차이점

1. 상태관리

- **Context API** : 상태 관리 도구가 X. (`useState`, `useReducer`를 사용해야 상태를 관리할 수 있음)
- **Redux** : 상태 관리 도구O, 전역 상태를 중앙에서 효율적으로 관리할 수 있다.

2. 리렌더링 최적화 (전체 구독 문제)

- **Context API** : "전역 상태"로 사용할 경우, **상태 값의 일부만 변경되어도 모든 구독 컴포넌트가 리렌더링**된다. <br/>
  즉, `{count:0 , name: ‘’}`에서 `count`만 변경되어도 `name`을 사용하는 컴포넌트까지 불필요하게 다시 렌더링됨.
- **Redux** : `useSelector`를 사용하면 **특정 상태 값만 구독할 수 있어, 해당 값이 변경될 때만 리렌더링**된다.

3. 상태 변경 이력 추적

- **Context API** : 상태 변경 이력을 추적할 수 없고, redux는 가능하다.<br/>
  context는 단순히 최신 상태만 유지할 뿐, 이전 상태의 변경 기록은 없다.
- **Redux** : Redux-devtool을 통해 상태 변경 이력을 시각적으로 볼 수 있다.

<br/><br/>

# 3️⃣ 그럼 각각 언제 사용해야 하는 것 일까?

✅ context api 사용

Context 는 실제로 아무것도 관리하지 않는다. 단순히 값을 공유하기 위해 사용되는 것이다.

- 상태 관리가 아닌, 단순히 “데이터 공유”가 필요한 때
- props drilling 을 피하고자 할 때
- 전역 상태가 단순한 경우 (ex. 다크모드, 언어설정 등)

<br/>

✅ 전역 상태 라이브러리 (redux)

- 상태의 특정 부분만 사용하여 특정 컴포넌트만 리렌더링 시키킬 때
- 애플리케이션 상태가 많고 여러 곳에서 필요할 때
- 상태 변경이 빈번하고 복잡한 로직이 있을 때
- 상태 변경 이력을 추적하고 싶을 때 (디버깅 툴 사용0
- Redux 미들웨어를 이용해 비동기 작업(예: API 요청)을 처리하고 싶을 때
