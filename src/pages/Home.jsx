import React, { useMemo, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, getUploadUrl, clearAuth } from "../api";

const defaultInfoCategories = [
  "Informasi Berkala",
  "Informasi Serta Merta",
  "Informasi Setiap Saat",
  "Informasi Dikecualikan",
];

const defaultMenuPages = [
  { parent_menu: "INFORMASI PUBLIK", menu_label: "Informasi Berkala", slug: "informasi-berkala" },
  { parent_menu: "INFORMASI PUBLIK", menu_label: "Informasi Serta Merta", slug: "informasi-serta-merta" },
  { parent_menu: "INFORMASI PUBLIK", menu_label: "Informasi Setiap Saat", slug: "informasi-setiap-saat" },
  { parent_menu: "INFORMASI PUBLIK", menu_label: "Informasi Dikecualikan", slug: "informasi-dikecualikan" }
];

const getFileFormat = (fileName = "") => {
  if (!fileName.includes(".")) return "FILE";
  return fileName.split(".").pop().toUpperCase();
};

const getInfoCategoryKey = (pageOrLabel) => {
  if (typeof pageOrLabel === "string") return pageOrLabel;
  const slug = String(pageOrLabel?.slug || "").toLowerCase();
  const label = pageOrLabel?.menu_label || "";

  if (slug.includes("berkala")) return "Informasi Berkala";
  if (slug.includes("serta-merta")) return "Informasi Serta Merta";
  if (slug.includes("setiap-saat")) return "Informasi Setiap Saat";
  if (slug.includes("dikecualikan")) return "Informasi Dikecualikan";

  return label;
};

const renderCleanDescription = (text) => {
  if (!text) return null;
  const urlRegex = /((?:https?|http):\/\/[^\s\)]+)/g;
  const parts = text.split(urlRegex);

  return (
    <>
      {parts.map((part, partIdx) => {
        if (part.match(/https?:\/\/[^\s]+/)) {
          const cleanUrl = part.replace(/[\)\]\.,\s]+$/, '');
          const urlTitle = cleanUrl.split('/').pop() || "Buka Tautan";
          
          return (
            <span key={partIdx} className="inline-block mx-1">
              <a
                href={cleanUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-[11px] px-2 py-0.5 rounded border border-emerald-200/80 shadow-2xs transition-colors align-middle break-all"
              >
                {decodeURIComponent(urlTitle).substring(0, 30)}{decodeURIComponent(urlTitle).length > 30 ? "..." : ""}
              </a>
            </span>
          );
        }
        return <span key={partIdx}>{part}</span>;
      })}
    </>
  );
};

const ExpandableDescription = ({ text }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  if (!text) return null;
  if (text.length <= 120) {
    return <p className="text-[11px] text-slate-400 mt-1 font-medium leading-relaxed">{renderCleanDescription(text)}</p>;
  }
  const truncatedText = text.substring(0, 120) + "...";

  return (
    <p className="text-[11px] text-slate-400 mt-1 font-medium leading-relaxed">
      {renderCleanDescription(isExpanded ? text : truncatedText)}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          setIsExpanded(!isExpanded);
        }}
        className="ml-1 text-emerald-700 hover:text-emerald-950 font-bold underline text-[10px] cursor-pointer inline-block"
      >
        {isExpanded ? "Tampilkan Sedikit" : "Selengkapnya"}
      </button>
    </p>
  );
};

