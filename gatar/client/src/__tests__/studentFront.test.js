import StudentDashboard from '../pages/StudentDashboard.js';
import { fireEvent, screen, render, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';

// Mock fetch globally
global.fetch = jest.fn();

describe('StudentDashboard', () => {
  // Mock class data
  const mockCourses = ['CSE101', 'MATH202', 'PHYS301'];

  // Reset fetch mock before each test
  beforeEach(() => {
    fetch.mockClear();
    // Mock the courses API call
    fetch.mockImplementation((url) => {
      if (url === 'http://localhost:5000/api/courses') {
        return Promise.resolve({
          json: () => Promise.resolve(mockCourses),
        });
      }
      // Mock chat API call
      if (url === 'http://127.0.0.1:5000/api/chat') {
        return Promise.resolve({
          json: () => Promise.resolve({ answer: 'Mock response' }),
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });
  });

  it('renders class tiles from API data', async () => {
    render(
      <MemoryRouter>
        <StudentDashboard />
      </MemoryRouter>
    );

    // Test that fetch was called with the course URL
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('http://localhost:5000/api/courses');
    });

    // Check that class tiles are rendered
    const classTiles = await screen.findAllByTestId(/^class-tile-/);
    expect(classTiles).toHaveLength(mockCourses.length);

    // Check each tile has the correct code
    mockCourses.forEach((course, index) => {
      expect(screen.getByTestId(`class-tile-${course}`)).toBeInTheDocument();
      expect(screen.getByText(course)).toBeInTheDocument();
      expect(classTiles[index]).toHaveTextContent(course);
    });
  });

  it('displays an error message if course API fails', async () => {
    // Mock fetch to fail - only once
    fetch.mockImplementationOnce(() => Promise.reject(new Error('API failure')));
    
    // ability to see console
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <MemoryRouter>
        <StudentDashboard />
      </MemoryRouter>
    );

    // Check that the error message is displayed in console
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Failed to load courses:', expect.any(Error));
    });

  });

  it('selects a class when clicking a class tile', async () => {
    render(
      <MemoryRouter>
        <StudentDashboard />
      </MemoryRouter>
    );
 
    // Click on the first class tile
    const CSEtile = await screen.findByTestId('class-tile-CSE101');
    fireEvent.click(CSEtile);
    //screen.debug();

    // Wait for the dashboard to render (class picker should disappear)
    await waitFor(() => {
      expect(screen.queryByTestId('class-tile-CSE101')).not.toBeInTheDocument();
    });

    // Check that the sidebar is now visible with class buttons
    const sidebarButtons = screen.getAllByRole('button', { name: /CSE101|MATH202|PHYS301/ });
    expect(sidebarButtons).toHaveLength(mockCourses.length);

    // Check that the chatbot is rendered
    expect(await screen.getByText('Welcome to CSE101. How can I help you today?')).toBeInTheDocument();
  });

  it('switches classes when clicking sidebar buttons', async () => {
    render(
      <MemoryRouter>
        <StudentDashboard />
      </MemoryRouter>
    );

    // Click on the first class tile
    const CSEtile = await screen.findByTestId('class-tile-CSE101');
    fireEvent.click(CSEtile);

    // Wait for dashboard to load
    expect(await screen.getByText('Welcome to CSE101. How can I help you today?')).toBeInTheDocument();

    // Now click on MATH202 in the sidebar
    const math202Button = screen.getByRole('button', { name: 'MATH202' });
    fireEvent.click(math202Button);

    // The chatbot should now show MATH202 content
    expect(await screen.getByText('Welcome to MATH202. How can I help you today?')).toBeInTheDocument();
  });

  it('accepts user input, calls chat API, and replies', async () => {
    render(
      <MemoryRouter>
        <StudentDashboard />
      </MemoryRouter>
    );

    // Click on the first class tile
    const CSEtile = await screen.findByTestId('class-tile-CSE101');
    fireEvent.click(CSEtile);

    // Wait for dashboard to load
    expect(await screen.getByText('Welcome to CSE101. How can I help you today?')).toBeInTheDocument();
    expect(await screen.getByRole('textbox')).toBeInTheDocument();
    expect(await screen.getByRole('button', { name: 'Send' })).toBeInTheDocument();
    
    // Simulate user input in the chatbot
    const userInput = 'Mock question?';
    const inputField = screen.getByRole('textbox');
    fireEvent.change(inputField, { target: { value: userInput } });
    fireEvent.keyDown(inputField, { key: 'Enter', code: 'Enter' });

    // Check that API was called w/ params
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("http://127.0.0.1:5000/api/chat", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: [{role: "user", content: userInput}],
          course_code: 'CSE101'
        })
      });
    });

    // Check message displays: user, bot reply
    expect(await screen.findByText(userInput)).toBeInTheDocument();
    expect(await screen.findByText('Mock response')).toBeInTheDocument();
  });
});