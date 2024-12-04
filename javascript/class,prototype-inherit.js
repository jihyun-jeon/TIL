/**
 *  클래스 기반<->프로토타입 기반 둘다 똑같이 동작하는 코드 만들기
 *  상속을 프로토타입으로 똑같이 흉내내기!
 */

// <프로토타입 기반> --------------------------------------------
function Dog(name, age) {
  this.name = name;
  this.age = age;
}

Dog.prototype.eat = function (food) {
  console.log(`${this.name}는 ${food}를 먹습니다.`);
};

Dog.prototype.sleep = function (hours) {
  console.log(`${this.name}는 ${hours}시간 잡니다.`);
};

function Poodle(name, age, skill, speed) {
  Dog.call(this, name, age);

  this.skill = skill;
  this.speed = speed;
}

Poodle.prototype = Object.create(Dog.prototype);
Poodle.prototype.constructor = Poodle;

Poodle.prototype.run = function () {
  console.log(`${this.name}는 ${this.speed}km 로 뜁니다.`);
};

Poodle.prototype.like = function () {
  console.log(`${this.name}는 ${this.skill} 하는 것을 좋아합니다.`);
};

// <클래스 기반> --------------------------------------------
class Dog {
  constructor(name, age) {
    this.name = name;
    this.age = age;
  }

  eat(food) {
    console.log(`${this.name}는 ${food}를 먹습니다.`);
  }
  sleep(hours) {
    console.log(`${this.name}는 ${hours}시간 잡니다.`);
  }
}

class Poodle extends Dog {
  constructor(name, age, skill, speed) {
    super(name, age);
    this.skill = skill;
    this.speed = speed;
  }

  run() {
    console.log(`${this.name}는 ${this.speed}km 로 뜁니다.`);
  }
  like() {
    console.log(`${this.name}는 ${this.skill} 하는 것을 좋아합니다.`);
  }
}

// 실행 -------------------------------------------------------
const happy = new Poodle("happy", 3, "점프", 20);
happy.eat("사료"); // 상속
happy.sleep(7); // 상속
happy.run();
happy.like();

/**
 * 노트
 *
 *
 * [1] 부모 생성자 호출 (super와 비슷) - Dog.call(this, name, age);
 * 부모에서 정의된 name과 age 속성을 자식 인스턴스에 직접 추가
 *
 * [2] 프로토타입 체인 연결 - Poodle.prototype = Object.create(Dog.prototype);
 * Object.create(Dog.prototype)은 Dog.prototype을 상속하는 새로운 객체를 생성한다.
 * Object.create() 메서드는 지정된 프로토타입 객체 및 속성(property)을 갖는 새 객체를 만든다.
 * 객체를 새로 만들고, 그 객체의 프로토타입을 Dog.prototype으로 지정 한 후,
 * 이후 상속받을 프로토타입 객체(Poodle.prototype)에 연결시키는 것이다.
 *
 * [3] 자식 생성자(Poodle)의 constructor 속성을 올바르게 설정
 * Poodle.prototype.constructor = Poodle;
 * Object.create로 프로토타입을 설정하면, Poodle.prototype.constructor가 부모 클래스(Dog)를 가리키게 되서 다시 설정해주는 것임.
 *
 * [4] Poodle.prototype에 메서드 추가 후 상속 실행하면 안되는 이유
 * Poodle에 메서드 넣은 뒤에 상속 실행하면,
 * Poodle.prototype = Object.create(Dog.prototype); 과정에서 다 덮어 씌여버리게 됨.
 * 때문에 상속 먼저 설정하고, 메서드 추가 해야 함.
 *
 */
