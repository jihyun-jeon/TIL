## Stacking Context(쌓임 맥락) 이란?

요소들이 화면에서 쌓이는 순서를 결정하는 개념.
요소들이 겹칠 때 어떤 요소가 위로 올라가고, 뒤로 갈지를 결정한다.
일반적으로 `z-index`가 높은 요소가 위에 배치되지만,
새로운 Stacking Context가 생성되면,

1. stacking context에 속한 내부 요소는 그 Stacking Context를 벗어나지 못하고
2. 자식 요소는 zindex값을 부모보다 높게 설정해도, 부모 보다 위에 배치될 수 없게 된다.

<br/>

## Stacking Context의 중요한 특징

1. **내부 요소는 부모의 Stacking Context를 벗어나지 못함**

- 새로운 context가 만들어지면, 그 컨텍스트 내부에서 z-indx가 독립적으로 관리되기 때문에
  외부 context의 z-index 값에 영향을 받지 않는다.
- 따라서, 내부 요소의 z-index를 아무리 높여도, 바깥 context보다 위에 배치되지 않는다.

- 코드 예제
  Stacking Context가 형성되었을 때
  자식 요소의 `z-index`가 아무리 높아도 부모 내에서만 배치되고,
  외부 요소보다 위에 배치되지 않음

```html
<!DOCTYPE html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Stacking Context 예제 2</title>
    <style>
      body {
        background-color: #eee;
      }
      .parent {
        position: relative;
        z-index: 1;
        background: lightcoral;
        width: 200px;
        height: 200px;
        margin: 50px;
        opacity: 0.9; /* 새로운 Stacking Context 생성 */
      }
      .child {
        position: absolute;
        z-index: 9999; /* 매우 높은 값 */
        /* 
        child(자식 요소)의 z-index가 9999로 높더라도,
        부모(빨간색 박스) 바깥에 있는 sibling(파란색 박스)보다 위로 올라가지 못함.
        즉 부모의 Stacking Context 내에서만 배치되며, 외부 요소보다 위에 배치되지 않음.
        */
        width: 100px;
        height: 100px;
        background: yellow;
        top: 50px;
        left: 50px;
      }
      .sibling {
        position: relative;
        z-index: 2; /* 부모보다 높은 z-index */
        background: lightblue;
        width: 200px;
        height: 200px;
        margin: 50px;
        margin-top: -100px; /* 부모 위로 올리기 */
      }
    </style>
  </head>
  <body>
    <div class="parent">
      부모 요소 (z-index: 1, opacity: 0.9)
      <div class="child">자식 요소 (z-index: 9999)</div>
    </div>
    <div class="sibling">형제 요소 (z-index: 2)</div>
  </body>
</html>
```

<br/>

2. **자식 요소는 부모보다 위에 배치될 수 없음**

- 부모의 Stacking Context 내에서만 배치 순서가 결정되기 때문에
- 자식요소가 아무리 z-index를 높여도 부모보다 위에 배치될 수 없다.
- 코드 예제
  Stacking Context가 형성되었을 때, 자식 요소의 `z-index`가 아무리 높아도 부모보다 위에 배치될 수 없는 상황

  ```html
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Stacking Context Example</title>
      <style>
        /* 최상위 요소 */
        .parent {
          position: relative;
          z-index: 1; /* 부모가 새로운 Stacking Context 생성 */
          background: lightgray;
          width: 300px;
          height: 300px;
        }

        /* 자식 요소 - 부모 내부에서 z-index 적용 */
        .child {
          position: absolute;
          z-index: 9999; /* !!자식의 z-index가 엄청 높아도 , 부모보다 높은 z-index 안먹힘*/
          width: 200px;
          height: 200px;
          background: red;
          top: 50px;
          left: 50px;
        }

        /* 독립적인 요소 - 부모보다 위에 배치됨 */
        .overlay {
          position: absolute;
          z-index: 2; /* 부모보다 높은 z-index 가능 */
          background: rgba(0, 0, 255, 0.7);
          width: 300px;
          height: 300px;
          top: 20px;
          left: 20px;
        }
      </style>
    </head>
    <body>
      <!-- 부모 (Stacking Context를 생성) -->
      <div class="parent">
        <!-- 자식 (부모의 Stacking Context 내부에 제한됨) -->
        <div class="child">Child</div>
      </div>

      <!-- 독립적인 요소 (부모보다 위에 배치됨) -->
      <div class="overlay">Overlay</div>
    </body>
  </html>
  ```

## 새로운 Stacking Context가 생성되는 조건

1. `position: absolute|relative|fixed (static이 아니고)` + `z-index 값이 auto가 아닐 때`
2. `opacity < 1` 으로 설정할 때 (투명도를 적용하면 새로운 Stacking Context가 형성됨)
3. `transform, filter, clip-path` 같은 CSS 속성을 사용할 때
