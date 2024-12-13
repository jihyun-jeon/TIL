/* 리액트 요소 만들기 1*/
function createElement(type, props, ...children) {
  return {
    type,
    props: {
      ...props,
      children: children.map((child) =>
        typeof child === "object" ? child : createTextElement(child)
      ),
    },
  };
}

/* 리액트 요소 만들기 2 : children이 텍스트면 객체로 만들기 위한 툴*/
function createTextElement(text) {
  return {
    type: "TEXT_ELEMENT",
    props: {
      nodeValue: text,
      children: [],
    },
  };
}

/* DOM 요소를 생성 */
function createDom(fiber) {
  const dom =
    fiber.type == "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(fiber.type);

  // DOM 속성 업데이트
  updateDom(dom, {}, fiber.props);

  return dom;
}

/* 재조정 위한 툴 */
const isEvent = (key) => key.startsWith("on"); // 이벤트 속성인지 확인
const isProperty = (key) => key !== "children" && !isEvent(key); // 일반 속성인지 확인
const isNew = (prev, next) => (key) => prev[key] !== next[key]; // 이전과 다른 속성인지 확인
const isGone = (prev, next) => (key) => !(key in next); // 삭제된 속성인지 확인

/* 재조정 - 이전 이후 돔트리 비교해서, 이벤트,속성 수정 */
function updateDom(dom, prevProps, nextProps) {
  // 기존에 있던 속성 제거
  Object.keys(prevProps || {})
    .filter(isProperty)
    .filter(isGone(prevProps, nextProps))
    .forEach((name) => {
      dom[name] = "";
    });

  // 새로운 또는 변경된 속성 설정
  Object.keys(nextProps || {})
    .filter(isProperty)
    .filter(isNew(prevProps, nextProps))
    .forEach((name) => {
      dom[name] = nextProps[name];
    });

  // 기존에 있던 이벤트 리스너 제거
  Object.keys(prevProps || {})
    .filter(isEvent)
    .filter((key) => !(key in nextProps) || isNew(prevProps, nextProps)(key))
    .forEach((name) => {
      const eventType = name.toLowerCase().substring(2);
      dom.removeEventListener(eventType, prevProps[name]);
    });

  // 새로운 이벤트 리스너 추가
  Object.keys(nextProps || {})
    .filter(isEvent)
    .filter(isNew(prevProps, nextProps))
    .forEach((name) => {
      const eventType = name.toLowerCase().substring(2);
      dom.addEventListener(eventType, nextProps[name]);
    });
}

/* 재조정 - DOM에서 요소를 삭제 */
function commitDeletion(fiber, domParent) {
  if (fiber.dom) {
    domParent.removeChild(fiber.dom);
  } else {
    commitDeletion(fiber.child, domParent); // 자식 요소로 내려가서 삭제
  }
}

/* fiber tree를 가지고 최종 렌더링 작업 실행 */
function commitRoot() {
  deletions.forEach(commitWork);

  commitWork(wipRoot.child);
  currentRoot = wipRoot;
  wipRoot = null;
  console.log("currentRoot", currentRoot);
}

/* dom tree 최종 렌더 - dom요소 생성,삭제,수정 */
function commitWork(fiber) {
  if (!fiber) {
    return;
  }

  // 부모 DOM 요소 찾기
  let domParentFiber = fiber.parent;
  while (!domParentFiber.dom) {
    domParentFiber = domParentFiber.parent;
  }
  const domParent = domParentFiber.dom;

  // effectTag에 따라 DOM에 적용할 작업 결정
  if (fiber.effectTag === "PLACEMENT" && fiber.dom != null) {
    domParent.appendChild(fiber.dom); // 새로운 요소 배치
  } else if (fiber.effectTag === "UPDATE" && fiber.dom != null) {
    updateDom(fiber.dom, fiber.alternate.props, fiber.props); // 기존 요소 업데이트
  } else if (fiber.effectTag === "DELETION") {
    commitDeletion(fiber, domParent); // 요소 삭제
  }

  commitWork(fiber.child);
  commitWork(fiber.sibling);
}

function render(element, container) {
  wipRoot = {
    dom: container, // #root
    props: {
      children: [element],
    },
    alternate: currentRoot,
  };
  deletions = [];
  nextUnitOfWork = wipRoot;
}

let nextUnitOfWork = null;
let currentRoot = null;
let wipRoot = null;
let deletions = null; // []

