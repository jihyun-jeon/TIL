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

function createTextElement(text) {
  return {
    type: "TEXT_ELEMENT",
    props: {
      nodeValue: text,
      children: [],
    },
  };
}

function createDom(element, container) {
  // [2] 요소 유형이 text요소인 경우는 텍스트 노드, 아니면 일반 노드(element) 생성
  const dom =
    element.type == "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(element.type);

  // [3] 요소에 prop 넣어줌
  Object.keys(element.props)
    .filter((key) => key !== "children")
    .forEach((name) => {
      dom[name] = element.props[name];
    });

  // [4] 재귀로 돌면서 하위요소도 렌더해줌
  element.props.children.forEach((child) => render(child, dom));
  container.appendChild(dom);

  // dom 결과 : <div id="foo"> <h1>bar</h1> <h2></h2> </div>
}

function commitRoot() {
  // 모든 요소를 root안에다 다 넣음.
  commitWork(wipRoot.child);
  currentRoot = wipRoot; // 마지막 dom tree를 저장해놓고, 바꼈을때 비교하기 위한 용도
  wipRoot = null;
}

function commitWork(fiber) {
  if (!fiber) {
    return;
  }
  const domParent = fiber.parent.dom;
  domParent.appendChild(fiber.dom);
  commitWork(fiber.child);
  commitWork(fiber.sibling);
}

// 첫번째 unitOfWork는 루트요소를 렌더하는 것임. 떄문에 nextUnitOfWork값 지정!
function render(element, container) {
  wipRoot = {
    dom: container, // <div id='root'>
    props: {
      children: [element], // [{type : 'div' , props :{id:'foo' , children : [...]}}]
    },
    alternate: currentRoot, // dom 업데이트시 이전 dom tree와 비교하기 위해 저장해둠
  };
  nextUnitOfWork = wipRoot;
}

// 추가 <3> Concurrent Mode -----------------------
// Concurrent Mode는 Fiber 작업을 실행하면서, 브라우저의 유휴 시간에 맞춰 적절히 멈추거나 재개합니다.
let nextUnitOfWork = null;
let currentRoot = null;
let wipRoot = null;

// [workLoop] :
// 작업(performUnitOfWork)을 계속 처리하지만, 브라우저가 더 이상 유휴 상태가 아니면(deadline.timeRemaining() < 1) 멈춥니다.
// 브라우저가 다시 유휴 상태가 되면 requestIdleCallback을 통해 작업을 이어갑니다.
function workLoop(deadline) {
  let shouldYield = false;

  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    shouldYield = deadline.timeRemaining() < 1; // 브라우저의 유휴 시간이 1ms 미만이면 시간 부족함 -> 작업을 중단
  }

  if (!nextUnitOfWork && wipRoot) {
    commitRoot(); // 더 이상 다음 작업이 없으면, 전체 fiber트리를 돔에 커밋함.
    // commitRoot에서 모든 노드가 한번에 돔에 추가게 됨.
  }

  window.requestIdleCallback(workLoop); // 다음 유휴 상태가되면 실행할 작업 예약해두고 끝
}

window.requestIdleCallback(workLoop);
// [requestIdleCallback] : 브라우저의 idle 상태에 호출될 함수를 대기열에 넣는 브라우저 내장 기능
// 브라우저는 현재 필요한 중요한 작업(예: 사용자 input입력)을 모두 마친 뒤에 남는 시간이 있다고 판단하면 requestIdleCallback으로 예약된 workLoop를 실행합니다.
// deadline.timeRemaining():  현재 유휴 상태에서 사용할 수 있는 남은 시간을 밀리초 단위로 반환

// 추가 <4> fiber ---------------------------------- 아래 설명
// Fiber는 작업 단위를 작은 청크로 나누는 데이터 구조입니다.
// 다음 작업 단위를 반환하는 함수. 작업 단위를 만들면서 부모<->자식을 잇는다.
// 하나의 element는, 하나의 fiber가 되고, 이 fiber가 바로 위에서 정의한 nextUnitOfWork가 된다

