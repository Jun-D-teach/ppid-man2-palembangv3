import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import { api, getUploadUrl } from "../api";

// Komponen deskripsi panjang dengan tombol "Selengkapnya"
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

// Komponen File Attachment Card yang modern
const FileAttachmentCard = ({ file }) => {
  const getFileFormat = (fileName = "") => {
    if (!fileName.includes(".")) return "FILE";
    return fileName.split(".").pop().toUpperCase();
  };
  const format = getFileFormat(file.nama_file);
  const formatColors = {
    PDF: "bg-red-100 text-red-700 border-red-200",
    DOC: "bg-blue-100 text-blue-700 border-blue-200",
    DOCX: "bg-blue-100 text-blue-700 border-blue-200",
    XLS: "bg-green-100 text-green-700 border-green-200",
    XLSX: "bg-green-100 text-green-700 border-green-200",
    JPG: "bg-amber-100 text-amber-700 border-amber-200",
    JPEG: "bg-amber-100 text-amber-700 border-amber-200",
    PNG: "bg-purple-100 text-purple-700 border-purple-200",
  };
  const colorClass = formatColors[format] || "bg-slate-100 text-slate-700 border-slate-200";

  return (
    <a
      href={getUploadUrl(file.nama_file)}
      target="_blank"
      rel="noreferrer"
      className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 md:p-4 transition-all hover:border-emerald-300 hover:shadow-md hover:-translate-y-0.5"
    >
      {/* Icon File */}
      <div className={`shrink-0 grid h-10 w-10 md:h-12 md:w-12 place-items-center rounded-lg border text-[10px] md:text-xs font-black ${colorClass}`}>
        {format}
      </div>
      {/* Nama File */}
      <div className="flex-1 min-w-0">
        <p className="text-xs md:text-sm font-bold text-slate-800 truncate group-hover:text-emerald-700 transition-colors">
          {file.nama_asli || file.nama_file}
        </p>
        <p className="text-[10px] md:text-[11px] text-slate-400 mt-0.5">
          Klik untuk unduh / lihat
        </p>
      </div>
      {/* Download Icon */}
      <div className="shrink-0 text-slate-300 group-hover:text-emerald-600 transition-colors">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
      </div>
    </a>
  );
};

