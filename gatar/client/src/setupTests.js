// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import React, { useState, useEffect } from 'react';

// studentFront.test.js - tests for StudentDashboard.js
import { TextEncoder } from 'util';
Object.assign(global, { TextEncoder });
jest.mock('@clerk/clerk-react', () => ({
    useAuth: () => ({ isSignedIn: true, isLoaded: true }),
    useUser: () => ({ user: { unsafeMetadata: { role: 'student' } } }),
}));

const mockUsedNavigate = jest.fn();
jest.mock('react-router', () => ({
    ...jest.requireActual('react-router'),
    useNavigate: () => mockUsedNavigate,
}));

const mockChatbot = jest.fn();
const ChatBotMock = ({flow, ...props}) => {
    mockChatbot(props);
    // dupe from studentdash, local msg storage
    const [msg, setMsg] = React.useState([]);
    const [input, setInput] = React.useState("");

    // begin conversation: welcome msg
    useEffect(() => {
        if (flow?.start?.message) {
            // studentdash formatting: assistant, chatReply
            setMsg([{role: "assistant", content: flow.start.message}]);
        }
    }, [flow]);

    // handle user input
    const handleInput = async () => {
        // studentdash formatting: user, userInput
        const userMsg = {role: "user", content: input};
        const userInput = input;
        setMsg(prev => [...prev, userMsg]);
        setInput("");
        
        // chatbot reply
        const reply = await flow.chat.message({userInput});
        console.log("Chatbot reply:", reply);
        const botMsg = {role: "assistant", content: reply};
        setMsg(prev => [...prev, botMsg]);
    };

    const handleEnter = (e) => {
        if (e.key === "Enter") {
            handleInput();
        }
    };

    return (
        <div data-testid="chatbot">
            <div>
                {msg.map((m, i) => <div key={i} data-testid={`${m.role}-msg`}>{m.content}</div>)}
            </div>
            <input 
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleEnter}
                placeholder="Type your message..."
            />
            <button onClick={handleInput}>Send</button>
        </div>
    );
  };

jest.mock('react-chatbotify', () => {
  const actual = jest.requireActual('react-chatbotify');

  return {
    __esModule: true,
    ...actual,
    default: ChatBotMock,
    ChatBot: ChatBotMock,
    ChatBotProvider: ({ children }) => <div data-testid="chatbot-provider">{children}</div>,
    useSettings: () => ({ settings: {}, updateSettings: jest.fn() }),
    useFlow: () => ({ restartFlow: jest.fn(), hasFlowStarted: false }),
    };
});