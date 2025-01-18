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

// [P1] 상속이 일어나는 것임.
// 프로토타입 체인을 통해 Poodle -> Dog -> Object 까지 연결되어 상속이 이뤄짐

// [P1] [상속 구현 방법 1] Object.setPrototypeOf() 사용 (권장 방법)
Object.setPrototypeOf(Poodle.prototype, Dog.prototype);
Poodle.prototype.constructor = Poodle;

// [P1] [상속 구현 방법 2] Object.create() 사용 (권장 방법)
Poodle.prototype = Object.create(Dog.prototype);
Poodle.prototype.constructor = Poodle;

Poodle.prototype.run = function () {
  console.log(`${this.name}는 ${this.speed}km 로 뜁니다.`);
};

// [P2] 프로토타입 기반 상속은 "동적"이다
// 이런식으로 환경에 따라 Poodle이 like메서드를 가질수도, 안가질수도 있게된다.
if (process.env.isShow) {
  Poodle.prototype.like = function () {
    console.log(`${this.name}는 ${this.skill} 하는 것을 좋아합니다.`);
  };
}

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
 * [P1] 프로토타입 기반 상속 코드 설명
 *
 * (1) 부모 생성자 호출 (super와 비슷) - Dog.call(this, name, age);
 * 부모에서 정의된 name과 age 속성을 자식 인스턴스에 직접 추가
 *
 * (2) 프로토타입 체인 연결 - Poodle.prototype = Object.create(Dog.prototype);
 * Object.create(Dog.prototype)은 Dog.prototype을 상속하는 새로운 객체를 생성한다.
 * Object.create() 메서드는 지정된 프로토타입 객체 및 속성(property)을 갖는 새 객체를 만든다.
 * 객체를 새로 만들고, 그 객체의 프로토타입을 Dog.prototype으로 지정 한 후,
 * 이후 상속받을 프로토타입 객체(Poodle.prototype)에 연결시키는 것이다.
 *
 * (3) 자식 생성자(Poodle)의 constructor 속성을 올바르게 설정
 * Poodle.prototype.constructor = Poodle;
 * Object.create로 프로토타입을 설정하면, Poodle.prototype.constructor가 부모 클래스(Dog)를 가리키게 되서 다시 설정해주는 것임.
 *
 * (4) Poodle.prototype에 메서드 추가 후 상속 실행하면 안되는 이유
 * Poodle에 메서드 넣은 뒤에 상속 실행하면,
 * Poodle.prototype = Object.create(Dog.prototype); 과정에서 다 덮어 씌여버리게 됨.
 * 때문에 상속 먼저 설정하고, 메서드 추가 해야 함.
 */

/**
 * [p2] 프로토타입 상속과 클래스 상속
 *
 * <프로토타입 으로 구현한 상속은 "동적"임>
 * (특성)
 * 런타임에서 동적으로 수정이 가능하다.
 * 프로토타입 체인을 조작해 새로운 속성이나 메서드를 동적으로 추가하거나 수정할 수 있다.
 * (장)
 * 그래서 플러그인 같은거 만들때 기능 덮어씌우기 위해 활용된다.
 * 이미 어떤 라이브러리에 기능이 구현되있는데, 프로토타입으로 그 기능을 추가,변경 할 수 있다.
 * (단)
 * 그러나 이렇게 동적으로 변경되면 코드를 예측하기 어렵다.
 *
 * <클래스로 구현한 상속은 "정적"임>
 * (특성)
 * 런타임에서 상속 체인을 직접 수정하기 어렵다.
 * (장)
 * 이렇게 유연하지 않아서 코드를 실행하기 전에도 코드를 예측할 수 있어 명확하고 안정적이다.
 * 명시적이고 읽기 쉽다.
 *
 * => 이렇게 정적인 코드가 안정적이여서 클래스로 하는게 대체로 좋다
 * */
