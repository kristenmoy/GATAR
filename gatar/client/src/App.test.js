import { render, screen } from '@testing-library/react';
import App from './pages/App';

jest.mock('@clerk/clerk-react', () => ({
  SignedIn: ({ children }) => <>{children}</>,
  SignedOut: ({ children }) => <>{children}</>,
  SignOutButton: ({ children }) => <>{children}</>,
  useAuth: () => ({ isSignedIn: false, isLoaded: true }),
  useClerk: () => ({ openSignUp: jest.fn(), openSignIn: jest.fn() }),
}), { virtual: true });

jest.mock('./components/Navbar', () => () => <div>Navbar</div>);
jest.mock('./pages/BackendTest', () => () => <div>Backend Test Page</div>);
jest.mock('./pages/About', () => () => <div>About Page</div>);
jest.mock('./pages/ProfLogin', () => () => <div>Professor Login Page</div>);
jest.mock('./pages/StudentLogin', () => () => <div>Student Login Page</div>);
jest.mock('./pages/ProfUpload', () => () => <div>Professor Upload Page</div>);
jest.mock('./pages/StudentDashboard', () => () => <div>Student Dashboard Page</div>);
jest.mock('./pages/ProfDashboard', () => () => <div>Professor Dashboard Page</div>);

test('renders app shell and configured routes', () => {
  render(<App />);

  expect(screen.getByText('Navbar')).toBeInTheDocument();
  expect(screen.getByTestId('route-root')).toHaveTextContent('Student Login Page');
  expect(screen.getByTestId('route-about')).toHaveTextContent('About Page');
  expect(screen.getByTestId('route-profDashboard')).toHaveTextContent('Professor Dashboard Page');
});
