import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api, getUploadUrl } from "../api";

export default function DashboardUser() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [permohonan, setPermohonan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, diproses: 0, selesai: 0 });

  useEffect(() => {
    const loggedInUser = localStorage.getItem("user");
    if (loggedInUser && loggedInUser !== "undefined") {
      try {
        const parsed = JSON.parse(loggedInUser);
        setUser(parsed);
        fetchPermohonan(parsed.id);
      } catch (e) {
        console.error(e);
        navigate("/login");
      }
    } else {
      navigate("/login");
    }
  }, [navigate]);

  const fetchPermohonan = async (userId) => {
    try {
      setLoading(true);
      const res = await api.get(`/api/permohonan/${userId}`);
      const data = Array.isArray(res.data) ? res.data : [];
      setPermohonan(data);

      // Hitung statistik
      const total = data.length;
      const diproses = data.filter((p) => 
        ["Pending", "Diverifikasi", "Diproses"].includes(p.status)
      ).length;
      const selesai = data.filter((p) => p.status === "Selesai").length;

      setStats({ total, diproses, selesai });
    } catch (error) {
      console.error("Gagal memuat permohonan:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      Pending: { bg: "bg-amber-100", text: "text-amber-800", icon: "⏳" },
      Diverifikasi: { bg: "bg-blue-100", text: "text-blue-800", icon: "✓" },
      Diproses: { bg: "bg-purple-100", text: "text-purple-800", icon: "🔄" },
      Selesai: { bg: "bg-emerald-100", text: "text-emerald-800", icon: "✅" },
      Ditolak: { bg: "bg-red-100", text: "text-red-800", icon: "❌" },
    };

    const config = statusConfig[status] || statusConfig.Pending;

    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${config.bg} ${config.text}`}>
        {config.icon} {status}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="h-12 w-12 mx-auto animate-spin rounded-full border-4 border-emerald-600 border-t-transparent"></div>
          <p className="mt-4 text-sm font-bold text-slate-500">Memuat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">
            Dashboard User
          </h1>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Selamat Datang,</p>
              <p className="text-sm font-bold text-emerald-700">{user.nama_lengkap}</p>
            </div>
            <button
              onClick={() => {
                localStorage.removeItem("user");
                localStorage.removeItem("token");
                navigate("/login");
              }}
              className="text-xs text-slate-600 hover:text-red-600 font-bold"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6 max-w-7xl mx-auto">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <StatCard
            label="Total Permohonan"
            value={stats.total}
            color="emerald"
            icon=""
          />
          <StatCard
            label="Diproses"
            value={stats.diproses}
            color="amber"
            icon="⏳"
          />
          <StatCard
            label="Selesai"
            value={stats.selesai}
            color="blue"
            icon="✅"
          />
        </div>

        {/* Banner Buat Permohonan */}
        <div className="bg-gradient-to-r from-emerald-700 to-emerald-900 rounded-2xl p-6 mb-6 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          </div>
          <div className="relative flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black uppercase tracking-tight">
                Butuh Informasi Publik?
              </h2>
              <p className="text-sm text-emerald-100 mt-1">
                Klik tombol untuk mengajukan permohonan baru.
              </p>
            </div>
            <Link
              to="/form-permohonan"
              className="bg-white text-emerald-700 px-6 py-3 rounded-xl font-black uppercase text-xs tracking-wider hover:bg-emerald-50 transition shadow-lg"
            >
              Buat Permohonan
            </Link>
          </div>
        </div>

        {/* Tabel Permohonan */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
            <h3 className="font-black text-slate-900 uppercase tracking-tight text-sm">
              Riwayat Permohonan
            </h3>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="h-10 w-10 mx-auto animate-spin rounded-full border-4 border-emerald-600 border-t-transparent"></div>
              <p className="mt-3 text-xs text-slate-500">Memuat data...</p>
            </div>
          ) : permohonan.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-5xl mb-3">📭</div>
              <p className="text-sm font-bold text-slate-700">Belum ada permohonan</p>
              <p className="text-xs text-slate-500 mt-1">
                Klik "Buat Permohonan" untuk mengajukan permohonan pertama Anda.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left">Subjek</th>
                    <th className="px-6 py-3 text-left">Tanggal</th>
                    <th className="px-6 py-3 text-left">No. Pendaftaran</th>
                    <th className="px-6 py-3 text-left">Status & Estimasi</th>
                    <th className="px-6 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {permohonan.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900 text-xs">
                          {item.rincian_informasi || item.subjek || "Permohonan Informasi"}
                        </p>
                        {item.nomor_pendaftaran && (
                          <p className="text-[10px] text-emerald-700 font-bold mt-1">
                            #{item.nomor_pendaftaran}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-600">
                        {formatDate(item.tanggal_pengajuan)}
                      </td>
                      <td className="px-6 py-4 text-xs font-mono text-slate-700">
                        {item.nomor_pendaftaran || "-"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {getStatusBadge(item.status)}
                          {item.estimasi && (
                            <p className="text-[10px] text-slate-500">
                              Estimasi: {formatDate(item.estimasi)}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => navigate(`/permohonan/${item.id}`)}
                          className="text-xs text-emerald-700 hover:text-emerald-900 font-bold"
                        >
                          Detail →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// Sub-component: StatCard
function StatCard({ label, value, color, icon }) {
  const colorClasses = {
    emerald: "border-emerald-200 bg-emerald-50",
    amber: "border-amber-200 bg-amber-50",
    blue: "border-blue-200 bg-blue-50",
  };

  return (
    <div className={`rounded-2xl border-2 ${colorClasses[color]} p-5`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-600">
            {label}
          </p>
          <p className="text-3xl font-black text-slate-900 mt-1">{value}</p>
        </div>
        <div className="text-4xl opacity-50">{icon}</div>
      </div>
    </div>
  );
}