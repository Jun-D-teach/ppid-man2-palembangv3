import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { api } from "../api";
import { fileUrl } from "../utils/file";

export default function Page() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPage = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/api/posts/${slug}`);
        setPage(res.data.submenu || null);
        setPosts(res.data.posts || []);
      } catch (err) {
        console.error(err);
        setPage(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPage();
  }, [slug]);

  // Fungsi cerdas agar teks dan link mengalir menyambung (inline) dalam satu paragraf utuh
  const renderCleanContent = (text) => {
    if (!text) return null;

    // 1. Deteksi & kumpulkan URL Iframe Google Maps jika ada
    const iframeRegex = /<iframe[^>]+src=["']([^"']+)["'][^>]*><\/iframe>/g;
    const embeddedMapUrls = [];
    let match;
    while ((match = iframeRegex.exec(text)) !== null) {
      embeddedMapUrls.push(match[1]);
    }

    // Bersihkan tag iframe dari teks utama agar tidak merusak paragraf tulisan
    let textWithoutIframe = text.replace(/<iframe[^>]*><\/iframe>/g, "");

    // 2. Memisahkan baris paragraf (\n) bawaan ketikan admin agar tetap rapi ke bawah
    const lines = textWithoutIframe.split("\n");

    // Pola regex untuk mendeteksi link URL (http:// atau https://)
    const urlRegex = /(https?:\/\/[^\s]+)/g;

    return (
      <div className="space-y-4">
        {/* PARAGRAF TEKS UTAMA */}
        <div className="text-gray-700 leading-relaxed text-base md:text-[17px] text-justify space-y-3">
          {lines.map((line, lineIdx) => {
            if (!line.trim()) return <div key={lineIdx} className="h-2"></div>;

            // Pecah baris berdasarkan URL agar kata link bisa dipisahkan dari kata biasa
            const parts = line.split(urlRegex);

            return (
              <p key={lineIdx} className="inline-block w-full">
                {parts.map((part, partIdx) => {
                  if (part.match(urlRegex)) {
                    const urlTitle = part.split('/').pop() || "Buka Tautan";
                    
                    return (
                      <span key={partIdx} className="inline-inline mx-1">
                        <a
                          href={part}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-sm px-2.5 py-0.5 rounded-md border border-emerald-200/80 shadow-3xs transition-colors align-middle"
                        >
                          <svg className="w-3.5 h-3.5 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          {decodeURIComponent(urlTitle).substring(0, 30)}{decodeURIComponent(urlTitle).length > 30 ? "..." : ""}
                        </a>
                      </span>
                    );
                  }
                  
                  // Bagian teks biasa tampil menyambung secara normal
                  return <span key={partIdx}>{part}</span>;
                })}
              </p>
            );
          })}
        </div>

        {/* 3. RENDER PETA INTERAKTIF GOOGLE MAPS (Jika admin memasukkan kode iframe embed) */}
        {embeddedMapUrls.length > 0 && (
          <div className="mt-6 border-t border-gray-100 pt-5 animate-fadeIn">
            <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-1.5 uppercase tracking-wider">
              <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Lampiran Peta / Lokasi Terkait:
            </h4>
            <div className="space-y-4">
              {embeddedMapUrls.map((mapUrl, idx) => (
                <div key={idx} className="overflow-hidden rounded-xl border border-gray-200 shadow-xs bg-gray-50">
                  <iframe
                    src={mapUrl}
                    className="w-full h-64 md:h-80 border-0"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title={`Google Maps Embed Konten ${idx}`}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-6">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-emerald-600 font-medium animate-pulse">Memuat informasi...</p>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 bg-red-50 border border-red-200 rounded-xl text-center shadow-xs">
        <svg className="w-10 h-10 mx-auto text-red-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <p className="text-red-700 font-semibold">Halaman tidak ditemukan</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 py-10 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xs border border-gray-100 p-6 md:p-10">

        {/* HEADER */}
        <header className="mb-8 border-b border-gray-100 pb-5">
          <span className="inline-block text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md uppercase tracking-wider mb-2">
            {page.parent_menu || "INFORMASI"}
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight leading-tight">
            {page.menu_label || page.title || page.judul}
          </h1>
          <p className="text-xs text-gray-400 font-medium mt-2 uppercase tracking-wide">
            PPID MAN 2 Palembang • Layanan Informasi Publik resmi
          </p>
        </header>

        {/* CONTENT & LIST POST */}
        <div className="space-y-8">
          {posts.length === 0 && (
            <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <p className="text-gray-400 italic">Belum ada informasi tertulis yang diterbitkan pada halaman ini.</p>
            </div>
          )}

          {posts.map((post) => (
            <article key={post.id} className="group">
              {post.title && (
                <h2 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-emerald-700 transition-colors">
                  {post.title}
                </h2>
              )}

              {/* Pemrosesan Bersih Konten Teks Menyambung Tanpa Putus */}
              {post.content && (
                <div className="mt-2">
                  {renderCleanContent(post.content)}
                </div>
              )}

              {/* IMAGE BAWAAN DATABASE */}
              {post.image && (
                <div className="mt-5 overflow-hidden rounded-xl border border-gray-100 shadow-xs max-w-2xl">
                  <img
                    src={post.image}
                    alt={post.title || "Gambar Lampiran"}
                    className="w-full h-auto max-h-80 object-cover"
                  />
                </div>
              )}

              {/* POST FILE LINK BAWAAN */}
              {post.file && !post.file.startsWith("http") && (
                <a
                  href={post.file}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-600 hover:text-emerald-700 mt-4 underline decoration-2 underline-offset-4"
                >
                  📄 Lihat Dokumen Utama
                </a>
              )}

              {/* LIST BERKAS MULTIPLE DARI DATABASE LOCAL */}
              {post.berkas_list && post.berkas_list.length > 0 && (
                <section className="mt-6 p-5 bg-gray-50 rounded-xl border border-gray-200/60 shadow-xs">
                  <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-1.5 uppercase tracking-wider">
                    <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Daftar Unduhan Berkas / Dokumen Resmi :
                  </h3>
                  
                  <div className="grid gap-2.5">
                    {post.berkas_list.map((file, i) => {
                      const url = fileUrl(file?.url || file?.path || file?.nama_file);
                      return (
                        <div 
                          key={i} 
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-white rounded-lg border border-gray-100 hover:border-emerald-200 transition-colors gap-3"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-md">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <span className="font-medium text-gray-800 text-sm break-all line-clamp-1">
                              {file.nama_asli || file.nama || "Unduh Lampiran Berkas"}
                            </span>
                          </div>

                          <a 
                            href={url} 
                            target="_blank" 
                            rel="noreferrer"
                            className="inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-3.5 py-2 rounded-md active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Unduh Berkas
                          </a>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}
            </article>
          ))}
        </div>

        {/* MAP KOLOM BAWAAN SUBMENU DATABASE */}
        {page.map_url && (
          <div className="mt-10 pt-6 border-t border-gray-100">
            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-1.5">
              <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Lokasi Peta Utama
            </h3>
            <iframe
              src={page.map_url}
              className="w-full h-72 rounded-xl border border-gray-200 shadow-xs"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        )}

        {/* BACK BUTTON */}
        <footer className="mt-12 pt-6 border-t border-gray-100">
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-medium text-sm rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Kembali ke Beranda
          </button>
        </footer>

      </div>
    </div>
  );
}