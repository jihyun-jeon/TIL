import React, { Component, useState, useEffect } from "react";
import { createPortal } from "react-dom";

// Error Boundary는 아직 함수형 컴포넌트로 완전히 대체할 수 없어서 클래스로 유지
class ErrorBoundary extends Component {
  state = { hasError: false };

  componentDidCatch = (error, info) => {
    this.setState({ hasError: true });
  };

  render() {
    const { hasError } = this.state;
    if (hasError) {
      return <ErrorFallback />;
    } else {
      return this.props.children;
    }
  }
}

const ErrorFallback = () => "Sorry, something wrong";

//
const ErrorMaker = () => {
  const [friends, setFriends] = useState(["A", "B", "C", "D"]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFriends(undefined);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  return friends.map((friend) => `_${friend}_`);
};

//
const Message = () => "Portal Message";
const Portals = () => {
  return createPortal(<Message />, document.getElementById("touchme1"));
};

//
const Comp3 = () => {
  return "hello : ";
};

// 방식 1 : 컴포넌트 래핑
// HOC 대신 컴포넌트로 감싸는 방식으로 변경
const ErrorHandling1 = () => {
  return (
    <>
      <Comp3 />
      <ErrorBoundary>
        <Portals />
      </ErrorBoundary>
      <ErrorBoundary>
        <ErrorMaker />
      </ErrorBoundary>
    </>
  );
};

export default ErrorHandling1;
