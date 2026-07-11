import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import { api, getUploadUrl } from "../api";
import { fileUrl } from "../utils/file";

// Komponen pembantu deskripsi panjang pada tabel dokumen agar tidak merusak layout paragraf HTML
const ExpandableDescription = ({ text, renderCleanContent }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!text) return null;

  if (text.length <= 120) {
    return (
      <div className="text-[11px] md:text-xs text-slate-400 mt-1 font-medium leading-relaxed">
        {renderCleanContent(text)}
      </div>
    );
  }

  const truncatedText = text.substring(0, 120) + "...";

  return (
    <div className="text-[11px] md:text-xs text-slate-400 mt-1 font-medium leading-relaxed">
      {renderCleanContent(isExpanded ? text : truncatedText)}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          setIsExpanded(!isExpanded);
        }}
        className="ml-1 text-emerald-700 hover:text-emerald-950 font-bold underline text-[10px] md:text-[11px] cursor-pointer inline-block"
      >
        {isExpanded ? "Tampilkan Sedikit" : "Selengkapnya"}
      </button>
    </div>
  );
};

export default function Page() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);

  // State data dokumen Informasi Publik
  const [informasiPublik, setInformasiPublik] = useState([]);
  const [searchDokumen, setSearchDokumen] = useState("");
  const [user, setUser] = useState(null);
  const [privateAccessModal, setPrivateAccessModal] = useState(null);

  // Deteksi kategori halaman aktif
  const isKategoriInformasiPublik = useMemo(() => {
    return ["informasi-berkala", "informasi-serta-merta", "informasi-setiap-saat", "informasi-dikecualikan"].includes(slug?.toLowerCase());
  }, [slug]);

  const namaKategoriMap = {
    "informasi-berkala": "Informasi Berkala",
    "informasi-serta-merta": "Informasi Serta Merta",
    "informasi-setiap-saat": "Informasi Setiap Saat",
    "informasi-dikecualikan": "Informasi Dikecualikan"
  };

  useEffect(() => {
    const loggedInUser = localStorage.getItem("user");
    if (loggedInUser && loggedInUser !== "undefined") {
      try { setUser(JSON.parse(loggedInUser)); } catch (e) { console.error(e); }
    }
  }, []);

  useEffect(() => {
    const fetchPage = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/api/posts/${slug}`);
        setPage(res.data.submenu || null);
        setPosts(res.data.posts || []);

        if (["informasi-berkala", "informasi-serta-merta", "informasi-setiap-saat", "informasi-dikecualikan"].includes(slug?.toLowerCase())) {
          const resInf = await api.get("/api/informasi-publik");
          setInformasiPublik(Array.isArray(resInf.data) ? resInf.data : []);
        }
      } catch (err) {
        console.error(err);
        setPage(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPage();
  }, [slug]);

  const handleFileClick = (e, file, item) => {
    if (item?.status_publish === "Private" && !user) {
      e.preventDefault();
      setPrivateAccessModal(item);
    }
  };

  const filteredDokumen = useMemo(() => {
  const namaKategori = namaKategoriMap[slug?.toLowerCase()] || "";
  return informasiPublik
    .filter((item) => item.kategori === namaKategori)
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
}, [informasiPublik, slug, searchDokumen]);

  // Fungsi cerdas pengolah konten teks & tautan inline bawaan asli
  const renderCleanContent = (text) => {
    if (!text) return null;

    const iframeRegex = /<iframe[^>]+src=["']([^"']+)["'][^>]*><\/iframe>/g;
    const embeddedMapUrls = [];
    let match;
    while ((match = iframeRegex.exec(text)) !== null) {
      embeddedMapUrls.push(match[1]);
    }

    const cleanText = text.replace(/<iframe[^>]*><\/iframe>/g, "");
    const urlRegex = /((?:https?|http):\/\/[^\s\)]+)/g;
    const parts = cleanText.split(urlRegex);

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
                  className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-[11px] px-2 py-0.5 rounded border border-emerald-200/80 shadow-2xs transition-colors align-middle break-all accessibility-target-link"
                >
                  <svg className="w-3 h-3 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  {decodeURIComponent(urlTitle).substring(0, 30)}{decodeURIComponent(urlTitle).length > 30 ? "..." : ""}
                </a>
              </span>
            );
          }
          return <span key={partIdx}>{part}</span>;
        })}

        {embeddedMapUrls.length > 0 && (
          <div className="mt-6 grid gap-4">
            {embeddedMapUrls.map((mapUrl, idx) => (
              <div key={idx} className="rounded-xl overflow-hidden border border-gray-100 shadow-2xs">
                <iframe
                  src={mapUrl}
                  className="w-full h-64 md:h-80 border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            ))}
          </div>
        )}
      </>
    );
  };

  const getFileFormat = (fileName = "") => {
    if (!fileName.includes(".")) return "FILE";
    return fileName.split(".").pop().toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-white">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-800 border-t-transparent"></div>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="mx-auto max-w-xl px-6 py-24 text-center">
        <span className="text-5xl">📄</span>
        <h2 className="mt-4 text-2xl font-black text-slate-800 uppercase">Halaman Tidak Ditemukan</h2>
        <p className="mt-2 text-sm text-slate-500">Maaf, menu atau konten yang Anda cari belum tersedia.</p>
        <button onClick={() => navigate("/")} className="mt-8 inline-flex items-center gap-2 rounded-xl bg-emerald-800 px-6 py-3 text-xs font-black uppercase tracking-wider text-white shadow-md hover:bg-emerald-700 transition">
          Kembali ke Beranda
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-24 font-sans text-slate-800 antialiased animate-fade-in">
      
      {/* HEADER GAGAH BARU - Sesuai Gambar Referensi Dengan Tulisan Besar & Subtitle Kustom */}
      <header className="relative bg-emerald-900 py-16 text-white md:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-emerald-800 via-emerald-950 to-emerald-950 opacity-95"></div>
        <div className="relative mx-auto max-w-5xl px-6">
          <p className="text-[11px] md:text-xs font-black uppercase tracking-[0.25em] text-emerald-400">
            PPID MAN 2 Palembang • Layanan Informasi Publik resmi.
          </p>
          <h2 className="mt-3 text-3xl font-black uppercase tracking-tight md:text-5xl leading-tight text-white">
            {page.judul || page.menu_label}
          </h2>
          <div className="mt-4 h-1 w-16 bg-emerald-400 rounded-full"></div>
        </div>
      </header>

      {/* AREA KONTEN UTAMA */}
      <main className="mx-auto max-w-5xl px-4 md:px-6 -mt-10 relative z-10">
        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-xl md:p-10">
          
          {/* Paragraf Utama Submenu */}
          <article className="prose prose-emerald max-w-none text-slate-700 leading-relaxed text-justify text-sm md:text-base whitespace-pre-line">
            {renderCleanContent(page.isi)}
          </article>

          {/* SUSUNAN DATA ARTIKEL/POSTS DARI ADMIN */}
          {posts && posts.length > 0 && (
            <div className="mt-8 space-y-6 border-t border-gray-100 pt-6">
              {posts.map((post) => (
                <div key={post.id} className="bg-slate-50/50 rounded-xl p-4 md:p-6 border border-gray-100 transition hover:shadow-xs">
                  <h4 className="font-black text-sm md:text-base text-emerald-900 uppercase tracking-tight border-b border-emerald-100/70 pb-2 mb-3">
                    📌 {post.title || post.judul}
                  </h4>
                  <div className="text-xs md:text-sm text-slate-600 leading-relaxed text-justify whitespace-pre-line font-medium">
                    {renderCleanContent(post.content || post.isi)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Area Lampiran Berkas Bawaan Menu */}
          {page.berkas_list && page.berkas_list.length > 0 && (
            <div className="mt-8 rounded-xl border border-emerald-100 bg-emerald-50/20 p-4 md:p-5">
              <p className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-800">
                📎 Lampiran Dokumen Menu:
              </p>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {page.berkas_list.map((file) => (
                  <a
                    key={file.id}
                    href={getUploadUrl(file.nama_file)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between gap-3 rounded-lg border border-gray-200/60 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-3xs transition hover:border-emerald-300 hover:text-emerald-800"
                  >
                    <span className="truncate max-w-[80%]">📂 {file.nama_asli || file.nama_file}</span>
                    <span className="shrink-0 rounded bg-emerald-100 px-2 py-0.5 text-[9px] font-extrabold text-emerald-800">
                      {getFileFormat(file.nama_file)}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* KHUSUS MENU INFORMASI PUBLIK: TABEL DAFTAR DATA INFORMASI BESERTA BERKASNYA */}
          {isKategoriInformasiPublik && (
            <div className="mt-12 rounded-xl border border-gray-200/70 overflow-hidden shadow-2xs">
              <div className="p-4 bg-gradient-to-r from-emerald-50 to-slate-50 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-700">
                    Daftar Dokumen Kategori
                  </p>
                  <h3 className="mt-0.5 font-black text-emerald-950 uppercase text-xs md:text-sm">
                    {namaKategoriMap[slug?.toLowerCase()]}
                  </h3>
                </div>
                <input
                  type="text"
                  value={searchDokumen}
                  onChange={(e) => setSearchDokumen(e.target.value)}
                  placeholder="Cari dokumen di tabel..."
                  className="w-full sm:w-60 bg-white border border-gray-300 rounded-md px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-emerald-600/40 transition placeholder-gray-400"
                />
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs md:text-[13px] text-left">
                  <thead className="bg-slate-100/80 text-slate-600 font-bold uppercase tracking-wider border-b border-gray-200 text-[10px] md:text-[11px]">
                    <tr>
                      <th className="px-5 py-3">Nama Dokumen</th>
                      <th className="px-5 py-3 text-right w-32">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {filteredDokumen.length === 0 ? (
                      <tr>
                        <td colSpan="2" className="px-5 py-8 text-center text-slate-400 font-medium italic">
                          Belum ada data dokumen pada kategori ini.
                        </td>
                      </tr>
                    ) : (
                      filteredDokumen.map((item) => {
                        const files = item.berkas_list || [];
                        return (
                          <tr key={item.id} className="hover:bg-emerald-50/40 transition-colors">
                            <td className="px-5 py-4 font-semibold text-slate-700 leading-snug">
                              <span className="text-slate-800 font-bold block md:inline">{item.judul}</span>
                              {item.status_publish === "Private" && (
                                <span className="ml-0 md:ml-2 mt-1 md:mt-0 inline-flex items-center gap-0.5 rounded bg-amber-50 px-1.5 py-0.5 text-[9px] font-black text-amber-700 uppercase tracking-wider ring-1 ring-amber-200">
                                  🔒 Private
                                </span>
                              )}
                              {item.deskripsi && (
                                <ExpandableDescription text={item.deskripsi} renderCleanContent={renderCleanContent} />
                              )}
                              {item.tahun && (
                                <span className="inline-block text-[9px] md:text-[10px] text-emerald-700 mt-1.5 bg-emerald-50 font-extrabold uppercase px-1.5 py-0.5 rounded">
                                  Tahun {item.tahun}
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-4 text-right align-middle">
                              {files.length > 0 ? (
                                files.map((file) => (
                                  <a
                                    key={file.id}
                                    href={item.status_publish === "Private" && !user ? "#" : getUploadUrl(file.nama_file)}
                                    onClick={(e) => handleFileClick(e, file, item)}
                                    target={item.status_publish === "Private" && !user ? "_self" : "_blank"}
                                    rel="noreferrer"
                                    className={`inline-block font-extrabold hover:underline uppercase text-[10px] bg-white border border-gray-200 rounded px-2.5 py-1 transition-all ${item.status_publish === "Private" && !user ? "text-amber-700 hover:bg-amber-50" : "text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300"}`}
                                  >
                                    {item.status_publish === "Private" && !user ? "🔒 Login" : "Lihat File"}
                                  </a>
                                ))
                              ) : (
                                <span className="text-slate-400 text-[10px] italic">No File</span>
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
          )}
        </div>

        {/* PETA LOKASI JIKA ADA */}
        {page.map_url && (
          <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-4 shadow-3xs">
            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-1.5 text-xs uppercase tracking-wider">
              📍 Lokasi Peta Utama
            </h3>
            <iframe
              src={page.map_url}
              className="w-full h-64 md:h-72 rounded-xl border border-gray-200"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        )}

        {/* FOOTER NAVIGASI BALIK */}
        <footer className="mt-8 text-center sm:text-left">
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-200 bg-white text-xs font-bold uppercase tracking-wider text-slate-600 shadow-3xs hover:bg-slate-50 transition"
          >
            ← Kembali Ke Beranda
          </button>
        </footer>
      </main>

      {/* MODAL WARNING AKSES PRIVATE */}
      {privateAccessModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-gray-100 animate-scale-up">
            <div className="flex flex-col items-center text-center">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-amber-50 text-2xl">🔒</div>
              <h3 className="mt-3 text-base font-black uppercase tracking-tight text-slate-900 border-b pb-2 w-full">Akses Terbatas</h3>
              <p className="mt-2 text-[10px] font-bold uppercase text-emerald-800 tracking-wider line-clamp-1">Dokumen: {privateAccessModal.judul}</p>
              <p className="mt-3 text-xs text-slate-500 leading-relaxed">
                Berkas ini dikategorikan bersifat terbatas. Silakan masuk akun terlebih dahulu untuk membuka tautan berkas ini.
              </p>
              <div className="mt-6 flex flex-col gap-2 w-full">
                <button type="button" onClick={() => { setPrivateAccessModal(null); navigate("/login"); }} className="w-full bg-emerald-800 text-white py-2.5 rounded-lg font-bold uppercase text-[10px] tracking-wider hover:bg-emerald-700 transition">Masuk Sekarang</button>
                <button type="button" onClick={() => { setPrivateAccessModal(null); navigate("/register"); }} className="w-full bg-slate-100 text-slate-800 py-2.5 rounded-lg font-bold uppercase text-[10px] tracking-wider hover:bg-slate-200 transition">Daftar Akun Baru</button>
                <button type="button" onClick={() => setPrivateAccessModal(null)} className="w-full py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-600 transition">Batal</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
