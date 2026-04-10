import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { SignOutButton, SignedIn } from '@clerk/clerk-react';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <header className="header-box">
          <h1>GATAR</h1>
          <div className="hamburger" onClick={() => setOpen(!open)}>
            <div></div>
            <div></div>
            <div></div>
          </div>
          {open && (
            <div className="dropdown-menu">
              <Link to="/about" onClick={() => setOpen(false)}>About</Link>

              <SignedIn>
                <SignOutButton>
                  <button onClick={() => setOpen(false)}>Logout</button>
                </SignOutButton>
              </SignedIn>
            </div>
          )}
      </header>
    </>
  );
}