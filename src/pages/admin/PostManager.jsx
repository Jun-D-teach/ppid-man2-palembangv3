import { useEffect, useState } from "react";
import { api } from "../../api";

export default function PostManager({ submenuId }) {
  const [posts, setPosts] = useState([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    const res = await api.get(`/api/posts/${submenuId}`);
    setPosts(res.data.posts || []);
  };

  const createPost = async () => {
    await api.post("/api/posts", {
      submenu_id: submenuId,
      title,
      content,
      status: "publish"
    });

    setTitle("");
    setContent("");
    fetchPosts();
  };

  const deletePost = async (id) => {
    await api.delete(`/api/posts/${id}`);
    fetchPosts();
  };

  return (
    <div className="p-4">

      {/* FORM INPUT */}
      <div className="border p-3 rounded bg-white mb-4">
        <input
          className="border p-2 w-full mb-2"
          placeholder="Judul informasi"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <textarea
          className="border p-2 w-full mb-2"
          placeholder="Isi informasi"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />

        <button
          onClick={createPost}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          + Publish Informasi
        </button>
      </div>

      {/* LIST POST */}
      <div className="space-y-3">
        {posts.map((p) => (
          <div key={p.id} className="border p-3 rounded bg-white">
            
            <div className="flex justify-between">
              <h3 className="font-bold">{p.title}</h3>

              <button
                onClick={() => deletePost(p.id)}
                className="text-red-500"
              >
                Hapus
              </button>
            </div>

            <p className="text-sm text-gray-600">
              {p.content}
            </p>

          </div>
        ))}
      </div>

    </div>
  );
}