// requestIdleCallback에 브라우저 유휴때 실행할 workLoop 넣어놓고, workLoop 실행될때 performUnitOfWork 실행됨. // 그럼 root요소 만드는 fiber(작업단위) 생성됨.

function performUnitOfWork(fiber) {
  if (!fiber.dom) {
    fiber.dom = createDom(fiber); // <div id="root"></div>
  }

  // [DELETE]
  // if (fiber.parent) {
  //   fiber.parent.dom.appendChild(fiber.dom);
  //   // <5>돔 변경시키는 부분 제거하고 wipRoot(work in progress)로 변경
  // }

  const elements = fiber.props.children;
  reconcileChildren(fiber, elements);

  // fiber 결과 -
  /*
   {dom : div#root , 
   props : { type : div, children : [{type:h1},{type:h2}}]} ,
   children .. }
  */
  // 1. 자식 있으면 자식부터 태스크 추가
  if (fiber.child) {
    return fiber.child; // <div id="root"> "<div id='foo' ></div>" </div>
  }
  let nextFiber = fiber;
  while (nextFiber) {
    // 2. 자식 없으면 형제(sibling)
    if (nextFiber.sibling) {
      return nextFiber.sibling;
    }
    // 3. 형제 없으면 부모의 형제(uncle) 실행
    nextFiber = nextFiber.parent;
  }
}

// dom 업데이트(재조정)
function reconcileChildren(wipFiber, elements) {
  let index = 0;
  let prevSibling = null;

  while (index < elements.length) {
    const element = elements[index];

    const newFiber = {
      type: element.type, // div 부모 요소
      props: element.props,
      parent: wipFiber, // root요소
      dom: null,
    };

    if (index === 0) {
      wipFiber.child = newFiber; // <div id="root"> <div id='foo'></div> </div>
    } else {
      prevSibling.sibling = newFiber; // <div id="root"><h1></h1> "<h2></h2>" </div>
      // index 1 부터는 0일때 넣은 자식과  동일 선상의 형제로하여, 같은 선상의 child가되는 것임.
    }

    prevSibling = newFiber;
    index++;
  }
}
// ----------------------------------------

const Didact = {
  createElement: createElement,
  render: render,
};

// [1]
/** @jsxRuntime classic /
  /* @jsx Didact.createElement */
const element = Didact.createElement(
  "div",
  { id: "foo" },
  Didact.createElement("h1", null, "bar"), // createElement 직접 만든 함수 사용
  Didact.createElement("h2") // createElement 직접 만든 함수 사용
);
const container = document.getElementById("root");
Didact.render(element, container);

/*
// 1. element
{
    "type": "div",
    "props": {
        "id": "foo",
        "children": [
            {
                "type": "h1",
                "props": {
                    "children": [
                        {
                            "type": "TEXT_ELEMENT",
                            "props": {
                                "nodeValue": "bar",
                                "children": []
                            }
                        }
                    ]
                }
            },

            {
                "type": "h2",
                "props": {
                    "children": []
                }
            }
        ]
    }
}
*/

/*
2. render - dom 결과 
  <div id="foo"> 
    <h1>bar</h1> 
    <h2></h2> 
  </div>
*/

/* 4. fiber
<fiber 인자 형태>
const fiber = {
  dom: {},
  props: {
    children: [
      {
        type: "div",
        props: {
          id: "foo",
          children: [
            {
              type: "h1",
              props: {
                children: [
                  {
                    type: "TEXT_ELEMENT",
                    props: { nodeValue: "bar", children: [] },
                  },
                ],
              },
            },
            { type: "h2", props: { children: [] } },
          ],
        },
      },
    ],
  },
};

Fiber 구조는 DFS(깊이 우선 탐색) 방식으로 작업을 순회합니다:
자식 -> 형제 -> 부모의 형제로 이동.
*/
