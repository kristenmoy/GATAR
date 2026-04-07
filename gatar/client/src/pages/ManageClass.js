import React, { useState, useEffect } from "react";

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
          setFiles(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchFiles();
  }, [classCode]);

  async function handleRemove(fileId, fileName) {
    if (!window.confirm(`Remove "${fileName}"?`)) return;
    setRemoving(fileId);
    
    const res = await fetch(`http://localhost:5000/api/files/${fileId}`, {
    method: "DELETE",
    });
    if (res.ok) {
    setFiles(prev => prev.filter(f => f.id !== fileId));
    } else {
    alert("Failed to remove file.");
    }
      setRemoving(null);
  }

  const fileRows = files.map(file =>
    React.createElement("li", { key: file.id, className: "manage-file-row" },
      React.createElement("div", { className: "manage-pdf-icon" }, "PDF"),
      React.createElement("button", {
        className: "manage-remove-btn",
        onClick: () => handleRemove(file.id, file.name),
        disabled: removing === file.id
      }, removing === file.id ? "…" : "Remove")
    )
  );

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