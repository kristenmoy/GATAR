// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

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
jest.mock('react-chatbotify', () => ({
  ChatBot: () => <div data-testid="chatbot">ChatBot Mock</div>,
  ChatBotProvider: ({ children }) => <div data-testid="chatbot-provider">{children}</div>,
  useSettings: () => ({ settings: {}, updateSettings: jest.fn() }),
  useFlow: () => ({ restartFlow: jest.fn(), hasFlowStarted: false }),
}));