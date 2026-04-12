import React, { useState, useEffect} from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useUser } from '@clerk/clerk-react';
import './ProfDashboard.css';
import UploadModal from "./ProfUpload";
import ManageClassModal from "./ManageClass";

function PersonIcon() {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="person-icon">
      <circle cx="32" cy="22" r="12" fill="white" />
      <ellipse cx="32" cy="52" rx="20" ry="12" fill="white" />
    </svg>
  );
}

export default function ProfDashboard() {
  const { isSignedIn, isLoaded } = useAuth();
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  // const [showManageModal, setShowManageModal] = useState(false);
  const { user } = useUser();
  const role = user?.unsafeMetadata?.role;

  const fetchCourses = () => {
    fetch("http://localhost:5000/api/courses")
      .then(res => res.json())
      .then(data => {
        setClasses(
          data.map((code, index) => ({
            id: index + 1,
            code
          }))
        );
      });
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      navigate('/profLogin');
    }
  }, [isSignedIn, isLoaded, navigate]);

  if (role && role !== 'professor') {
    navigate('/');
  }

  if (!isLoaded || !isSignedIn) {
    return(
      <div className="dashboard-background">
        <div className="center-screen">
          <h1>Oh no! You broke something! Please go back to the login page.</h1>
        </div>
      </div>
    );
  }

  async function handleAddClass() {
    const courseCode = newCode.trim().toUpperCase();
    if (!courseCode) return;

    try {
      const res = await fetch("http://localhost:5000/api/create-course", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ course_code: courseCode })
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("Backend error:", data.error);
        return;
      }
      
      setClasses(prev => [
        ...prev,
        { id: prev.length + 1, code: courseCode }
      ]);

      setNewCode('');
      setShowAddModal(false);

    } catch (err) {
      console.error("Failed to create course:", err);
    }
  }

  // function handleAction(action) {
  //   if (action === 'Upload')
  //   {
  //     setShowUploadModal(true);
  //   }
  //   else if(action === 'Manage Class')
  //   {
  //     setShowManageModal(true);
  //   }
  // }

  return (
    <div className="prof-dashboard-root dashboard-background">

      {!selectedClass ? (
        <div className="class-picker-overlay">
          <div className="class-picker-card">
            <h2>Welcome to <span className="brand">GATAR</span>!</h2>
            <p className="picker-sub">Which class would you like to edit?</p>

            <div className="class-grid">
              {classes.map(cls => (
                <button key={cls.id} className="class-tile" onClick={() => setSelectedClass(cls)}>
                  <PersonIcon />
                  <span className="tile-code">{cls.code}</span>
                </button>
              ))}
            </div>
            <button className="add-class-btn" onClick={() => setShowAddModal(true)}>Add class</button>
          </div>
        </div>

      ) : (
        <div className="dashboard-container">

          <div className="class-sidebar">
            {classes.map(cls => (
              <button
                key={cls.id}
                className={`sidebar-class-btn ${selectedClass.id === cls.id ? 'active' : ''}`}
                onClick={() => setSelectedClass(cls)}
                title={cls.code}
              >
                <PersonIcon />
                <span className="sidebar-code">{cls.code}</span>
              </button>
            ))}
            <button
              className="sidebar-add-btn"
              onClick={() => setShowAddModal(true)}
            >
              Add Class
            </button>
          </div>
          

          {/* <div className="class-actions-panel">
            <div className="actions-header">
              <PersonIcon />
              <span className="actions-course-code">{selectedClass.code}</span>
            </div>
            {/* <div className="actions-grid">
              <button className="action-btn" onClick={() => handleAction('Upload')}>Upload</button>
              <button className="action-btn" onClick={() => handleAction('Manage Class')}>Manage<br />Class</button>
            </div> */}
            {/* <button 
              className="upload-btn"
              onClick={() => setShowUploadModal(true)}
            >
              Upload
            </button>
              </div> */}
          <div className="class-content-panel">
            <div className="dashboard-header">
              <div className="header-left">
                <PersonIcon />
                <span className="actions-course-code">{selectedClass?.code}</span>
              </div>

              <button
                className="upload-btn"
                onClick={() => setShowUploadModal(true)}
                disabled={uploading}
              >
                {uploading ? "Uploading..." : "Upload"}
              </button>
            </div>

            <ManageClassModal
              classCode={selectedClass.code}
              embedded={true}
            />
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <h3>Add a Class</h3>
            <input
              type="text"
              value={newCode}
              onChange={e => setNewCode(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddClass()}
              autoFocus
            />
            <div className="modal-actions">
              <button className="modal-cancel" onClick={() => setShowAddModal(false)}>Cancel</button>
              <button className="modal-confirm" onClick={handleAddClass}>Add</button>
            </div>
          </div>
        </div>
      )}
      {showUploadModal && (
        <UploadModal
            classCode={selectedClass.code}
            onClose={function() { setShowUploadModal(false); }}
            setUploading={setUploading}
        />
        )}
      {/* {showManageModal && React.createElement(ManageClassModal, {
        classCode: selectedClass.code,
        onClose: function() { setShowManageModal(false); }
      })} */}
    </div>
  );
}