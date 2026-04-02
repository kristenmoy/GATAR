import React, { useEffect } from 'react';
import { SignedIn, SignedOut, useClerk, useAuth } from '@clerk/clerk-react';
import { Link, useNavigate } from 'react-router-dom';

function ProfLogin() {
  const navigate = useNavigate();
  const { isSignedIn, isLoaded } = useAuth();
  const { openSignUp, openSignIn } = useClerk();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      navigate('/profDashboard');
    }
  }, [isSignedIn, isLoaded, navigate]);

  const handleSignUp = () => {
    openSignUp({ unsafeMetadata: { role: 'professor' } });
  };

  const handleSignIn = () => {
    openSignIn();
  };

  return (
    <div className="center-screen">
      <div className="center-wrapper">
          <h1>Are your students struggling?</h1>
        
        <SignedOut>
          <p>TA’s <b>overburdened</b> by similar questions? <b>Unsure</b> how to help your students? Don’t worry...</p>
          <h2><b>GATAR</b> is here to help!</h2>
          <p><b>Sign up or log in now</b> to access an AI-powered tutor trained on <b>YOUR</b> course materials. And the best part: it’s completely <b>free</b>!</p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button onClick={handleSignUp} className="clerk-button">Sign Up</button>
            <button onClick={handleSignIn} className="clerk-button">Sign In</button>
          </div>
        </SignedOut>

        <SignedIn>
          {typeof window !== 'undefined' && navigate('/profDashboard')}
        </SignedIn>
      </div>

      <div className="hover-box">
        <div className="label">Not a professor?</div>
        <div className="extra">
          <p>Log in to upload course materials for your students! Hassle and worry free.</p>
          <Link to="/" className="about-button">Student Login</Link>
        </div>
      </div>
    </div>    
  );
}

export default ProfLogin;
