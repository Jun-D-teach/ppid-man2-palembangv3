import React, { useState, useEffect, useMemo } from "react";
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from "react-router-dom";
import { api, clearAuth } from "./api"; // sesuaikan path api jika dibutuhkan

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import DashboardUser from "./pages/DashboardUser";
import DashboardAdmin from "./pages/DashboardAdmin";
import AccessibilityWidget from "./components/AccessibilityWidget";
import Page from "./pages/page";

// ==========================================
// 1. KOMPONEN NAVBAR / MENU ATAS UTUH DENGAN NAVIGASI DINAMIS API
// ==========================================
function NavbarAtas() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [konten, setKonten] = useState({});
  const [menuPages, setMenuPages] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileDropdownOpen, setMobileDropdownOpen] = useState(null);

  const defaultMenuPages = [
    { parent_menu: "PROFIL", menu_label: "Profil PPID", slug: "profil-ppid", position: 1 },
    { parent_menu: "PROFIL", menu_label: "Visi & Misi", slug: "visi-misi", position: 2 },
    { parent_menu: "PROFIL", menu_label: "Tugas & Fungsi", slug: "tugas-fungsi", position: 3 },
    { parent_menu: "PROFIL", menu_label: "Struktur Organisasi", slug: "struktur-organisasi", position: 4 },
    { parent_menu: "PROFIL", menu_label: "Maklumat Pelayanan", slug: "maklumat-pelayanan", position: 5 },
    { parent_menu: "REGULASI", menu_label: "UU KIP", slug: "uu-kip", position: 1 },
    { parent_menu: "REGULASI", menu_label: "Peraturan Menteri", slug: "peraturan-menteri", position: 2 },
    { parent_menu: "REGULASI", menu_label: "SOP PPID", slug: "sop-ppid", position: 3 },
    { parent_menu: "REGULASI", menu_label: "SK PPID", slug: "sk-ppid", position: 4 },
    { parent_menu: "INFORMASI PUBLIK", menu_label: "Informasi Berkala", slug: "informasi-berkala", position: 1 },
    { parent_menu: "INFORMASI PUBLIK", menu_label: "Informasi Serta Merta", slug: "informasi-serta-merta", position: 2 },
    { parent_menu: "INFORMASI PUBLIK", menu_label: "Informasi Setiap Saat", slug: "informasi-setiap-saat", position: 3 },
    { parent_menu: "INFORMASI PUBLIK", menu_label: "Informasi Dikecualikan", slug: "informasi-dikecualikan", position: 4 },
    { parent_menu: "LAYANAN INFORMASI", menu_label: "Prosedur Permohonan", slug: "prosedur-permohonan", position: 1 },
    { parent_menu: "LAYANAN INFORMASI", menu_label: "Prosedur Keberatan", slug: "prosedur-keberatan", position: 2 },
    { parent_menu: "LAYANAN INFORMASI", menu_label: "Biaya Layanan", slug: "biaya-layanan", position: 3 },
    { parent_menu: "LAYANAN INFORMASI", menu_label: "Hak & Tata Cara", slug: "hak-tata-cara", position: 4 },
    { parent_menu: "LAPORAN", menu_label: "Laporan Tahunan", slug: "laporan-tahunan", position: 1 },
    { parent_menu: "LAPORAN", menu_label: "Laporan Statistik", slug: "laporan-statistik", position: 2 },
    { parent_menu: "LAPORAN", menu_label: "Laporan Akses", slug: "laporan-akses", position: 3 },
  ];

  const parentOrder = ["PROFIL", "REGULASI", "INFORMASI PUBLIK", "LAYANAN INFORMASI", "LAPORAN"];

  useEffect(() => {
    // 1. Ambil data User dari LocalStorage
    const loggedInUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (loggedInUser && loggedInUser !== "undefined" && token) {
      try { setUser(JSON.parse(loggedInUser)); } catch (e) { console.error(e); }
    } else {
      setUser(null);
    }

    // 2. Ambil data branding beranda
    api.get("/api/beranda")
      .then((res) => setKonten(res.data || {}))
      .catch((err) => console.error(err));

    // 3. Ambil data Menu Website
    api.get("/api/menu-pages")
      .then((res) => {
        if (res.data && Array.isArray(res.data)) {
          setMenuPages(res.data);
        } else {
          setMenuPages(defaultMenuPages);
        }
      })
      .catch((err) => {
        console.error("Gagal mengambil menu:", err);
        setMenuPages(defaultMenuPages);
      });
  }, [location.pathname]);

  const navigation = useMemo(() => {
    const source = menuPages.length ? menuPages : defaultMenuPages;
    const grouped = parentOrder.map((parent) => ({
      name: parent,
      submenu: source
        .filter((page) => String(page.parent_menu).toUpperCase() === parent)
        .sort((a, b) => Number(a.position || 1) - Number(b.position || 1)),
    }));
    return [{ name: "BERANDA", href: "/" }, ...grouped.filter((item) => item.submenu.length > 0)];
  }, [menuPages]);

  const handleLogout = () => {
    clearAuth();
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
    alert("Berhasil Logout");
    window.location.href = "/";
  };

  const handleMenuPageClick = (page) => {
    if (!page?.slug) {
      setMobileMenuOpen(false);
      return;
    }
    navigate(`/page/${page.slug}`);
    setMobileMenuOpen(false);
  };

  const toggleMobileDropdown = (menuName) => {
    setMobileDropdownOpen(mobileDropdownOpen === menuName ? null : menuName);
  };

  return (
    <div className="w-full">
      {/* Top Utility Bar */}
     
<div className="bg-[#004d40] py-2 text-white shadow-inner hidden md:block">
  <div className="mx-auto flex max-w-7xl justify-between px-6 text-[10px] font-bold tracking-widest uppercase opacity-90">
    <div className="flex gap-6 items-center">
      <span>📞 {konten.kontak_telepon || "(0711) 123456"}</span>
      <span>📧 {konten.kontak_email || "ppid@man2plg.sch.id"}</span>
      
      {/* --- ICON SOSIAL MEDIA OTOMATIS --- */}
      <div className="flex gap-4 items-center border-l border-white/20 pl-6 ml-2 text-sm">
        {konten.sosmed_ig && (
          <a href={konten.sosmed_ig} target="_blank" rel="noreferrer" className="hover:text-emerald-300 transition-colors" title="Instagram">
            <i className="fa-brands fa-instagram"></i>
          </a>
        )}
        {konten.sosmed_fb && (
          <a href={konten.sosmed_fb} target="_blank" rel="noreferrer" className="hover:text-emerald-300 transition-colors" title="Facebook">
            <i className="fa-brands fa-facebook"></i>
          </a>
        )}
        {konten.sosmed_twitter && (
          <a href={konten.sosmed_twitter} target="_blank" rel="noreferrer" className="hover:text-emerald-300 transition-colors" title="X (Twitter)">
            <i className="fa-brands fa-x-twitter"></i>
          </a>
        )}
        {konten.sosmed_yt && (
          <a href={konten.sosmed_yt} target="_blank" rel="noreferrer" className="hover:text-emerald-300 transition-colors" title="YouTube">
            <i className="fa-brands fa-youtube"></i>
          </a>
        )}
      </div>
    </div>

    <div className="flex gap-4 items-center">
      {user ? (
        <div className="flex gap-4 items-center">
          <span className="text-emerald-300 italic">Halo, {user.nama_lengkap || user.nama}</span>
          <button onClick={handleLogout} className="bg-red-600 px-3 py-1 rounded-full hover:bg-red-700 transition shadow-sm text-white font-bold cursor-pointer">
            LOGOUT
          </button>
        </div>
      ) : (
        <>
          <Link to="/login" className="bg-red-600 px-3 py-1 rounded-full hover:bg-red-700 transition shadow-sm text-white font-bold">
            LOGIN USER
          </Link>
          <Link to="/register" className="hover:text-emerald-300">DAFTAR</Link>
        </>
      )}
    </div>
  </div>
</div>

      {/* Main Navbar */}
      <nav className="sticky top-0 z-50 text-center bg-white/95 backdrop-blur shadow-md border-b-2 border-emerald-800">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6 md:py-4">
          <Link to="/" className="flex items-center gap-3 group text-left">
            <img
              src={konten.logo_url || "https://man2plg.sch.id/Foto/logo.png"}
              alt="Logo"
              className="h-10 md:h-14"
              onError={(e) => {
                e.target.src = "https://upload.wikimedia.org/wikipedia/commons/a/a2/Logo_Kemenag_new.png";
              }}
            />
            <div className="border-l-2 border-gray-200 pl-3">
              <h1 className="text-lg md:text-2xl font-black leading-none text-slate-900 tracking-tighter uppercase flex items-center gap-2">
                PPID UNIT
                {user && user.role?.toLowerCase() === "admin" && (
                  <span className="text-xs text-yellow-600 font-extrabold normal-case bg-yellow-100 px-1.5 py-0.5 rounded border border-yellow-300 ml-1">[ADMIN]</span>
                )}
              </h1>
              <p className="text-[10px] md:text-sm font-bold text-emerald-800 uppercase italic">
                {konten.nama_instansi || "MAN 2 Kota Palembang"}
              </p>
            </div>
          </Link>

          {/* Desktop Menu */}
          <ul className="hidden xl:flex items-center gap-1">
            {navigation.map((nav) => (
              <li key={nav.name} className="group relative">
                {nav.href ? (
                  <Link to={nav.href} className="px-4 py-2 text-[12px] font-black text-slate-700 hover:text-emerald-700 flex items-center gap-1 transition rounded-lg hover:bg-emerald-50">
                    {nav.name}
                  </Link>
                ) : (
                  <button className="px-4 py-2 text-[12px] font-black text-slate-700 group-hover:text-emerald-700 flex items-center gap-1 transition rounded-lg group-hover:bg-emerald-50 cursor-pointer">
                    {nav.name} <span className="text-[10px] opacity-60 group-hover:rotate-180 transition-transform">▼</span>
                  </button>
                )}

                {nav.submenu && (
                  <ul className="absolute left-0 top-[100%] hidden w-64 border border-gray-100 rounded-xl bg-white py-2 shadow-2xl group-hover:block text-left">
                    {nav.submenu.map((sub, idx) => (
                      <li key={sub.id || sub.slug || sub.menu_label || idx}>
                        <button
                          onClick={() => handleMenuPageClick(sub)}
                          className="block px-6 py-3 text-[11px] font-bold text-slate-600 hover:bg-emerald-50 hover:text-emerald-800 border-b border-gray-50 last:border-0 w-full text-left cursor-pointer"
                        >
                          {sub.menu_label}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
            {user && user.role?.toLowerCase() === "admin" && (
              <li>
                <Link to="/admin-ppid-man2" className="ml-2 bg-amber-500 text-slate-950 px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider hover:bg-amber-400 transition shadow-xs">
                  Panel Admin
                </Link>
              </li>
            )}
          </ul>

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            className="xl:hidden flex h-10 w-10 items-center justify-center rounded-lg border border-emerald-200 text-emerald-800 hover:bg-emerald-50 cursor-pointer"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span className="text-xl leading-none">{mobileMenuOpen ? "✕" : "☰"}</span>
          </button>
        </div>

        {/* Mobile Responsive Dropdown */}
        {mobileMenuOpen && (
          <div className="xl:hidden border-t border-emerald-100 bg-white px-4 py-3 shadow-inner max-h-[75vh] overflow-y-auto">
            <ul className="flex flex-col gap-1">
              {navigation.map((nav) => (
                <li key={nav.name} className="border-b border-gray-100 last:border-0 pb-1">
                  {nav.href ? (
                    <Link
                      to={nav.href}
                      className="block rounded-lg px-4 py-3 text-sm font-black text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 text-left"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {nav.name}
                    </Link>
                  ) : (
                    <>
                      <button
                        onClick={() => toggleMobileDropdown(nav.name)}
                        className="w-full flex items-center justify-between px-4 py-3 text-sm font-black uppercase tracking-wider text-emerald-800 hover:bg-emerald-50/50 rounded-lg text-left cursor-pointer"
                      >
                        <span>{nav.name}</span>
                        <span className={`text-[10px] transition-transform duration-200 ${mobileDropdownOpen === nav.name ? 'rotate-180' : ''}`}>
                          ▼
                        </span>
                      </button>
                      
                      {mobileDropdownOpen === nav.name && (
                        <div className="bg-slate-50/70 rounded-lg mt-1 mb-2 pl-2 border-l-2 border-emerald-600">
                          {nav.submenu?.map((sub, idx) => (
                            <button
                              key={sub.id || sub.slug || sub.menu_label || idx}
                              onClick={() => handleMenuPageClick(sub)}
                              className="block px-6 py-3 text-[11px] font-bold text-slate-600 hover:bg-emerald-50 hover:text-emerald-800 border-b border-gray-100/50 last:border-0 w-full text-left cursor-pointer"
                            >
                              {sub.menu_label}
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </li>
              ))}
              {user && user.role?.toLowerCase() === "admin" && (
                <li className="pt-2">
                  <Link to="/admin-ppid-man2" onClick={() => setMobileMenuOpen(false)} className="block w-full text-center bg-amber-500 text-slate-950 rounded-lg py-2.5 text-xs font-black uppercase">
                    Panel Admin
                  </Link>
                </li>
              )}
              {!user && (
                <li className="grid grid-cols-2 gap-2 pt-2 md:hidden">
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="bg-red-600 text-white rounded-lg py-2.5 text-center text-xs font-bold">LOGIN</Link>
                  <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="bg-slate-100 border text-slate-700 rounded-lg py-2.5 text-center text-xs font-bold">DAFTAR</Link>
                </li>
              )}
            </ul>
          </div>
        )}
      </nav>
    </div>
  );
}

// ==========================================
// 2. KOMPONEN FOOTER HIJAU PERMANEN
// ==========================================
function FooterBawah() {
  const [konten, setKonten] = useState({});

  useEffect(() => {
    api.get("/api/landing-content")
      .then((res) => {
        if (res.data) setKonten(res.data);
      })
      .catch((err) => console.error("Gagal mengambil data footer:", err));
  }, []);

  return (
    <footer className="w-full bg-slate-950 border-t-4 border-emerald-700 text-slate-300 py-12 font-sans mt-auto">
      <div className="mx-auto max-w-5xl px-6 grid gap-8 sm:grid-cols-3">
        <div>
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/a/a2/Logo_Kemenag_new.png"
            alt="Logo Kemenag"
            className="h-12 w-12 object-contain mb-4 drop-shadow-md"
          />
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/90">
            {konten.nama_instansi || "PPID MAN 2 KOTA PALEMBANG"}
          </p>
          <p className="mt-3 text-[11px] italic leading-relaxed text-gray-400">
            {konten.footer_deskripsi || "Mewujudkan keterbukaan informasi madrasah yang modern dan transparan."}
          </p>
        </div>

        <div>
          <h4 className="text-white font-black uppercase text-xs tracking-widest mb-4 border-b border-slate-800 pb-2">
            Kontak Kami
          </h4>
          <p className="text-[11px] leading-6 uppercase tracking-wider font-bold text-slate-400">
            📍 {konten.alamat || "Jl. Prof. KH. Zainal Abidin, Kec. Kemuning, Palembang"}
            <br />
            📧 {konten.kontak_email || "ppid@man2plg.sch.id"}
            <br />
            📞 {konten.kontak_telepon || "(0711) 123456"}
          </p>
        </div>

        <div>
          <h4 className="text-white font-black uppercase text-xs tracking-widest mb-4 border-b border-slate-800 pb-2">
            Informasi Hukum
          </h4>
          <p className="text-[11px] leading-relaxed font-semibold text-slate-400">
            Segala bentuk data dan dokumen yang dipublikasikan pada sistem ini dilindungi undang-undang Keterbukaan Informasi Publik (KIP).
          </p>
          <p className="mt-4 text-[10px] font-bold uppercase tracking-wider text-emerald-500">
            © {new Date().getFullYear()} MAN 2 Palembang. All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

// ==========================================
// 3. STRUKTUR UTAMA APLIKASI (APP)
// ==========================================
function App() {
  return (
    <Router>
      <div className="flex min-h-screen flex-col bg-slate-50/30">
        
        {/* NavbarAtas permanen di luar Routes */}
        <NavbarAtas />

        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/permohonan-baru" element={<DashboardUser />} />
            <Route path="/admin-ppid-man2" element={<DashboardAdmin />} />
            <Route path="/page/:slug" element={<Page />} />
          </Routes>
        </main>

        <FooterBawah />
        <AccessibilityWidget />

      </div>
    </Router>
  );
}

export default App;
