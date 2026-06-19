import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import DashboardUser from "./pages/DashboardUser";
import DashboardAdmin from "./pages/DashboardAdmin";

// 🔥 TAMBAHAN PENTING
import Page from "./pages/page";

function App() {
  return (
    <Router>
      <Routes>

        {/* HOME */}
        <Route path="/" element={<Home />} />

        {/* AUTH */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* USER */}
        <Route path="/permohonan-baru" element={<DashboardUser />} />

        {/* ADMIN */}
        <Route path="/admin-ppid-man2" element={<DashboardAdmin />} />

        {/* 🔥 INI YANG KAMU TANYA - FULL PAGE SUB MENU */}
        <Route path="/page/:slug" element={<Page />} />

      </Routes>
    </Router>
  );
}

export default App;