export default function Page() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [informasiPublik, setInformasiPublik] = useState([]);
  const [searchDokumen, setSearchDokumen] = useState("");
  const [user, setUser] = useState(null);
  const [privateAccessModal, setPrivateAccessModal] = useState(null);

  const isKategoriInformasiPublik = useMemo(() => {
    return ["informasi-berkala", "informasi-serta-merta", "informasi-setiap-saat", "informasi-dikecualikan"].includes(slug?.toLowerCase());
  }, [slug]);

  const namaKategoriMap = {
    "informasi-berkala": "Informasi Berkala",
    "informasi-serta-merta": "Informasi Serta Merta",
    "informasi-setiap-saat": "Informasi Setiap Saat",
    "informasi-dikecualikan": "Informasi Dikecualikan",
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
        const posA = Number(a.posisi || a.position || 999);
        const posB = Number(b.posisi || b.position || 999);
        return posA - posB;
      });
  }, [informasiPublik, slug, searchDokumen]);

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
                  className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-[11px] px-2 py-0.5 rounded border border-emerald-200/80 shadow-sm transition-colors align-middle break-all"
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
              <div key={idx} className="rounded-xl overflow-hidden border border-gray-100 shadow-sm">
                <iframe src={mapUrl} className="w-full h-64 md:h-80 border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
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
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="h-12 w-12 mx-auto animate-spin rounded-full border-4 border-emerald-600 border-t-transparent"></div>
          <p className="mt-4 text-sm font-bold text-slate-500">Memuat halaman...</p>
        </div>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-6">
        <div className="text-center max-w-md">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-slate-100 text-4xl">📄</div>
          <h2 className="mt-6 text-2xl font-black text-slate-900">Halaman Tidak Ditemukan</h2>
          <p className="mt-2 text-sm text-slate-500">Maaf, menu atau konten yang Anda cari belum tersedia.</p>
          <button
            onClick={() => navigate("/")}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-emerald-700 px-6 py-3 text-xs font-black uppercase tracking-wider text-white shadow-lg hover:bg-emerald-800 transition"
          >
            ← Kembali ke Beranda
          </button>
        </div>
      </div>
    );
  }

  // Ambil berkas dari posts[0] (fallback ke page.berkas_list)
  const berkasList = posts[0]?.berkas_list || page.berkas_list || [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white font-sans text-slate-800 antialiased">
      {/* ============================================
          HEADER — Modern & Compact
      ============================================= */}
      <header className="relative bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-950 overflow-hidden">
        {/* Decorative Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-400 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
        </div>

        <div className="relative mx-auto max-w-5xl px-4 md:px-6 py-8 md:py-14">
          <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.25em] text-emerald-300/90">
            PPID MAN 2 Palembang • Layanan Informasi Publik Resmi
          </p>
          <h1 className="mt-3 text-xl md:text-3xl lg:text-4xl font-black uppercase tracking-tight text-white leading-tight">
            {page.judul || page.menu_label}
          </h1>
          <div className="mt-4 h-1 w-12 md:w-16 bg-emerald-400 rounded-full"></div>
        </div>
      </header>

      {/* ============================================
          MAIN CONTENT
      ============================================= */}
      <main className="mx-auto max-w-5xl px-4 md:px-6 -mt-6 md:-mt-10 relative z-10 pb-16">
        <div className="rounded-2xl md:rounded-3xl border border-slate-200/60 bg-white shadow-xl shadow-slate-200/50 overflow-hidden">
          <div className="p-5 md:p-10">
            {/* Konten Utama */}
            <article className="prose prose-emerald max-w-none text-slate-700 leading-relaxed text-sm md:text-base whitespace-pre-line">
              {renderCleanContent(page.isi)}
            </article>

            {/* Posts Tambahan */}
            {posts && posts.length > 0 && (
              <div className="mt-8 space-y-4 border-t border-slate-100 pt-6">
                {posts.map((post) => (
                  <div key={post.id} className="rounded-xl bg-slate-50/70 p-4 md:p-6 border border-slate-100">
                    <h4 className="font-black text-sm md:text-base text-emerald-900 uppercase tracking-tight border-b border-emerald-100/70 pb-2 mb-3">
                       {post.title || post.judul}
                    </h4>
                    <div className="text-xs md:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                      {renderCleanContent(post.content || post.isi)}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ============================================
                LAMPIRAN DOKUMEN — Modern Card Style
            ============================================= */}
            {berkasList.length > 0 && (
              <div className="mt-8 rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/50 to-white p-5 md:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-100 text-emerald-700">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs md:text-sm font-black uppercase tracking-wider text-emerald-900">
                      Lampiran Dokumen
                    </p>
                    <p className="text-[10px] md:text-xs text-slate-500">
                      {berkasList.length} file tersedia untuk diunduh
                    </p>
                  </div>
                </div>
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {berkasList.map((file) => (
                    <FileAttachmentCard key={file.id} file={file} />
                  ))}
                </div>
              </div>
            )}

            {/* ============================================
                TABEL INFORMASI PUBLIK
            ============================================= */}
            {isKategoriInformasiPublik && (
              <div className="mt-8 rounded-2xl border border-slate-200 overflow-hidden">
                <div className="p-4 md:p-5 bg-gradient-to-r from-emerald-50 to-slate-50 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700">
                      Daftar Dokumen Kategori
                    </p>
                    <h3 className="mt-0.5 font-black text-emerald-950 uppercase text-sm md:text-base">
                      {namaKategoriMap[slug?.toLowerCase()]}
                    </h3>
                  </div>
                  <input
                    type="text"
                    value={searchDokumen}
                    onChange={(e) => setSearchDokumen(e.target.value)}
                    placeholder=" Cari dokumen..."
                    className="w-full sm:w-60 bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition"
                  />
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs md:text-sm text-left">
                    <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200 text-[10px] md:text-[11px]">
                      <tr>
                        <th className="px-4 md:px-5 py-3">Nama Dokumen</th>
                        <th className="px-4 md:px-5 py-3 text-right w-28 md:w-32">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
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
                            <tr key={item.id} className="hover:bg-emerald-50/30 transition-colors">
                              <td className="px-4 md:px-5 py-4 font-semibold text-slate-700 leading-snug">
                                <span className="text-slate-900 font-bold block">{item.judul}</span>
                                {item.status_publish === "Private" && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-black text-amber-700 uppercase tracking-wider ring-1 ring-amber-200 mt-1">
                                    🔒 Private
                                  </span>
                                )}
                                {item.deskripsi && (
                                  <ExpandableDescription text={item.deskripsi} renderCleanContent={renderCleanContent} />
                                )}
                                {item.tahun && (
                                  <span className="inline-block text-[9px] md:text-[10px] text-emerald-700 mt-2 bg-emerald-50 font-extrabold uppercase px-2 py-0.5 rounded-full">
                                    Tahun {item.tahun}
                                  </span>
                                )}
                              </td>
                              <td className="px-4 md:px-5 py-4 text-right align-middle">
                                {files.length > 0 ? (
                                  <div className="flex flex-col gap-1.5 items-end">
                                    {files.map((file) => (
                                      <a
                                        key={file.id}
                                        href={item.status_publish === "Private" && !user ? "#" : getUploadUrl(file.nama_file)}
                                        onClick={(e) => handleFileClick(e, file, item)}
                                        target={item.status_publish === "Private" && !user ? "_self" : "_blank"}
                                        rel="noreferrer"
                                        className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[10px] md:text-xs font-bold transition-all border ${
                                          item.status_publish === "Private" && !user
                                            ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                                            : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300"
                                        }`}
                                      >
                                        {item.status_publish === "Private" && !user ? "🔒 Login" : `📥 ${getFileFormat(file.nama_file)}`}
                                      </a>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-slate-400 text-[10px] italic">Tidak ada file</span>
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
        </div>

        {/* Peta Lokasi */}
        {page.map_url && (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 md:p-5 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-1.5 text-xs md:text-sm uppercase tracking-wider">
               Lokasi Peta Utama
            </h3>
            <iframe
              src={page.map_url}
              className="w-full h-64 md:h-80 rounded-xl border border-slate-200"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        )}

        {/* ============================================
            TOMBOL KEMBALI — Modern & Prominent
        ============================================= */}
        <footer className="mt-8 flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-3">
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full border-2 border-emerald-700 bg-white text-xs md:text-sm font-black uppercase tracking-wider text-emerald-700 shadow-sm hover:bg-emerald-700 hover:text-white transition-all group"
          >
            <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Kembali ke Beranda
          </button>
        </footer>
      </main>

      {/* ============================================
          MODAL AKSES PRIVATE
      ============================================= */}
      {privateAccessModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-slate-100">
            <div className="flex flex-col items-center text-center">
              <div className="grid h-14 w-14 place-items-center rounded-full bg-amber-50 text-3xl">🔒</div>
              <h3 className="mt-4 text-lg font-black uppercase tracking-tight text-slate-900">Akses Terbatas</h3>
              <p className="mt-2 text-[11px] font-bold uppercase text-emerald-800 tracking-wider line-clamp-1">
                Dokumen: {privateAccessModal.judul}
              </p>
              <p className="mt-3 text-xs text-slate-500 leading-relaxed">
                Berkas ini dikategorikan bersifat terbatas. Silakan masuk akun terlebih dahulu untuk membuka tautan berkas ini.
              </p>
              <div className="mt-6 flex flex-col gap-2 w-full">
                <button
                  type="button"
                  onClick={() => { setPrivateAccessModal(null); navigate("/login"); }}
                  className="w-full bg-emerald-700 text-white py-3 rounded-xl font-black uppercase text-[10px] tracking-wider hover:bg-emerald-800 transition"
                >
                  Masuk Sekarang
                </button>
                <button
                  type="button"
                  onClick={() => { setPrivateAccessModal(null); navigate("/register"); }}
                  className="w-full bg-slate-100 text-slate-800 py-3 rounded-xl font-black uppercase text-[10px] tracking-wider hover:bg-slate-200 transition"
                >
                  Daftar Akun Baru
                </button>
                <button
                  type="button"
                  onClick={() => setPrivateAccessModal(null)}
                  className="w-full py-2 text-[10px] font-black uppercase tracking-wider text-slate-400 hover:text-slate-600 transition"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
