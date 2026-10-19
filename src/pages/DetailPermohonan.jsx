import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api, getUploadUrl } from "../api";

export default function DetailPermohonan() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/api/permohonan/${id}/detail`);
        setData(res.data);
      } catch (err) {
        console.error(err);
        setError("Gagal memuat detail permohonan. Permohonan tidak ditemukan atau Anda tidak memiliki akses.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      Pending: { bg: "bg-amber-100", text: "text-amber-800", icon: "" },
      Diverifikasi: { bg: "bg-blue-100", text: "text-blue-800", icon: "✓" },
      Diproses: { bg: "bg-purple-100", text: "text-purple-800", icon: "🔄" },
      Selesai: { bg: "bg-emerald-100", text: "text-emerald-800", icon: "✅" },
      Ditolak: { bg: "bg-red-100", text: "text-red-800", icon: "❌" },
    };
    const config = statusConfig[status] || statusConfig.Pending;
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${config.bg} ${config.text}`}>
        {config.icon} {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="h-12 w-12 mx-auto animate-spin rounded-full border-4 border-emerald-600 border-t-transparent"></div>
          <p className="mt-4 text-sm font-bold text-slate-500">Memuat detail permohonan...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 max-w-md w-full text-center">
          <div className="text-5xl mb-3">️</div>
          <h2 className="text-lg font-black text-slate-900 mb-2">Permohonan Tidak Ditemukan</h2>
          <p className="text-sm text-slate-500 mb-6">{error || "Data permohonan tidak dapat dimuat."}</p>
          <button
            onClick={() => navigate("/dashboard-user")}
            className="bg-emerald-700 text-white px-6 py-3 rounded-xl font-black uppercase text-xs tracking-wider hover:bg-emerald-800 transition"
          >
            Kembali ke Dashboard
          </button>
        </div>
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
            <button
              onClick={() => navigate(-1)}
              className="text-emerald-200 hover:text-white text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2"
            >
              ← Kembali
            </button>
            <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.25em] text-emerald-300/90">
              PPID MAN 2 Palembang
            </p>
            <h1 className="mt-2 text-2xl md:text-3xl font-black uppercase tracking-tight">
              Detail Permohonan
            </h1>
            {data.nomor_pendaftaran && (
              <p className="mt-2 text-sm text-emerald-100 font-bold">
                No. Pendaftaran: {data.nomor_pendaftaran}
              </p>
            )}
          </div>
        </div>

        {/* Status Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-slate-500">Status Permohonan</p>
              <div className="mt-2">{getStatusBadge(data.status)}</div>
            </div>
            <div className="text-right">
              <p className="text-xs font-black uppercase tracking-wider text-slate-500">Tanggal Pengajuan</p>
              <p className="mt-1 text-sm font-bold text-slate-900">{formatDate(data.tanggal_pengajuan)}</p>
            </div>
          </div>
          {data.estimasi && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-xs font-black uppercase tracking-wider text-slate-500">Estimasi Waktu</p>
              <p className="mt-1 text-sm font-bold text-amber-700">{data.estimasi}</p>
            </div>
          )}
        </div>

        {/* Data Pemohon */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
          <h2 className="text-lg font-black text-emerald-900 uppercase tracking-tight border-b-2 border-emerald-100 pb-2 mb-4">
            📋 Data Pemohon
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoField label="Nama Lengkap" value={data.nama_lengkap} />
            <InfoField label="Nomor KTP" value={data.nomor_ktp || data.nik} />
            <InfoField label="Email" value={data.email_pemohon || data.email} />
            <InfoField label="No. HP" value={data.no_hp} />
            <InfoField label="Pekerjaan" value={data.pekerjaan} className="md:col-span-2" />
            <InfoField label="Alamat Lengkap" value={data.alamat} className="md:col-span-2" />
          </div>
        </div>

        {/* Detail Permohonan */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
          <h2 className="text-lg font-black text-emerald-900 uppercase tracking-tight border-b-2 border-emerald-100 pb-2 mb-4">
            📄 Detail Permohonan
          </h2>
          <div className="space-y-4">
            <InfoField label="Rincian Informasi yang Dimohonkan" value={data.rincian_informasi || data.subjek} large />
            <InfoField label="Tujuan Penggunaan Informasi" value={data.tujuan_penggunaan || data.tujuan_informasi} large />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoField label="Cara Memperoleh Informasi" value={data.cara_memperoleh} />
              <InfoField label="Cara Mendapatkan Salinan" value={data.cara_salinan} />
            </div>
          </div>
        </div>

        {/* Dokumen Upload */}
        {(data.file_ktp || data.file_foto || data.berkas_permohonan) && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
            <h2 className="text-lg font-black text-emerald-900 uppercase tracking-tight border-b-2 border-emerald-100 pb-2 mb-4">
              📎 Dokumen yang Diupload
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.file_ktp && (
                <DocumentCard
                  label="KTP/SIM/Paspor"
                  fileName={data.file_ktp}
                  color="blue"
                />
              )}
              {data.file_foto && (
                <DocumentCard
                  label="Foto Selfie"
                  fileName={data.file_foto}
                  color="purple"
                />
              )}
              {data.berkas_permohonan && (
                <DocumentCard
                  label="Berkas Permohonan"
                  fileName={data.berkas_permohonan}
                  color="emerald"
                />
              )}
            </div>
          </div>
        )}

        {/* Jawaban Admin */}
        {data.pesan_admin && (
          <div className="bg-white rounded-2xl border border-emerald-200 shadow-sm p-6 mb-6">
            <h2 className="text-lg font-black text-emerald-900 uppercase tracking-tight border-b-2 border-emerald-100 pb-2 mb-4">
              💬 Jawaban Admin
            </h2>
            <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{data.pesan_admin}</p>
              {data.tanggal_jawaban && (
                <p className="mt-3 text-xs text-slate-500 font-bold">
                  Dibalas pada: {formatDate(data.tanggal_jawaban)}
                </p>
              )}
            </div>
            {data.berkas_balasan && (
              <div className="mt-4">
                <DocumentCard
                  label="Berkas Balasan Admin"
                  fileName={data.berkas_balasan}
                  color="emerald"
                />
              </div>
            )}
          </div>
        )}

        {/* Alasan Penolakan */}
        {data.alasan_penolakan && (
          <div className="bg-white rounded-2xl border border-red-200 shadow-sm p-6 mb-6">
            <h2 className="text-lg font-black text-red-900 uppercase tracking-tight border-b-2 border-red-100 pb-2 mb-4">
              ❌ Alasan Penolakan
            </h2>
            <div className="bg-red-50 rounded-xl p-4 border border-red-100">
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{data.alasan_penolakan}</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex-1 bg-white border-2 border-emerald-700 text-emerald-700 py-3 rounded-xl font-black uppercase text-xs tracking-wider hover:bg-emerald-50 transition"
          >
            Kembali
          </button>
          <button
            onClick={() => navigate("/dashboard-user")}
            className="flex-1 bg-emerald-700 text-white py-3 rounded-xl font-black uppercase text-xs tracking-wider hover:bg-emerald-800 transition"
          >
            Dashboard User
          </button>
        </div>
      </div>
    </div>
  );
}

