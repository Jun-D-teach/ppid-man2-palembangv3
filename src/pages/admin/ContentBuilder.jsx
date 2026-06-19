import { useEffect, useState } from "react";
import { api } from "../../api";

export default function ContentBuilder({ submenuId }) {
  const [blocks, setBlocks] = useState([]);

  useEffect(() => {
    fetchBlocks();
  }, []);

  const fetchBlocks = async () => {
    const res = await api.get(`/api/submenu/${submenuId}`);
    setBlocks(res.data.content_blocks || []);
  };

  // ADD BLOCK
  const addBlock = async (type) => {
    const newBlock = {
      submenu_id: submenuId,
      type,
      title: "",
      content: "",
      url: "",
      file_path: "",
      sort_order: blocks.length + 1
    };

    await api.post("/api/content-blocks", newBlock);
    fetchBlocks();
  };

  // DELETE BLOCK
  const deleteBlock = async (id) => {
    await api.delete(`/api/content-blocks/${id}`);
    fetchBlocks();
  };

  return (
    <div className="p-4">

      {/* TOOLBAR */}
      <div className="flex gap-2 mb-4">
        <button onClick={() => addBlock("text")} className="px-3 py-1 bg-blue-500 text-white rounded">
          + Text
        </button>

        <button onClick={() => addBlock("file")} className="px-3 py-1 bg-green-500 text-white rounded">
          + File
        </button>

        <button onClick={() => addBlock("image")} className="px-3 py-1 bg-purple-500 text-white rounded">
          + Image
        </button>

        <button onClick={() => addBlock("link")} className="px-3 py-1 bg-orange-500 text-white rounded">
          + Link
        </button>

        <button onClick={() => addBlock("map")} className="px-3 py-1 bg-red-500 text-white rounded">
          + Map
        </button>
      </div>

      {/* BLOCK LIST */}
      <div className="space-y-3">
        {blocks.map((block) => (
          <div key={block.id} className="border p-3 rounded bg-white shadow">

            <div className="flex justify-between items-center">
              <span className="font-bold uppercase text-sm">
                {block.type}
              </span>

              <button
                onClick={() => deleteBlock(block.id)}
                className="text-red-500"
              >
                Hapus
              </button>
            </div>

            {/* TEXT BLOCK */}
            {block.type === "text" && (
              <textarea
                className="w-full border mt-2 p-2"
                defaultValue={block.content}
              />
            )}

            {/* FILE BLOCK */}
            {block.type === "file" && (
              <input
                type="text"
                className="w-full border mt-2 p-2"
                placeholder="URL file / upload nanti"
                defaultValue={block.file_path}
              />
            )}

            {/* LINK BLOCK */}
            {block.type === "link" && (
              <input
                type="text"
                className="w-full border mt-2 p-2"
                placeholder="https://..."
                defaultValue={block.url}
              />
            )}

            {/* MAP BLOCK */}
            {block.type === "map" && (
              <input
                type="text"
                className="w-full border mt-2 p-2"
                placeholder="Google Maps embed URL"
                defaultValue={block.url}
              />
            )}

          </div>
        ))}
      </div>
    </div>
  );
}