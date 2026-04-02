import React, { useEffect } from 'react';
import { SignedIn, SignedOut, useClerk, useAuth } from '@clerk/clerk-react';
import { Link, useNavigate } from 'react-router-dom';

function StudentLogin() {
  const navigate = useNavigate();
  const { isSignedIn, isLoaded } = useAuth();
  const { openSignUp, openSignIn } = useClerk();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      navigate('/studentDashboard');
    }
  }, [isSignedIn, isLoaded, navigate]);

  const handleSignUp = () => {
    openSignUp({ unsafeMetadata: { role: 'student' } });
  };

  const handleSignIn = () => {
    openSignIn();
  };
  
  return (
  <div className="gator-background">
      <div className="center-screen">
        <div className="center-wrapper">
            <h1>Homework bringing you down?</h1>
          
          <SignedOut>
            <p>Upcoming exam <b>ruining</b> your weekend? Too many files to click through? Don’t worry...</p>
            <h2><b>GATAR</b> is here to help!</h2>
            <p><b>Log in now</b> to access an AI-powered tutor trained on <b>YOUR</b> course materials. And the best part: it’s completely <b>free</b>!</p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button onClick={handleSignUp} className="clerk-button">Sign Up</button>
              <button onClick={handleSignIn} className="clerk-button">Sign In</button>
            </div>
          </SignedOut>

          <SignedIn>
            console.log('signed in alr student');
            {typeof window !== 'undefined' && navigate('/studentDashboard')}
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
  </div>
  );
}

export default StudentLogin;
