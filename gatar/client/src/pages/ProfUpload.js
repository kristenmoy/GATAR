import React, { useState } from "react";

export default function UploadModal({ onClose, classCode, setUploading, uploading }) {
  const [file, setFile] = useState(null);

  function handleFileChange(e) {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  }

  async function handleSubmit() {
    if (!file) { alert("Please select a PDF file"); return; }

    setUploading?.(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("course_code", classCode);   // send class code to backend

    try {
      const res = await fetch("http://localhost:5000/api/upload-pdf", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        alert("Upload successful!");
        setFile(null);
        if (onClose) onClose();
      } else {
        alert("Upload failed");
      }
    } catch (err) {
      console.error(err);
      alert("Server error");
    }
    finally{
      setUploading?.(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={function(e) { e.stopPropagation(); }}>
        <h3>Upload PDF {classCode ? `— ${classCode}` : ''}</h3>

        <input
          type="file"
          id="file-input"
          accept="application/pdf"
          onChange={handleFileChange}
          style={{ display: "none" }}
        />
        <label
          htmlFor="file-input"
          className="custom-file-button"
          style={{
            pointerEvents: uploading ? "none" : "auto",
            opacity: uploading ? 0.6 : 1
          }}
        >
          {file ? file.name : "Choose PDF File"}
        </label>

        <div className="modal-actions">
          <button className="modal-cancel" onClick={onClose}>Cancel</button>
          <button
            className="modal-confirm"
            onClick={handleSubmit}
            disabled={uploading}
            style={{ cursor: uploading ? "wait" : "pointer" }}
          >
            {uploading ? "Uploading..." : "Upload"}
          </button>
        </div>
      </div>
    </div>
  );
}