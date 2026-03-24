import React from 'react';
// import { Link } from 'react-router-dom';
import ChatBot, { ChatBotProvider } from "react-chatbotify";
import { useState } from 'react';

/* Current issues:
1. figure out way to make the course change palpable
   - restart chatbot UI, updateSettings to correct chatbot?
   - switch chatbot/page entirely?
2. link chatbot to UI [PRIORITY]
   - talk to backend about that
3. access student courses to reflect that in chatbot options
   - wireframe: showed options already grabbed from student info + add a class opt.
*/

function StudentDashboard() {
  // vars
  const [course, changeCourse] = useState("CIS4904"); // change to student default
  // functions
  const handleClick = (code) => {
    changeCourse(code);
  }
  // chatbot elements
  const settings = {
    general: {embedded:true, primaryColor:"#BD4F00", secondaryColor:"#150FA9"},
    header: {title:`${course}`}
  }
  const flow = {
    start: {
        message: `Welcome to ${course}. How can I help you today?`,
        path: "ask"
    },
    ask: {
      message: async (params) => {
        const userMessage = params.userInput;

        const res = await fetch("http://127.0.0.1:5000/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ message: userMessage })
        });

        const data = await res.json();
        return data.answer || "Sorry, something went wrong.";
      },
      path: "ask"
    }
    // end_loop: {
    //     message: "Connect LLM to this later.",
    //     path: "end_loop"
    // }
  }
  return (
    <div className="dashboard-background">
      <div className="center-screen">
        <div className="left-side">
          <div className="side-wrapper">
            <h3>Class list:</h3>
            <button type="button"
            onClick={() => handleClick("mewo")}>mewo</button>
            <button>test</button>
            <button>class1</button>
            <button>class2</button>
          </div>
        </div>
        <div className="right-side">
          <ChatBotProvider>
            <ChatBot settings={settings} flow={flow}/>
          </ChatBotProvider>
        </div>
      </div>
    </div>
  );
}

export default StudentDashboard;
