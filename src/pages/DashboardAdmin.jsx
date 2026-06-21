import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, getUploadUrl } from "../api";
import MenuCmsAdmin from "../components/MenuCmsAdmin";
import ContentBuilder from "./admin/ContentBuilder";

const kategoriInformasi = [
  "Informasi Berkala",
  "Informasi Serta Merta",
  "Informasi Setiap Saat",
  "Informasi Dikecualikan",
  "Laporan Tahunan",
  "Laporan Statistik",
  "Regulasi",
  "Layanan",
];

const initialKonten = {
  nama_instansi: "PPID UNIT MAN 2 Kota Palembang",
  logo_url: "https://man2plg.sch.id/Foto/logo.png",
  kontak_telepon: "(0711) 123456",
  kontak_email: "ppid@man2plg.sch.id",
  alamat: "Jl. Prof. KH. Zainal Abidin, Kec. Kemuning, Palembang",
  banner_badge: "Portal Layanan Informasi",
  banner_judul: "Keterbukaan Informasi",
  banner_highlight: "Adalah Hak Anda.",
  banner_subjudul:
    "Pejabat Pengelola Informasi dan Dokumentasi (PPID) MAN 2 Palembang memberikan pelayanan informasi yang transparan dan akuntabel bagi seluruh masyarakat.",
  banner_gambar: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80",
  footer_deskripsi: "Mewujudkan keterbukaan informasi madrasah yang modern dan transparan.",
  prosedur_judul: "",
prosedur_isi: "",
};

const initialInfoForm = {
  id: null,
  kategori: "Informasi Berkala",
  judul: "",
  deskripsi: "",
  tahun: new Date().getFullYear().toString(),
  status_publish: "Tampil",
  files: [],
};

const statusStyle = {
  Pending: "bg-slate-50 text-slate-700 ring-1 ring-slate-200",
  Diproses: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  Selesai: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  default: "bg-slate-50 text-slate-600 ring-1 ring-slate-200",
};

const getFileUrl = (fileNameOrUrl) => {
  if (!fileNameOrUrl) return "#";
  if (/^https?:\/\//i.test(fileNameOrUrl)) return fileNameOrUrl;
  return getUploadUrl(fileNameOrUrl);
};

const getFileExtension = (fileName = "") => {
  const cleanName = String(fileName).split("?")[0];
  return cleanName.includes(".") ? cleanName.split(".").pop().toUpperCase() : "FILE";
};

const normalizeStatus = (status) => {
  if (!status) return "Pending";
  const value = String(status).toLowerCase();
  if (value === "selesai") return "Selesai";
  if (value === "diproses" || value === "proses") return "Diproses";
  if (value === "pending" || value === "menunggu") return "Pending";
  return status;
};

const isPreviewableImage = (fileName = "") => /\.(png|jpe?g|webp|gif|bmp)$/i.test(fileName);
const isPreviewablePdf = (fileName = "") => /\.pdf$/i.test(fileName);

const getInfoTitle = (item) => item?.judul || item?.nama_dokumen || item?.nama || item?.title || "Tanpa judul";
const getInfoCategory = (item) => item?.kategori || item?.jenis_informasi || item?.tipe || "Informasi Berkala";
const getInfoDescription = (item) => item?.deskripsi || item?.keterangan || item?.ringkasan || "";

const getInfoFiles = (item) => {
  if (!item) return [];

  const raw = item.berkas_list || item.files || item.berkas || item.file || item.lampiran || item.dokumen || item.nama_file;

  if (!raw) return [];

  if (Array.isArray(raw)) {
    return raw
      .map((file) => {
        if (!file) return null;
        if (typeof file === "string") return { name: file, fileName: file, url: getFileUrl(file) };

        const fileName = file.nama_file || file.filename || file.originalname || file.name || file.berkas || file.file;
        const url = file.url || getFileUrl(fileName);
        return { ...file, name: file.nama_asli || file.originalname || fileName, fileName, url };
      })
      .filter(Boolean);
  }

  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map((name) => ({ name, fileName: name, url: getFileUrl(name) }));
    } catch (error) {
      return raw ? [{ name: raw, fileName: raw, url: getFileUrl(raw) }] : [];
    }
  }

  return [];
};

const StatCard = ({ label, value, helper, icon }) => (
  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</p>
        <h3 className="mt-2 text-3xl font-black text-slate-900">{value}</h3>
        <p className="mt-1 text-xs text-slate-500">{helper}</p>
      </div>
      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-xl">{icon}</div>
    </div>
  </div>
);

