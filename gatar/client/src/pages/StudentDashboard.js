import React from 'react';
import { Link } from 'react-router-dom';
import ChatBot from "react-chatbotify";


function StudentDashboard() {
  // chatbot elements
  const settings = {
    general: {embedded:true, primaryColor:"#BD4F00", secondaryColor:"#150FA9"},
    header: {title:"CIS4904"}
  }
  const flow = {
    start: {
        message: "Hi.",
        path: "end_loop"
    },
    end_loop: {
        message: "Connect LLM to this later.",
        path: "end_loop"
    }
  }
  return (
    <div className="dashboard-background">
      <div className="center-screen">
        <ChatBot settings={settings} flow={flow}/>
      </div>
    </div>
  );
}

export default StudentDashboard;
