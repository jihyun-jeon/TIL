// turtle601
// https://github.com/turtle601/promise-object-myself

// https://velog.io/@turtle601/JS-%EC%9E%90%EB%B0%94%EC%8A%A4%ED%81%AC%EB%A6%BD%ED%8A%B8-Promise-%EA%B0%9D%EC%B2%B4-%EC%A7%81%EC%A0%91-%EA%B5%AC%ED%98%84%ED%95%B4%EB%B3%B4%EA%B8%B0

const PROMISES_STATE = Object.freeze({
  pending: "pending",
  fulfilled: "fulfilled",
  rejected: "rejected",
});

class MyPromise {
  #value = null;
  #state = PROMISES_STATE.pending; //
  #catchCallbacks = [];
  #thenCallbacks = [];

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
      this.#thenCallbacks = [];
    }

    if (this.#state === PROMISES_STATE.rejected) {
      this.#catchCallbacks.forEach((callback) => callback(this.#value));
      this.#catchCallbacks = [];
    }
  }

  #update(state, value) {
    // state, value : fullfiled 성공1
    queueMicrotask(() => {
      if (this.#state !== PROMISES_STATE.pending) return;
      if (value instanceof MyPromise) {
        value.then(this.#resolve.bind(this), this.#reject.bind(this));
        return;
      }
      this.#state = state;
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
          return;
        }

        try {
          resolve(thenCallback(value));
          // thenCallback(value) : 성공2! , 성공3! , undefined
        } catch (error) {
          reject(error);
        }
      });

      this.#catchCallbacks.push((value) => {
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
        throw value;
      }
    );
  }
}

module.exports = MyPromise;

// 예제 실행 -----------------------------------
const promise = new MyPromise((resolve, reject) => {
  console.log("1. 작업 시작");

  setTimeout(() => {
    console.log("3. 작업 완료");
    resolve("성공1!"); // 1초 후에 성공 상태로 변경
  }, 1000);
});

promise
  .then((result) => {
    console.log("4. 첫 번째 then: " + result); // 성공1
    return "성공2!";
    // return promise;
  })
  .then((result) => {
    console.log("5. 두 번째 then", result); // 성공2
    return "성공3!";
  })
  .catch((error) => {
    console.log("catch: " + error);
  })
  .then((result) => {
    console.log("6. 세 번째 then", result); // 성공3!
  });

console.log("2. 작업 끝");
