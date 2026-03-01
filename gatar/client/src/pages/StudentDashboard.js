import React from 'react';
import { Link } from 'react-router-dom';


function StudentDashboard() {
  return (
    <div>
      <h1>Welcome to the Student Dashboard</h1>
      <Link to="/">
        <button>I wanna go home</button>
      </Link>
    </div>
  );
}

export default StudentDashboard;
