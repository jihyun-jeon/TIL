// 리액트 요소 만들기 1
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

// 리액트 요소 만들기 2 : children이 텍스트면 객체로 만들기 위한 툴
function createTextElement(text) {
  return {
    type: "TEXT_ELEMENT",
    props: {
      nodeValue: text,
      children: [],
    },
  };
}

function createDom(fiber) {
  // DOM 요소를 생성. 텍스트 요소는 텍스트 노드를 생성하고, 그 외의 요소는 해당 태그를 생성
  const dom =
    fiber.type == "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(fiber.type);

  // DOM 속성 업데이트
  updateDom(dom, {}, fiber.props);

  return dom;
}

const isEvent = (key) => key.startsWith("on"); // 이벤트 속성인지 확인
const isProperty = (key) => key !== "children" && !isEvent(key); // 일반 속성인지 확인
const isNew = (prev, next) => (key) => prev[key] !== next[key]; // 이전과 다른 속성인지 확인
const isGone = (prev, next) => (key) => !(key in next); // 삭제된 속성인지 확인

// 재조정 - 이전 이후 돔트리 비교해서, dom 추가/삭제/수정
function updateDom(dom, prevProps, nextProps) {
  // 기존에 있던 이벤트 리스너 제거
  Object.keys(prevProps || {})
    .filter(isEvent)
    .filter((key) => !(key in nextProps) || isNew(prevProps, nextProps)(key))
    .forEach((name) => {
      const eventType = name.toLowerCase().substring(2);
      dom.removeEventListener(eventType, prevProps[name]);
    });

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

  // 새로운 이벤트 리스너 추가
  Object.keys(nextProps || {})
    .filter(isEvent)
    .filter(isNew(prevProps, nextProps))
    .forEach((name) => {
      const eventType = name.toLowerCase().substring(2);
      dom.addEventListener(eventType, nextProps[name]);
    });
}

function commitRoot() {
  // 최종적으로 렌더링 작업을 실행
  deletions.forEach(commitWork);
  commitWork(wipRoot.child);
  currentRoot = wipRoot;
  wipRoot = null;
}

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

function commitDeletion(fiber, domParent) {
  // DOM에서 요소를 삭제
  if (fiber.dom) {
    domParent.removeChild(fiber.dom);
  } else {
    commitDeletion(fiber.child, domParent); // 자식 요소로 내려가서 삭제
  }
}

function render(element, container) {
  wipRoot = {
    dom: container,
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

function workLoop(deadline) {
  let shouldYield = false;

  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork); // 한 단위 작업 처리
    // nextUnitOfWork - div{type: ƒ Counter(), parent : root}

    shouldYield = deadline.timeRemaining() < 1; // 시간이 부족하면 작업을 멈추고 나중에 다시 시작
  }

  if (!nextUnitOfWork && wipRoot) {
    commitRoot(); // 모든 작업이 끝났으면 commitRoot 호출
  }

  window.requestIdleCallback(workLoop); // idle 상태일 때 반복 호출
}

window.requestIdleCallback(workLoop);

/*
fiber
{
    dom: #root,
    props: {
      children: [{div..}],
    },
    alternate: currentRoot,
  }
*/
function performUnitOfWork(fiber) {
  // 함수형 컴포넌트일 경우 업데이트 함수 호출
  const isFunctionComponent = fiber.type instanceof Function;
  if (isFunctionComponent) {
    updateFunctionComponent(fiber);
  } else {
    updateHostComponent(fiber); // 일반 컴포넌트 업데이트
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

function updateFunctionComponent(fiber) {
  wipFiber = fiber;
  hookIndex = 0;
  wipFiber.hooks = [];
  const children = [fiber.type(fiber.props)]; // 함수형 컴포넌트의 children을 계산
  reconcileChildren(fiber, children); // 자식 컴포넌트 처리
}

function useState(initial) {
  // useState 훅 처리
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

  const setState = (action) => {
    hook.queue.push(action);
    wipRoot = {
      dom: currentRoot.dom,
      props: currentRoot.props,
      alternate: currentRoot,
    };
    nextUnitOfWork = wipRoot;
    deletions = [];
  };

  wipFiber.hooks.push(hook);
  hookIndex++;
  return [hook.state, setState];
}

function updateHostComponent(fiber) {
  // 호스트 컴포넌트 처리
  if (!fiber.dom) {
    fiber.dom = createDom(fiber); // DOM 요소 생성
  }
  reconcileChildren(fiber, fiber.props?.children); // 자식 컴포넌트 처리
  //children {type: 'div',child:[]}
}

function reconcileChildren(wipFiber, elements) {
  let index = 0;
  let oldFiber = wipFiber.alternate && wipFiber.alternate.child; //null
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

const Didact = {
  createElement,
  render,
  useState,
};

// -------------------------------------------------------
// /** @jsx Didact.createElement */
/** @jsxRuntime classic /
  /* @jsx Didact.createElement */

// <실행1> - 컴포넌트 렌더
// https://github.com/pomber/didact/issues/13
function Counter() {
  const [state, setState] = Didact.useState(1);
  return <h1 onClick={() => setState((c) => c + 1)}>My Count: {state}</h1>;
  // return Didact.createElement(
  //   "h1",
  //   {
  //     onClick: () => setState((c) => c + 1),
  //     style: {
  //       backgroundColor: "lightblue",
  //     },
  //   },
  //   `Count: ${state}`
  // );
}

const element = <Counter />;
// const element = Didact.createElement(Counter);
const container = document.getElementById("root");
Didact.render(element, container);

// <실행2>
/*
const container = document.getElementById("root");

Didact.render(
  Didact.createElement("div", undefined, {
    children: [
      Didact.createElement("h1", undefined, {
        children: [Didact.createElement("p"), Didact.createElement("a")],
      }),
      Didact.createElement("h2"),
    ],
  }),
  container
);
*/
/*
element
{
  type: 'div',
  props: {
    children: [
      {
        type: 'h1',
        props: {
          children: [
            { type: 'p' },
            { type: 'a' }
          ]
        }
      },
      { type: 'h2' }
    ]
  }
}

<div>
    <h1>
      <p></p> <a></a>  
    </h1>
    <h2></h2>
</div>
 
*/

/*
const element = {
    type : h1,
    props: {
      onClick: () => setState((c) => c + 1),
      style: {
        backgroundColor: "lightblue",
      },
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
