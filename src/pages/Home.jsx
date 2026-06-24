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
  { parent_menu: "PROFIL", menu_label: "Profil PPID", slug: "profil-ppid", judul: "Profil PPID", isi: "Konten Profil PPID belum diisi oleh admin.", position: 1, berkas_list: [] },
  { parent_menu: "PROFIL", menu_label: "Visi & Misi", slug: "visi-misi", judul: "Visi & Misi", isi: "Konten Visi & Misi belum diisi oleh admin.", position: 2, berkas_list: [] },
  { parent_menu: "PROFIL", menu_label: "Tugas & Fungsi", slug: "tugas-fungsi", judul: "Tugas & Fungsi", isi: "Konten Tugas & Fungsi belum diisi oleh admin.", position: 3, berkas_list: [] },
  { parent_menu: "PROFIL", menu_label: "Struktur Organisasi", slug: "struktur-organisasi", judul: "Struktur Organisasi", isi: "Konten Struktur Organisasi belum diisi oleh admin.", position: 4, berkas_list: [] },
  { parent_menu: "PROFIL", menu_label: "Maklumat Pelayanan", slug: "maklumat-pelayanan", judul: "Maklumat Pelayanan", isi: "Konten Maklumat Pelayanan belum diisi oleh admin.", position: 5, berkas_list: [] },

  { parent_menu: "REGULASI", menu_label: "UU KIP", slug: "uu-kip", judul: "UU KIP", isi: "Konten UU KIP belum diisi oleh admin.", position: 1, berkas_list: [] },
  { parent_menu: "REGULASI", menu_label: "Peraturan Menteri", slug: "peraturan-menteri", judul: "Peraturan Menteri", isi: "Konten Peraturan Menteri belum diisi oleh admin.", position: 2, berkas_list: [] },
  { parent_menu: "REGULASI", menu_label: "SOP PPID", slug: "sop-ppid", judul: "SOP PPID", isi: "Konten SOP PPID belum diisi oleh admin.", position: 3, berkas_list: [] },
  { parent_menu: "REGULASI", menu_label: "SK PPID", slug: "sk-ppid", judul: "SK PPID", isi: "Konten SK PPID belum diisi oleh admin.", position: 4, berkas_list: [] },

  { parent_menu: "INFORMASI PUBLIK", menu_label: "Informasi Berkala", slug: "informasi-berkala", judul: "Informasi Berkala", isi: "Klik untuk melihat daftar Informasi Berkala.", position: 1, berkas_list: [] },
  { parent_menu: "INFORMASI PUBLIK", menu_label: "Informasi Serta Merta", slug: "informasi-serta-merta", judul: "Informasi Serta Merta", isi: "Klik untuk melihat daftar Informasi Serta Merta.", position: 2, berkas_list: [] },
  { parent_menu: "INFORMASI PUBLIK", menu_label: "Informasi Setiap Saat", slug: "informasi-setiap-saat", judul: "Informasi Setiap Saat", isi: "Klik untuk melihat daftar Informasi Setiap Saat.", position: 3, berkas_list: [] },
  { parent_menu: "INFORMASI PUBLIK", menu_label: "Informasi Dikecualikan", slug: "informasi-dikecualikan", judul: "Informasi Dikecualikan", isi: "Klik untuk melihat daftar Informasi Dikecualikan.", position: 4, berkas_list: [] },

  { parent_menu: "LAYANAN INFORMASI", menu_label: "Prosedur Permohonan", slug: "prosedur-permohonan", judul: "Prosedur Permohonan", isi: "Konten Prosedur Permohonan belum diisi oleh admin.", position: 1, berkas_list: [] },
  { parent_menu: "LAYANAN INFORMASI", menu_label: "Prosedur Keberatan", slug: "prosedur-keberatan", judul: "Prosedur Keberatan", isi: "Konten Prosedur Keberatan belum diisi oleh admin.", position: 2, berkas_list: [] },
  { parent_menu: "LAYANAN INFORMASI", menu_label: "Biaya Layanan", slug: "biaya-layanan", judul: "Biaya Layanan", isi: "Konten Biaya Layanan belum diisi oleh admin.", position: 3, berkas_list: [] },
  { parent_menu: "LAYANAN INFORMASI", menu_label: "Hak & Tata Cara", slug: "hak-tata-cara", judul: "Hak & Tata Cara", isi: "Konten Hak & Tata Cara belum diisi oleh admin.", position: 4, berkas_list: [] },

  { parent_menu: "LAPORAN", menu_label: "Laporan Tahunan", slug: "laporan-tahunan", judul: "Laporan Tahunan", isi: "Konten Laporan Tahunan belum diisi oleh admin.", position: 1, berkas_list: [] },
  { parent_menu: "LAPORAN", menu_label: "Laporan Statistik", slug: "laporan-statistik", judul: "Laporan Statistik", isi: "Konten Laporan Statistik belum diisi oleh admin.", position: 2, berkas_list: [] },
  { parent_menu: "LAPORAN", menu_label: "Laporan Akses", slug: "laporan-akses", judul: "Laporan Akses", isi: "Konten Laporan Akses belum diisi oleh admin.", position: 3, berkas_list: [] },
];

