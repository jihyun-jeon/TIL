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
    thenCallback?: (x: T) => MyPromise_<U> | Promise<U> | U,
    catchCallback?: (ex: any) => MyPromise_<U> | Promise<U> | U
  ): MyPromise_<U> {
    return new MyPromise_<U>((resolve, reject) => {
      this.thenCallbacks.push((value) => {
        if (!thenCallback) {
          resolve(value as unknown as U);
          return;
        }

        try {
          const result = thenCallback(value);
          if (result instanceof MyPromise_ || result instanceof Promise) {
            (result as MyPromise_<any>).then(resolve, reject);
          } else {
            resolve(result);
          }
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
          const result = catchCallback(value);
          if (result instanceof MyPromise_ || result instanceof Promise) {
            (result as MyPromise_<any>).then(resolve, reject);
          } else {
            resolve(result as U);
          }
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

// 실행 - promise에서 promise 또 반환 ----------------------------------
const promise = new MyPromise_((resolve, reject) => {
  setTimeout(() => {
    resolve("성공1");
  }, 1000);
});

promise
  .then((result) => {
    console.log("then-1", result); //  then-1 성공1
    return new MyPromise_((resolve, reject) => {
      resolve("성공2");
    });
  })
  .then((result) => {
    console.log("then-2", result); // then-2 성공2
    return "성공3";
  });

/**
 * 노트
 *
 * <then에서 또 프로미스 반환되는 로직>
 * [1] thenCallback(value);실행 -> 서브 프로미스 반환 -> 서브 프로미스 resolve 실행
 * -> update(fillfied , 성공2) -> 큐에 서브 프로미스 콜백 등록 (서브프로미스 resolve대기상태)
 *
 * [2] 동기 코드 남은거 실행  const result = 서브 프로미스{queue에서 resolve 대기상태}
 * result가 프로미스 인스턴스 객체여서
 * if (result instanceof MyPromise_ || result instanceof Promise) {} 에 걸림
 *
 * [3] result.then("resolve") 실행. 서브 프로미스{큐 resolve 대기}.then(resolve) 실행되는 것임.
 * 이때의 resolve는 then프로미스를 this로 하는 resolve임!!!
 *
 * [4] 서브 프로미스의 this에 this.thenCallbacks에 Push 하고 끝
 * [5] 동기 다 끝났으니, 큐에 넣어놓은 서브 프로미스 콜백 실행됨. this.value = 성공2
 * [6] this.runCallbacks 실행 -> 4에서 push헤놔서 저장된 thenCbs 실행
 * [7] resolve(성공2)가 실행되는데, 이때 resolve는 then프로미스꺼임
 * 때문에 then 프로미스의 값이 리졸브되서 -> 다음 then으로 채이닝
 */
