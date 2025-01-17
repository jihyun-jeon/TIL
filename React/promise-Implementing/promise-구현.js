const PROMISES_STATE = {
  pending: "pending",
  fulfilled: "fulfilled",
  rejected: "rejected",
};

class MyPromise {
  value = null;
  state = PROMISES_STATE.pending;
  thenCallbacks = [];
  catchCallbacks = [];

  constructor(executor) {
    try {
      executor(this.resolve.bind(this), this.reject.bind(this));
    } catch (error) {
      this.reject(error);
    }
  }

  runCallbacks() {
    if (this.state === PROMISES_STATE.fulfilled) {
      this.thenCallbacks.forEach((cb) => cb(this.value));
      // this.thenCallbacks = []; // 질문 [Q1]
    }
    if (this.state === PROMISES_STATE.rejected) {
      this.catchCallbacks.forEach((cb) => cb(this.value));
      // this.catchCallbacks = []; // 질문 [Q1]
    }
  }

  update(updateState, value) {
    queueMicrotask(() => {
      if (this.state !== PROMISES_STATE.pending) return;

      // [TODO] Promise 안에서 Promise 리턴 하는 경우 <- 잘 이해가 안되서 일단 스킵
      // value가 프로미스 인스턴스 객체인지 확인
      // if (value instanceof MyPromise) {
      //   value.then(this.resolve.bind(this), this.reject.bind(this));
      //   return;
      // }

      this.state = updateState;
      this.value = value;
      this.runCallbacks();
    });
  }

  resolve(value) {
    this.update(PROMISES_STATE.fulfilled, value);
  }

  reject(value) {
    this.update(PROMISES_STATE.rejected, value);
  }

  then(thenCallback, catchCallback) {
    return new MyPromise((resolve, reject) => {
      this.thenCallbacks.push((value) => {
        if (!thenCallback) {
          resolve(value);
          return;
        }
        try {
          resolve(thenCallback(value));
        } catch (error) {
          reject(error);
        }
      });

      this.catchCallbacks.push((value) => {
        if (!catchCallback) {
          reject(value);
          return;
        }
        try {
          resolve(catchCallback(value));
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  catch(catchCallback) {
    return this.then(undefined, catchCallback);
  }

  finally(callback) {
    return this.then(
      (value) => {
        callback();
        return value;
      },
      (value) => {
        callback();
        return value;
      }
    );
  }
}

// 실행코드
const promise = new MyPromise((resolve, reject) => {
  setTimeout(() => {
    resolve("성공1");
  }, 1000);
});

promise
  .then((result) => {
    console.log("then-1", result); // ✔️ 성공1
    throw new Error();
  })
  .then((result) => {
    console.log("then-2", result);
    return "성공3";
  })
  .catch((error) => {
    console.log("catch :" + error); // ✔️ Error
    return "실패";
  })
  .then((result) => {
    console.log("then-3", result); // ✔️  "실패"
    return "성공4";
  })
  .finally(() => {
    console.log("finally");
  });

// 실행코드 async-awiat
/*
  async function asyncFunc() {
    try {
      const result1 = await new Promise((resolve) => {
        setTimeout(() => {
          resolve("성공1");
        }, 1000);
      });
      console.log("then-1", result1); // ✔️ 성공1
  
      // 강제로 에러 발생
      throw new Error();
    } catch (error) {
      console.log("catch :" + error); // ✔️ Error
      return "실패";
    }
  }
  
  async function promise2() {
    const result2 = await asyncFunc();
    console.log("then-3", result2); // ✔️ "실패"
    return "성공4";
  }
  
  promise2();
  */

// <질문 & 보완 필요 부분>  ----------------------------------------------------------------------

// [Q1] - 왜 runCallbacks 메서드 실행 이후, this.thenCallbacks = []; 왜 초기화를 해줘야 하는지?
// 어차피 다음 프로미스 인스턴스 객체로 실행이 넘어가는데?

// [2] - Promise 안에서 Promise 리턴 하는 경우 <- 잘 이해가 안되서 일단 스킵

// [3] - 타입스크립트 미적용. js 코드 파악만으로도 여유가 없었음

// <노트> ------------------------------------------------------------------------------------
/**
 * [P1] - executor(this.resolve.bind(this), this.reject.bind(this));
 * this 바인딩 해줘야 this는 프로미스 인스턴스 객체가 제대로 됨.
 * 안하면 this는 window 여서 resolve 못찾음.
 *
 * 이유
 * setTimeout(() => { resolve("성공1");}
 * setTimeout에서 this는 window이고, resolve는 그냥 함수 호출이기 때문에, resolve안의 this도 window임.
 */

/**
 * [P2] - resolve(catchCallback(value));
 * reject(catchCallback(value)) 아님!
 *
 * catch 는 : 비동기 작업에서 실패(reject) 상태를 처리하는 메서드
 * catch 는 이미 실패 상태를 처리한 뒤, 다음 체이닝은 연결해야 하기 때문에 (catch()."then()")
 * resolve를 호출해 새로운 성공 상태로 전환하는 것임.
 *
 * catch 콜백함수의 반환 값을 resolve한 새 Promise를 반환하는 것임.
 */

/**
 * [P2] - finally
 * finally도 프로미스를 반환한다.
 * then,catch,finally 모두 콜백함수의 반환 값(없으면 undefined)을 resolve 한 프로미스를 반환 하는 것이다.
 */

/**
 * [P3] - queueMicrotask()
 * 왜 Queue에 저장해두는가?
 * : 비동기 작업의 순서를 보장하기 위해
 * : 큐가 없으면, setTimeout 콜백함수의 resolve 기다리지 않고, then 콜백함수가 먼저 바로 resolve 되버림!
 */
