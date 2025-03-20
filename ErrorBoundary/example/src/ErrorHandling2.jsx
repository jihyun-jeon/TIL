import React, { Component, useState, useEffect } from "react";
import { createPortal } from "react-dom";

// Error Boundary HOC
const withErrorBoundary = (WrappedComponent) =>
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
        return <WrappedComponent {...this.props} />;
      }
    }
  };

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
const ErrorMakerWithErrorBoundary = withErrorBoundary(ErrorMaker);

//
const Message = () => "Portal Message";
const Portals = () => {
  return createPortal(<Message />, document.getElementById("touchme2"));
};
const PortalsWithErrorBoundary = withErrorBoundary(Portals);

//
const Comp3 = () => {
  return "hello : ";
};

//  방식 2 : HOC 사용
// HOC를 사용하여 withErrorBoundary(Component) 형식으로 감싸서 새로운 컴포넌트를 반환.
const ErrorHandling2 = () => {
  return (
    <>
      <Comp3 />
      <PortalsWithErrorBoundary />
      <ErrorMakerWithErrorBoundary />
    </>
  );
};

export default ErrorHandling2;
