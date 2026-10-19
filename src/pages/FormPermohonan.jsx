import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import  ModalPernyataan from "../components/ModalPernyataan";

export default function FormPermohonan() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [previewFiles, setPreviewFiles] = useState({ ktp: null, foto: null });

  const [formData, setFormData] = useState({
    nama_lengkap: "",
    nomor_ktp: "",
    alamat: "",
    pekerjaan: "",
    no_hp: "",
    email_pemohon: "",
    rincian_informasi: "",
    tujuan_penggunaan: "",
    cara_memperoleh: "",
    cara_salinan: "",
    file_ktp: null,
    file_foto: null,
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    const loggedInUser = localStorage.getItem("user");
    if (loggedInUser && loggedInUser !== "undefined") {
      try {
        const parsed = JSON.parse(loggedInUser);
        setUser(parsed);
        setFormData((prev) => ({
          ...prev,
          nama_lengkap: parsed.nama_lengkap || "",
          email_pemohon: parsed.email || "",
          no_hp: parsed.no_hp || "",
        }));
      } catch (e) {
        console.error(e);
      }
    } else {
      navigate("/login");
    }
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    const file = files[0];
    
    if (file) {
      // Validasi ukuran (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({
          ...prev,
          [name]: "Ukuran file maksimal 5MB",
        }));
        return;
      }

      // Validasi tipe file
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
      if (!allowedTypes.includes(file.type)) {
        setErrors((prev) => ({
          ...prev,
          [name]: "Format file: JPG, PNG, atau PDF",
        }));
        return;
      }

      setFormData((prev) => ({ ...prev, [name]: file }));
      setPreviewFiles((prev) => ({
        ...prev,
        [name === "file_ktp" ? "ktp" : "foto"]: URL.createObjectURL(file),
      }));
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const requiredFields = [
      "nama_lengkap",
      "nomor_ktp",
      "alamat",
      "rincian_informasi",
      "tujuan_penggunaan",
      "cara_memperoleh",
      "cara_salinan",
    ];

    requiredFields.forEach((field) => {
      if (!formData[field] || !String(formData[field]).trim()) {
        newErrors[field] = "Field ini wajib diisi";
      }
    });

    if (formData.nomor_ktp && formData.nomor_ktp.length !== 16) {
      newErrors.nomor_ktp = "Nomor KTP harus 16 digit";
    }

    if (!formData.file_ktp) {
      newErrors.file_ktp = "Upload KTP/SIM/Paspor wajib";
    }

    if (!formData.file_foto) {
      newErrors.file_foto = "Upload foto selfie wajib";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmitClick = () => {
    if (validateForm()) {
      setShowModal(true);
    }
  };

  const handleConfirmSubmit = async () => {
  setLoading(true);
  try {
    const formDataToSend = new FormData();
    
    Object.keys(formData).forEach((key) => {
      if (formData[key] !== null && formData[key] !== undefined) {
        formDataToSend.append(key, formData[key]);
      }
    });

    // ✅ PENTING: Pastikan ini string "true"
    formDataToSend.append("pernyataan_disetujui", "true");

    const response = await api.post("/api/permohonan", formDataToSend, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    alert(
      `Permohonan berhasil dikirim!\n\nNomor Pendaftaran: ${response.data.nomor_pendaftaran}\n\nSilakan simpan nomor ini untuk tracking status.`
    );
    
    // ✅ Gunakan route yang benar
    navigate("/permohonan-baru");
  } catch (error) {
    console.error("Error submitting form:", error);
    alert(error.response?.data?.message || "Gagal mengirim permohonan");
  } finally {
    setLoading(false);
    setShowModal(false);
  }
};

const handleCetakFormulir = async () => {
  if (!validateForm()) {
    alert("Mohon lengkapi semua field yang wajib diisi terlebih dahulu!");
    return;
  }

  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;
  let y = 15;

  // ============================================
  // HEADER - KOP SURAT
  // ============================================
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('KEMENTERIAN AGAMA', pageWidth / 2, y, { align: 'center' });
  y += 5;
  doc.setFontSize(10);
  doc.text('PEJABAT PENGELOLA INFORMASI DAN DOKUMENTASI (PPID)', pageWidth / 2, y, { align: 'center' });
  y += 5;
  doc.text('UNIT MADRASAH ALIYAH NEGERI 2 PALEMBANG', pageWidth / 2, y, { align: 'center' });
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Alamat: Jl. Prof. K.H. Zainal Abidin Fikri (Komplek UIN Raden Fatah Palembang), 30126.', pageWidth / 2, y, { align: 'center' });
  y += 4;
  doc.text('Situs Website: https://ppid.man2plg.sch.id    WhatsApp Humas: 0821 8697 2771', pageWidth / 2, y, { align: 'center' });
  y += 4;

  // Keterangan
  doc.setFontSize(7);
  doc.text('Keterangan: * Diisi oleh petugas    ** Pilih salah satu dengan memberi tanda (✓)', pageWidth / 2, y, { align: 'center' });
  y += 3;

  // Garis bawah header
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // ============================================
  // JUDUL FORMULIR
  // ============================================
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('FORMULIR PERMOHONAN INFORMASI PUBLIK', pageWidth / 2, y, { align: 'center' });
  y += 10;

  // Nomor Pendaftaran
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Nomor Pendaftaran*: ....../PPID/MAN2PLG/PIP/..../20....', margin, y);
  y += 10;

  // ============================================
  // DATA PEMOHON
  // ============================================
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Yang bertandatangan di bawah ini, mengajukan permohonan informasi:', margin, y);
  y += 8;

  const drawField = (label, value, yPos) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const labelWidth = 45;
    doc.text(label, margin, yPos);
    doc.text(':', margin + labelWidth, yPos);
    
    // Garis titik-titik
    const startX = margin + labelWidth + 5;
    const endX = pageWidth - margin;
    doc.setDrawColor(100);
    doc.setLineWidth(0.2);
    doc.setLineDashPattern([1, 1], 0);
    doc.line(startX, yPos + 1, endX, yPos + 1);
    
    // Isi nilai di atas garis
    doc.setFont('helvetica', 'bold');
    const displayValue = String(value || '').substring(0, 60);
    doc.text(displayValue, startX + 2, yPos);
    doc.setLineDashPattern([], 0);
    
    return yPos + 7;
  };

  y = drawField('Nama Pemohon', formData.nama_lengkap, y);
  y = drawField('Nomor KTP', formData.nomor_ktp, y);
  y = drawField('Alamat Lengkap', formData.alamat, y);
  y = drawField('Pekerjaan', formData.pekerjaan || '-', y);
  y = drawField('Nomor Telepon/HP', formData.no_hp, y);
  y = drawField('Email', formData.email_pemohon, y);
  y += 3;

  // ============================================
  // RINCIAN PERMOHONAN
  // ============================================
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Dengan ini bermaksud untuk mengajukan permohonan informasi, dengan rincian sebagai berikut:', margin, y);
  y += 8;

  // Rincian Informasi
  doc.setFont('helvetica', 'bold');
  doc.text('Rincian Informasi yang Dimohonkan:', margin, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  const rincianLines = doc.splitTextToSize(formData.rincian_informasi || '-', contentWidth - 10);
  doc.text(rincianLines, margin + 5, y);
  y += rincianLines.length * 5 + 3;

  // Tujuan Penggunaan
  doc.setFont('helvetica', 'bold');
  doc.text('Tujuan Penggunaan Informasi:', margin, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  const tujuanLines = doc.splitTextToSize(formData.tujuan_penggunaan || '-', contentWidth - 10);
  doc.text(tujuanLines, margin + 5, y);
  y += tujuanLines.length * 5 + 5;

  // ============================================
  // CARA MEMPEROLEH INFORMASI (dengan checkbox)
  // ============================================
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Cara Memperoleh Informasi**:', margin, y);
  y += 6;

  const drawCheckbox = (text, isChecked, xPos, yPos) => {
    doc.setDrawColor(0);
    doc.setLineWidth(0.3);
    doc.rect(xPos, yPos - 3, 4, 4);
    if (isChecked) {
      doc.setFont('helvetica', 'bold');
      doc.text('✓', xPos + 0.5, yPos);
    }
    doc.setFont('helvetica', 'normal');
    doc.text(text, xPos + 7, yPos);
    return yPos + 6;
  };

  const caraMemperolehOptions = [
    'Melihat/membaca/mendengar/mencatat',
    'Mendapat salinan informasi hard copy',
    'Mendapat salinan informasi soft copy',
  ];
  caraMemperolehOptions.forEach((opt) => {
    const isChecked = formData.cara_memperoleh === opt;
    y = drawCheckbox(opt, isChecked, margin + 5, y);
  });
  y += 2;

  // ============================================
  // CARA MENDAPATKAN SALINAN (dengan checkbox)
  // ============================================
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Cara Mendapatkan Salinan:', margin, y);
  y += 6;

  const caraSalinanOptions = [
    'Mengambil langsung',
    'Dikirim melalui email',
    'Dikirim melalui whatsapp',
    'Lainnya',
  ];
  caraSalinanOptions.forEach((opt) => {
    const isChecked = formData.cara_salinan === opt;
    y = drawCheckbox(opt, isChecked, margin + 5, y);
  });
  y += 5;

  // ============================================
  // PERNYATAAN
  // ============================================
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9);
  const pernyataanText = 'Pemohon menyatakan bahwa informasi yang diperoleh akan digunakan sesuai dengan tujuan yang disampaikan serta mematuhi ketentuan peraturan perundang-undangan yang berlaku.';
  const pernyataanLines = doc.splitTextToSize(pernyataanText, contentWidth);
  doc.text(pernyataanLines, margin, y);
  y += pernyataanLines.length * 5 + 15;

  // ============================================
  // TANDA TANGAN
  // ============================================
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Palembang, .......................20.....', pageWidth - margin - 60, y);
  y += 20;

  doc.text('Petugas Layanan Informasi', margin + 20, y);
  doc.text('Pemohon Informasi,', pageWidth - margin - 60, y);
  y += 20;

  doc.text('(..........................................)', margin + 20, y);
  doc.text('(...................................................)', pageWidth - margin - 60, y);
  y += 5;
  doc.setFont('helvetica', 'bold');
  doc.text(formData.nama_lengkap, pageWidth - margin - 60, y, { align: 'center' });

  // ============================================
  // SIMPAN PDF
  // ============================================
  doc.save(`Formulir_Permohonan_${formData.nama_lengkap.replace(/\s+/g, '_')}.pdf`);
};
  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-emerald-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-950 rounded-2xl p-6 md:p-8 mb-6 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          </div>
          <div className="relative">
            <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.25em] text-emerald-300/90">
              PPID MAN 2 Palembang
            </p>
            <h1 className="mt-2 text-2xl md:text-3xl font-black uppercase tracking-tight">
              Formulir Permohonan Informasi Publik
            </h1>
            <div className="mt-3 h-1 w-16 bg-emerald-400 rounded-full"></div>
            <p className="mt-3 text-xs md:text-sm text-emerald-100">
              Lengkapi data di bawah ini dengan sebenar-benarnya sesuai identitas resmi Anda.
            </p>
          </div>
        </div>

        {/* Form */}
        <form className="bg-white rounded-2xl border border-slate-200 shadow-xl p-6 md:p-8 space-y-6">
          {/* Data Pribadi */}
          <section>
            <h2 className="text-lg font-black text-emerald-900 uppercase tracking-tight border-b-2 border-emerald-100 pb-2 mb-4">
              📋 Data Pemohon
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField
                label="Nama Lengkap *"
                name="nama_lengkap"
                value={formData.nama_lengkap}
                onChange={handleChange}
                error={errors.nama_lengkap}
                placeholder="Sesuai KTP"
              />
              <InputField
                label="Nomor KTP *"
                name="nomor_ktp"
                value={formData.nomor_ktp}
                onChange={handleChange}
                error={errors.nomor_ktp}
                placeholder="16 digit nomor KTP"
                maxLength={16}
              />
              <InputField
                label="Nomor Telepon/HP *"
                name="no_hp"
                value={formData.no_hp}
                onChange={handleChange}
                error={errors.no_hp}
                placeholder="08xxxxxxxxxx"
              />
              <InputField
                label="Email *"
                name="email_pemohon"
                type="email"
                value={formData.email_pemohon}
                onChange={handleChange}
                error={errors.email_pemohon}
                placeholder="email@example.com"
              />
              <InputField
                label="Pekerjaan"
                name="pekerjaan"
                value={formData.pekerjaan}
                onChange={handleChange}
                placeholder="Pekerjaan Anda"
                className="md:col-span-2"
              />
              <TextAreaField
                label="Alamat Lengkap *"
                name="alamat"
                value={formData.alamat}
                onChange={handleChange}
                error={errors.alamat}
                placeholder="Alamat sesuai KTP"
                className="md:col-span-2"
              />
            </div>
          </section>

          {/* Detail Permohonan */}
          <section>
            <h2 className="text-lg font-black text-emerald-900 uppercase tracking-tight border-b-2 border-emerald-100 pb-2 mb-4">
               Detail Permohonan
            </h2>
            <div className="space-y-4">
              <TextAreaField
                label="Rincian Informasi yang Dimohonkan *"
                name="rincian_informasi"
                value={formData.rincian_informasi}
                onChange={handleChange}
                error={errors.rincian_informasi}
                placeholder="Jelaskan informasi apa yang Anda butuhkan..."
                rows={4}
              />
              <TextAreaField
                label="Tujuan Penggunaan Informasi *"
                name="tujuan_penggunaan"
                value={formData.tujuan_penggunaan}
                onChange={handleChange}
                error={errors.tujuan_penggunaan}
                placeholder="Untuk apa informasi ini digunakan..."
                rows={3}
              />
            </div>
          </section>

          {/* Cara Memperoleh */}
          <section>
            <h2 className="text-lg font-black text-emerald-900 uppercase tracking-tight border-b-2 border-emerald-100 pb-2 mb-4">
              📮 Cara Memperoleh Informasi
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <RadioGroup
                label="Cara Memperoleh Informasi *"
                name="cara_memperoleh"
                value={formData.cara_memperoleh}
                onChange={handleChange}
                error={errors.cara_memperoleh}
                options={[
                  "Melihat/membaca/mendengar/mencatat",
                  "Mendapat salinan hard copy",
                  "Mendapat salinan soft copy",
                ]}
              />
              <RadioGroup
                label="Cara Mendapatkan Salinan *"
                name="cara_salinan"
                value={formData.cara_salinan}
                onChange={handleChange}
                error={errors.cara_salinan}
                options={[
                  "Mengambil langsung",
                  "Dikirim melalui email",
                  "Dikirim melalui WhatsApp",
                ]}
              />
            </div>
          </section>

          {/* Upload File */}
          <section>
            <h2 className="text-lg font-black text-emerald-900 uppercase tracking-tight border-b-2 border-emerald-100 pb-2 mb-4">
              📎 Upload Dokumen
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FileUploadField
                label="KTP/SIM/Paspor *"
                name="file_ktp"
                onChange={handleFileChange}
                error={errors.file_ktp}
                preview={previewFiles.ktp}
                accept="image/jpeg,image/png,application/pdf"
              />
              <FileUploadField
                label="Foto Selfie dengan KTP *"
                name="file_foto"
                onChange={handleFileChange}
                error={errors.file_foto}
                preview={previewFiles.foto}
                accept="image/jpeg,image/png"
              />
            </div>
            <p className="text-[10px] text-slate-500 mt-2 italic">
              * Format: JPG, PNG, atau PDF. Maksimal 5MB per file.
            </p>
          </section>

          {/* Action Buttons */}
<div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-slate-200">
  <button
  type="button"
  onClick={handleCetakFormulir}
  className="flex-1 bg-slate-100 text-slate-800 py-3 rounded-xl font-black uppercase text-xs tracking-wider hover:bg-slate-200 transition flex items-center justify-center gap-2"
>
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
    </svg>
    Cetak Formulir
  </button>
  <button
    type="button"
    onClick={handleSubmitClick}
    disabled={loading}
    className="flex-1 bg-emerald-700 text-white py-3 rounded-xl font-black uppercase text-xs tracking-wider hover:bg-emerald-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
  >
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
    </svg>
    {loading ? "Mengirim..." : "Kirim Permohonan"}
  </button>
  <button
    type="button"
    onClick={() => navigate("/dashboard-user")}
    className="flex-1 bg-white border-2 border-emerald-700 text-emerald-700 py-3 rounded-xl font-black uppercase text-xs tracking-wider hover:bg-emerald-50 transition"
  >
    Batal
  </button>
</div>
        </form>

       {showModal && (
  <ModalPernyataan
    formData={formData}
    previewFiles={previewFiles}
    onConfirm={handleConfirmSubmit}
    onCancel={() => setShowModal(false)}
    loading={loading}
  />
)}
      </div>
    </div>
  );
}

