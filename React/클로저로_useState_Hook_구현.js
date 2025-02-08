/* 클로저로 useState Hook 구현하기 */
/* <Hook과 클로저의 관계는?>
컴포넌트가 렌더링될 때마다 컴포넌트 함수가 새로 실행되므로, 이전 상태(state)를 기억하고 접근하려면 클로저가 필요하다.
- useState는 내부적으로 이전 상태를 유지하기 위해 클로저를 사용한다.
- 컴포넌트가 리렌더링 될 때마다 useState가 다시 실행되지만, 리액트는 상태를 유지하기 위해 useState함수 외부에 값을 저장하고 
  클로저를 통해 접근하기 때문에 기존 상태를 유지할 수 있는것 이다!
*/


const React = (function(){
    let hooks = [] // 클로저 [1 , apple] // click() -> [2 , apple] // type() -> [2, pear]
    let idx = 0 // 클로저 0 1 // 0 1 // 0 1

    function useState(initVal){
        const _idx = idx //  클로저를 활용한 setState 인덱스 고정! - 첫번째 useState는 인덱스 0, 두번째 useState는 인덱스 1로 고정됨
        const state = hooks[idx] || initVal // 1 apple // 2 apple // 2 pear
        const setState = newVal => {hooks[_idx] = newVal} // hooks[0] = newVal , hooks[1] = newVal
        idx++
        return [state, setState]
    }

    function render(Component){
        idx = 0
        const C = Component()
        C.render()
        return C
    }
    return {useState , render}

})()
 
function Component(){
    const [count , setCount] = React.useState(1)
    const [text , setText] = React.useState('apple')

    return {
        render : ()=> console.log({count , text}),
        click : ()=> setCount(count+1),
        type : (word)=> setText(word),
    }
}

var App = React.render(Component) // {count : 1 , text : apple}

App.click();
var App = React.render(Component) // {count : 2 , text : apple}

App.type('pear')
var App = React.render(Component) // {count : 2 , text : pear}