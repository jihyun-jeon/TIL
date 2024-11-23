const STATE = {
  FULFILLED: "fulfilled",
  REJECTED: "rejected",
  PENDING: "pending",
};

class MyPromise {
  #thenCds = [];
  #catchCbs = [];
  #state = STATE.PENDING;
  #value;
  #onSuccessBind = this.#onSuccess.bind(this); // 왜 bind ?
  #onFailBind = this.#onFail.bind(this); // 왜 bind ?

  constructor(cb) {
    try {
      cb(this.#onSuccessBind, this.#onFailBind);
    } catch (error) {
      this.#onFail(error);
    }
  }

  // 콜백함수 실행하는 함수
  #runCallbacks() {
    if (this.#state === STATE.FULFILLED) {
      // 성공하면 모든 then을 실행
      this.#thenCds.forEach((callback) => {
        callback(this.#value);
      });

      this.#thenCds = []; // 콜백 쌓인거 초기화
    }

    if (this.#state === STATE.REJECTED) {
      // 실패하면 모든 catch를 실행
      this.#catchCbs.forEach((callback) => {
        callback(this.#value);
      });

      this.#thenCds = []; // 콜백 쌓인거 초기화
    }
  }

  //  MyPromise 클래스 안에서만 호출됨. 클래스 외부로 공개X
  #onSuccess(value) {
    if (this.#state !== STATE.PENDING) return; // ?
    this.#value = value;
    this.#state = STATE.FULFILLED;
  }

  //  MyPromise 클래스 안에서만 호출됨. 클래스 외부로 공개X
  #onFail(value) {
    if (this.#state !== STATE.PENDING) return; // ?
    this.#value = value;
    this.#state = STATE.REJECTED;
  }

  then(thenCb, catchCb) {
    return new MyPromise((resolve, reject) => {
      // resolve('Hi'); 호출 하면 Hi값이 result로 받아지는 것임

      this.#thenCds.push((result) => {
        if (result === null) {
          resolve(result);
          return;
        }
      });

      if (thenCb !== null) this.#thenCds.push(thenCb);
      if (catchCb !== null) this.#catchCbs.push(catchCb);
      this.#runCallbacks();
    });
    // then은 프로미스{값} 을 반환하는 것임! - 프로미스 체이닝 가능
  }

  catch(cd) {
    this.then(undefined, cd);
  }

  finally(cd) {
    this.#thenCds.push(cd);
    this.#runCallbacks();
  }
}

const p1 = new MyPromise((resolve, reject) => {
  resolve("HI~");
  reject("err~");
});

// ------------------------------------------------------
// [P1] Promise()
// 프로미스 호출시 콜백 함수 선언
// 콜백 함수 인자는 resolve, reject
// (resolve, reject) => {} 콜백 함수가 constructor의 cd로 들어감

// [P2] cd호출
// cd 콜백함수의 resolve, reject 인자로 성공시와 실패시 실행 함수를 넣어줌
// 성공시 resolv() => onSuccess() 실행
// 실패시 reject() => onFail() 실행
// onSuccess, onFail은 MyPromis 안에서만 쓰이지, p1.then() p1.catch()와 같이 쓸 수 없움
// 따라서 # 처리 y (비공개 프로퍼티 처리) 하여 -> 클래스 안에서만 쓰도록 처리

// [P3]
// then(()=>{}) .then(()=>{}) .then(()=>{})
// 이렇게 비동기 실행을 순차적으로 실행할 땐
// then메서드에서 실행할 콜백함수를 thenCbs에 push하여 저장해두고 -> 성공할 때 마다 -> onSuccess 호출하도록
