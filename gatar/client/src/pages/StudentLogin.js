import React from 'react';
import { Link } from 'react-router-dom';

function StudentLogin() {
  return (
    <div>
      <h1>Welcome to the Student Login Page</h1>
      <Link to="/studentDashboard">
        <button>I promise I logged in</button>
      </Link>
    </div>
  );
}

export default StudentLogin;
