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

  if (loading) {
    return <div className="p-10 text-gray-500">Loading...</div>;
  }

  if (!page) {
    return (
      <div className="p-10 text-red-500">
        Halaman tidak ditemukan
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-emerald-50 py-10 px-4">
      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-lg border border-emerald-100 p-8">

        {/* HEADER */}
          <div className="mb-6 border-b pb-4">

  <h1 className="text-2xl md:text-3xl font-black text-emerald-800 uppercase">
    {page.menu_label}
  </h1>

  {/* SUB TITLE */}
  <p className="text-xs text-gray-400 mt-1">
    PPID MAN 2 Palembang • Informasi Publik
  </p>

</div>
{/* CONTENT */}
       {/* LIST POST */}
<div className="space-y-4 mt-6">

  {posts.length === 0 && (
    <p className="text-gray-400">Belum ada informasi</p>
  )}

  {posts.map((post) => (
    <div
      key={post.id}
      className="border rounded-lg p-4 bg-white shadow-sm"
    >
      <h2 className="text-lg font-bold text-emerald-800">
        {post.title}
      </h2>

      <p className="text-gray-600 mt-2">
        {post.content}
      </p>

      {/* IMAGE */}
      {post.image && (
        <img
          src={post.image}
          className="mt-3 rounded-lg max-h-60"
        />
      )}

      {/* FILE */}
      {post.file && (
        <a
          href={post.file}
          target="_blank"
          className="text-blue-600 underline block mt-2"
        >
          📄 Download File
        </a>
      )}

      {/* LINK */}
      {post.link && (
        <a
          href={post.link}
          target="_blank"
          className="text-green-600 underline block mt-1"
        >
          🔗 Link Terkait
        </a>
      )}
    </div>
  ))}
</div>

        {/* MAP */}
        {page.map_url && (
          <div className="mt-8">
            <h3 className="font-bold text-emerald-800 mb-3">
              Lokasi
            </h3>

            <iframe
              src={page.map_url}
              className="w-full h-80 rounded-lg border"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        )}

        {/* BERKAS */}
        {page.berkas_list && page.berkas_list.length > 0 && (
          <div className="mt-8">
            <h3 className="font-bold text-emerald-800 mb-3">
              Dokumen / Berkas
            </h3>

            <div className="space-y-2">
              {page.berkas_list.map((file, i) => {
                const rawPath =
                  file?.url || file?.path || file?.nama_file;

                const url = fileUrl(rawPath);

                return (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="block text-blue-600 underline hover:text-blue-800"
                  >
                    📄 {file.nama_asli || file.nama || "Download File"}
                  </a>
                );
              })}
            </div>
          </div>
        )}

        {/* LINK */}
        {page.link_list && page.link_list.length > 0 && (
          <div className="mt-8">
            <h3 className="font-bold text-emerald-800 mb-3">
              Link Terkait
            </h3>

            <div className="space-y-2">
              {page.link_list.map((link, i) => (
                <a
                  key={i}
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block text-green-600 underline hover:text-green-800"
                >
                  🔗 {link.title || link.url}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* BACK BUTTON */}
        <div className="mt-10 pt-6 border-t">
          <button
            onClick={() => navigate("/")}
            className="px-5 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            ← Kembali ke Home
          </button>
        </div>

      </div>
    </div>
  );
}