const StatusBadge = ({ status }) => {
  const normalizedStatus = normalizeStatus(status);
  const className = statusStyle[normalizedStatus] || statusStyle.default;

  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide ${className}`}>
      <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current" />
      {normalizedStatus || "Belum diketahui"}
    </span>
  );
};

const FieldCard = ({ label, children }) => (
  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
    <p className="mb-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{label}</p>
    <div className="text-sm text-slate-700">{children}</div>
  </div>
);

const FilePreviewButton = ({ fileName, label, onPreview, emptyText = "Tidak ada berkas" }) => {
  if (!fileName) {
    return <p className="text-xs font-bold uppercase text-slate-400">{emptyText}</p>;
  }

  return (
    <div className="space-y-2 text-center">
      <button
        type="button"
        onClick={() => onPreview(fileName, label)}
        className="text-sm font-black uppercase text-blue-700 underline-offset-4 transition hover:underline"
      >
        Lihat / Preview Berkas
      </button>
      <p className="break-all text-xs font-semibold text-slate-500">{fileName}</p>
    </div>
  );
};

const DashboardAdmin = () => {
  const navigate = useNavigate();

  const [permohonan, setPermohonan] = useState([]);
  const [selectedData, setSelectedData] = useState(null);
  const [processData, setProcessData] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [pesanAdmin, setPesanAdmin] = useState("");
  const [estimasiProses, setEstimasiProses] = useState("");
  const [catatanProses, setCatatanProses] = useState("");
  const [tempFile, setTempFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingBeranda, setSavingBeranda] = useState(false);
  const [savingInfo, setSavingInfo] = useState(false);
  const [error, setError] = useState("");
  const [view, setView] = useState("permohonan");
  const [cmsTab, setCmsTab] = useState("hero");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Semua");
  const [konten, setKonten] = useState(initialKonten);
  const [informasiPublik, setInformasiPublik] = useState([]);
  const [kategoriAktif, setKategoriAktif] = useState("Informasi Berkala");
  const [infoSearch, setInfoSearch] = useState("");
  const [infoForm, setInfoForm] = useState(initialInfoForm);
  const [showInfoForm, setShowInfoForm] = useState(false);
  const [selectedSubmenuId, setSelectedSubmenuId] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/api/admin/permohonan");
      setPermohonan(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      setError("Gagal memuat data permohonan. Periksa koneksi backend/API.");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchBeranda = useCallback(async () => {
    try {
      const res = await api.get("/api/beranda");
      if (res.data) setKonten({ ...initialKonten, ...res.data });
    } catch (err) {
      console.error("Gagal memuat konten beranda", err);
    }
  }, []);

  const fetchInformasiPublik = useCallback(async () => {
    try {
      const res = await api.get("/api/informasi-publik");
      setInformasiPublik(Array.isArray(res.data) ? res.data : res.data?.data || []);
    } catch (err) {
      console.error("Gagal memuat daftar informasi publik", err);
      setInformasiPublik([]);
    }
  }, []);

  useEffect(() => {
    let user = null;
    const rawUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (rawUser && rawUser !== "undefined" && token && token !== "undefined" && token !== "null") {
      try {
        user = JSON.parse(rawUser);
      } catch (e) {
        console.error("Gagal parse admin user data:", e);
      }
    }

    if (!user || user.role !== "admin" || !token || token === "undefined" || token === "null") {
      navigate("/login");
      return;
    }

    fetchData();
    fetchBeranda();
    fetchInformasiPublik();
  }, [fetchData, fetchBeranda, fetchInformasiPublik, navigate]);

  const stats = useMemo(() => {
    const total = permohonan.length;
    const pending = permohonan.filter((item) => normalizeStatus(item.status) === "Pending").length;
    const diproses = permohonan.filter((item) => normalizeStatus(item.status) === "Diproses").length;
    const selesai = permohonan.filter((item) => normalizeStatus(item.status) === "Selesai").length;

    return { total, pending, diproses, selesai };
  }, [permohonan]);

  const infoStats = useMemo(() => {
    return kategoriInformasi.map((kategori) => ({
      kategori,
      total: informasiPublik.filter((item) => getInfoCategory(item) === kategori).length,
    }));
  }, [informasiPublik]);

  const filteredPermohonan = useMemo(() => {
    const keyword = query.trim().toLowerCase();

    return permohonan.filter((item) => {
      const itemStatus = normalizeStatus(item.status);
      const cocokStatus = statusFilter === "Semua" || itemStatus === statusFilter;
      const searchableText = [
        item.nama_lengkap,
        item.nik,
        item.email,
        item.no_hp,
        item.subjek,
        item.tujuan_informasi,
        item.status,
        item.estimasi,
        item.catatan_admin,
        item.catatan,
        item.berkas_balasan,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const cocokKeyword = !keyword || searchableText.includes(keyword);
      return cocokStatus && cocokKeyword;
    });
  }, [permohonan, query, statusFilter]);

  const filteredInformasi = useMemo(() => {
    const keyword = infoSearch.trim().toLowerCase();

    return informasiPublik.filter((item) => {
      const cocokKategori = getInfoCategory(item) === kategoriAktif;
      const files = getInfoFiles(item).map((file) => file.name || file.fileName).join(" ");
      const text = [getInfoTitle(item), getInfoDescription(item), item.tahun, item.status_publish, files]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return cocokKategori && (!keyword || text.includes(keyword));
    });
  }, [informasiPublik, kategoriAktif, infoSearch]);

  const openDetail = (data, editMode = false) => {
    setSelectedData(data);
    setIsEditMode(editMode);
    setPesanAdmin(data.pesan_admin || "");
    setTempFile(null);
  };

  const openProcessModal = (data) => {
    setProcessData(data);
    setEstimasiProses(data.estimasi || "");
    setCatatanProses(data.catatan_admin || data.catatan || "");
  };

  const closeProcessModal = () => {
    setProcessData(null);
    setEstimasiProses("");
    setCatatanProses("");
  };

  const openPreview = (fileName, label = "Preview Berkas") => {
    setPreviewFile({ fileName, label, url: getFileUrl(fileName) });
  };

  const closeModal = () => {
    setSelectedData(null);
    setIsEditMode(false);
    setPesanAdmin("");
    setTempFile(null);
  };

  const openCreateInfo = () => {
    setInfoForm({ ...initialInfoForm, kategori: kategoriAktif, tahun: new Date().getFullYear().toString() });
    setShowInfoForm(true);
  };

  const openEditInfo = (item) => {
    setInfoForm({
      id: item.id,
      kategori: getInfoCategory(item),
      judul: getInfoTitle(item),
      deskripsi: getInfoDescription(item),
      tahun: item.tahun || "",
      status_publish: item.status_publish || item.status || "Tampil",
      files: [],
    });
    setShowInfoForm(true);
  };

  const closeInfoForm = () => {
    setInfoForm({ ...initialInfoForm, kategori: kategoriAktif });
    setShowInfoForm(false);
  };

  const handleUpdateBeranda = async () => {
    try {
      setSavingBeranda(true);
      await api.put("/api/admin/beranda", konten);
      alert("Halaman utama berhasil diperbarui!");
      fetchBeranda();
    } catch (err) {
      console.error(err);
      alert("Gagal update halaman utama");
    } finally {
      setSavingBeranda(false);
    }
  };

  const handleSaveInformasi = async () => {
    if (!infoForm.judul.trim()) {
      alert("Nama/Judul dokumen wajib diisi.");
      return;
    }

    try {
      setSavingInfo(true);
      const formData = new FormData();
      formData.append("kategori", infoForm.kategori);
      formData.append("judul", infoForm.judul);
      formData.append("deskripsi", infoForm.deskripsi);
      formData.append("tahun", infoForm.tahun);
      formData.append("status_publish", infoForm.status_publish);

      Array.from(infoForm.files || []).forEach((file) => {
        formData.append("berkas", file);
      });

      if (infoForm.id) {
        await api.put(`/api/admin/informasi-publik/${infoForm.id}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        alert("Informasi publik berhasil diperbarui.");
      } else {
        await api.post("/api/admin/informasi-publik", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        alert("Informasi publik berhasil ditambahkan.");
      }

      closeInfoForm();
      fetchInformasiPublik();
    } catch (err) {
      console.error(err);
      alert("Gagal menyimpan informasi publik. Pastikan endpoint backend untuk informasi publik sudah dibuat.");
    } finally {
      setSavingInfo(false);
    }
  };

  const handleDeleteInformasi = async (id) => {
    if (!window.confirm("Hapus data informasi publik ini beserta berkasnya?")) return;

    try {
      await api.delete(`/api/admin/informasi-publik/${id}`);
      alert("Informasi publik berhasil dihapus.");
      fetchInformasiPublik();
    } catch (err) {
      console.error(err);
      alert("Gagal menghapus informasi publik.");
    }
  };

  const handleProses = async (id) => {
    if (!estimasiProses.trim()) {
      alert("Estimasi waktu wajib diisi. Contoh: 3 Hari Kerja atau 20 Mei 2026.");
      return;
    }

    try {
      setProcessing(true);
      await api.put(`/api/permohonan/${id}`, {
        status: "Diproses",
        estimasi: estimasiProses,
        catatan_admin: catatanProses,
      });
      alert("Status diperbarui ke Diproses");
      closeProcessModal();
      closeModal();
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Gagal update status");
    } finally {
      setProcessing(false);
    }
  };

  const handleSimpanJawaban = async (id) => {
    if (!pesanAdmin.trim() && !tempFile) {
      alert("Isi pesan jawaban atau pilih berkas balasan terlebih dahulu.");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("pesan_admin", pesanAdmin);
    if (tempFile) formData.append("berkas", tempFile);

    try {
      await api.put(`/api/permohonan/upload/${id}`, formData);
      alert("Jawaban berhasil dikirim!");
      closeModal();
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Gagal mengirim jawaban");
    } finally {
      setUploading(false);
    }
  };

  const handleHapusJawaban = async (id) => {
    if (!window.confirm("Hapus jawaban dan berkas balasan admin? Status permohonan akan kembali ke Diproses dan tombol Tanggapi akan aktif lagi.")) return;

    try {
      const formData = new FormData();
      formData.append("hapus_berkas", "true");
      await api.put(`/api/permohonan/upload/${id}`, formData);
      alert("Jawaban dan berkas balasan berhasil dihapus.");
      closeModal();
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Gagal menghapus jawaban dan berkas balasan");
    }
  };

  const updateKonten = (field, value) => {
    setKonten((prev) => ({ ...prev, [field]: value }));
  };

  const renderPreviewContent = () => {
    if (!previewFile) return null;

    const { fileName, url } = previewFile;
    const extension = getFileExtension(fileName);

    if (isPreviewableImage(fileName)) {
      return (
        <div className="grid min-h-[60vh] place-items-center bg-slate-100 p-4">
          <img src={url} alt={fileName} className="max-h-[70vh] max-w-full rounded-2xl object-contain shadow-sm" />
        </div>
      );
    }

    if (isPreviewablePdf(fileName)) {
      return <iframe src={url} title={fileName} className="h-[72vh] w-full rounded-b-[2rem] bg-slate-100" />;
    }

    return (
      <div className="grid min-h-[45vh] place-items-center bg-slate-50 p-8 text-center">
        <div className="max-w-md">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-slate-200 text-2xl">📄</div>
          <h3 className="mt-4 text-lg font-black text-slate-900">Preview langsung belum tersedia</h3>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Format .{extension || "FILE"} biasanya tidak bisa ditampilkan langsung di browser. Gunakan tombol buka di tab baru untuk melihat file melalui browser.
          </p>
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-flex rounded-2xl bg-slate-900 px-5 py-3 text-xs font-black uppercase text-white transition hover:bg-emerald-800"
          >
            Buka Berkas di Tab Baru
          </a>
        </div>
      </div>
    );
  };

  const renderActionButton = (item) => {
    const status = normalizeStatus(item.status);

    if (status === "Pending") {
      return (
        <button
          onClick={() => openProcessModal(item)}
          className="rounded-xl bg-amber-600 px-4 py-2 text-xs font-black uppercase text-white shadow-sm transition hover:bg-amber-700"
        >
          Proses
        </button>
      );
    }

    if (status === "Diproses") {
      return (
        <button
          onClick={() => openDetail(item, true)}
          className="rounded-xl bg-emerald-700 px-4 py-2 text-xs font-black uppercase text-white shadow-sm transition hover:bg-emerald-800"
        >
          Tanggapi
        </button>
      );
    }

    if (status === "Selesai") {
      return (
        <button
          disabled
          title="Permohonan selesai. Hapus jawaban terlebih dahulu jika ingin menanggapi ulang."
          className="cursor-not-allowed rounded-xl bg-slate-200 px-4 py-2 text-xs font-black uppercase text-slate-500 shadow-sm"
        >
          🔒 Terkunci
        </button>
      );
    }

    return (
      <button
        onClick={() => openProcessModal(item)}
        className="rounded-xl bg-amber-600 px-4 py-2 text-xs font-black uppercase text-white shadow-sm transition hover:bg-amber-700"
      >
        Proses
      </button>
    );
  };

  const selectedStatus = selectedData ? normalizeStatus(selectedData.status) : "";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50 font-sans text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <header className="mb-8 rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-sm backdrop-blur md:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.3em] text-emerald-700">Panel Admin PPID</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">Dashboard Admin</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Kelola permohonan informasi dan semua konten yang tampil di halaman depan.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2">
              <button
                onClick={() => setView("permohonan")}
                className={`rounded-xl px-5 py-2.5 text-xs font-black uppercase tracking-wide transition ${
                  view === "permohonan" ? "bg-slate-900 text-white shadow-sm" : "text-slate-500 hover:bg-white hover:text-slate-900"
                }`}
              >
                Daftar Masuk
              </button>
              <button
                onClick={() => setView("atur_beranda")}
                className={`rounded-xl px-5 py-2.5 text-xs font-black uppercase tracking-wide transition ${
                  view === "atur_beranda" ? "bg-emerald-700 text-white shadow-sm" : "text-slate-500 hover:bg-white hover:text-slate-900"
                }`}
              >
                Atur Halaman Utama
              </button>
              <button
                onClick={() => setView("atur_menu")}
                className={`rounded-xl px-5 py-2.5 text-xs font-black uppercase tracking-wide transition ${
                  view === "atur_menu" ? "bg-blue-700 text-white shadow-sm" : "text-slate-500 hover:bg-white hover:text-slate-900"
                }`}
              >
                Atur Menu Website
              </button>
              <button
                onClick={() => navigate("/")}
                className="rounded-xl px-5 py-2.5 text-xs font-black uppercase tracking-wide bg-slate-900/10 text-slate-800 hover:bg-slate-900/25 transition flex items-center gap-1"
              >
                <span>🏠</span> Kembali ke Beranda
              </button>
            </div>
          </div>
        </header>

        {view === "permohonan" ? (
          <main className="space-y-6">
            <section className="grid gap-4 md:grid-cols-4">
              <StatCard label="Total" value={stats.total} helper="Semua data masuk" icon="📨" />
              <StatCard label="Pending" value={stats.pending} helper="Menunggu diproses" icon="🕘" />
              <StatCard label="Diproses" value={stats.diproses} helper="Siap ditanggapi" icon="⏳" />
              <StatCard label="Selesai" value={stats.selesai} helper="Sudah dijawab" icon="✅" />
            </section>

            <section className="rounded-[2rem] border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-4 border-b border-slate-100 p-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-lg font-black text-slate-900">Daftar Permohonan</h2>
                  <p className="text-sm text-slate-500">Pending diproses dulu dengan estimasi/catatan, baru bisa ditanggapi oleh admin.</p>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <div className="relative">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">⌕</span>
                    <input
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Cari permohonan..."
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm font-medium outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100 sm:w-72"
                    />
                  </div>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                  >
                    <option value="Semua">Semua Status</option>
                    <option value="Pending">Pending</option>
                    <option value="Diproses">Diproses</option>
                    <option value="Selesai">Selesai</option>
                  </select>

                  <button
                    onClick={fetchData}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                  >
                    Refresh
                  </button>
                </div>
              </div>

              {error && <div className="m-5 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700 ring-1 ring-red-100">{error}</div>}

              {loading ? (
                <div className="grid gap-3 p-5">
                  {[1, 2, 3, 4].map((item) => (
                    <div key={item} className="h-20 animate-pulse rounded-2xl bg-slate-100" />
                  ))}
                </div>
              ) : filteredPermohonan.length === 0 ? (
                <div className="p-10 text-center">
                  <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-slate-100 text-2xl">📭</div>
                  <h3 className="mt-4 text-lg font-black text-slate-900">Data tidak ditemukan</h3>
                  <p className="mt-1 text-sm text-slate-500">Coba ubah kata kunci pencarian atau filter status.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1180px] text-left">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50 text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                        <th className="px-6 py-4">Pemohon</th>
                        <th className="px-6 py-4">Subjek & Tujuan</th>
                        <th className="px-6 py-4">Estimasi</th>
                        <th className="px-6 py-4">Berkas Admin</th>
                        <th className="px-6 py-4 text-center">Status</th>
                        <th className="px-6 py-4 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredPermohonan.map((item) => (
                        <tr key={item.id} className="group transition hover:bg-emerald-50/40">
                          <td className="px-6 py-5 align-top">
                            <button onClick={() => openDetail(item, false)} className="text-left">
                              <p className="font-black text-slate-900 group-hover:text-emerald-800">{item.nama_lengkap || "Tanpa nama"}</p>
                              <p className="mt-1 text-xs font-semibold text-slate-400">NIK: {item.nik || "-"}</p>
                              <p className="mt-1 text-xs text-slate-400">{item.no_hp || "-"}</p>
                            </button>
                          </td>

                          <td className="px-6 py-5 align-top">
                            <button onClick={() => openDetail(item, false)} className="max-w-md text-left">
                              <p className="line-clamp-1 text-sm font-black text-emerald-700 underline-offset-4 group-hover:underline">
                                {item.subjek || "Tanpa subjek"}
                              </p>
                              <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{item.tujuan_informasi || "Tidak ada tujuan informasi"}</p>
                            </button>
                          </td>

                          <td className="px-6 py-5 align-top">
                            {item.estimasi ? (
                              <div>
                                <p className="text-xs font-black text-slate-800">{item.estimasi}</p>
                                <p className="mt-1 line-clamp-2 max-w-[180px] text-[11px] leading-4 text-slate-400">
                                  {item.catatan_admin || item.catatan || "Tidak ada catatan tambahan"}
                                </p>
                              </div>
                            ) : (
                              <p className="text-xs font-semibold text-slate-300">Belum diisi</p>
                            )}
                          </td>

                          <td className="px-6 py-5 align-top">
                            {item.berkas_balasan ? (
                              <button onClick={() => openPreview(item.berkas_balasan, "Berkas Balasan Admin")} className="max-w-[210px] text-left">
                                <p className="line-clamp-1 text-xs font-black text-blue-700 underline-offset-4 hover:underline">{item.berkas_balasan}</p>
                                <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">Klik untuk preview</p>
                              </button>
                            ) : (
                              <p className="text-xs font-semibold text-slate-300">Belum ada berkas</p>
                            )}
                          </td>

                          <td className="px-6 py-5 text-center align-top">
                            <StatusBadge status={item.status} />
                          </td>

                          <td className="px-6 py-5 text-right align-top">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => openDetail(item, false)}
                                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-black uppercase text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
                              >
                                Detail
                              </button>
                              {renderActionButton(item)}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </main>
        ) : view === "atur_menu" ? (
          <MenuCmsAdmin />
        ) : (
          <main className="space-y-6">
            {selectedSubmenuId && <ContentBuilder submenuId={selectedSubmenuId} />}
            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
              <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.25em] text-emerald-700">Manajemen Halaman Utama</p>
                  <h2 className="mt-2 text-2xl font-black text-slate-950">Atur Semua Konten Beranda</h2>
                  <p className="mt-1 max-w-2xl text-sm text-slate-500">
                    Admin dapat mengatur hero/banner, identitas kontak, dan daftar informasi publik yang tampil di halaman depan.
                  </p>
                </div>

                <div className="flex gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2">
                  <button
                    onClick={() => setCmsTab("hero")}
                    className={`rounded-xl px-4 py-2.5 text-xs font-black uppercase transition ${cmsTab === "hero" ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-white"}`}
                  >
                    Hero & Identitas
                  </button>
                  <button
                    onClick={() => setCmsTab("informasi")}
                    className={`rounded-xl px-4 py-2.5 text-xs font-black uppercase transition ${cmsTab === "informasi" ? "bg-emerald-700 text-white" : "text-slate-500 hover:bg-white"}`}
                  >
                    Informasi Publik
                  </button>
                </div>
              </div>

              {cmsTab === "hero" ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <label>
                    <span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">Nama Instansi</span>
                    <input
                      type="text"
                      value={konten.nama_instansi}
                      onChange={(e) => updateKonten("nama_instansi", e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                    />
                  </label>

                  <label>
                    <span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">URL Logo</span>
                    <input
                      type="text"
                      value={konten.logo_url}
                      onChange={(e) => updateKonten("logo_url", e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                    />
                  </label>

                  <label>
                    <span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">Telepon</span>
                    <input
                      type="text"
                      value={konten.kontak_telepon}
                      onChange={(e) => updateKonten("kontak_telepon", e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                    />
                  </label>

                  <label>
                    <span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">Email</span>
                    <input
                      type="email"
                      value={konten.kontak_email}
                      onChange={(e) => updateKonten("kontak_email", e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                    />
                  </label>

                  <label className="md:col-span-2">
                    <span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">Alamat</span>
                    <input
                      type="text"
                      value={konten.alamat}
                      onChange={(e) => updateKonten("alamat", e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                    />
                  </label>

                  <label>
                    <span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">Badge Hero</span>
                    <input
                      type="text"
                      value={konten.banner_badge}
                      onChange={(e) => updateKonten("banner_badge", e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                    />
                  </label>

                  <label>
                    <span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">URL Gambar Hero</span>
                    <input
                      type="text"
                      value={konten.banner_gambar}
                      onChange={(e) => updateKonten("banner_gambar", e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                    />
                  </label>

                  <label>
                    <span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">Judul Hero</span>
                    <input
                      type="text"
                      value={konten.banner_judul}
                      onChange={(e) => updateKonten("banner_judul", e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                    />
                  </label>

                  <label>
                    <span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">Teks Highlight Hero</span>
                    <input
                      type="text"
                      value={konten.banner_highlight}
                      onChange={(e) => updateKonten("banner_highlight", e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                    />
                  </label>

                  <label className="md:col-span-2">
                    <span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">Deskripsi Hero</span>
                    <textarea
                      value={konten.banner_subjudul}
                      onChange={(e) => updateKonten("banner_subjudul", e.target.value)}
                      rows="4"
                      className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-medium leading-6 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                    />
                  </label>

                  <label className="md:col-span-2">
                    <span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">Deskripsi Footer</span>
                    <textarea
                      value={konten.footer_deskripsi}
                      onChange={(e) => updateKonten("footer_deskripsi", e.target.value)}
                      rows="3"
                      className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-medium leading-6 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                    />
                  </label>
<label className="md:col-span-2">
  <span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">
    Judul Prosedur Layanan
  </span>

  <input
    type="text"
    value={konten.prosedur_judul || ""}
    onChange={(e) =>
      setKonten({
        ...konten,
        prosedur_judul: e.target.value,
      })
    }
    placeholder="Contoh: Prosedur Permohonan Informasi"
    className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
  />
</label>

<label className="md:col-span-2">
  <span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">
    Isi Prosedur Layanan
  </span>

  <textarea
    rows="8"
    value={konten.prosedur_isi || ""}
    onChange={(e) =>
      setKonten({
        ...konten,
        prosedur_isi: e.target.value,
      })
    }
    placeholder={`Contoh:
1. Pemohon melakukan login.
2. Mengisi formulir permohonan informasi.
3. Admin memproses permohonan.
4. Admin memberikan jawaban atau dokumen.
5. Pemohon dapat mengunduh hasil layanan.`}
    className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-medium leading-6 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
  />
</label>
                  <button
                    onClick={handleUpdateBeranda}
                    disabled={savingBeranda}
                    className="md:col-span-2 rounded-2xl bg-emerald-700 py-4 text-sm font-black uppercase tracking-wide text-white shadow-lg shadow-emerald-900/10 transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    {savingBeranda ? "Menyimpan..." : "Simpan Konten Halaman Utama"}
                  </button>
                </div>
              ) : (
                <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
                  <aside className="space-y-2">
                    {infoStats.map((item) => (
                      <button
                        key={item.kategori}
                        onClick={() => setKategoriAktif(item.kategori)}
                        className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-xs font-black uppercase tracking-wide transition ${
                          kategoriAktif === item.kategori
                            ? "border-emerald-700 bg-emerald-700 text-white shadow-lg shadow-emerald-900/10"
                            : "border-slate-200 bg-slate-50 text-slate-500 hover:bg-white"
                        }`}
                      >
                        <span>{item.kategori}</span>
                        <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px]">{item.total}</span>
                      </button>
                    ))}
                  </aside>

                  <section className="rounded-3xl border border-slate-200 bg-slate-50 p-4 md:p-5">
                    <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">{kategoriAktif}</p>
                        <h3 className="mt-1 text-xl font-black text-slate-950">Daftar Data Informasi</h3>
                        <p className="mt-1 text-xs text-slate-500">Data di bagian ini akan ditampilkan pada tabel Daftar Informasi Publik di halaman depan.</p>
                      </div>

                      <div className="flex flex-col gap-2 sm:flex-row">
                        <input
                          type="text"
                          value={infoSearch}
                          onChange={(e) => setInfoSearch(e.target.value)}
                          placeholder="Cari dokumen..."
                          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                        />
                        <button
                          onClick={openCreateInfo}
                          className="rounded-2xl bg-emerald-700 px-5 py-3 text-xs font-black uppercase text-white shadow-lg shadow-emerald-900/10 transition hover:bg-emerald-800"
                        >
                          + Tambah Data
                        </button>
                      </div>
                    </div>

                    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                      <table className="w-full min-w-[850px] text-left">
                        <thead className="bg-slate-100 text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
                          <tr>
                            <th className="px-5 py-4">Nama Dokumen</th>
                            <th className="px-5 py-4">Berkas</th>
                            <th className="px-5 py-4 text-center">Status</th>
                            <th className="px-5 py-4 text-right">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                          {filteredInformasi.length === 0 ? (
                            <tr>
                              <td colSpan="4" className="px-5 py-10 text-center text-sm font-semibold text-slate-400">
                                Belum ada data untuk kategori ini.
                              </td>
                            </tr>
                          ) : (
                            filteredInformasi.map((item) => {
                              const files = getInfoFiles(item);
                              return (
                                <tr key={item.id} className="transition hover:bg-emerald-50/40">
                                  <td className="px-5 py-4 align-top">
                                    <p className="font-black text-slate-900">{getInfoTitle(item)}</p>
                                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{getInfoDescription(item) || "Tidak ada deskripsi"}</p>
                                    <p className="mt-2 text-[10px] font-black uppercase tracking-wide text-slate-400">Tahun: {item.tahun || "-"}</p>
                                  </td>
                                  <td className="px-5 py-4 align-top">
                                    {files.length > 0 ? (
                                      <div className="space-y-2">
                                        {files.map((file, index) => (
                                          <button
                                            key={`${file.fileName}-${index}`}
                                            onClick={() => openPreview(file.fileName || file.url, file.name || "Berkas Informasi Publik")}
                                            className="block max-w-[260px] rounded-xl bg-blue-50 px-3 py-2 text-left text-xs font-bold text-blue-700 transition hover:bg-blue-100"
                                          >
                                            <span className="line-clamp-1">{file.name || file.fileName}</span>
                                            <span className="mt-1 block text-[10px] font-black uppercase text-blue-400">{getFileExtension(file.fileName || file.name)}</span>
                                          </button>
                                        ))}
                                      </div>
                                    ) : (
                                      <p className="text-xs font-semibold text-slate-300">Belum ada berkas</p>
                                    )}
                                  </td>
                                  <td className="px-5 py-4 text-center align-top">
                                    <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase ${item.status_publish === "Sembunyi" ? "bg-slate-100 text-slate-500" : item.status_publish === "Private" ? "bg-amber-100 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
                                      {item.status_publish || item.status || "Tampil"}
                                    </span>
                                  </td>
                                  <td className="px-5 py-4 text-right align-top">
                                    <div className="flex justify-end gap-2">
                                      <button
                                        onClick={() => openEditInfo(item)}
                                        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-black uppercase text-slate-600 transition hover:bg-slate-50"
                                      >
                                        Edit
                                      </button>
                                      <button
                                        onClick={() => handleDeleteInformasi(item.id)}
                                        className="rounded-xl border border-red-200 bg-white px-4 py-2 text-xs font-black uppercase text-red-600 transition hover:bg-red-50"
                                      >
                                        Hapus
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </section>
                </div>
              )}
            </section>
          </main>
        )}
      </div>

      {selectedData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="relative max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/90 p-6 backdrop-blur">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-700">{isEditMode ? "Mode Tanggapan" : "Mode Detail"}</p>
                <h2 className="mt-1 text-xl font-black text-slate-950">{isEditMode ? "Tanggapi Permohonan" : "Detail Permohonan"}</h2>
              </div>
              <button
                onClick={closeModal}
                className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-lg font-black text-slate-500 transition hover:bg-red-50 hover:text-red-600"
              >
                ×
              </button>
            </div>

            <div className="space-y-5 p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div>
                  <p className="text-sm font-black text-slate-900">{selectedData.nama_lengkap || "Tanpa nama"}</p>
                  <p className="text-xs font-semibold text-slate-400">NIK: {selectedData.nik || "-"}</p>
                </div>
                <StatusBadge status={selectedData.status} />
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <FieldCard label="Kontak Pemohon">
                  <p className="font-bold text-slate-800">{selectedData.no_hp || "-"}</p>
                  <p className="mt-1 text-xs text-slate-500">{selectedData.email || "-"}</p>
                </FieldCard>

                <FieldCard label="Subjek">
                  <p className="font-bold text-slate-800">{selectedData.subjek || "-"}</p>
                </FieldCard>

                <div className="md:col-span-2">
                  <FieldCard label="Tujuan Informasi">
                    <p className="leading-6 text-slate-600">{selectedData.tujuan_informasi || "-"}</p>
                  </FieldCard>
                </div>

                <FieldCard label="Estimasi Waktu / Tanggal Estimasi">
                  <p className="font-bold text-slate-800">{selectedData.estimasi || "Belum diisi"}</p>
                </FieldCard>

                <FieldCard label="Catatan Proses Admin">
                  <p className="leading-6 text-slate-600">{selectedData.catatan_admin || selectedData.catatan || "Belum ada catatan"}</p>
                </FieldCard>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-center">
                  <p className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-blue-400">Berkas Pemohon</p>
                  <FilePreviewButton
                    fileName={selectedData.berkas_permohonan}
                    label="Berkas Permohonan Pemohon"
                    onPreview={openPreview}
                    emptyText="Tidak ada berkas pemohon"
                  />
                </div>

                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-center">
                  <p className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-500">Berkas Balasan Admin</p>
                  <FilePreviewButton
                    fileName={selectedData.berkas_balasan}
                    label="Berkas Balasan Admin"
                    onPreview={openPreview}
                    emptyText="Belum ada berkas balasan admin"
                  />
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <label className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">Pesan Jawaban Admin</label>
                <textarea
                  className={`w-full resize-none rounded-2xl border p-4 text-sm leading-6 outline-none transition ${
                    isEditMode
                      ? "border-slate-200 bg-white focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                      : "border-transparent bg-transparent text-slate-500"
                  }`}
                  rows="5"
                  value={pesanAdmin}
                  onChange={(e) => setPesanAdmin(e.target.value)}
                  readOnly={!isEditMode}
                  placeholder="Belum ada jawaban admin..."
                />
              </div>

              {isEditMode ? (
                <div className="space-y-4">
                  <label className="block rounded-3xl border-2 border-dashed border-slate-200 bg-white p-5 text-center transition hover:border-emerald-300 hover:bg-emerald-50/40">
                    <span className="block text-sm font-black text-slate-800">Unggah berkas balasan admin</span>
                    <span className="mt-1 block text-xs text-slate-400">PDF/gambar/dokumen pendukung jawaban permohonan</span>
                    <input
                      type="file"
                      onChange={(e) => setTempFile(e.target.files?.[0] || null)}
                      className="mt-4 text-xs font-bold text-slate-500 file:mr-4 file:rounded-xl file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-xs file:font-black file:uppercase file:text-white"
                    />
                    {tempFile && <p className="mt-3 text-xs font-bold text-emerald-700">File dipilih: {tempFile.name}</p>}
                  </label>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                      onClick={() => handleSimpanJawaban(selectedData.id)}
                      disabled={uploading}
                      className="flex-1 rounded-2xl bg-emerald-700 py-4 text-sm font-black uppercase text-white shadow-lg shadow-emerald-900/10 transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                      {uploading ? "Mengunggah..." : "Simpan & Kirim Tanggapan"}
                    </button>

                    {(selectedStatus === "Selesai" || selectedData.pesan_admin || selectedData.berkas_balasan) && (
                      <button
                        onClick={() => handleHapusJawaban(selectedData.id)}
                        className="rounded-2xl border border-red-200 px-5 py-4 text-xs font-black uppercase text-red-600 transition hover:bg-red-50"
                      >
                        Hapus Jawaban & Berkas
                      </button>
                    )}
                  </div>
                </div>
              ) : selectedStatus === "Pending" ? (
                <button
                  onClick={() => openProcessModal(selectedData)}
                  className="w-full rounded-2xl bg-amber-600 py-4 text-sm font-black uppercase text-white shadow-lg transition hover:bg-amber-700"
                >
                  Proses Permohonan Ini
                </button>
              ) : selectedStatus === "Diproses" ? (
                <button
                  onClick={() => setIsEditMode(true)}
                  className="w-full rounded-2xl bg-emerald-700 py-4 text-sm font-black uppercase text-white shadow-lg transition hover:bg-emerald-800"
                >
                  Tanggapi Permohonan Ini
                </button>
              ) : selectedStatus === "Selesai" ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    onClick={() => setIsEditMode(true)}
                    className="rounded-2xl bg-slate-900 py-4 text-sm font-black uppercase text-white shadow-lg transition hover:bg-emerald-800"
                  >
                    Update Balasan
                  </button>
                  <button
                    onClick={() => handleHapusJawaban(selectedData.id)}
                    className="rounded-2xl border border-red-200 bg-white py-4 text-sm font-black uppercase text-red-600 transition hover:bg-red-50"
                  >
                    Hapus Jawaban & Berkas
                  </button>
                  <p className="sm:col-span-2 rounded-2xl bg-slate-50 p-3 text-center text-xs font-semibold text-slate-500">
                    Status selesai membuat tombol Tanggapi di daftar terkunci. Hapus jawaban dan berkas jika ingin menanggapi ulang.
                  </p>
                </div>
              ) : (
                <button
                  onClick={() => openProcessModal(selectedData)}
                  className="w-full rounded-2xl bg-amber-600 py-4 text-sm font-black uppercase text-white shadow-lg transition hover:bg-amber-700"
                >
                  Proses Permohonan Ini
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {processData && (
        <div className="fixed inset-0 z-[55] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-[2rem] bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-amber-600">Proses Permohonan</p>
                <h3 className="mt-1 text-xl font-black text-slate-950">Isi Estimasi & Catatan Admin</h3>
                <p className="mt-1 text-sm text-slate-500">Setelah disimpan, status berubah dari Pending menjadi Diproses dan tombol akan berubah menjadi Tanggapi.</p>
              </div>
              <button
                onClick={closeProcessModal}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-100 text-lg font-black text-slate-500 transition hover:bg-red-50 hover:text-red-600"
              >
                ×
              </button>
            </div>

            <div className="mb-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-black text-slate-900">{processData.nama_lengkap || "Tanpa nama"}</p>
              <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{processData.subjek || "Tanpa subjek"}</p>
            </div>

            <div className="space-y-4">
              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">Estimasi Waktu / Tanggal Estimasi</span>
                <input
                  type="text"
                  value={estimasiProses}
                  onChange={(e) => setEstimasiProses(e.target.value)}
                  placeholder="Contoh: 3 Hari Kerja atau 20 Mei 2026"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold outline-none transition focus:border-amber-400 focus:bg-white focus:ring-4 focus:ring-amber-100"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">Catatan Admin</span>
                <textarea
                  value={catatanProses}
                  onChange={(e) => setCatatanProses(e.target.value)}
                  rows="4"
                  placeholder="Contoh: Permohonan sedang diverifikasi oleh admin. Mohon menunggu sesuai estimasi."
                  className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-medium leading-6 outline-none transition focus:border-amber-400 focus:bg-white focus:ring-4 focus:ring-amber-100"
                />
              </label>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={() => handleProses(processData.id)}
                  disabled={processing}
                  className="flex-1 rounded-2xl bg-amber-600 py-4 text-sm font-black uppercase text-white shadow-lg shadow-amber-900/10 transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {processing ? "Memproses..." : "Simpan & Ubah ke Diproses"}
                </button>
                <button
                  onClick={closeProcessModal}
                  className="rounded-2xl border border-slate-200 px-5 py-4 text-sm font-black uppercase text-slate-500 transition hover:bg-slate-50"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showInfoForm && (
        <div className="fixed inset-0 z-[56] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-700">Informasi Publik</p>
                <h3 className="mt-1 text-xl font-black text-slate-950">{infoForm.id ? "Edit Data Informasi" : "Tambah Data Informasi"}</h3>
                <p className="mt-1 text-sm text-slate-500">Input data dan upload satu atau banyak berkas untuk ditampilkan di halaman depan.</p>
              </div>
              <button
                onClick={closeInfoForm}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-100 text-lg font-black text-slate-500 transition hover:bg-red-50 hover:text-red-600"
              >
                ×
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="md:col-span-2">
                <span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">Kategori Informasi</span>
                <select
                  value={infoForm.kategori}
                  onChange={(e) => setInfoForm((prev) => ({ ...prev, kategori: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-bold outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                >
                  {kategoriInformasi.map((kategori) => (
                    <option key={kategori} value={kategori}>
                      {kategori}
                    </option>
                  ))}
                </select>
              </label>

              <label className="md:col-span-2">
                <span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">Nama / Judul Dokumen</span>
                <input
                  type="text"
                  value={infoForm.judul}
                  onChange={(e) => setInfoForm((prev) => ({ ...prev, judul: e.target.value }))}
                  placeholder="Contoh: Laporan Realisasi Program Kerja 2026"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                />
              </label>

              <label>
                <span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">Tahun</span>
                <input
                  type="text"
                  value={infoForm.tahun}
                  onChange={(e) => setInfoForm((prev) => ({ ...prev, tahun: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                />
              </label>

              <label>
                <span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">Status Tampil</span>
                <select
                  value={infoForm.status_publish}
                  onChange={(e) => setInfoForm((prev) => ({ ...prev, status_publish: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-bold outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                >
                  <option value="Tampil">Tampil (Public)</option>
                  <option value="Private">Private (Hanya Terdaftar)</option>
                  <option value="Sembunyi">Sembunyi</option>
                </select>
              </label>

              <label className="md:col-span-2">
                <span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">Deskripsi / Keterangan</span>
                <textarea
                  value={infoForm.deskripsi}
                  onChange={(e) => setInfoForm((prev) => ({ ...prev, deskripsi: e.target.value }))}
                  rows="4"
                  placeholder="Keterangan singkat dokumen agar mudah dipahami pengunjung."
                  className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-medium leading-6 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                />
              </label>

              <label className="md:col-span-2 block rounded-3xl border-2 border-dashed border-slate-200 bg-white p-5 text-center transition hover:border-emerald-300 hover:bg-emerald-50/40">
                <span className="block text-sm font-black text-slate-800">Upload Berkas</span>
                <span className="mt-1 block text-xs text-slate-400">Bisa pilih banyak file sekaligus. PDF, Word, Excel, gambar, dan dokumen lain.</span>
                <input
                  type="file"
                  multiple
                  onChange={(e) => setInfoForm((prev) => ({ ...prev, files: Array.from(e.target.files || []) }))}
                  className="mt-4 text-xs font-bold text-slate-500 file:mr-4 file:rounded-xl file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-xs file:font-black file:uppercase file:text-white"
                />
                {infoForm.files?.length > 0 && (
                  <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-left">
                    {infoForm.files.map((file) => (
                      <p key={file.name} className="break-all text-xs font-semibold text-emerald-700">
                        • {file.name}
                      </p>
                    ))}
                  </div>
                )}
              </label>

              <button
                onClick={handleSaveInformasi}
                disabled={savingInfo}
                className="md:col-span-2 rounded-2xl bg-emerald-700 py-4 text-sm font-black uppercase tracking-wide text-white shadow-lg shadow-emerald-900/10 transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {savingInfo ? "Menyimpan..." : infoForm.id ? "Simpan Perubahan" : "Simpan & Tampilkan di Halaman Depan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {previewFile && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-5xl overflow-hidden rounded-[2rem] bg-white shadow-2xl">
            <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-700">{previewFile.label}</p>
                <h3 className="mt-1 break-all text-lg font-black text-slate-950">{previewFile.fileName}</h3>
              </div>
              <div className="flex gap-2">
                <a
                  href={previewFile.url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-2xl border border-slate-200 px-4 py-2.5 text-xs font-black uppercase text-slate-600 transition hover:bg-slate-50"
                >
                  Buka Tab Baru
                </a>
                <button
                  onClick={() => setPreviewFile(null)}
                  className="rounded-2xl bg-slate-900 px-4 py-2.5 text-xs font-black uppercase text-white transition hover:bg-red-600"
                >
                  Tutup
                </button>
              </div>
            </div>

            {renderPreviewContent()}
          </div>
        </div>
      )}
    </div>
  );
  
};

export default DashboardAdmin;
