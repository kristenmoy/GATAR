import React from 'react';
import { Link } from 'react-router-dom';

function Navbar() {
  return (
    <nav>
      <Link to="/test" style={{ marginRight: '15px' }}>Backend Test</Link>
      <Link to="/about" style={{ marginRight: '15px' }}>About</Link>
      <Link to="/profLogin" style={{ marginRight: '15px' }}>Professor Login</Link>
      <Link to="/studentLogin" style={{ marginRight: '15px' }}>Student Login</Link>
      <Link to="/profUpload" style={{ marginRight: '15px' }}>Professor Upload</Link>
    </nav>
  );
}

export default Navbar;
