import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";

const Register = () => {
  const [formData, setFormData] = useState({
    nama_lengkap: "",
    nik: "",
    no_hp: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); // Mencegah reload halaman
    console.log("Data yang akan dikirim:", formData); // Cek di console F12

    if (formData.password !== formData.confirmPassword) {
      alert("Password tidak cocok!");
      return;
    }

    try {
      const response = await api.post("/api/register", {
        nama_lengkap: formData.nama_lengkap,
        nik: formData.nik,
        no_hp: formData.no_hp,
        email: formData.email,
        password: formData.password
      });

      console.log("Respon Server:", response.data);
      alert("Pendaftaran Berhasil!");
      navigate("/login");
    } catch (err) {
      console.error("Error Detail:", err);
      alert("Gagal Daftar: " + (err.response?.data?.message || err.response?.data?.error || "Cek koneksi server"));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-emerald-50 py-12 px-6">
      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl p-10">
        <h2 className="text-2xl font-black text-emerald-900 mb-6">DAFTAR AKUN PPID</h2>
        
        {/* PASTIKAN ONSUBMIT ADA DI SINI */}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="text-xs font-bold text-slate-400 uppercase">Nama Lengkap</label>
            <input name="nama_lengkap" onChange={handleChange} type="text" required className="w-full px-4 py-3 rounded-xl border bg-gray-50" />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase">NIK</label>
            <input name="nik" onChange={handleChange} type="number" required className="w-full px-4 py-3 rounded-xl border bg-gray-50" />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase">No HP</label>
            <input name="no_hp" onChange={handleChange} type="tel" required className="w-full px-4 py-3 rounded-xl border bg-gray-50" />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-bold text-slate-400 uppercase">Email</label>
            <input name="email" onChange={handleChange} type="email" required className="w-full px-4 py-3 rounded-xl border bg-gray-50" />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase">Password</label>
            <input name="password" onChange={handleChange} type="password" required className="w-full px-4 py-3 rounded-xl border bg-gray-50" />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase">Konfirmasi Password</label>
            <input name="confirmPassword" onChange={handleChange} type="password" required className="w-full px-4 py-3 rounded-xl border bg-gray-50" />
          </div>

          <button type="submit" className="md:col-span-2 bg-emerald-700 py-4 rounded-xl text-white font-black mt-4 hover:bg-emerald-800 transition-all">
            DAFTAR SEKARANG
          </button>
        </form>
      </div>
    </div>
  );
};

export default Register;