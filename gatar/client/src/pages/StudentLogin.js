import React, { useEffect } from 'react';
import { SignedIn, SignedOut, SignInButton, useAuth } from '@clerk/clerk-react';
import { Link, useNavigate } from 'react-router-dom';

function StudentLogin() {
  const navigate = useNavigate();
  const { isSignedIn, isLoaded } = useAuth();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      console.log('redirecting to student dashboard');
    }
  }, [isSignedIn, isLoaded, navigate]);
  return (
    <div className="center-screen">
      <div className="center-wrapper">
          <h1>Homework bringing you down?</h1>
        
        <SignedOut>
          <p>Upcoming exam <b>ruining</b> your weekend? Too many files to click through? Don’t worry...</p>
          <h2><b>GATAR</b> is here to help!</h2>
          <p><b>Log in now</b> to access an AI-powered tutor trained on <b>YOUR</b> course materials. And the best part: it’s completely <b>free</b>!</p>
          <SignInButton mode="modal" />
        </SignedOut>

        <SignedIn>
          {typeof window !== 'undefined' && navigate('/profUpload')}
        </SignedIn>
      </div>

      <div className="hover-box">
        <div className="label">Not a student?</div>
        <div className="extra">
          <p>Log in to upload course materials for your students! Hassle and worry free.</p>
          <Link to="/profLogin" className="about-button">Professor Login</Link>
        </div>
      </div>
    </div>    
  );
}

export default StudentLogin;
