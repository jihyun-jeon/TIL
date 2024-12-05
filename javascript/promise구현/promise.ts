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
            (result as MyPromise_<U>).then(resolve, reject);
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
            (result as MyPromise_<U>).then(resolve, reject);
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
        callback(value);
        return value;
      },
      (value) => {
        callback(value);
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

// ------------------------------------------------------
/* 📍[P0]   
<프라미스는 CPS(Continuation Passing Style) 패턴을 기반으로 비동기 작업을 체이닝할 수 있도록 돕는다.>
Promise 객체 생성과 초기 실행은 동기적이다.
Promise가 생성될 때 전달된 콜백 함수(예: executor)는 즉시 실행된다.
하지만 resolve로 전달된 결과값은 즉시 처리되지 않고 다음 작업(then, catch)으로 비동기적으로 전달된다.

즉, (Promise는 비동기라고 하기보단 자세히 말하자면,) 
Promise는 비동기 작업을 처리할 수 있도록 연결해주는 도구인 것이다.

※ 나만의 이해용 설명
Promise : 선물 상자 (동기) , 선물상자 안에 있는 값을 전달할 뿐
resolve된 값을 꺼내 쓰는것 : 선물 상자를 뜯으면 그때서야 주는 값(비동기)
 */

// <노트> --------------------------------------------------
/**
 * 📍[P1] - executor(this.resolve.bind(this), this.reject.bind(this));
 * this 바인딩 해줘야 this는 프로미스 인스턴스 객체가 제대로 됨.
 * 안하면 this는 window 여서 resolve 못찾음.
 *
 * 이유
 * setTimeout(() => { resolve("성공1");}
 * setTimeout에서 this는 window이고, resolve는 그냥 함수 호출이기 때문에, resolve안의 this도 window임.
 */

/**
 * 📍[P2] - resolve(catchCallback(value));
 * reject(catchCallback(value)) 아님!
 *
 * catch 는 : 비동기 작업에서 실패(reject) 상태를 처리하는 메서드
 * catch 는 이미 실패 상태를 처리한 뒤, 다음 체이닝은 연결해야 하기 때문에 (catch()."then()")
 * resolve를 호출해 새로운 성공 상태로 전환하는 것임.
 *
 * catch 콜백함수의 반환 값을 resolve한 새 Promise를 반환하는 것임.
 */

/**
 * 📍[P3] - finally
 * finally도 프로미스를 반환한다.
 * then,catch,finally 모두 콜백함수의 반환 값(없으면 undefined)을 "resolve" 한 "프로미스를" 반환 하는 것이다.
 */

/**
 * 📍[P4] - queueMicrotask()
 * 왜 Queue에 저장해두는가?
 * : 비동기 작업의 순서를 보장하기 위해
 * : 큐가 없으면, setTimeout 콜백함수의 resolve 기다리지 않고, then 콜백함수가 먼저 바로 resolve 되버림!
 *
 * 때문에 setTimeout이 0초여도 큐에 한번 들어갔다 오게되어 동기 실행 코드보다 느리게 실행된다.
 *
 * 📍[P5] then에서 또 프로미스 반환되는 로직 설명⭐️
 * 1) thenCallback(value);실행 -> 서브 프로미스 반환 -> 서브 프로미스 resolve 실행
 * -> update(fillfied , 성공2) -> 큐에 서브 프로미스 콜백 등록 (서브프로미스 resolve대기상태)
 *
 * 2) 동기 코드 남은거 실행  const result = 서브 프로미스{queue에서 resolve 대기상태}
 * result가 프로미스 인스턴스 객체여서
 * if (result instanceof MyPromise_ || result instanceof Promise) {} 에 걸림
 *
 * 3) result.then("resolve") 실행. 서브 프로미스{큐 resolve 대기}.then(resolve) 실행되는 것임.
 * 이때의 resolve는 then프로미스를 this로 하는 resolve임!!!
 *
 * 4) 서브 프로미스의 this에 this.thenCallbacks에 Push 하고 끝
 * 5) 동기 다 끝났으니, 큐에 넣어놓은 서브 프로미스 콜백 실행됨. this.value = 성공2
 * 6) this.runCallbacks 실행 -> 4에서 push헤놔서 저장된 thenCbs 실행
 * 7) resolve(성공2)가 실행되는데, 이때 resolve는 then프로미스꺼임.
 * 때문에 then 프로미스의 값이 리졸브되서 -> 다음 then으로 채이닝
 */
