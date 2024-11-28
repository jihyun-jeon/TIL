enum PROMISES_STATE_ {
  pending = "pending",
  fulfilled = "fulfilled",
  rejected = "rejected",
}

class MyPromise_<T> {
  value?: T;
  state = PROMISES_STATE_.pending;
  thenCallbacks: ((x: T) => void)[] = [];
  catchCallbacks: ((ex: any) => void)[] = [];

  constructor(
    executor: (resolve: (x: T) => void, reject: (ex: any) => void) => void
  ) {
    try {
      executor(this.resolve.bind(this), this.reject.bind(this));
    } catch (error) {
      this.reject(error);
    }
  }

  runCallbacks() {
    if (this.state === PROMISES_STATE_.fulfilled) {
      this.thenCallbacks.forEach((cb) => cb(this.value!));
      this.thenCallbacks = [];
    }
    if (this.state === PROMISES_STATE_.rejected) {
      this.catchCallbacks.forEach((cb) => cb(this.value));
      this.catchCallbacks = [];
    }
  }

  update(updateState: PROMISES_STATE_, value?: T) {
    queueMicrotask(() => {
      if (this.state !== PROMISES_STATE_.pending) return;

      // [TODO] Promise 안에서 Promise 리턴 하는 경우 <- 잘 이해가 안되서 일단 스킵
      // value가 프로미스 인스턴스 객체인지 확인
      // if (value instanceof MyPromise_) {
      //   value.then(this.resolve.bind(this), this.reject.bind(this));
      //   return;
      // }

      this.state = updateState;
      this.value = value;
      this.runCallbacks();
    });
  }

  resolve(value: T) {
    if (this.state !== PROMISES_STATE_.pending) return;
    this.update(PROMISES_STATE_.fulfilled, value);
  }

  reject(ex: any) {
    if (this.state !== PROMISES_STATE_.pending) return;
    this.update(PROMISES_STATE_.rejected, ex);
  }

  then<U>(
    thenCallback?: (x: T) => MyPromise_<U>,
    catchCallback?: (ex: any) => MyPromise_<U>
  ): MyPromise_<U> {
    return new MyPromise_<U>((resolve, reject) => {
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

  catch<U>(catchCallback: (ex: any) => MyPromise_<U>): MyPromise_<U> {
    return this.then(undefined, catchCallback);
  }

  finally<U>(callback: (ex: any) => MyPromise_<U>): MyPromise_<U> {
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

// 실행 - promise 또 반환 ----------------------------------
const promise = new MyPromise_((resolve, reject) => {
  setTimeout(() => {
    resolve("성공1");
  }, 1000);
});

promise
  .then(async (result) => {
    console.log("then-1", result); // ✔️ 성공1
    return new MyPromise_((resolve, reject) => {
      setTimeout(async () => {
        resolve("Succuess1");
      }, 1000);
    });
  })
  .then(async (result) => {
    console.log("then-2", result); // ✔️  "Succuess1"
    return "성공4";
  });
