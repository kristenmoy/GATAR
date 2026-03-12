import React, { useEffect } from 'react';
import { SignedIn, SignedOut, SignInButton, useAuth } from '@clerk/clerk-react';
import { Link, useNavigate } from 'react-router-dom';

function ProfLogin() {
  const navigate = useNavigate();
  const { isSignedIn, isLoaded } = useAuth();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      navigate('/profUpload');
    }
  }, [isSignedIn, isLoaded, navigate]);
  return (
    <div className="center-screen">
      <div className="center-wrapper">
          <h1>Are your students struggling?</h1>
        
        <SignedOut>
          <p>TA’s <b>overburdened</b> by similar questions? <b>Unsure</b> how to help your students? Don’t worry...</p>
          <h2><b>GATAR</b> is here to help!</h2>
          <p><b>Log in now</b> to access an AI-powered tutor trained on <b>YOUR</b> course materials. And the best part: it’s completely <b>free</b>!</p>
          <SignInButton mode="modal" />
        </SignedOut>

        <SignedIn>
          {typeof window !== 'undefined' && navigate('/profUpload')}
          <h1>Welcome back, Professor!</h1>
        </SignedIn>
      </div>

      <div className="hover-box">
        <div className="label">Not a professor?</div>
        <div className="extra">
          <p>Log in to upload course materials for your students! Hassle and worry free.</p>
          <Link to="/studentLogin" className="about-button">Student Login</Link>
        </div>
      </div>
    </div>    
  );
}

export default ProfLogin;
