import React, { useState } from "react";

export default function ProfUploads() {
  const [file, setFile] = useState(null);

  function handleFileChange(e) {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!file) {
      alert("Please select a PDF file");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://localhost:5000/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        alert("Upload successful!");
        setFile(null);
      } else {
        alert("Upload failed");
      }
    } catch (err) {
      console.error(err);
      alert("Server error");
    }
  }

  return (
    <>
      <div className="center-screen">
        <div className="upload-box">
          <h2>Upload PDF</h2>

          <form onSubmit={handleSubmit}>
            <input
              type="file"
              id="file-input"
              accept="application/pdf"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />

            <label htmlFor="file-input" className="custom-file-button">
              {file ? file.name : "Choose PDF File"}
            </label>

            <button type="submit">Upload</button>
          </form>
        </div>
      </div>
    </>
  );
}