const parentOrder = ["PROFIL", "REGULASI", "INFORMASI PUBLIK", "LAYANAN INFORMASI", "LAPORAN"];

const getFileFormat = (fileName = "") => {
  if (!fileName.includes(".")) return "FILE";
  return fileName.split(".").pop().toUpperCase();
};

const groupNavigation = (pages = []) => {
  const source = pages.length ? pages : defaultMenuPages;
  const grouped = parentOrder.map((parent) => ({
    name: parent,
    submenu: source
      .filter((page) => String(page.parent_menu).toUpperCase() === parent)
      .sort((a, b) => Number(a.position || 1) - Number(b.position || 1)),
  }));

  return [{ name: "BERANDA", href: "/" }, ...grouped.filter((item) => item.submenu.length > 0)];
};

const isInformasiPublikPage = (page) =>
  String(page?.parent_menu || "").toUpperCase() === "INFORMASI PUBLIK";

const getInfoCategoryKey = (pageOrLabel) => {
  if (typeof pageOrLabel === "string") return pageOrLabel;

  const slug = String(pageOrLabel?.slug || "").toLowerCase();
  const label = pageOrLabel?.menu_label || "";

  // Tetap cocok dengan kategori tabel lama walaupun nama submenu diedit admin.
  if (slug.includes("berkala")) return "Informasi Berkala";
  if (slug.includes("serta-merta")) return "Informasi Serta Merta";
  if (slug.includes("setiap-saat")) return "Informasi Setiap Saat";
  if (slug.includes("dikecualikan")) return "Informasi Dikecualikan";

  return label;
};

