class MyPromise {
  constructor(executor) {
    this.state = "pending"; // 초기 상태
    this.value = undefined; // 작업 결과 값
    this.thenCallbacks = []; // 성공 콜백 // ()=>{console(4)} ()=>{console(5)}
    this.catchCallbacks = []; // 실패 콜백 // ()=>{console(catch)}

    const resolve = (value) => {
      if (this.state !== "pending") return;
      this.state = "fulfilled";
      this.value = value;
      this.runCallbacks(); // 상태가 fulfilled로 변경되면 콜백 실행
    };

    const reject = (value) => {
      if (this.state !== "pending") return;
      this.state = "rejected";
      this.value = value;
      this.runCallbacks(); // 상태가 rejected로 변경되면 콜백 실행
    };

    try {
      executor(resolve, reject); // 사용자 콜백 실행
    } catch (error) {
      reject(error);
    }
  }

  runCallbacks() {
    if (this.state === "fulfilled") {
      this.thenCallbacks.forEach((callback) => callback(this.value)); // 성공 콜백 실행
      this.thenCallbacks = []; // 콜백 배열 비우기
    }

    if (this.state === "rejected") {
      this.catchCallbacks.forEach((callback) => callback(this.value)); // 실패 콜백 실행
      this.catchCallbacks = []; // 콜백 배열 비우기
    }
  }

  then(thenCallback) {
    if (this.state === "fulfilled") {
      thenCallback(this.value); // 상태가 fulfilled이면 즉시 실행
    } else if (this.state === "pending") {
      this.thenCallbacks.push(thenCallback); // pending 상태이면 콜백을 배열에 저장
    }
    return this; // 체이닝 지원
  }

  catch(catchCallback) {
    if (this.state === "rejected") {
      catchCallback(this.value); // 상태가 rejected이면 즉시 실행
    } else if (this.state === "pending") {
      this.catchCallbacks.push(catchCallback); // pending 상태이면 콜백을 배열에 저장
    }
    return this; // 체이닝 지원
  }
}

// 예제 실행 -----------------------------------
const fetch = new MyPromise((resolve, reject) => {
  console.log("1. 작업 시작");

  setTimeout(() => {
    console.log("3. 작업 완료");
    resolve("성공!"); // 1초 후에 성공 상태로 변경
  }, 1000);
});

fetch
  .then((result) => {
    console.log("4. 첫 번째 then: " + result);
    return "v";
  })
  .then((re) => {
    console.log("5. 두 번째 then");
  })
  .catch((error) => {
    console.log("catch: " + error);
  })
  .then(() => {
    //
  });

console.log("2. 작업 끝");
