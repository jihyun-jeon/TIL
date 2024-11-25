// turtle601
// https://github.com/turtle601/promise-object-myself
// https://velog.io/@turtle601/JS-%EC%9E%90%EB%B0%94%EC%8A%A4%ED%81%AC%EB%A6%BD%ED%8A%B8-Promise-%EA%B0%9D%EC%B2%B4-%EC%A7%81%EC%A0%91-%EA%B5%AC%ED%98%84%ED%95%B4%EB%B3%B4%EA%B8%B0

// 코드 분석

const PROMISES_STATE = Object.freeze({
  pending: "PENDING",
  fulfilled: "fulfilled",
  rejected: "rejected",
});

class MyPromise {
  #value = null;
  #state = PROMISES_STATE.pending;
  #catchCallbacks = []; //
  #thenCallbacks = []; // 다음에 실행할 콜백함수를 현재 인스턴스의 this.thenCallbacks에 담아둠

  constructor(executor) {
    try {
      executor(this.#resolve.bind(this), this.#reject.bind(this));
    } catch (error) {
      this.#reject(error);
    }
  }

  #runCallbacks() {
    if (this.#state === PROMISES_STATE.fulfilled) {
      this.#thenCallbacks.forEach((callback) => callback(this.#value));
      this.#thenCallbacks = []; // 왜 초기화?
    }

    if (this.#state === PROMISES_STATE.rejected) {
      this.#catchCallbacks.forEach((callback) => callback(this.#value));
      this.#catchCallbacks = []; // 왜 초기화?
    }
  }

  // update(fulfilled , promise{})
  // then 인스턴스 객체 생성 -> thenCallbacks에 push만 하고 끝
  // resolve("Succuess1"); 실행 -> update(fulfilled, 'Succuess1')
  // .then((result) => {return "성공3";} 실행
  #update(updateState, value) {
    queueMicrotask(() => {
      if (this.#state !== PROMISES_STATE.pending) return;

      // value가 프로미스 인스턴스 객체인지 확인
      if (value instanceof MyPromise) {
        value.then(this.#resolve.bind(this), this.#reject.bind(this));
        return;
      }

      this.#state = updateState;
      this.#value = value;
      this.#runCallbacks();
    });
  }

  #resolve(value) {
    this.#update(PROMISES_STATE.fulfilled, value);
  }

  #reject(error) {
    this.#update(PROMISES_STATE.rejected, error);
  }

  then(thenCallback, catchCallback) {
    return new MyPromise((resolve, reject) => {
      this.#thenCallbacks.push((value) => {
        if (!thenCallback) {
          resolve(value);
          //  첫 번째 콜백(thenCallback)이 없으면 성공 결과를 "다음 then메서드의 콜백함수에" 그대로 전달하기 위해 resolve(result)를 호출.
          return;
        }

        try {
          resolve(thenCallback(value));
        } catch (error) {
          reject(error);
        }
      });

      this.#catchCallbacks.push((value) => {
        if (!catchCallback) {
          reject(value);
          // 두 번째 콜백(catchCallback)이 없으면 실패 결과를 "다음 catch메서드의 콜백함수에" 그대로 전달하기 위해 reject(result)를 호출.
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
        throw value;
      }
    );
  }
}

// 예제 실행1 : then 체이닝 ------------------------------------------------------
const promise1 = new MyPromise((resolve, reject) => {
  setTimeout(() => {
    resolve("성공1");
  }, 1000);
});

promise1
  .then((result) => {
    console.log("then-1", result); // ✔️ 성공1
    return "성공2";
  })
  .then((result) => {
    console.log("then-2", result); // ✔️ 성공2
    return "성공3";
  })
  .catch((error) => {
    console.log("catch :" + error);
    return "실패";
  })
  .then((result) => {
    console.log("then-3", result); // ✔️ 성공3
    return "성공4";
  })
  .finally(() => {
    console.log("finally :");
  });

// 예제 실행2 : 프로미스 rejected -> then 두번쨰 인자로 catch ----------------------------
/*
const promise2 = new MyPromise((resolve, reject) => {
  setTimeout(() => {
    reject("실패1");
  }, 1000);
});

promise2
  .then(
    (result) => {
      console.log("then-1", result);
      return "성공2";
    },
    (result) => {
      console.log("then-2", result); // ✔️ 실패1
      return "실패2";
    }
  )
  .then((result) => {
    console.log("then-3", result); // ✔️ 실패2
    return "성공3";
  });
  */

// 예제 실행3 : 에러 발생시 ------------------------------------------------------
/*
const promise3 = new MyPromise((resolve, reject) => {
  setTimeout(() => {
    resolve("성공1");
  }, 1000);
});

promise3
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
  });
  */

// 예제 실행4 : Promise 안에서 Promise 리턴 -----------------------------------
/*
const promise4 = new MyPromise((resolve, reject) => {
  setTimeout(() => {
    resolve("성공1");
  }, 1000);
});

promise4
  .then((result) => {  
    console.log("then-1", result); // ✔️ 성공1
    return new MyPromise((resolve, reject) => {
      setTimeout(() => {
        resolve("Succuess1");
      }, 1000);
    });
  })
  .then((result) => {
    console.log("then-2", result); // ✔️ Succuess1
    return "성공3";
  })
  .catch((error) => {
    console.log("catch :" + error); //
    return "실패";
  })
  .then((result) => {
    console.log("then-3", result); // ✔️ 성공3
    return "성공4";
  });
  */

/*
[P1 ← P2(첫번쨰then) ← P5(두번쨰then) ← P6(catch) ← P7(세번쨰then)]
       |
      P3(첫번쨰then이 반환한 new MyPromise) ← P4(then)
*/

// 예제 실행5 : async-await  ---------------------------------------------
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

async function promise5() {
  const result2 = await asyncFunc();
  console.log("then-3", result2); // ✔️ "실패"
  return "성공4";
}

promise5();
*/

// 예제 실행6 : async-await  ---------------------------------------------
/*
const promise5 = new MyPromise((resolve, reject) => {
  setTimeout(() => {
    resolve("성공1");
  }, 1000);
});

async function promise6() {
  try {
    let result = await promise5; // awaits는 매직
    console.log("then-1", result); // ✔️ 성공1

    result = await new MyPromise((resolve) => {
      setTimeout(() => {
        resolve("성공2");
      }, 1000);
    });
    console.log("then-2", result); // ✔️ 성공2

    result = await new MyPromise((resolve) => {
      setTimeout(() => {
        resolve("성공3");
      }, 1000);
    });
    console.log("then-3", result); // ✔️ 성공3
  } catch (error) {
    console.log("catch :", error); // 에러 발생 시
    return "실패";
  }
}

promise6();
*/
