import React, { useState, useEffect } from "react";
import './ManageClass.css';
import './ProfDashboard.css';

export default function ManageClassModal({ onClose, classCode, embedded}) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState(null);

  useEffect(() => {
    async function fetchFiles() {
      try {
        const res = await fetch(`http://localhost:5000/api/files/${classCode}`);
        if (res.ok) {
          const data = await res.json();
          const cleanName = name => name.split("_").pop();
          setFiles(data.sort((a, b) => cleanName(a.name).localeCompare(cleanName(b.name), undefined, { sensitivity: 'base' })));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchFiles();
  }, [classCode]);

  async function handleRemove(fileId) {
    const confirmDelete = window.confirm(
    "Are you sure you want to delete this file?"
  );

  if (!confirmDelete) return;
    
    setRemoving(fileId);

    try {
      const res = await fetch(
        `http://localhost:5000/api/files/${fileId}?course_code=${classCode}`,
        { method: "DELETE" }
      );

      if (!res.ok) {
        throw new Error("Delete failed");
      }

      setFiles(prev => prev.filter(f => f.id !== fileId));

    } catch (err) {
      console.error(err);
      alert("Failed to remove file.");
    }

    setRemoving(null);
  }

  const fileRows = files.map(file => {
    const cleanName = file.name.split("_").pop();

    return (
      <div key={file.id} className="manage-file-row">
        
        <div className="file-left">
          <span className="manage-pdf-icon">📄</span>
          <span className="manage-file-name">{cleanName}</span>
        </div>

        <button
          className="manage-remove-btn trash-btn"
          onClick={() => handleRemove(file.id)}
          disabled={removing === file.id}
        >
          🗑
        </button>

      </div>
    );
  });

  let bodyContent;
  if (loading) {
    bodyContent = React.createElement("p", { className: "manage-empty" }, "Loading files…");
  } else if (files.length === 0) {
    bodyContent = React.createElement("p", { className: "manage-empty" }, "No files uploaded yet.");
  } else {
    bodyContent = (
      <div className="manage-file-list">
        {fileRows}
      </div>
    );
  }

  const content = (
  <div className="manage-class-content">
    <div className="file-scroll-area">
      {bodyContent}
    </div>
  </div>
);

  if (embedded) {
    return content;
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card manage-modal-card" onClick={e => e.stopPropagation()}>
        {content}
        <div className="modal-actions" style={{ marginTop: "20px" }}>
          <button className="modal-cancel" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );

  // return React.createElement(
  //   "div", { className: "modal-backdrop", onClick: onClose },
  //   React.createElement(
  //     "div", { className: "modal-card manage-modal-card", onClick: e => e.stopPropagation() },
  //     React.createElement("h3", null, `Manage Class — ${classCode}`),
  //     bodyContent,
  //     React.createElement(
  //       "div", { className: "modal-actions", style: { marginTop: "20px" } },
  //       React.createElement("button", { className: "modal-cancel", onClick: onClose }, "Close")
  //     )
  //   )
  // );
}