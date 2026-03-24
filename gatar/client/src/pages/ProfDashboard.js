import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ProfDashboard.css';
import UploadModal from "./ProfUpload";

// we can change to store the courses in a database linking to a professor
const INITIAL_CLASSES = [
  { id: 1, code: 'CIS4914' },
  { id: 2, code: 'CNT4106C' },
  { id: 3, code: 'COP5556' },
  { id: 4, code: 'MAC2312' },
  { id: 5, code: 'CEN3031' },
];

function PersonIcon() {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="person-icon">
      <circle cx="32" cy="22" r="12" fill="#c0c0c0" />
      <ellipse cx="32" cy="52" rx="20" ry="12" fill="#c0c0c0" />
    </svg>
  );
}

export default function ProfDashboard() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState(INITIAL_CLASSES);
  const [selectedClass, setSelectedClass] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);

  function handleAddClass() {
    setClasses(prev => [...prev, { id: classes.length + 1, code: newCode.trim().toUpperCase() }]);
    setNewCode('');
    setShowAddModal(false);
  }

  function handleAction(action) {
  if (action === 'Upload')
    {
        setShowUploadModal(true);
    }
}

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
          </div>

          <div className="class-actions-panel">
            <div className="actions-header">
              <PersonIcon />
              <span className="actions-course-code">{selectedClass.code}</span>
            </div>
            <div className="actions-grid">
              <button className="action-btn" onClick={() => handleAction('Upload')}>Upload</button>
              <button className="action-btn" onClick={() => handleAction('Edit')}>Edit</button>
              <button className="action-btn" onClick={() => handleAction('Manage Class')}>Manage<br />Class</button>
              <button className="action-btn" onClick={() => handleAction('Publish')}>Publish</button>
            </div>
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
        />
        )}
    </div>
  );
}