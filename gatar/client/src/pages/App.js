import "./../App.css";
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from "../components/Navbar";
import BackendTest from './BackendTest';
import About from './About';
import ProfLogin from "./ProfLogin";
import StudentLogin from "./StudentLogin";
import ProfUpload from "./ProfUpload";


export default function App() {

  return (
      <Router>
      <Navbar />
      <Routes>
        <Route path="/test" element={<BackendTest />} />
        <Route path="/about" element={<About />} />
        <Route path="/profLogin" element={<ProfLogin />} />
        <Route path="/studentLogin" element={<StudentLogin />} />
        <Route path="/profUpload" element={<ProfUpload />} />
      </Routes>
    </Router>
  );
}
