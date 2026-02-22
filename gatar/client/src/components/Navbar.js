import React from 'react';
import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <>
      <header className="header-box">
        <h1>GATAR</h1>
        <Link to="/about" className="about-button">About Us</Link>
      </header>
      <nav style={{ padding: '20px', background: '#f0f0f0' }}>
        <Link to="/test">Test</Link> |  
        <Link to="/profLogin">Prof Login</Link> | 
        <Link to="/studentLogin">Student Login</Link> | 
        <Link to="/profUpload">Upload</Link>
      </nav>
    </>
  );
}