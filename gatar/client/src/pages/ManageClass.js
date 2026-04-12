import React, { useState, useEffect } from "react";
import './ManageClass.css';
import './ProfDashboard.css';

export default function ManageClassModal({ onClose, classCode }) {
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

    return React.createElement("div", { key: file.id, className: "manage-file-row" },
      React.createElement("div", { className: "file-left" },
        React.createElement("span", { className: "manage-pdf-icon" }, "📄"),
        React.createElement("span", { className: "manage-file-name" }, cleanName), // 👈 USE IT HERE
        React.createElement("button", {
          className: "manage-remove-btn",
          onClick: () => handleRemove(file.id),
          disabled: removing === file.id
        }, "Remove")
      )
    );
  });

  let bodyContent;
  if (loading) {
    bodyContent = React.createElement("p", { className: "manage-empty" }, "Loading files…");
  } else if (files.length === 0) {
    bodyContent = React.createElement("p", { className: "manage-empty" }, "No files uploaded yet.");
  } else {
    bodyContent = React.createElement("ul", { className: "manage-file-list" }, ...fileRows);
  }

  return React.createElement(
    "div", { className: "modal-backdrop", onClick: onClose },
    React.createElement(
      "div", { className: "modal-card manage-modal-card", onClick: e => e.stopPropagation() },
      React.createElement("h3", null, `Manage Class — ${classCode}`),
      bodyContent,
      React.createElement(
        "div", { className: "modal-actions", style: { marginTop: "20px" } },
        React.createElement("button", { className: "modal-cancel", onClick: onClose }, "Close")
      )
    )
  );
}