/* idle 상태일때 실행 될 함수 */
function workLoop(deadline) {
  let shouldYield = false;

  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork); // 한 단위 작업 처리

    shouldYield = deadline.timeRemaining() < 1;
    // 시간이 부족하면 작업을 멈추고 나중에 다시 시작
  }

  if (!nextUnitOfWork && wipRoot) {
    commitRoot(); // 모든 작업이 끝났으면 commitRoot 호출
  }

  window.requestIdleCallback(workLoop); // idle 상태일 때 반복 호출
}

window.requestIdleCallback(workLoop);

/* fiber 작업단위 생성 - idle 상태일때 실행 */
function performUnitOfWork(fiber) {
  const isFunctionComponent = fiber.type instanceof Function;
  if (isFunctionComponent) {
    updateFunctionComponent(fiber);
  } else {
    updateHostComponent(fiber);
  }

  if (fiber.child) {
    return fiber.child; // 자식이 있으면 자식으로 이동
  }
  let nextFiber = fiber;
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling; // 형제가 있으면 형제로 이동
    }
    nextFiber = nextFiber.parent; // 부모로 이동
  }
}

let wipFiber = null;
let hookIndex = null;

/* performUnitOfWork에서 - 현 파이버가 함수일때 */
function updateFunctionComponent(fiber) {
  wipFiber = fiber;
  hookIndex = 0;
  wipFiber.hooks = [];
  // {type: f Counter , hooks : {state:1 , queue:[(c)=>c+1]}}
  const children = [fiber.type(fiber.props)]; // 함수형 컴포넌트의 children을 계산 // useState()
  reconcileChildren(fiber, children); // 자식 컴포넌트 처리
}

/* performUnitOfWork에서 - 현 파이버의 dom요소 생성*/
function updateHostComponent(fiber) {
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }

  reconcileChildren(fiber, fiber.props?.children);
}

/* 현 파이버의 부모,자식,형제 관계 형성 */
function reconcileChildren(wipFiber, elements) {
  let index = 0;
  let oldFiber = wipFiber.alternate && wipFiber.alternate.child; //null , {type : ƒ Counter()} }

  let prevSibling = null;

  // 새로운 요소와 기존 요소를 비교하여 차례대로 처리
  while (index < elements?.length || oldFiber != null) {
    const element = elements[index]; // {type: 'div',child:[]}
    let newFiber = null;

    const sameType = oldFiber && element && element.type === oldFiber.type;

    if (sameType) {
      // 타입이 같으면 기존 fiber를 업데이트
      newFiber = {
        type: oldFiber.type,
        props: element.props,
        dom: oldFiber.dom,
        parent: wipFiber,
        alternate: oldFiber,
        effectTag: "UPDATE",
      };
    }
    if (element && !sameType) {
      // 타입이 다르면 새로운 fiber를 추가
      newFiber = {
        type: element.type,
        props: element.props,
        dom: null,
        parent: wipFiber,
        alternate: null,
        effectTag: "PLACEMENT",
      };
    }
    if (oldFiber && !sameType) {
      // 기존 요소가 더 이상 필요 없으면 삭제
      oldFiber.effectTag = "DELETION";
      deletions.push(oldFiber);
    }

    if (oldFiber) {
      oldFiber = oldFiber.sibling; // 형제 이동
    }

    if (index === 0) {
      wipFiber.child = newFiber; // 첫 번째 자식 설정
    } else if (element) {
      prevSibling.sibling = newFiber; // 형제 설정
    }

    prevSibling = newFiber;
    index++;
  }
}

function useState(initial) {
  const oldHook =
    wipFiber.alternate &&
    wipFiber.alternate.hooks &&
    wipFiber.alternate.hooks[hookIndex];

  const hook = {
    state: oldHook ? oldHook.state : initial,
    queue: [],
  };

  const actions = oldHook ? oldHook.queue : [];
  actions.forEach((action) => {
    hook.state = action(hook.state); // state 업데이트
  });

  // action을 setState에 저장해놓고, 다음 리렌더링시 useState 실행하면서, action실행됨 -> state 업데이트 되고 -> update fiber 형성
  const setState = (action) => {
    hook.queue.push(action);
    // 새로 만든 wipRoot와 이전 wipRoot(alternate)를 비교해서 -> 리렌더링
    wipRoot = {
      dom: currentRoot.dom,
      props: currentRoot.props, // children <- old와 비교대상
      alternate: currentRoot, // old fiber tree가 됨 ({#root , ...전체})
    };
    nextUnitOfWork = wipRoot;
    deletions = [];
  };

  wipFiber.hooks.push(hook);
  hookIndex++;
  return [hook.state, setState];
}

function isDepsDiff(prevDeps, nextDeps) {
  return prevDeps.some((d) => !nextDeps.includes(d));
}

