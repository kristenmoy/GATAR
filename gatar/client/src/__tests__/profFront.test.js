import ProfDashboard from '../pages/ProfDashboard';
import { fireEvent, screen, render, waitFor } from '@testing-library/react';
import { act } from 'react';
import { MemoryRouter } from 'react-router';

// Errors (fix when have time):
// 1. Warning: An update to ProfDashboard inside a test was not wrapped in act(...).

// Mock fetch globally
global.fetch = jest.fn();

// Mock clerk auth = prof acc
jest.mock('@clerk/clerk-react', () => ({
    useAuth: () => ({ isSignedIn: true, isLoaded: true }),
    useUser: () => ({ user: { unsafeMetadata: { role: 'professor' } } }),
}));

// basically student rehashed
describe('ProfDashboard', () => {
    // Mock class data (matches student side)
    const mockCourses = ['CSE101', 'MATH202', 'PHYS301'];
    const mockFiles = [{ name: "file1.pdf", id: "1" }, { name: "file2.pdf", id: "2" }, { name: "file3.pdf", id: "3" }];

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
                    ok: true,
                    json: () => Promise.resolve({ success: true }),
                });
            }
            if (url === 'http://localhost:5000/api/upload-pdf') {
                // have to hard code an add; unlike add class which is handled in profdash,
                // adding a pdf is entirely backend
                //console.log('Mock files:', mockFiles);
                const fileName = 'file4.pdf';
                mockFiles.push({ name: fileName, id: 4 });
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({ success: true })
                });
            }
            if (url.includes('http://localhost:5000/api/files')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve(mockFiles),
                });
            }
            // hardcoded for tests sake
            if (url === 'http://localhost:5000/api/files/1?course_code=CSE101') {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve(),
                });
            }
            return Promise.reject(new Error('Unknown URL'));
        });
        // console.log('Unknown URL:', url);
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
    const { container } = render(
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
    const classContent = container.querySelector('.manage-class-content');
    expect(classContent).toBeInTheDocument();

    // and CSE101 is active in sidebar
    const activeButton = screen.getByRole('button', { name: 'CSE101' });
    expect(activeButton).toHaveClass('active');
});

it('opens upload modal when clicking upload, displays new file', async () => {
    const windowAlert = jest.spyOn(window, 'alert').mockImplementation(() => true);

    const { container } = render(
        <MemoryRouter>
            <ProfDashboard />
        </MemoryRouter>
    );

    await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('http://localhost:5000/api/courses');
    });

    // Click on the first tile
    const CSEtile = await screen.findByRole('button', { name: 'CSE101' });
    fireEvent.click(CSEtile);

    await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('http://localhost:5000/api/files/CSE101');
    });

    // Click the Upload button
    const uploadButton = await screen.getByRole('button', { name: 'Upload' });
    fireEvent.click(uploadButton);

    // Check that the upload modal is visible
    expect(screen.getByText('Choose PDF File')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();

    // simulate pdf upload and click
    const uploadField = await container.querySelector('#file-input');
    const newFile = new File(['content'], 'file4.pdf', { type: 'application.pdf' });
    fireEvent.change(uploadField, { target: { files: [newFile] } });

    const submitButton = container.querySelector('.modal-confirm');
    fireEvent.click(submitButton);

    await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('http://localhost:5000/api/upload-pdf', expect.any(Object));
        // took file, now input field is cleared
        expect(windowAlert).toHaveBeenCalledWith("Upload successful!")
        expect(uploadField.value).toBe('');
    });

    expect(await screen.findByText('file4.pdf')).toBeInTheDocument();
});

it('displays files in class content area', async () => {
    const { container } = render(
        <MemoryRouter>
            <ProfDashboard />
        </MemoryRouter>
    );

    // Click on the first tile
    const CSEtile = await screen.findByRole('button', { name: 'CSE101' });
    act(() => {
        fireEvent.click(CSEtile);
    });

    // Wait for files to load
    await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('http://localhost:5000/api/files/CSE101');
        expect(screen.queryByText('Loading files…')).not.toBeInTheDocument();
    });

    const classContent = container.querySelector('.manage-class-content');
    expect(classContent).toBeInTheDocument();

    // Check class dashboard is visible (CSE101)
    const fileRows = await classContent.querySelectorAll('.manage-file-name');
    const pdfIcons = await classContent.querySelectorAll('.manage-pdf-icon');

    // Check that the correct number of files are displayed
    expect(fileRows).toHaveLength(mockFiles.length);
    expect(pdfIcons).toHaveLength(mockFiles.length);

    // Check that each file is displayed with its name and PDF icon
    mockFiles.forEach((file, index) => {
        expect(screen.getByText(file.name)).toBeInTheDocument();
        expect(fileRows[index]).toHaveTextContent(file.name);
        expect(pdfIcons[index]).toBeInTheDocument();
    });
});

it('switches classes when clicking sidebar buttons', async () => {
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

    // Make sure that class opened (header + active sidebar button)
    waitFor(() => {
        expect(screen.getByText('CSE101')).toBeInTheDocument();
        const activeButton = screen.getByRole('button', { name: 'CSE101' });
        expect(activeButton).toHaveClass('active');
    });

    // Click on a class in the sidebar
    const mathButton = await screen.getByRole('button', { name: 'MATH202' });
    act(() => {
        fireEvent.click(mathButton);
    });

    // Wait for the dashboard to update
    await waitFor(() => {
        expect(screen.getByText('MATH202', { selector: 'span.actions-course-code' })).toBeInTheDocument();
        const activeButton = screen.getByRole('button', { name: 'MATH202' });
        expect(activeButton).toHaveClass('active');
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
    act(() => {
        fireEvent.click(addButton);
    });

    // Modal opens, displays add and cancel buttons
    await waitFor(() => {
        expect(screen.getByText('Add a Class')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    })

    // Enter new code
    const input = screen.getByRole('textbox');
    act(() => {
        fireEvent.change(input, { target: { value: 'SCI404' } });
    });

    // Submit
    const confirmButton = screen.getByRole('button', { name: 'Add' });
    act(() => {
        fireEvent.click(confirmButton);
    });

    // Check if fetch was called
    await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('http://localhost:5000/api/create-course', expect.any(Object));
    });

    // Check that the new class is displayed
    waitFor(() => {
        expect(screen.getByText('SCI404')).toBeInTheDocument();
    });
});

it('displays confirmation modal when deleting', async () => {
    // Lets us see a window pop up
    const windowConfirm = jest.spyOn(window, 'confirm').mockImplementation(() => true);

    const { container } = render(
        <MemoryRouter>
            <ProfDashboard />
        </MemoryRouter>
    );

    // Click on the first tile
    const CSEtile = await screen.findByRole('button', { name: 'CSE101' });
    act(() => {
        fireEvent.click(CSEtile);
    });

    // Wait for files to load
    await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('http://localhost:5000/api/files/CSE101');
        expect(screen.queryByText('Loading files…')).not.toBeInTheDocument();
    });

    // Get file names
    //const classContent = container.querySelector('.manage-class-content');
    //const fileRows = await classContent.querySelectorAll('.manage-file-name');

    // Click delete CSE101
    const delRows = await container.querySelectorAll('.manage-remove-btn');
    const deleteButton = delRows[0]; // should be CSE101
    fireEvent.click(deleteButton);

    // Check if confirm modal has appeared
    expect(windowConfirm).toHaveBeenCalledWith("Are you sure you want to delete this file?");

    // And if the delete fetch was called
    await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('http://localhost:5000/api/files/1?course_code=CSE101', 
            {method: "DELETE"}
        );
    });
});
});