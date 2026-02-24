import React from 'react';
import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <>
      <header className="header-box">
        <Link to="/home">
          <h1>GATAR</h1>
        </Link>
        <nav className="nav-links">
          <Link to="/test">Test</Link> |  
          <Link to="/profLogin">Prof Login</Link> | 
          <Link to="/studentLogin">Student Login</Link> | 
          <Link to="/profUpload">Upload</Link>
        </nav>
        <Link to="/about" className="about-button">About Us</Link>
      </header>
    </>
  );
}