const Home = () => {
  const [activeTab, setActiveTab] = useState("Informasi Berkala");
  const [user, setUser] = useState(null);
  const [konten, setKonten] = useState({});
  const [informasiPublik, setInformasiPublik] = useState([]);
  const [menuPages, setMenuPages] = useState([]);

  const [searchDokumen, setSearchDokumen] = useState("");
 
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // States for Cek Status Layanan
  const [cekStatusOpen, setCekStatusOpen] = useState(false);
  const [cekStatusQuery, setCekStatusQuery] = useState("");
  const [cekStatusLoading, setCekStatusLoading] = useState(false);
  const [cekStatusResults, setCekStatusResults] = useState(null);
  const [cekStatusError, setCekStatusError] = useState("");

  // States for Private Document Restrictions
  const [privateAccessModal, setPrivateAccessModal] = useState(null);

  const navigate = useNavigate();

  const handleCekStatus = async (e) => {
    if (e) e.preventDefault();
    if (!cekStatusQuery.trim()) {
      setCekStatusError("Masukkan NIK, Email, atau nomor subjek Anda.");
      return;
    }
    try {
      setCekStatusLoading(true);
      setCekStatusError("");
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

  const navigation = useMemo(() => groupNavigation(menuPages), [menuPages]);

  const infoMenuPages = useMemo(() => {
    const source = menuPages.length ? menuPages : defaultMenuPages;
    const pages = source
      .filter(isInformasiPublikPage)
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
      try {
        setUser(JSON.parse(loggedInUser));
      } catch (e) {
        console.error("Gagal parse user data:", e);
        setUser(null);
      }
    } else if (loggedInUser && !token) {
      clearAuth();
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const fetchBeranda = async () => {
      try {
        const res = await api.get("/api/beranda");
        setKonten(res.data || {});
      } catch (err) {
        console.error("Gagal memuat beranda", err);
      }
    };

    const fetchInformasiPublik = async () => {
      try {
        const res = await api.get("/api/informasi-publik");
        setInformasiPublik(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Gagal memuat informasi publik", err);
      }
    };

    const fetchMenuPages = async () => {
      try {
        const res = await api.get("/api/menu-pages");
        setMenuPages(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Gagal memuat menu website", err);
        setMenuPages([]);
      }
    };

    fetchBeranda();
    fetchInformasiPublik();
    fetchMenuPages();
  }, []);

  const handleLogout = () => {
    clearAuth();
    setUser(null);
    alert("Berhasil Logout");
    navigate("/");
  };

  const handleAjukanClick = (e) => {
    if (e) e.preventDefault();

    if (user) {
      navigate("/permohonan-baru");
    } else {
      alert("Silakan Login terlebih dahulu untuk mengajukan permohonan informasi.");
      navigate("/login");
    }
  };

 const handleMenuPageClick = (page) => {
  if (page?.slug) {
    navigate(`/page/${page.slug}`);
  }
  setMobileMenuOpen(false);
};

  const handleProsedurButton = () => {
  const page = menuPages.find(
    (p) => p.slug === "prosedur-permohonan"
  );

  if (page?.slug) {
    navigate(`/page/${page.slug}`);
  }
};

  const filteredDokumen = informasiPublik
    .filter((item) => item.kategori === activeTab)
    .filter((item) => item.status_publish !== "Sembunyi")
    .filter((item) =>
      `${item.judul || ""} ${item.deskripsi || ""} ${item.tahun || ""}`
        .toLowerCase()
        .includes(searchDokumen.toLowerCase())
    );

  return (
    <div className="min-h-screen bg-white font-sans text-slate-800 antialiased">
      <div className="bg-[#004d40] py-2 text-white shadow-inner hidden md:block">
        <div className="mx-auto flex max-w-7xl justify-between px-6 text-[10px] font-bold tracking-widest uppercase opacity-90">
          <div className="flex gap-6">
            <span>📞 {konten.kontak_telepon || "(0711) 123456"}</span>
            <span>📧 {konten.kontak_email || "ppid@man2plg.sch.id"}</span>
          </div>

          <div className="flex gap-4 items-center">
            {user ? (
              <div className="flex gap-4 items-center">
                <span className="text-emerald-300 italic">Halo, {user.nama_lengkap || user.nama}</span>
                <button
                  onClick={handleLogout}
                  className="bg-red-600 px-3 py-1 rounded-full hover:bg-red-700 transition shadow-sm text-white font-bold"
                >
                  LOGOUT
                </button>
              </div>
            ) : (
              <>
                <Link to="/login" className="bg-red-600 px-3 py-1 rounded-full hover:bg-red-700 transition shadow-sm text-white font-bold">
                  LOGIN USER
                </Link>
                <Link to="/register" className="hover:text-emerald-300">
                  DAFTAR
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur shadow-md border-b-2 border-emerald-800">
        {user && user.role === "admin" && (
          <Link to="/admin-ppid-man2" className="text-yellow-500 font-bold ml-4">
            [ PANEL ADMIN ]
          </Link>
        )}

        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6 md:py-4">
          <div className="flex items-center gap-3 group">
            <img
              src={konten.logo_url || "https://man2plg.sch.id/Foto/logo.png"}
              alt="Logo"
              className="h-10 md:h-14"
              onError={(e) => {
                e.target.src = "https://upload.wikimedia.org/wikipedia/commons/a/a2/Logo_Kemenag_new.png";
              }}
            />
            <div className="border-l-2 border-gray-200 pl-3">
              <h1 className="text-lg md:text-2xl font-black leading-none text-slate-900 tracking-tighter uppercase">
                PPID UNIT
              </h1>
              <p className="text-[10px] md:text-sm font-bold text-emerald-800 uppercase italic">
                {konten.nama_instansi || "MAN 2 Kota Palembang"}
              </p>
            </div>
          </div>

          <ul className="hidden xl:flex items-center gap-1">
            {navigation.map((nav) => (
              <li key={nav.name} className="group relative">
                {nav.href ? (
                  <Link to={nav.href} className="px-4 py-2 text-[12px] font-black text-slate-700 hover:text-emerald-700 flex items-center gap-1 transition rounded-lg hover:bg-emerald-50">
                    {nav.name}
                  </Link>
                ) : (
                  <button className="px-4 py-2 text-[12px] font-black text-slate-700 group-hover:text-emerald-700 flex items-center gap-1 transition rounded-lg group-hover:bg-emerald-50">
                    {nav.name} <span className="text-[10px] opacity-60 group-hover:rotate-180 transition-transform">▼</span>
                  </button>
                )}

                {nav.submenu && (
                  <ul className="absolute left-0 top-[110%] hidden w-64 border border-gray-100 rounded-xl bg-white py-2 shadow-2xl group-hover:block">
                    {nav.submenu.map((sub, idx) => (
                      <li key={sub.id || sub.slug || sub.menu_label || idx}>
                        <button
  onClick={() => handleMenuPageClick(sub)}
  className="block px-6 py-3 text-[11px] font-bold text-slate-600 hover:bg-emerald-50 hover:text-emerald-800 border-b border-gray-50 last:border-0 w-full text-left"
>
  {sub.menu_label}
</button>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>

          <button
            type="button"
            className="xl:hidden flex h-10 w-10 items-center justify-center rounded-lg border border-emerald-200 text-emerald-800 hover:bg-emerald-50"
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? "Tutup menu" : "Buka menu"}
            onClick={() => setMobileMenuOpen((open) => !open)}
          >
            <span className="text-xl leading-none">{mobileMenuOpen ? "✕" : "☰"}</span>
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="xl:hidden border-t border-emerald-100 bg-white px-4 py-3 shadow-inner">
            <ul className="flex flex-col gap-1">
              {navigation.map((nav) => (
                <li key={nav.name}>
                  {nav.href ? (
                    <Link
                      to={nav.href}
                      className="block rounded-lg px-4 py-3 text-sm font-black text-slate-700 hover:bg-emerald-50 hover:text-emerald-700"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {nav.name}
                    </Link>
                  ) : (
                    <>
                      <p className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-emerald-700">
                        {nav.name}
                      </p>
                      {nav.submenu?.map((sub, idx) => (
                        <button
  key={sub.id || sub.slug || sub.menu_label || idx}
  onClick={() => handleMenuPageClick(sub)}
  className="block px-6 py-3 text-[11px] font-bold text-slate-600 hover:bg-emerald-50 hover:text-emerald-800 border-b border-gray-50 last:border-0 w-full text-left"
>
  {sub.menu_label}
</button>
                      ))}
                    </>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </nav>

      <header className="relative min-h-[500px] md:h-[650px] bg-emerald-950 overflow-hidden flex items-center pb-20 md:pb-40">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{
            backgroundImage: `url('${konten.banner_gambar || "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80"}')`,
          }}
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
            {konten.banner_subjudul ||
              "Pejabat Pengelola Informasi dan Dokumentasi memberikan pelayanan informasi yang transparan dan akuntabel."}
          </p>

          <div className="mt-10 flex flex-wrap gap-4 font-black tracking-widest text-[11px]">
            <button
              onClick={handleAjukanClick}
              className="bg-emerald-600 px-8 py-4 rounded-xl shadow-xl hover:bg-emerald-500 transition-all uppercase text-white cursor-pointer"
            >
              Ajukan Permohonan
            </button>
            <button
              onClick={handleProsedurButton}
              className="border border-white/20 bg-white/5 px-8 py-4 rounded-xl backdrop-blur-sm hover:bg-white/10 transition-all uppercase text-white"
            >
              Prosedur Layanan
            </button>
          </div>
        </div>
      </header>

      <section className="relative z-10 -mt-16 md:-mt-24 mx-auto max-w-7xl px-4 md:px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-0 shadow-2xl rounded-2xl overflow-hidden ring-1 ring-emerald-900/10">
          {[
            { 
              title: "Permohonan Informasi", 
              icon: "📨", 
              color: "bg-white", 
              text: "text-slate-800",
              onClick: handleAjukanClick,
              helper: "Buat permohonan baru"
            },
            { 
              title: "Pengajuan Keberatan", 
              icon: "⚖️", 
              color: "bg-emerald-800", 
              text: "text-white",
              onClick: () => {
                if (user) {
                  navigate("/permohonan-baru?type=keberatan");
                } else {
                  alert("Silakan Login terlebih dahulu untuk mengajukan keberatan.");
                  navigate("/login");
                }
              },
              helper: "Ajukan surat keberatan"
            },
            { 
              title: "Cek Status Layanan", 
              icon: "🔍", 
              color: "bg-white", 
              text: "text-slate-800",
              onClick: () => {
                setCekStatusOpen(true);
                setCekStatusQuery("");
                setCekStatusResults(null);
                setCekStatusError("");
              },
              helper: "Lacak status permohonan"
            },
            { 
              title: "Daftar Informasi", 
              icon: "📂", 
              color: "bg-emerald-900", 
              text: "text-white",
              onClick: () => {
                document.getElementById("daftar-informasi")?.scrollIntoView({ behavior: "smooth" });
              },
              helper: "Lihat data publik"
            },
          ].map((item, i) => (
            <div
              key={i}
              onClick={item.onClick}
              className={`${item.color} p-6 md:p-12 flex flex-col items-center text-center group cursor-pointer hover:scale-[1.01] hover:shadow-inner transition-all border-b md:border-b-0`}
            >
              <span className="text-4xl md:text-6xl mb-4 group-hover:scale-110 transition-transform">{item.icon}</span>
              <h3 className={`text-[10px] md:text-xs font-black uppercase tracking-widest leading-tight ${item.text}`}>{item.title}</h3>
              <p className={`mt-2 text-[9px] md:text-[11px] opacity-60 hidden sm:block ${item.text}`}>
                {item.helper}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section id="daftar-informasi" className="mx-auto max-w-7xl px-4 md:px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-4xl font-black text-slate-900 uppercase tracking-tighter">
            Daftar Informasi Publik
          </h2>
          <div className="mx-auto mt-3 h-1 w-20 bg-emerald-700 rounded-full"></div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-1/4 flex flex-row lg:flex-col gap-2 overflow-x-auto pb-4 lg:pb-0 scrollbar-hide">
            {infoMenuPages.map((page, index) => {
              const categoryKey = getInfoCategoryKey(page);
              const isActive = activeTab === categoryKey || activeInfoPage?.id === page.id;

              return (
                <button
                  key={page.id || page.slug || page.menu_label || index}
                  onClick={() => {
                    setActiveTab(categoryKey);
                   
                  }}
                  className={`whitespace-nowrap px-4 py-3 md:px-6 md:py-4 rounded-xl text-left text-[10px] md:text-[12px] font-black uppercase tracking-widest transition-all border ${
                    isActive
                      ? "bg-emerald-800 text-white shadow-lg"
                      : "bg-gray-50 border-gray-100 text-slate-500 hover:bg-emerald-50"
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
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-700">
                  Daftar Informasi Publik
                </p>
                <h3 className="mt-1 font-black text-emerald-900 uppercase text-sm md:text-base">
                  {activeInfoPage?.judul || activeInfoPage?.menu_label || activeTab}
                </h3>
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
                {activeInfoPage && (
      <div className="max-w-4xl mx-auto bg-white rounded-2xl p-8 shadow-lg border border-emerald-100">

      <div className="mb-6 border-b pb-4">
        <h3 className="text-xl font-black text-emerald-800 uppercase">
          {activeInfoPage.judul || activeInfoPage.menu_label}
        </h3>

        <p className="text-xs text-gray-400 mt-1">
          PPID MAN 2 Palembang • Informasi Publik
        </p>
    
<div
  className="text-sm leading-8 text-slate-700 text-justify prose max-w-none"
  dangerouslySetInnerHTML={{ __html: activeInfoPage.isi }}
/>
  </div>
  </div>
)}

                {activeInfoPage.berkas_list?.length > 0 && (
                  <div className="mt-5 rounded-2xl border border-emerald-100 bg-white p-4">
                    <p className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700">
                      Berkas Terkait
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {activeInfoPage.berkas_list.map((file) => (
                        <a
                          key={file.id}
                          href={getUploadUrl(file.nama_file)}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs font-bold text-slate-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                        >
                          <span className="break-all">📄 {file.nama_asli || file.nama_file}</span>
                          <span className="shrink-0 rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-black text-emerald-700">
                            {getFileFormat(file.nama_file)}
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-[12px] md:text-[13px] text-left">
                <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Nama Dokumen</th>
                    <th className="px-6 py-4 text-center">Format</th>
                    <th className="px-6 py-4 text-right">Aksi</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {filteredDokumen.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="px-6 py-10 text-center text-slate-400 font-semibold">
                        Belum ada dokumen pada kategori ini.
                      </td>
                    </tr>
                  ) : (
                    filteredDokumen.map((item) => {
                      const files = item.berkas_list || [];

                      return (
                        <tr key={item.id} className="hover:bg-emerald-50/50 transition">
                          <td className="px-6 py-5 font-semibold text-slate-700 leading-tight">
                            {item.judul}
                            {item.status_publish === "Private" && (
                              <span className="ml-2 inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-0.5 text-[9px] font-black text-amber-700 uppercase tracking-wider ring-1 ring-amber-200">
                                🔒 Khusus Terdaftar (Private)
                              </span>
                            )}
                            {item.deskripsi && (
                              <p className="text-[11px] text-slate-400 mt-1 font-medium">
                                {item.deskripsi}
                              </p>
                            )}
                            {item.tahun && (
                              <p className="text-[10px] text-emerald-700 mt-2 font-black uppercase">
                                Tahun {item.tahun}
                              </p>
                            )}
                          </td>

                          <td className="px-6 py-5 text-center">
                            {files.length > 0 ? (
                              <div className="flex flex-wrap justify-center gap-1">
                                {files.map((file) => (
                                  <span
                                    key={file.id}
                                    className="bg-red-100 text-red-700 px-3 py-1 rounded-full font-black text-[9px] uppercase"
                                  >
                                    {getFileFormat(file.nama_file)}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-400 text-[10px]">-</span>
                            )}
                          </td>

                          <td className="px-6 py-5 text-right">
                            {files.length > 0 ? (
                              files.map((file) => (
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
                            ) : (
                              <span className="text-slate-400 text-[10px]">Tidak ada berkas</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* MODAL: PRIVATE ACCESS WARNING */}
      {privateAccessModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md rounded-3xl border border-rose-100 bg-white p-8 shadow-2xl transition-all">
            <div className="flex flex-col items-center text-center">
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-amber-50 text-3xl">🔒</div>
              <h3 className="mt-4 text-lg font-black uppercase tracking-tight text-slate-900 border-b pb-2 w-full">Akses Terbatas (Private)</h3>
              <p className="mt-3 text-[11px] font-black uppercase text-emerald-800 tracking-wider">
                Dokumen: {privateAccessModal.judul}
              </p>
              <p className="mt-4 text-xs font-medium text-slate-500 leading-relaxed">
                Berkas ini dikategorikan bersifat terbatas (khusus pengguna terdaftar). Silakan masuk ke dalam akun PPID Anda atau daftarkan akun baru sekarang untuk dapat melihat dan mengunduh berkas ini.
              </p>

              <div className="mt-8 flex flex-col gap-2 w-full">
                <button
                  onClick={() => {
                    setPrivateAccessModal(null);
                    navigate("/login");
                  }}
                  className="w-full bg-emerald-800 text-white py-3.5 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-md hover:bg-emerald-700 transition"
                >
                  Masuk Sekarang
                </button>
                <button
                  onClick={() => {
                    setPrivateAccessModal(null);
                    navigate("/register");
                  }}
                  className="w-full bg-slate-100 text-slate-800 py-3.5 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-200 transition"
                >
                  Daftar Akun Baru
                </button>
                <button
                  onClick={() => setPrivateAccessModal(null)}
                  className="w-full py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition"
                >
                  Tutup / Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: TRACK STATUS LAYANAN */}
      {cekStatusOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-[2.5rem] border border-slate-100 bg-white p-6 md:p-10 shadow-2xl">
            <button
              onClick={() => setCekStatusOpen(false)}
              className="absolute right-6 top-6 grid h-10 w-10 place-items-center rounded-full bg-slate-50 text-slate-500 hover:bg-slate-100 transition font-bold"
            >
              ✕
            </button>

            <div className="text-center sm:text-left">
              <span className="text-2xl">🔍</span>
              <h3 className="mt-2 text-xl md:text-2xl font-black uppercase tracking-tight text-emerald-950">Lacak Status Permohonan</h3>
              <p className="mt-1 text-xs text-slate-400">Temukan informasi progres dan tanggapan admin atas permohonan Anda.</p>
            </div>

            <form onSubmit={handleCekStatus} className="mt-6">
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  required
                  value={cekStatusQuery}
                  onChange={(e) => setCekStatusQuery(e.target.value)}
                  placeholder="Masukkan Email atau NIK untuk melacak..."
                  className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-5 py-4 text-xs font-semibold outline-none focus:border-emerald-600 focus:bg-white transition shadow-sm"
                />
                <button
                  type="submit"
                  disabled={cekStatusLoading}
                  className="rounded-xl bg-emerald-800 px-6 py-4 text-[10px] font-black uppercase tracking-wider text-white shadow-md hover:bg-emerald-700 transition disabled:opacity-50"
                >
                  {cekStatusLoading ? "Mencari..." : "Cari Progres"}
                </button>
              </div>
              {cekStatusError && (
                <p className="mt-3 text-xs font-semibold text-rose-600">{cekStatusError}</p>
              )}
            </form>

            <div className="mt-6 max-h-[350px] overflow-y-auto pr-2 space-y-4">
              {cekStatusResults === null ? (
                <div className="p-8 text-center text-slate-400 italic bg-slate-50/50 rounded-2xl text-xs font-medium">
                  Silakan masukkan parameter pencarian di atas untuk mulai melacak.
                </div>
              ) : cekStatusResults.length === 0 ? (
                <div className="p-8 text-center text-amber-700 font-bold bg-amber-50 rounded-2xl text-xs">
                  ⚠️ Maaf, permohonan dengan identitas tersebut tidak ditemukan. Silakan periksa kembali email atau NIK Anda.
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Hasil Pencarian ({cekStatusResults.length}):</p>
                  {cekStatusResults.map((p) => (
                    <div key={p.id} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5 shadow-sm space-y-3 text-left">
                      <div className="flex flex-wrap items-start justify-between gap-4 border-b pb-3">
                        <div>
                          <p className="text-[9px] font-black uppercase text-slate-400">Subjek Informasi</p>
                          <h4 className="text-sm font-black text-emerald-900">{p.subjek}</h4>
                        </div>
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-[9px] font-extrabold uppercase tracking-wide ${
                          p.status === "Pending" ? "bg-amber-100 text-amber-700" :
                          p.status === "Diproses" ? "bg-blue-100 text-blue-700" :
                          "bg-emerald-100 text-emerald-700"
                        }`}>
                          <span className="mr-1.5 h-1 w-1 rounded-full bg-current" />
                          {p.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-xs leading-5 text-slate-600">
                        <div>
                          <p className="text-[9px] font-black uppercase text-slate-400">Pengaju</p>
                          <p className="font-bold text-slate-800">{p.nama_lengkap}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black uppercase text-slate-400">Tanggal Pengajuan</p>
                          <p className="font-semibold">{new Date(p.tanggal_pengajuan).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                        </div>
                      </div>

                      {p.status === "Diproses" && p.estimasi && (
                        <div className="bg-blue-50/60 p-3 rounded-xl border border-blue-100 text-xs text-left">
                          <p className="text-blue-700 font-black">⚠️ Estimasi Selesai: {p.estimasi}</p>
                          {p.catatan_admin && (
                            <p className="mt-1 text-[11px] text-slate-500 italic">Catatan: {p.catatan_admin}</p>
                          )}
                        </div>
                      )}

                      {p.status === "Selesai" && (
                        <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 text-xs space-y-2 text-left">
                          <p className="text-emerald-800 font-black">✅ Tanggapan Admin Tersedia</p>
                          {p.pesan_admin && (
                            <p className="text-slate-700 italic bg-white p-3 rounded-lg border">"{p.pesan_admin}"</p>
                          )}
                          {p.berkas_balasan ? (
                            <a
                              href={getUploadUrl(p.berkas_balasan)}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-2 rounded-lg bg-emerald-800 px-4 py-2 text-[10px] font-black uppercase text-white hover:bg-emerald-700 transition shadow-sm"
                            >
                              📥 Download Berkas Jawaban
                            </a>
                          ) : (
                            <p className="text-[10px] text-slate-400 font-black">Tidak ada dokumen fisik tambahan yang dilampirkan.</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="mt-6 text-center">
              <button
                onClick={() => setCekStatusOpen(false)}
                className="text-xs font-black uppercase tracking-wider text-slate-400 hover:text-slate-600 transition"
              >
                Kembali Ke Beranda
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="bg-[#091a17] text-gray-400 py-16 border-t-4 border-emerald-800">
        <div className="mx-auto max-w-7xl px-6 grid grid-cols-1 md:grid-cols-3 gap-12 text-center md:text-left">
          <div>
            <img
              src={konten.logo_url || "https://man2plg.sch.id/Foto/logo.png"}
              alt="Logo MAN 2"
              className="h-16 mx-auto md:ml-0 object-contain mb-4 drop-shadow-md"
              onError={(e) => {
                e.target.src = "https://upload.wikimedia.org/wikipedia/commons/a/a2/Logo_Kemenag_new.png";
              }}
            />
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/90">
              {konten.nama_instansi || "PPID MAN 2 KOTA PALEMBANG"}
            </p>
            <p className="mt-4 text-[11px] italic leading-relaxed text-gray-400">
              {konten.footer_deskripsi || "Mewujudkan keterbukaan informasi madrasah yang modern dan transparan."}
            </p>
          </div>

          <div>
            <h4 className="text-white font-black uppercase text-xs tracking-widest mb-6">Kontak Kami</h4>
            <p className="text-[11px] leading-6 uppercase tracking-wider font-bold">
              📍 {konten.alamat || "Jl. Prof. KH. Zainal Abidin, Kec. Kemuning, Palembang"}
              <br />
              📧 {konten.kontak_email || "ppid@man2plg.sch.id"}
              <br />
              📞 {konten.kontak_telepon || "(0711) 123456"}
            </p>
          </div>

          <div>
            <h4 className="text-white font-black uppercase text-xs tracking-widest mb-6">Navigasi</h4>
            <div className="grid grid-cols-2 gap-2 text-[10px] font-bold uppercase tracking-widest">
              <Link to="/login" className="hover:text-white transition">Login User</Link>
              
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default Home;