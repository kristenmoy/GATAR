import ProfDashboard from '../pages/ProfDashboard';
import { fireEvent, screen, render, waitFor } from '@testing-library/react';
import { act } from 'react';
import { MemoryRouter } from 'react-router';

// Errors (fix when have time):
// 1. Warning: An update to ProfDashboard inside a test was not wrapped in act(...).
// 2. Backend error: undefined

// Mock fetch globally
global.fetch = jest.fn();

// override clerk mock from student -> prof
jest.mock('@clerk/clerk-react', () => ({
    useAuth: () => ({isSignedIn: true, isLoaded: true}),
    useUser: () => ({ user: { unsafeMetadata: { role: 'professor' } } }),
}));

// basically student rehashed
describe('ProfDashboard', () => {
  // Mock class data (matches student side)
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
        if (url === 'http://localhost:5000/api/create-course') {
            return Promise.resolve({
                json: () => Promise.resolve({ success: true }),
            });
        }
        if (url.includes('http://localhost:5000/api/files/')) {
            return Promise.resolve({
                json: () => Promise.resolve([], []),
            });
        }
        // console.log('Unknown URL:', url);
        return Promise.reject(new Error('Unknown URL'));
        });
    });

    it('renders class tiles from API data', async () => {
        render(
            <MemoryRouter>
                <ProfDashboard />
            </MemoryRouter>
        );

        // Test that fetch was called with the course URL
        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith('http://localhost:5000/api/courses');
        });

        // Check that class tiles are rendered
        const classTiles = await screen.findAllByRole('button', { name: /CSE101|MATH202|PHYS301/ });
        expect(classTiles).toHaveLength(mockCourses.length);
        
        // Check each tile has the correct code
        mockCourses.forEach((course) => {
            expect(screen.getByText(course)).toBeInTheDocument();
        });
    });

    it('selects a class when clicking a class tile', async () => {
        render(
            <MemoryRouter>
                <ProfDashboard />
            </MemoryRouter>
        );

        // Click on the first tile
        const CSEtile = await screen.findByRole('button', { name: 'CSE101' });
        act(() => {
            fireEvent.click(CSEtile);
        });

        // Wait for the dashboard to render (class picker should disappear; prompt gone)
        await waitFor(() => {
            expect(screen.queryByText('Which class would you like to edit?')).not.toBeInTheDocument();
        });

        // Check class dashboard is visible (CSE101)
        expect(screen.getByText('CSE101', { selector: 'span.actions-course-code' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Upload' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Manage Class' })).toBeInTheDocument();
    });

    it('opens upload modal when clicking Upload button', async () => {
        render(
            <MemoryRouter>
                <ProfDashboard />
            </MemoryRouter>
        );

        // Click on the first tile
        const CSEtile = await screen.findByRole('button', { name: 'CSE101' });
        fireEvent.click(CSEtile);

        // Click the Upload button
        const uploadButton = await screen.getByRole('button', { name: 'Upload' });
        fireEvent.click(uploadButton);

        // Check that the upload modal is visible
        expect(screen.getByText('Choose PDF File')).toBeInTheDocument();
    });

    it('opens manage class modal when clicking Manage Class button', async () => {
        render(
            <MemoryRouter>
                <ProfDashboard />
            </MemoryRouter>
        );

        //Click on the first tile
        const CSEtile = await screen.findByRole('button', { name: 'CSE101' });
        fireEvent.click(CSEtile);

        // Click the Manage Class button
        const manageButton = await screen.getByRole('button', { name: 'Manage Class' });
        act(() => {
            fireEvent.click(manageButton);
        });

        // Check that the manage class modal is visible
        expect(screen.getByText('Manage Class — CSE101')).toBeInTheDocument();
    });

    it('switches classes when clicking sidebar buttons', async () => {
        render(
            <MemoryRouter>
                <ProfDashboard />
            </MemoryRouter>
        );

        // Click on the first tile
        const CSEtile = await screen.findByRole('button', { name: 'CSE101' });
        fireEvent.click(CSEtile);

        // Make sure that class opened
        waitFor(() => {
            expect(screen.getByText('CSE101')).toBeInTheDocument();
        });

        // Click on a class in the sidebar
        const mathButton = await screen.getByRole('button', { name: 'MATH202' });
        fireEvent.click(mathButton);

        // Wait for the dashboard to update
        await waitFor(() => {
            expect(screen.getByText('MATH202', { selector: 'span.actions-course-code' })).toBeInTheDocument();
        });
    });

    it('adds new class when clicking Add Class button', async () => {
        render(
            <MemoryRouter>
                <ProfDashboard />
            </MemoryRouter>
        );

        // Click the Add Class button
        const addButton = await screen.findByRole('button', { name: 'Add class' });
        fireEvent.click(addButton);

        // Modal opens
        expect(await screen.getByText('Add a Class')).toBeInTheDocument();

        // Enter new code
        const input = screen.getByRole('textbox');
        fireEvent.change(input, { target: { value: 'SCI404' } });

        // Submit
        const confirmButton = screen.getByRole('button', { name: 'Add' });
        fireEvent.click(confirmButton);

        // Check if fetch was called
        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith('http://localhost:5000/api/create-course', expect.any(Object));
        });

        // Check that the new class is displayed
        waitFor(() => {
            expect(screen.getByText('SCI404')).toBeInTheDocument();
        });
    });
});