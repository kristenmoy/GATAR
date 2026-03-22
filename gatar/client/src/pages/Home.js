import React from 'react';
import { Link } from 'react-router-dom';


function Home() {
  return (  
    <div className="gator-background">
      <div className="center-screen">
          <div className="center-wrapper">
            <h2>Homework bringing you down?</h2>
            <p>
              Upcoming exam <b>ruining</b> your weekend? <b>Don't know</b> where to start studying? Don't worry...
            </p>
            <h3><span style={{fontWeight: 'bold', color: '#150FA9'}}>GATAR</span> is here to help!</h3>
            <p> 
              <b>Log in now</b> to access an AI-powered tutor trained on <b>your</b> course materials. 
              And the best part: <em>it's completely free!</em>
            </p>
            <Link to="/studentLogin">
              <button>Log in</button>
            </Link>
          </div>
      </div>
      <Link to="/profLogin">
        <button className="switch-login-button">Not a student?</button>
      </Link>
    </div>
  );
}

export default Home;
