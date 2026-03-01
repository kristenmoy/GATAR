import React from 'react';

function loginButton() {
  return (
    <button>Log in</button>
  );
}

function Home() {
  // events here
    const testClick = () => {
    alert("you clicked button");
  }

  // dis
  return (
    <div>
        <h1>Welcome to the Home Page</h1>
        <button onClick={testClick}>Log in</button>
    </div>
  );
}

export default Home;
