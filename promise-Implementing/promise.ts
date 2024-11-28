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
    thenCallback?: (x: T) => MyPromise_<U> | Promise<U>,
    catchCallback?: (ex: any) => MyPromise_<U> | Promise<U>
  ): MyPromise_<U> {
    return new MyPromise_<U>((resolve, reject) => {
      this.thenCallbacks.push(async (value) => {
        if (!thenCallback) {
          resolve(value as unknown as U);
          return;
        }
        try {
          const v = await thenCallback(value);
          resolve(v);
        } catch (error) {
          reject(error);
        }
      });

      this.catchCallbacks.push(async (value) => {
        if (!catchCallback) {
          reject(value);
          return;
        }
        try {
          const v = await catchCallback(value);
          resolve(v);
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  catch<U>(
    catchCallback: (ex: any) => MyPromise_<U> | Promise<U>
  ): MyPromise_<U> {
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
    throw new Error();
  })
  .then(async (result) => {
    console.log("catch-1", result);
    throw "성공2";
  })
  .catch(async (result) => {
    console.log("then-3", result); // ✔️ Error
    return "성공4";
  });
