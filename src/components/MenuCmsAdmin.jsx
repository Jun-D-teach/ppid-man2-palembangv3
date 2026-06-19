import React, { useCallback, useEffect, useMemo, useState } from "react";
import { api, getUploadUrl } from "../api";

const parentMenuOptions = ["PROFIL", "REGULASI", "INFORMASI PUBLIK", "LAYANAN INFORMASI", "LAPORAN"];

const initialForm = {
  id: null,
  parent_menu: "PROFIL",
  menu_label: "",
  slug: "",
  judul: "",
  isi: "",
  status_publish: "Tampil",
  position: 1,
  files: [],
  existingFiles: [],
};

const slugify = (value = "") =>
  String(value)
    .toLowerCase()
    .trim()
    .replace(/&/g, "dan")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const getFileFormat = (fileName = "") => {
  if (!fileName.includes(".")) return "FILE";
  return fileName.split(".").pop().toUpperCase();
};

const MenuCmsAdmin = () => {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeParent, setActiveParent] = useState("PROFIL");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(initialForm);

  const fetchPages = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/admin/menu-pages");
      setPages(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      alert("Gagal memuat data menu website. Pastikan backend aktif dan tabel CMS menu tersedia.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

  const stats = useMemo(() => {
    return parentMenuOptions.map((menu) => ({
      menu,
      total: pages.filter((item) => item.parent_menu === menu).length,
    }));
  }, [pages]);

  const filteredPages = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return pages
      .filter((item) => item.parent_menu === activeParent)
      .filter((item) => {
        const text = [item.menu_label, item.slug, item.judul, item.isi, item.status_publish]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return !keyword || text.includes(keyword);
      })
      .sort((a, b) => Number(a.position || 1) - Number(b.position || 1));
  }, [pages, activeParent, search]);

  const openCreateForm = () => {
    setForm({ ...initialForm, parent_menu: activeParent, position: filteredPages.length + 1 });
    setShowForm(true);
  };

  const openEditForm = (item) => {
    setForm({
      id: item.id,
      parent_menu: item.parent_menu || "PROFIL",
      menu_label: item.menu_label || "",
      slug: item.slug || "",
      judul: item.judul || "",
      isi: item.isi || "",
      status_publish: item.status_publish || "Tampil",
      position: item.position || 1,
      files: [],
      existingFiles: item.berkas_list || [],
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setForm(initialForm);
    setShowForm(false);
  };

  const updateForm = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateLabel = (value) => {
    setForm((prev) => ({
      ...prev,
      menu_label: value,
      judul: prev.judul || value,
      slug: prev.slug ? prev.slug : slugify(value),
    }));
  };

  const handleSave = async () => {
    if (!form.parent_menu || !form.menu_label.trim() || !form.judul.trim()) {
      alert("Menu utama, nama submenu, dan judul halaman wajib diisi.");
      return;
    }

    try {
      setSaving(true);
      const formData = new FormData();
      formData.append("parent_menu", form.parent_menu);
      formData.append("menu_label", form.menu_label);
      formData.append("slug", form.slug || slugify(form.menu_label));
      formData.append("judul", form.judul);
      formData.append("isi", form.isi || "");
      formData.append("status_publish", form.status_publish);
      formData.append("position", form.position || 1);

      Array.from(form.files || []).forEach((file) => {
        formData.append("berkas", file);
      });

      if (form.id) {
        await api.put(`/api/admin/menu-pages/${form.id}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        alert("Halaman menu berhasil diperbarui.");
      } else {
        await api.post("/api/admin/menu-pages", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        alert("Halaman menu berhasil ditambahkan.");
      }

      closeForm();
      fetchPages();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Gagal menyimpan halaman menu.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePage = async (item) => {
    if (!window.confirm(`Hapus menu "${item.menu_label}" beserta semua berkasnya?`)) return;

    try {
      await api.delete(`/api/admin/menu-pages/${item.id}`);
      alert("Halaman menu berhasil dihapus.");
      fetchPages();
    } catch (err) {
      console.error(err);
      alert("Gagal menghapus halaman menu.");
    }
  };

  const handleDeleteFile = async (file) => {
    if (!window.confirm(`Hapus berkas "${file.nama_asli || file.nama_file}"?`)) return;

    try {
      await api.delete(`/api/admin/menu-pages/${form.id}/files/${file.id}`);
      alert("Berkas berhasil dihapus.");
      setForm((prev) => ({
        ...prev,
        existingFiles: prev.existingFiles.filter((item) => Number(item.id) !== Number(file.id)),
      }));
      fetchPages();
    } catch (err) {
      console.error(err);
      alert("Gagal menghapus berkas.");
    }
  };

  return (
    <main className="space-y-6">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-emerald-700">CMS Menu Website</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">Atur Menu dan Isi Halaman</h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
              Gunakan bagian ini untuk mengedit submenu seperti Profil PPID, Visi & Misi, SOP PPID, SK PPID, Prosedur Keberatan, Laporan Tahunan, dan menu lain. Isi halaman serta berkas lampiran akan muncul saat pengunjung mengeklik submenu di halaman utama.
            </p>
          </div>

          <button
            onClick={openCreateForm}
            className="rounded-2xl bg-emerald-700 px-5 py-3 text-xs font-black uppercase text-white shadow-lg shadow-emerald-900/10 transition hover:bg-emerald-800"
          >
            + Tambah Submenu
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="space-y-2">
            {stats.map((item) => (
              <button
                key={item.menu}
                onClick={() => setActiveParent(item.menu)}
                className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-xs font-black uppercase tracking-wide transition ${
                  activeParent === item.menu
                    ? "border-emerald-700 bg-emerald-700 text-white shadow-lg shadow-emerald-900/10"
                    : "border-slate-200 bg-slate-50 text-slate-500 hover:bg-white"
                }`}
              >
                <span>{item.menu}</span>
                <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px]">{item.total}</span>
              </button>
            ))}
          </aside>

          <section className="rounded-3xl border border-slate-200 bg-slate-50 p-4 md:p-5">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">{activeParent}</p>
                <h3 className="mt-1 text-xl font-black text-slate-950">Daftar Submenu</h3>
              </div>

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari submenu..."
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
              />
            </div>

            {loading ? (
              <div className="rounded-3xl bg-white p-10 text-center text-sm font-bold text-slate-400">Memuat data menu...</div>
            ) : filteredPages.length === 0 ? (
              <div className="rounded-3xl bg-white p-10 text-center text-sm font-bold text-slate-400">Belum ada submenu pada menu ini.</div>
            ) : (
              <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-500">
                    <tr>
                      <th className="px-5 py-4">Submenu</th>
                      <th className="px-5 py-4">Isi Singkat</th>
                      <th className="px-5 py-4 text-center">Berkas</th>
                      <th className="px-5 py-4 text-center">Status</th>
                      <th className="px-5 py-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredPages.map((item) => (
                      <tr key={item.id} className="align-top hover:bg-emerald-50/40">
                        <td className="px-5 py-4">
                          <p className="font-black text-slate-900">{item.menu_label}</p>
                          <p className="mt-1 text-[11px] font-bold text-slate-400">/{item.slug}</p>
                          <p className="mt-1 text-[10px] font-black uppercase text-emerald-700">Urutan {item.position || 1}</p>
                        </td>
                        <td className="max-w-md px-5 py-4 text-xs leading-6 text-slate-500">
                          <p className="font-black text-slate-800">{item.judul}</p>
                          <p className="mt-1 line-clamp-3">{item.isi || "Belum ada isi."}</p>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black text-slate-500">
                            {item.berkas_list?.length || 0} file
                          </span>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase ${item.status_publish === "Tampil" ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"}`}>
                            {item.status_publish || "Tampil"}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => openEditForm(item)}
                              className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-black uppercase text-white transition hover:bg-emerald-800"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeletePage(item)}
                              className="rounded-xl border border-red-200 bg-white px-4 py-2 text-xs font-black uppercase text-red-600 transition hover:bg-red-50"
                            >
                              Hapus
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </section>

      {showForm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-700">Atur Submenu</p>
                <h3 className="mt-1 text-xl font-black text-slate-950">{form.id ? "Edit Halaman Menu" : "Tambah Halaman Menu"}</h3>
                <p className="mt-1 text-sm text-slate-500">Menu ini akan tampil di navbar halaman utama.</p>
              </div>
              <button
                onClick={closeForm}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-100 text-lg font-black text-slate-500 transition hover:bg-red-50 hover:text-red-600"
              >
                ×
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label>
                <span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">Menu Utama</span>
                <select
                  value={form.parent_menu}
                  onChange={(e) => updateForm("parent_menu", e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-bold outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                >
                  {parentMenuOptions.map((menu) => (
                    <option key={menu} value={menu}>{menu}</option>
                  ))}
                </select>
              </label>

              <label>
                <span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">Urutan</span>
                <input
                  type="number"
                  value={form.position}
                  onChange={(e) => updateForm("position", e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                />
              </label>

              <label>
                <span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">Nama Submenu</span>
                <input
                  type="text"
                  value={form.menu_label}
                  onChange={(e) => updateLabel(e.target.value)}
                  placeholder="Contoh: Profil PPID"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                />
              </label>

              <label>
                <span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">Slug / Link</span>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => updateForm("slug", slugify(e.target.value))}
                  placeholder="profil-ppid"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                />
                <p className="mt-1 text-[11px] font-semibold text-slate-400">Contoh hasil link: /profil-ppid. Jangan pakai spasi.</p>
              </label>

              <label className="md:col-span-2">
                <span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">Judul Halaman</span>
                <input
                  type="text"
                  value={form.judul}
                  onChange={(e) => updateForm("judul", e.target.value)}
                  placeholder="Contoh: Profil PPID MAN 2 Palembang"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                />
              </label>

              <label className="md:col-span-2">
                <span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">Isi Halaman</span>
                <textarea
                  value={form.isi}
                  onChange={(e) => updateForm("isi", e.target.value)}
                  rows="9"
                  placeholder="Tulis isi halaman di sini. Enter/baris baru akan tetap tampil di halaman utama."
                  className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-medium leading-6 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                />
              </label>

              <label>
                <span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">Status Tampil</span>
                <select
                  value={form.status_publish}
                  onChange={(e) => updateForm("status_publish", e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-bold outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                >
                  <option value="Tampil">Tampil</option>
                  <option value="Sembunyi">Sembunyi</option>
                </select>
              </label>

              <label className="block rounded-3xl border-2 border-dashed border-slate-200 bg-white p-5 text-center transition hover:border-emerald-300 hover:bg-emerald-50/40">
                <span className="block text-sm font-black text-slate-800">Upload Berkas</span>
                <span className="mt-1 block text-xs text-slate-400">Boleh kosong. Bisa pilih banyak file sekaligus.</span>
                <input
                  type="file"
                  multiple
                  onChange={(e) => updateForm("files", Array.from(e.target.files || []))}
                  className="mt-4 text-xs font-bold text-slate-500 file:mr-4 file:rounded-xl file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-xs file:font-black file:uppercase file:text-white"
                />
              </label>

              {form.files?.length > 0 && (
                <div className="md:col-span-2 rounded-2xl bg-emerald-50 p-4">
                  <p className="mb-2 text-xs font-black uppercase text-emerald-700">Berkas baru yang akan diupload</p>
                  {form.files.map((file) => (
                    <p key={file.name} className="break-all text-xs font-semibold text-emerald-700">• {file.name}</p>
                  ))}
                </div>
              )}

              {form.existingFiles?.length > 0 && (
                <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="mb-3 text-xs font-black uppercase tracking-wide text-slate-500">Berkas yang sudah tersimpan</p>
                  <div className="space-y-2">
                    {form.existingFiles.map((file) => (
                      <div key={file.id} className="flex flex-col gap-2 rounded-xl bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
                        <a
                          href={getUploadUrl(file.nama_file)}
                          target="_blank"
                          rel="noreferrer"
                          className="break-all text-xs font-bold text-emerald-700 hover:underline"
                        >
                          📄 {file.nama_asli || file.nama_file} ({getFileFormat(file.nama_file)})
                        </a>
                        <button
                          onClick={() => handleDeleteFile(file)}
                          className="rounded-xl border border-red-200 px-3 py-2 text-[10px] font-black uppercase text-red-600 hover:bg-red-50"
                        >
                          Hapus Berkas
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={handleSave}
                disabled={saving}
                className="md:col-span-2 rounded-2xl bg-emerald-700 py-4 text-sm font-black uppercase tracking-wide text-white shadow-lg shadow-emerald-900/10 transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {saving ? "Menyimpan..." : form.id ? "Simpan Perubahan Menu" : "Simpan Menu Baru"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default MenuCmsAdmin;