const Home = () => {
  const [activeTab, setActiveTab] = useState("Informasi Berkala");
  const [user, setUser] = useState(null);
  const [konten, setKonten] = useState({});
  const [informasiPublik, setInformasiPublik] = useState([]);
  const [menuPages, setMenuPages] = useState([]);
  const [searchDokumen, setSearchDokumen] = useState("");

  const [cekStatusOpen, setCekStatusOpen] = useState(false);
  const [cekStatusQuery, setCekStatusQuery] = useState("");
  const [cekStatusLoading, setCekStatusLoading] = useState(false);
  const [cekStatusResults, setCekStatusResults] = useState(null);
  const [cekStatusError, setCekStatusError] = useState("");
  const [privateAccessModal, setPrivateAccessModal] = useState(null);

  const navigate = useNavigate();

  const handleCekStatus = async (e) => {
    if (e) e.preventDefault();
    if (!cekStatusQuery.trim()) {
      setCekStatusError("Masukkan NIK, Email, atau nomor subjek Anda.");
      return;
    }
    try {
      cekStatusLoading(true);
      cekStatusError("");
      const res = await api.get(`/api/cek-status?q=${encodeURIComponent(cekStatusQuery)}`);
      setCekStatusResults(res.data || []);
    } catch (err) {
      console.error(err);
      setCekStatusError("Terjadi kesalahan teknis saat melacak permohonan Anda.");
    } finally {
      setCekStatusLoading(false);
    }
  };

  const handleFileClick = (e, file, item) => {
    if (item?.status_publish === "Private" && !user) {
      e.preventDefault();
      setPrivateAccessModal(item);
    }
  };

  const infoMenuPages = useMemo(() => {
    const source = menuPages.length ? menuPages : defaultMenuPages;
    const pages = source
      .filter(p => String(p?.parent_menu || "").toUpperCase() === "INFORMASI PUBLIK")
      .sort((a, b) => Number(a.position || 1) - Number(b.position || 1));

    if (pages.length > 0) return pages;

    return defaultInfoCategories.map((label, index) => ({
      parent_menu: "INFORMASI PUBLIK",
      menu_label: label,
      slug: label.toLowerCase().replace(/\s+/g, "-"),
      judul: label,
      isi: "Konten halaman ini belum diisi oleh admin.",
      position: index + 1,
      berkas_list: [],
    }));
  }, [menuPages]);

  const activeInfoPage = useMemo(() => {
    return (
      infoMenuPages.find((page) => getInfoCategoryKey(page) === activeTab) ||
      infoMenuPages.find((page) => page.menu_label === activeTab) ||
      infoMenuPages[0] ||
      null
    );
  }, [infoMenuPages, activeTab]);

  useEffect(() => {
    const loggedInUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (loggedInUser && loggedInUser !== "undefined" && token) {
      try { setUser(JSON.parse(loggedInUser)); } catch (e) { console.error(e); }
    }
  }, []);

  useEffect(() => {
    api.get("/api/beranda").then((res) => setKonten(res.data || {})).catch(err => console.error(err));
    api.get("/api/informasi-publik").then((res) => setInformasiPublik(Array.isArray(res.data) ? res.data : [])).catch(err => console.error(err));
    api.get("/api/menu-pages").then((res) => setMenuPages(Array.isArray(res.data) ? res.data : [])).catch(err => console.error(err));
  }, []);

  const handleAjukanClick = (e) => {
    if (e) e.preventDefault();
    if (user) {
      navigate("/permohonan-baru");
    } else {
      alert("Silakan Login terlebih dahulu untuk mengajukan permohonan informasi.");
      navigate("/login");
    }
  };

  const handleProsedurButton = () => {
    const page = menuPages.find((p) => p.slug === "prosedur-permohonan");
    if (page?.slug) navigate(`/page/${page.slug}`);
  };

 const filteredDokumen = useMemo(() => {
  return informasiPublik
    .filter((item) => item.kategori === activeTab)
    .filter((item) => item.status_publish !== "Sembunyi")
    .filter((item) =>
      `${item.judul || ""} ${item.deskripsi || ""} ${item.tahun || ""}`
        .toLowerCase()
        .includes(searchDokumen.toLowerCase())
    )
    .sort((a, b) => {
      // ✅ URUTKAN BERDASARKAN POSISI
      const posA = Number(a.posisi || a.position || 999);
      const posB = Number(b.posisi || b.position || 999);
      return posA - posB;
    });
}, [informasiPublik, activeTab, searchDokumen]);

  return (
    <div className="min-h-screen bg-white font-sans text-slate-800 antialiased">
      
      {/* HEADER HERO BANNER */}
      <header className="relative min-h-[500px] md:h-[650px] bg-emerald-950 overflow-hidden flex items-center pb-20 md:pb-40">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url('${konten.banner_gambar || "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80"}')` }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-950 via-emerald-900/80 to-transparent"></div>

        <div className="relative mx-auto max-w-7xl px-6 text-white w-full">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-300 ring-1 ring-white/20 backdrop-blur-sm mb-6">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400"></span>
            {konten.banner_badge || "Portal Layanan Informasi"}
          </div>

          <h2 className="text-4xl md:text-7xl font-black leading-tight uppercase">
            {konten.banner_judul || "Keterbukaan Informasi"} <br />
            <span className="text-emerald-400 font-light italic normal-case">
              {konten.banner_highlight || "Adalah Hak Anda."}
            </span>
          </h2>

          <p className="mt-6 text-sm md:text-xl text-slate-200 max-w-2xl leading-relaxed">
            {konten.banner_subjudul || "Pejabat Pengelola Informasi dan Dokumentasi memberikan pelayanan informasi yang transparan dan akuntabel."}
          </p>

          <div className="mt-10 flex flex-wrap gap-4 font-black tracking-widest text-[11px]">
            <button onClick={handleAjukanClick} className="bg-emerald-600 px-8 py-4 rounded-xl shadow-xl hover:bg-emerald-500 transition-all uppercase text-white cursor-pointer">
              Ajukan Permohonan
            </button>
            <button onClick={handleProsedurButton} className="border border-white/20 bg-white/5 px-8 py-4 rounded-xl backdrop-blur-sm hover:bg-white/10 transition-all uppercase text-white cursor-pointer">
              Prosedur Layanan
            </button>
          </div>
        </div>
      </header>

      {/* STRIP AKSES LAYANAN CEPAT */}
      <section className="relative z-10 -mt-16 md:-mt-24 mx-auto max-w-7xl px-4 md:px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-0 shadow-2xl rounded-2xl overflow-hidden ring-1 ring-emerald-900/10">
          {[
            { title: "Permohonan Informasi", icon: "📨", color: "bg-white", text: "text-slate-800", onClick: handleAjukanClick, helper: "Buat permohonan baru" },
            { 
              title: "Pengajuan Keberatan", icon: "⚖️", color: "bg-emerald-800", text: "text-white", 
              onClick: () => user ? navigate("/permohonan-baru?type=keberatan") : (alert("Silakan Login terlebih dahulu untuk mengajukan keberatan."), navigate("/login")),
              helper: "Ajukan surat keberatan" 
            },
            { title: "Cek Status Layanan", icon: "🔍", color: "bg-white", text: "text-slate-800", onClick: () => { setCekStatusOpen(true); setCekStatusQuery(""); setCekStatusResults(null); setCekStatusError(""); }, helper: "Lacak status permohonan" },
            { title: "Daftar Informasi", icon: "📂", color: "bg-emerald-900", text: "text-white", onClick: () => document.getElementById("daftar-informasi")?.scrollIntoView({ behavior: "smooth" }), helper: "Lihat data publik" },
          ].map((item, i) => (
            <div key={i} onClick={item.onClick} className={`${item.color} p-6 md:p-12 flex flex-col items-center text-center group cursor-pointer hover:scale-[1.01] hover:shadow-inner transition-all border-b md:border-b-0`}>
              <span className="text-4xl md:text-6xl mb-4 group-hover:scale-110 transition-transform">{item.icon}</span>
              <h3 className={`text-[10px] md:text-xs font-black uppercase tracking-widest leading-tight ${item.text}`}>{item.title}</h3>
              <p className={`mt-2 text-[9px] md:text-[11px] opacity-60 hidden sm:block ${item.text}`}>{item.helper}</p>
            </div>
          ))}
        </div>
      </section>

      {/* DAFTAR DOKUMEN TABEL */}
      <section id="daftar-informasi" className="mx-auto max-w-7xl px-4 md:px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-4xl font-black text-slate-900 uppercase tracking-tighter">Daftar Informasi Publik</h2>
          <div className="mx-auto mt-3 h-1 w-20 bg-emerald-700 rounded-full"></div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-1/4 flex flex-row lg:flex-col gap-2 overflow-x-auto pb-4 lg:pb-0">
            {infoMenuPages.map((page, index) => {
              const categoryKey = getInfoCategoryKey(page);
              const isActive = activeTab === categoryKey || activeInfoPage?.id === page.id;
              return (
                <button
                  key={page.id || page.slug || page.menu_label || index}
                  onClick={() => setActiveTab(categoryKey)}
                  className={`whitespace-nowrap px-4 py-3 md:px-6 md:py-4 rounded-xl text-left text-[10px] md:text-[12px] font-black uppercase tracking-widest transition-all border cursor-pointer ${
                    isActive ? "bg-emerald-800 text-white shadow-lg" : "bg-gray-50 border-gray-100 text-slate-500 hover:bg-emerald-50"
                  }`}
                >
                  {page.menu_label}
                </button>
              );
            })}
          </aside>

          <div className="flex-1 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="p-4 md:p-6 bg-gray-50 border-b flex flex-col sm:flex-row justify-between items-center gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-700">Kategori Terpilih</p>
                <h3 className="mt-1 font-black text-emerald-900 uppercase text-sm md:text-base">{activeInfoPage?.judul || activeInfoPage?.menu_label || activeTab}</h3>
              </div>
              <input
                type="text"
                value={searchDokumen}
                onChange={(e) => setSearchDokumen(e.target.value)}
                placeholder="Cari dokumen..."
                className="w-full sm:w-64 bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-700/50 transition shadow-sm"
              />
            </div>

            {activeInfoPage && (
              <div className="border-b border-emerald-100 bg-emerald-50/50 p-5 md:p-6">
                <div className="max-w-4xl mx-auto bg-white rounded-2xl p-6 shadow-lg border border-emerald-100">
                  <h3 className="text-xl font-black text-emerald-800 uppercase">{activeInfoPage.judul || activeInfoPage.menu_label}</h3>
                  <div className="text-sm leading-7 text-slate-700 mt-2 text-justify">{renderCleanDescription(activeInfoPage.isi)}</div>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-[12px] md:text-[13px] text-left">
                <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Nama Dokumen</th>
                    <th className="px-6 py-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredDokumen.length === 0 ? (
                    <tr><td colSpan="2" className="px-6 py-10 text-center text-slate-400 font-semibold">Belum ada dokumen pada kategori ini.</td></tr>
                  ) : (
                    filteredDokumen.map((item) => (
                      <tr key={item.id} className="hover:bg-emerald-50/50 transition">
                        <td className="px-6 py-5 font-semibold text-slate-700 leading-tight">
                          {item.judul}
                          {item.status_publish === "Private" && (
                            <span className="ml-2 inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-0.5 text-[9px] font-black text-amber-700 uppercase ring-1 ring-amber-200">🔒 Private</span>
                          )}
                          {item.deskripsi && <ExpandableDescription text={item.deskripsi} />}
                          {item.tahun && <p className="text-[10px] text-emerald-700 mt-2 font-black">Tahun {item.tahun}</p>}
                        </td>
                        <td className="px-6 py-5 text-right">
                          {(item.berkas_list || []).length > 0 ? (
                            item.berkas_list.map((file) => (
                              <a
                                key={file.id}
                                href={item.status_publish === "Private" && !user ? "#" : getUploadUrl(file.nama_file)}
                                onClick={(e) => handleFileClick(e, file, item)}
                                target={item.status_publish === "Private" && !user ? "_self" : "_blank"}
                                rel="noreferrer"
                                className={`block font-black hover:underline uppercase text-[10px] ${item.status_publish === "Private" && !user ? "text-amber-600" : "text-emerald-700"}`}
                              >
                                {item.status_publish === "Private" && !user ? "🔒 Login / Daftar" : `Lihat ${file.nama_asli ? `- ${file.nama_asli}` : ""}`}
                              </a>
                            ))
                          ) : <span className="text-slate-400 text-[10px]">Tidak ada berkas</span>}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* MODAL: PRIVATE ACCESS WARNING */}
      {privateAccessModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-3xl border bg-white p-8 shadow-2xl text-center">
            <span className="text-3xl">🔒</span>
            <h3 className="mt-4 text-lg font-black uppercase tracking-tight text-slate-900 border-b pb-2">Akses Terbatas (Private)</h3>
            <p className="mt-3 text-[11px] font-black uppercase text-emerald-800">Dokumen: {privateAccessModal.judul}</p>
            <p className="mt-4 text-xs font-medium text-slate-500 leading-relaxed">Silakan masuk ke dalam akun PPID Anda atau daftarkan akun baru untuk mengunduh dokumen terbatas ini.</p>
            <div className="mt-6 flex flex-col gap-2">
              <button onClick={() => { setPrivateAccessModal(null); navigate("/login"); }} className="w-full bg-emerald-800 text-white py-3 rounded-xl font-black uppercase text-[10px] tracking-widest cursor-pointer">Masuk Sekarang</button>
              <button onClick={() => { setPrivateAccessModal(null); navigate("/register"); }} className="w-full bg-slate-100 text-slate-800 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest cursor-pointer">Daftar Akun Baru</button>
              <button onClick={() => setPrivateAccessModal(null)} className="w-full py-2 text-[10px] font-black uppercase text-slate-400 cursor-pointer">Batal</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: TRACK STATUS LAYANAN */}
      {cekStatusOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-[2.5rem] border bg-white p-6 md:p-10 shadow-2xl">
            <button type="button" onClick={() => setCekStatusOpen(false)} className="absolute right-6 top-6 grid h-10 w-10 place-items-center rounded-full bg-slate-50 text-slate-500 hover:bg-slate-100 font-bold cursor-pointer">✕</button>
            <div className="text-center sm:text-left">
              <span className="text-2xl">🔍</span>
              <h3 className="mt-2 text-xl md:text-2xl font-black uppercase text-emerald-950">Lacak Status Permohonan</h3>
              <p className="text-xs text-slate-400">Temukan progres dan tanggapan admin atas permohonan Anda.</p>
            </div>
            <form onSubmit={handleCekStatus} className="mt-6">
              <div className="flex flex-col sm:flex-row gap-2">
                <input type="text" required value={cekStatusQuery} onChange={(e) => setCekStatusQuery(e.target.value)} placeholder="Masukkan Email atau NIK..." className="flex-1 rounded-xl border bg-slate-50 px-5 py-4 text-xs font-semibold outline-none focus:bg-white" />
                <button type="submit" disabled={cekStatusLoading} className="rounded-xl bg-emerald-800 px-6 py-4 text-[10px] font-black uppercase text-white disabled:opacity-50 cursor-pointer">{cekStatusLoading ? "Mencari..." : "Cari Progres"}</button>
              </div>
              {cekStatusError && <p className="mt-3 text-xs font-semibold text-rose-600">{cekStatusError}</p>}
            </form>

            <div className="mt-6 max-h-[350px] overflow-y-auto space-y-4">
              {cekStatusResults === null ? (
                <div className="p-8 text-center text-slate-400 italic bg-slate-50/50 rounded-2xl text-xs">Silakan masukkan parameter pencarian di atas.</div>
              ) : cekStatusResults.length === 0 ? (
                <div className="p-8 text-center text-amber-700 font-bold bg-amber-50 rounded-2xl text-xs">⚠️ Data tidak ditemukan. Periksa kembali email atau NIK Anda.</div>
              ) : (
                <div className="space-y-4">
                  {cekStatusResults.map((p) => (
                    <div key={p.id} className="rounded-2xl border bg-slate-50/70 p-5 space-y-3">
                      <div className="flex justify-between items-start border-b pb-2">
                        <div>
                          <p className="text-[9px] font-black uppercase text-slate-400">Subjek</p>
                          <h4 className="text-sm font-black text-emerald-900">{p.subjek}</h4>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-[9px] font-extrabold uppercase ${p.status === "Pending" ? "bg-amber-100 text-amber-700" : p.status === "Diproses" ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"}`}>{p.status}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                        <div><p className="text-[9px] text-slate-400">Pengaju</p><p className="font-bold">{p.nama_lengkap}</p></div>
                        <div><p className="text-[9px] text-slate-400">Tanggal</p><p className="font-semibold">{new Date(p.tanggal_pengajuan).toLocaleDateString('id-ID')}</p></div>
                      </div>
                      {p.status === "Diproses" && p.estimasi && (
                        <div className="bg-blue-50 p-3 rounded-xl text-xs text-blue-700">⚠️ Estimasi: {p.estimasi}</div>
                      )}
                      {p.status === "Selesai" && (
                        <div className="bg-emerald-50 p-4 rounded-xl text-xs space-y-2">
                          <p className="text-emerald-800 font-black">✅ Jawaban Tersedia</p>
                          {p.pesan_admin && <p className="italic bg-white p-2 rounded border">"{p.pesan_admin}"</p>}
                          {p.berkas_balasan && <a href={getUploadUrl(p.berkas_balasan)} target="_blank" rel="noreferrer" className="inline-block bg-emerald-800 text-white px-3 py-1.5 rounded text-[10px] font-black uppercase">Download Berkas Balasan</a>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