function useMemo(calculateFn, currentDeps) {
  const oldHook =
    wipFiber.alternate &&
    wipFiber.alternate.hooks &&
    wipFiber.alternate.hooks[hookIndex];

  const hook = {
    value: oldHook ? oldHook.value : null,
    deps: currentDeps,
  };

  if (
    !oldHook ||
    currentDeps.length === 0 ||
    isDepsDiff(oldHook.deps, currentDeps)
  ) {
    hook.value = calculateFn();
    hook.deps = currentDeps;
    console.log("useMemo 재계산");
  }

  wipFiber.hooks.push(hook);
  hookIndex++;
  return hook.value;
}

function isPropsEqual(prevProps, nextProps) {
  if (!prevProps || !nextProps) return false;

  const prevKeys = Object.keys(prevProps);
  const nextKeys = Object.keys(nextProps);
  if (prevKeys.length !== nextKeys.length) return false;

  return prevKeys.every((key) => Object.is(prevProps[key], nextProps[key]));
}

function memo(component) {
  return function memoizedComponent(nextProps) {
    if (isPropsEqual(memoizedComponent.prevProps, nextProps)) {
      return memoizedComponent.prevComponent;
    }

    console.log("memo 재계산");
    memoizedComponent.prevProps = nextProps;
    memoizedComponent.prevComponent = component(nextProps);
    return memoizedComponent.prevComponent;
  };
}

const Didact = {
  createElement,
  render,
  useState,
  useMemo,
  memo,
};

/** @jsxRuntime classic /
/* @jsx Didact.createElement */

// -------------------------------------------------------
// <실행> React.memo
const MemoizedCounter = Didact.memo(function Counter({ count }) {
  return <div>Count: {count}</div>;
});

function App() {
  const [count, setCount] = useState(0);
  const [text, setText] = useState("");

  return (
    <div>
      <MemoizedCounter count={count} />
      <button onClick={() => setCount((c) => c + 1)}>Increment Count</button>
      <input
        type="text"
        value={text}
        onChange={(e) => setText(() => e.target.value)}
      />
    </div>
  );
}

const container = document.getElementById("root");
const element = <App />;
// var element = Didact.createElement(Counter, null); // 바벨로 변환된 결과
// element {type: ƒ Counter() , props: {children: Array(0)}}

Didact.render(element, container);

// <실행> - useMemo
/*
let isPlusToggle = true;

function Counter() {
  const [state, setState] = Didact.useState(1);

  const calcFn = useMemo(() => {
    return state * 2;
  }, [state]);

  return (
    <h1
      onClick={() => {
        setState((c) => c + (isPlusToggle ? 0 : 1));
        isPlusToggle = !isPlusToggle;
      }}
    >
      My Count: {state} , memoValue : {calcFn}
    </h1>
  );
  // 바벨로 변환 결과
  // return
  // Didact.createElement("h1", {
  //   onClick: function onClick() {
  //     setState(function (c) {
  //       return c + 1;
  //     });
  //   }
  // }, "My Count: ", state , ",memoValue:", expensiveCalculation);
}

const container = document.getElementById("root");
const element = <Counter />;
// var element = Didact.createElement(Counter, null); // 바벨로 변환된 결과
// element {type: ƒ Counter() , props: {children: Array(0)}}

Didact.render(element, container);
*/

// <실행1> - useState
/*
function Counter() {
  const [state, setState] = Didact.useState(1);
  // const [state2, setState2] = Didact.useState(0);
  return (
    <h1
      onClick={() => {
        setState((c) => c + 1);
      }}
    >
      My Count: {state}
    </h1>
  );
  // 바벨로 변환 결과
  // return
  // Didact.createElement("h1", {
  //   onClick: function onClick() {
  //     setState(function (c) {
  //       return c + 1;
  //     });
  //   }
  // }, "My Count: ", state);
}

const container = document.getElementById("root");
const element = <Counter />;
// var element = Didact.createElement(Counter, null); // 바벨로 변환된 결과
// element {type: ƒ Counter() , props: {children: Array(0)}}

Didact.render(element, container);
*/

/*
const element = {
    type : h1,
    props: {
      onClick: () => setState((c) => c + 1),
      children: {
          type: "TEXT_ELEMENT",
          props: {
            nodeValue: `Count: ${state}`,
            children: [],
          },
        }
      ),
    },
  };
*/

// <실행2> - html요소만 렌더
/*
const container = document.getElementById("root");

Didact.render(
  Didact.createElement(
    "div",
    null,
    Didact.createElement(
      "h1",
      null,
      Didact.createElement("p", null),
      Didact.createElement("a", null)
    ),
    Didact.createElement("h2", null)
  ),
  container
);
*/
