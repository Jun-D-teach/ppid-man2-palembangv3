import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api, getUploadUrl, clearAuth } from "../api";

const DashboardUser = () => {
  const [user, setUser] = useState(null);
  const [view, setView] = useState("overview");
  const [permohonanList, setPermohonanList] = useState([]);
  const [selectedData, setSelectedData] = useState(null);
  const [formData, setFormData] = useState({
    subjek: "",
    tujuan_informasi: "",
    cara_memperoleh: "Email",
  });
  const navigate = useNavigate();

  useEffect(() => {
    const loggedInUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (!loggedInUser || loggedInUser === "undefined" || !token) {
      navigate("/login");
    } else {
      try {
        const parsedUser = JSON.parse(loggedInUser);
        setUser(parsedUser);
        fetchPermohonan(parsedUser.id);
      } catch (e) {
        console.error("Gagal parse user data:", e);
        navigate("/login");
      }

      // Tangkap parameter pencarian / trigger form
      const params = new URLSearchParams(window.location.search);
      if (params.get("view") === "formulir" || params.get("type") === "keberatan") {
        setView("formulir");
        if (params.get("type") === "keberatan") {
          setFormData({
            subjek: "Pengajuan Keberatan Atas Informasi Publik",
            tujuan_informasi: "Mengajukan keberatan karena alasan berikut: \n",
            cara_memperoleh: "Email",
          });
        }
      }
    }
  }, [navigate]);

  const fetchPermohonan = async (userId) => {
    try {
      const response = await api.get(`/api/permohonan/${userId}`);
      setPermohonanList(response.data);
    } catch (err) {
      console.error("Gagal mengambil data permohonan");
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmitPermohonan = async (e) => {
    e.preventDefault();
    try {
      await api.post("/api/permohonan", {
        ...formData,
        user_id: user.id,
      });
      alert("Permohonan Berhasil Dikirim!");
      fetchPermohonan(user.id);
      setView("overview");
      setFormData({ subjek: "", tujuan_informasi: "", cara_memperoleh: "Email" });
    } catch (err) {
      alert("Gagal mengirim permohonan");
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans text-slate-800">
      <aside className="w-64 bg-emerald-900 text-white hidden md:flex flex-col">
        <div className="p-6 border-b border-emerald-800 text-center">
          <p className="text-[10px] font-black tracking-widest opacity-70 uppercase">PPID MAN 2</p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button onClick={() => setView("overview")} className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold uppercase transition ${view === 'overview' ? 'bg-emerald-800' : 'hover:bg-emerald-800'}`}>
            📊 Ringkasan
          </button>
          <button onClick={() => navigate("/")} className="w-full text-left px-4 py-3 hover:bg-emerald-800 rounded-xl text-xs font-bold uppercase transition">
            🏠 Beranda
          </button>
        </nav>
        <div className="p-4 border-t border-emerald-800">
          <button onClick={() => { clearAuth(); navigate("/"); }} className="w-full px-4 py-3 bg-red-600 rounded-xl text-[10px] font-black uppercase text-white hover:bg-red-700 transition">
            Keluar Sistem
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-y-auto">
        <header className="bg-white shadow-sm px-8 py-4 flex justify-between items-center">
          <h2 className="text-lg font-black uppercase tracking-tighter">
            {view === "overview" ? "Dashboard User" : "Formulir Permohonan"}
          </h2>
          <div className="text-right">
            <p className="text-[10px] font-bold text-slate-400 uppercase italic">Selamat Datang,</p>
            <p className="text-xs font-black text-emerald-800">{user?.nama_lengkap || user?.nama}</p>
          </div>
        </header>

        <div className="p-8">
          {view === "overview" ? (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-emerald-500">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Total Permohonan</p>
                  <h4 className="text-3xl font-black">{permohonanList.length}</h4>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-orange-500">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Diproses</p>
                  <h4 className="text-3xl font-black">{permohonanList.filter(p => p.status === 'Diproses').length}</h4>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-blue-500">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Selesai</p>
                  <h4 className="text-3xl font-black">{permohonanList.filter(p => p.status === 'Selesai').length}</h4>
                </div>
              </div>

              <div className="bg-emerald-700 text-white p-8 rounded-3xl flex justify-between items-center shadow-lg">
                <div>
                  <h3 className="text-xl font-black uppercase italic">Butuh Informasi Publik?</h3>
                  <p className="text-xs opacity-80">Klik tombol untuk mengajukan permohonan baru.</p>
                </div>
                <button onClick={() => setView("formulir")} className="bg-white text-emerald-900 px-6 py-3 rounded-xl font-black text-xs uppercase shadow-md hover:bg-slate-100 transition">
                  Buat Permohonan
                </button>
              </div>

              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-[10px] font-black text-slate-400 uppercase">
                    <tr>
                      <th className="px-6 py-4">Subjek</th>
                      <th className="px-6 py-4">Tanggal</th>
                      <th className="px-6 py-4 text-center">Status & Estimasi</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs font-bold text-slate-600 divide-y">
                    {permohonanList.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50 transition cursor-pointer" onClick={() => setSelectedData(p)}>
                        <td className="px-6 py-4 text-emerald-800 font-black uppercase">{p.subjek}</td>
                        <td className="px-6 py-4">{new Date(p.tanggal_pengajuan).toLocaleDateString('id-ID')}</td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col items-center">
                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${
                              p.status === 'Pending' ? 'bg-orange-100 text-orange-600' : 
                              p.status === 'Diproses' ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'
                            }`}>
                              {p.status}
                            </span>
                            {p.status === 'Diproses' && p.estimasi && (
                              <p className="mt-1 text-[9px] text-blue-600 font-black italic">Est: {p.estimasi}</p>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {permohonanList.length === 0 && (
                      <tr><td colSpan="3" className="p-10 text-center text-slate-400 italic">Belum ada riwayat permohonan.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="max-w-2xl bg-white p-10 rounded-3xl shadow-xl border border-gray-100 mx-auto">
              <button onClick={() => setView("overview")} className="text-emerald-700 font-bold text-xs uppercase mb-6 flex items-center gap-2">
                ← Kembali
              </button>
              <form onSubmit={handleSubmitPermohonan} className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Subjek Informasi</label>
                  <input name="subjek" value={formData.subjek} onChange={handleChange} placeholder="Contoh: Rencana Anggaran 2024" className="w-full p-4 bg-gray-50 border rounded-2xl outline-none focus:ring-2 focus:ring-emerald-600" required />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Tujuan Penggunaan</label>
                  <textarea name="tujuan_informasi" value={formData.tujuan_informasi} onChange={handleChange} rows="3" className="w-full p-4 bg-gray-50 border rounded-2xl outline-none focus:ring-2 focus:ring-emerald-600" required></textarea>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Cara Memperoleh</label>
                  <select name="cara_memperoleh" value={formData.cara_memperoleh} onChange={handleChange} className="w-full p-4 bg-gray-50 border rounded-2xl outline-none">
                    <option value="Email">Email</option>
                    <option value="Hardcopy">Hardcopy (Ambil Langsung)</option>
                    <option value="Whatsapp">Whatsapp</option>
                  </select>
                </div>
                <button type="submit" className="w-full bg-emerald-800 text-white py-5 rounded-2xl font-black uppercase text-xs shadow-xl hover:bg-emerald-700 transition-all">
                  Kirim Permohonan
                </button>
              </form>
            </div>
          )}
        </div>
      </main>

      {selectedData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-10 rounded-[2.5rem] max-w-md w-full shadow-2xl relative">
            <h3 className="font-black uppercase mb-6 tracking-widest text-emerald-900 border-b pb-4 italic">Detail Jawaban</h3>
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl">
                <p className="text-[8px] font-black text-slate-400 uppercase">Status Sekarang</p>
                <p className="text-xs font-black uppercase text-emerald-700">{selectedData.status}</p>
              </div>
              {selectedData.pesan_admin ? (
                <div className="bg-blue-50 p-5 rounded-2xl border-l-4 border-blue-500">
                  <p className="text-[9px] font-bold text-blue-400 uppercase mb-1">Pesan Admin:</p>
                  <p className="text-xs text-slate-700 italic leading-relaxed">"{selectedData.pesan_admin}"</p>
                </div>
              ) : (
                <div className="bg-orange-50 p-5 rounded-2xl text-center">
                  <p className="text-[9px] text-orange-600 font-black uppercase italic">Belum ada pesan balasan.</p>
                </div>
              )}
              {/* Tampilkan Tanggal Jawaban di sini */}
    {selectedData.tanggal_jawaban && (
      <div className="mb-4 text-right">
        <p className="text-[9px] font-black text-slate-400 uppercase">Tanggal Jawaban:</p>
        <p className="text-[10px] font-bold text-emerald-600">
          {new Date(selectedData.tanggal_jawaban).toLocaleString('id-ID', { 
            day: '2-digit', 
            month: 'long', 
            year: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </p>
      </div>
    )}
              {selectedData.berkas_balasan && (
                <a href={getUploadUrl(selectedData.berkas_balasan)} target="_blank" rel="noreferrer" className="block w-full text-center bg-emerald-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase shadow-lg hover:bg-emerald-700 transition">
                  📥 Unduh Berkas Lampiran
                </a>
              )}
            </div>
            <button onClick={() => setSelectedData(null)} className="w-full mt-6 py-3 text-[10px] font-black uppercase text-gray-400 hover:text-red-500 transition">Tutup</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardUser;