// ============ SUB-COMPONENTS ============

function InputField({ label, name, value, onChange, error, placeholder, type = "text", maxLength, className = "" }) {
  return (
    <div className={className}>
      <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
        {label}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        maxLength={maxLength}
        className={`w-full px-3 py-2.5 rounded-lg border ${
          error ? "border-red-400 bg-red-50" : "border-slate-200"
        } text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 outline-none transition`}
      />
      {error && <p className="text-[10px] text-red-600 mt-1 font-medium">{error}</p>}
    </div>
  );
}

function TextAreaField({ label, name, value, onChange, error, placeholder, rows = 3, className = "" }) {
  return (
    <div className={className}>
      <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
        {label}
      </label>
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        className={`w-full px-3 py-2.5 rounded-lg border ${
          error ? "border-red-400 bg-red-50" : "border-slate-200"
        } text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 outline-none transition resize-none`}
      />
      {error && <p className="text-[10px] text-red-600 mt-1 font-medium">{error}</p>}
    </div>
  );
}

function RadioGroup({ label, name, value, onChange, error, options }) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
        {label}
      </label>
      <div className="space-y-2">
        {options.map((option) => (
          <label
            key={option}
            className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition ${
              value === option
                ? "border-emerald-500 bg-emerald-50"
                : "border-slate-200 hover:border-emerald-300"
            }`}
          >
            <input
              type="radio"
              name={name}
              value={option}
              checked={value === option}
              onChange={onChange}
              className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-xs text-slate-700">{option}</span>
          </label>
        ))}
      </div>
      {error && <p className="text-[10px] text-red-600 mt-1 font-medium">{error}</p>}
    </div>
  );
}

function FileUploadField({ label, name, onChange, error, preview, accept }) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
        {label}
      </label>
      <div className={`border-2 border-dashed rounded-lg p-4 text-center ${
        error ? "border-red-400 bg-red-50" : "border-slate-300 hover:border-emerald-400"
      } transition`}>
        {preview ? (
          <div className="space-y-2">
            <img
              src={preview}
              alt="Preview"
              className="max-h-32 mx-auto rounded-lg shadow-sm"
            />
            <p className="text-[10px] text-emerald-700 font-bold">✓ File terpilih</p>
          </div>
        ) : (
          <div className="space-y-2">
            <svg className="w-8 h-8 mx-auto text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-[10px] text-slate-500">Klik untuk upload</p>
          </div>
        )}
        <input
          type="file"
          name={name}
          onChange={onChange}
          accept={accept}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          style={{ position: "relative" }}
        />
      </div>
      {error && <p className="text-[10px] text-red-600 mt-1 font-medium">{error}</p>}
    </div>
  );
}