// Sub-components
function InfoField({ label, value, large = false, className = "" }) {
  return (
    <div className={className}>
      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">{label}</p>
      <p className={`text-sm font-bold text-slate-800 ${large ? "leading-relaxed" : ""}`}>
        {value || "-"}
      </p>
    </div>
  );
}

function DocumentCard({ label, fileName, color = "blue" }) {
  const colorClasses = {
    blue: "border-blue-100 bg-blue-50 text-blue-700",
    purple: "border-purple-100 bg-purple-50 text-purple-700",
    emerald: "border-emerald-100 bg-emerald-50 text-emerald-700",
  };

  const getFileUrl = (fileNameOrUrl) => {
    if (!fileNameOrUrl) return "#";
    if (/^https?:\/\//i.test(fileNameOrUrl)) return fileNameOrUrl;
    return getUploadUrl(fileNameOrUrl);
  };

  return (
    <a
      href={getFileUrl(fileName)}
      target="_blank"
      rel="noreferrer"
      className={`block rounded-xl border-2 ${colorClasses[color]} p-4 hover:shadow-md transition`}
    >
      <p className="text-[10px] font-black uppercase tracking-wider opacity-70 mb-1">{label}</p>
      <p className="text-xs font-bold truncate">{fileName}</p>
      <p className="text-[10px] font-bold uppercase mt-2 opacity-70">Klik untuk buka →</p>
    </a>
  );
}