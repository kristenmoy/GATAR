import StudentDashboard from '../pages/StudentDashboard';
import { fireEvent, screen, render, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';

// Mock fetch globally
global.fetch = jest.fn();

describe('StudentDashboard', () => {
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

    // Wait for classes to load
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('http://localhost:5000/api/courses');
    });

    // Check that class tiles are rendered
    const classTiles = screen.queryAllByTestId(/^class-tile-/);
    expect(classTiles).toHaveLength(mockCourses.length);

    // Check each tile has the correct code
    mockCourses.forEach((course, index) => {
      expect(screen.getByTestId(`class-tile-${course}`)).toBeInTheDocument();
      expect(screen.getByText(course)).toBeInTheDocument();
    });
  });

  it('selects a class when clicking a class tile', async () => {
    render(
      <MemoryRouter>
        <StudentDashboard />
      </MemoryRouter>
    );

    // Wait for classes to load
    await waitFor(() => {
      expect(screen.getByTestId('class-tile-CSE101')).toBeInTheDocument();
    });

    // Click on the first class tile
    const cse101Tile = screen.getByTestId('class-tile-CSE101');
    fireEvent.click(cse101Tile);

    // Wait for the dashboard to render (class picker should disappear)
    await waitFor(() => {
      expect(screen.queryByTestId('class-tile-CSE101')).not.toBeInTheDocument();
    });

    // Check that the sidebar is now visible with class buttons
    const sidebarButtons = screen.getAllByRole('button', { name: /CSE101|MATH202|PHYS301/ });
    expect(sidebarButtons).toHaveLength(mockCourses.length);

    // Check that the chatbot is rendered
    expect(screen.getByTestId('chatbot')).toBeInTheDocument();
  });

  it('switches classes when clicking sidebar buttons', async () => {
    render(
      <MemoryRouter>
        <StudentDashboard />
      </MemoryRouter>
    );

    // Wait for classes to load and select first class
    await waitFor(() => {
      expect(screen.getByTestId('class-tile-CSE101')).toBeInTheDocument();
    });

    // Select CSE101
    fireEvent.click(screen.getByTestId('class-tile-CSE101'));

    // Wait for dashboard to load
    await waitFor(() => {
      expect(screen.getByTestId('chatbot')).toBeInTheDocument();
    });

    // Now click on MATH202 in the sidebar
    const math202Button = screen.getByRole('button', { name: 'MATH202' });
    fireEvent.click(math202Button);

    // The chatbot should still be there (class switched)
    expect(screen.getByTestId('chatbot')).toBeInTheDocument();

    // Check that the active class button has the 'active' class
    const activeButton = screen.getByRole('button', { name: 'MATH202' });
    expect(activeButton).toHaveClass('active');
  });

  it('renders add class button', async () => {
    render(
      <MemoryRouter>
        <StudentDashboard />
      </MemoryRouter>
    );

    // Wait for classes to load
    await waitFor(() => {
      expect(screen.getByTestId('class-tile-CSE101')).toBeInTheDocument();
    });

    // Check that add class button is present
    const addButton = screen.getByRole('button', { name: /add class/i });
    expect(addButton).toBeInTheDocument();
  });
});