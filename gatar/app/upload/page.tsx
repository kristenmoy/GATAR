"use client";

import { ChangeEvent, useState } from "react";

export default function UploadPdf()
{
    const [file, setFile] = useState<File | null>(null);

    function handleFileChange(e: ChangeEvent<HTMLInputElement>)
    {
        if (e.target.files)
        {
            setFile(e.target.files[0]);
        }
    }

    async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>)
    {
        e.preventDefault();

        if (!file)
        {
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch("/api/upload", {
            method: "POST",
            body: formData,
        });

        if (res.ok)
        {
            alert("Upload successful!");
            setFile(null);
        }
    }

  return (
    <>
      <header className="header-box">
        <h1>GATAR</h1>
        <button className="about-button">About Us</button>
      </header>

      <div className="center-screen">
        <div className="upload-box">
          <h2>Upload PDF</h2>
            <form onSubmit={handleSubmit}>
                <input
                    type="file"
                    id="file-input"
                    accept="application/pdf"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
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