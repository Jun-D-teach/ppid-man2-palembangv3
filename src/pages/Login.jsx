import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post("/api/login", formData);
      
      // Simpan data user dan token agar API admin/user terlindungi tetap bisa diakses setelah refresh
      localStorage.setItem("user", JSON.stringify(response.data.user));
      localStorage.setItem("token", response.data.token);
      
      alert("Selamat Datang, " + (response.data.user.nama_lengkap || response.data.user.nama || "Pengguna"));
      navigate("/"); // Sementara arahkan ke Home dulu
    } catch (err) {
      setMessage(err.response?.data?.message || err.response?.data?.error || "Gagal Login");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-emerald-50 px-6 font-sans">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-10 border border-emerald-100">
        <div className="text-center mb-8">
          <img 
            src="https://man2plg.sch.id/Foto/logo.png" 
            alt="Logo" 
            className="h-16 mx-auto mb-4 object-contain" 
            onError={(e) => {
              e.target.src = "https://upload.wikimedia.org/wikipedia/commons/a/a2/Logo_Kemenag_new.png";
            }}
          />
          <h2 className="text-2xl font-black text-emerald-900 uppercase tracking-tighter">Login PPID</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Silakan masuk ke akun Anda</p>
        </div>

        {message && <p className="bg-red-100 text-red-600 p-3 rounded-xl mb-4 text-[10px] font-bold text-center uppercase tracking-widest">{message}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Email</label>
            <input name="email" type="email" onChange={handleChange} required className="w-full px-4 py-3 rounded-xl border bg-gray-50 focus:ring-2 focus:ring-emerald-600 outline-none text-sm" />
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Password</label>
            <input name="password" type="password" onChange={handleChange} required className="w-full px-4 py-3 rounded-xl border bg-gray-50 focus:ring-2 focus:ring-emerald-600 outline-none text-sm" />
          </div>
          
          <button type="submit" className="w-full bg-emerald-700 py-4 rounded-xl text-white font-black text-xs uppercase tracking-widest shadow-lg hover:bg-emerald-800 transition-all">
            Masuk Sekarang
          </button>
        </form>

        <p className="mt-8 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Belum punya akun? <Link to="/register" className="text-emerald-700 hover:underline">Daftar Disini</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;