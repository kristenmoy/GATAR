import React, { useState, useEffect} from 'react';
import { useNavigate } from 'react-router-dom';
import ChatBot, { ChatBotProvider } from "react-chatbotify";
import { useAuth, useUser } from '@clerk/clerk-react';
import HtmlRenderer from "@rcb-plugins/html-renderer";
import './StudentDashboard.css';

function PersonIcon() {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="person-icon">
      <circle cx="32" cy="22" r="12" fill="white" />
      <ellipse cx="32" cy="52" rx="20" ry="12" fill="white" />
    </svg>
  );
}

function StudentDashboard() {
  const { isSignedIn, isLoaded } = useAuth();
  const navigate = useNavigate();
  const [chatKey, setChatKey] = useState(0);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const { user } = useUser();
  const role = user?.unsafeMetadata?.role;
  const [messages, setMessages] = useState([]);
  const plugin = [HtmlRenderer()];

  useEffect(() => {
    fetch("http://localhost:5000/api/courses")
      .then(res => res.json())
      .then(data => {
        setClasses(
          data.map((code, index) => ({
            id: index + 1,
            code
          }))
        );
      })
      .catch(err => console.error("Failed to load courses:", err));
  }, []);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      navigate('/');
    }
  }, [isSignedIn, isLoaded, navigate]);

  if (role && role !== 'student') {
    navigate('/profLogin');
  }

  if (!isLoaded || !isSignedIn) {
    return(
      <div className="dashboard-background">
        <div className="center-screen">
          <h1>Oh no! Give us a moment to get you redirected.</h1>
        </div>
      </div>
    );
  }

  // chatbot elements BD4F00
  const defaultSettings = {
    general: {embedded:true, primaryColor:"#9C9CC8", secondaryColor:"#9C9CC8"},
    chatHistory: {disabled: true, storageType: "NONE"},
    header: { title: selectedClass?.code || "Select a class" }
  };
  const MAX_HISTORY = 10;
  const flow = {
    start: {
        message: `Welcome to ${selectedClass.code}. How can I help you today?`,
        path: "chat"
    },
    chat: {
      message: async (params) => {
        const userMessage = params.userInput;
        
        const updatedMessages = [
          ...messages,
          { role: "user", content: userMessage }
        ];

        const trimmedMessages = updatedMessages.slice(-MAX_HISTORY);

        const res = await fetch("http://127.0.0.1:5000/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            messages: trimmedMessages,
            course_code: selectedClass.code
          })
        });

        const data = await res.json();
        const rawReply = data.answer || "Sorry, something went wrong.";
        const chatReply = rawReply;
        
        setMessages([
          ...updatedMessages,
          { role: "assistant", content: chatReply }
        ]);

        return chatReply;
      },
      path: "chat",
      renderHtml: ["BOT"]
    }
  }

  return (
    <div className="student-dashboard-root dashboard-background">

      {!selectedClass ? (
        <div className="class-picker-overlay">
          <div className="class-picker-card"> 
              <h2>Welcome to <span className="brand">GATAR</span>!</h2>
              <p className="picker-sub">Which class would you like to study for?</p>
          
              <div className="class-grid">
                {classes.map(cls => (
                    <button key={cls.id} className="class-tile" onClick={() => setSelectedClass(cls)}>
                      <PersonIcon />
                      <span className="tile-code">{cls.code}</span>
                    </button>
                  ))}
              </div>
          </div>
        </div>
      ) : (
        <div className="dashboard-container">

          <div className="class-sidebar">
            {classes.map(cls => (
              <button
                key={cls.id}
                className={`sidebar-class-btn ${selectedClass.id === cls.id ? 'active' : ''}`}
                onClick={() => {
                  setSelectedClass(cls);
                  setChatKey(prevKey => prevKey+1);
                  setMessages([])
                }}
                title={cls.code}
              >
                <PersonIcon />
                <span className="sidebar-code">{cls.code}</span>
              </button>
            ))}
          </div>

          <ChatBotProvider key={chatKey}>
            <ChatBot plugins={plugin} settings={defaultSettings} flow={flow}/>
          </ChatBotProvider>

        </div>
      )} 
    </div>
  );
}

export default StudentDashboard;
