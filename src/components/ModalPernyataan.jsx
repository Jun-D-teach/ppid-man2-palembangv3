export default function ModalPernyataan({ formData, previewFiles, onConfirm, onCancel, loading }) {
  const [checked, setChecked] = useState(false);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 my-8">
        {/* Header */}
        <div className="bg-gradient-to-br from-emerald-900 to-emerald-800 p-6 rounded-t-2xl text-white">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-white/20 text-2xl">
              ️
            </div>
            <div>
              <h3 className="text-lg font-black uppercase tracking-tight">
                Pernyataan Kebenaran Data
              </h3>
              <p className="text-[10px] text-emerald-200 uppercase tracking-wider">
                Baca dan setujui sebelum mengirim permohonan
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Preview Data */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <h4 className="text-xs font-black text-emerald-900 uppercase mb-3">
               Ringkasan Data Pemohon
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-500">Nama:</span>
                <p className="font-bold text-slate-800">{formData.nama_lengkap}</p>
              </div>
              <div>
                <span className="text-slate-500">No. KTP:</span>
                <p className="font-bold text-slate-800">{formData.nomor_ktp}</p>
              </div>
              <div className="col-span-2">
                <span className="text-slate-500">Alamat:</span>
                <p className="font-bold text-slate-800">{formData.alamat}</p>
              </div>
            </div>
          </div>

          {/* Preview Upload */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <h4 className="text-xs font-black text-emerald-900 uppercase mb-3">
              📎 Dokumen yang Diupload
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] text-slate-500 mb-1">KTP/SIM/Paspor:</p>
                {previewFiles.ktp && (
                  <img
                    src={previewFiles.ktp}
                    alt="KTP"
                    className="w-full h-24 object-cover rounded-lg border border-slate-200"
                  />
                )}
              </div>
              <div>
                <p className="text-[10px] text-slate-500 mb-1">Foto Selfie:</p>
                {previewFiles.foto && (
                  <img
                    src={previewFiles.foto}
                    alt="Foto"
                    className="w-full h-24 object-cover rounded-lg border border-slate-200"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Pernyataan Legal */}
          <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg">
            <h4 className="text-xs font-black text-amber-900 uppercase mb-2">
              ⚠️ Pernyataan Hukum
            </h4>
            <p className="text-xs text-slate-700 leading-relaxed mb-3">
              Dengan ini saya menyatakan bahwa data dan dokumen yang saya berikan adalah <strong>benar dan dapat dipertanggungjawabkan</strong>. 
              Saya memahami bahwa pemberian keterangan palsu dapat dikenakan sanksi sesuai dengan:
            </p>
            <ul className="text-[11px] text-slate-600 space-y-1 ml-4 list-disc">
              <li>
                <strong>UU No. 14 Tahun 2008 tentang Keterbukaan Informasi Publik</strong>
                <br />
                <a
                  href="https://peraturan.bpk.go.id/Details/39104/uu-no-14-tahun-2008"
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-700 hover:underline font-bold"
                >
                  Lihat Peraturan →
                </a>
              </li>
              <li>
                <strong>Pasal 19 ayat (1)</strong>: Pidana penjara maksimal 1 tahun dan/atau denda Rp5.000.000
              </li>
              <li>
                <strong>Pasal 22</strong>: Sanksi bagi pemohon yang menyalahgunakan informasi
              </li>
              <li>
                <strong>Peraturan Komisi Informasi No. 1 Tahun 2010</strong> tentang Standar Layanan Informasi Publik
              </li>
            </ul>
          </div>

          {/* Checkbox */}
          <label className="flex items-start gap-3 p-4 bg-emerald-50 rounded-xl border border-emerald-200 cursor-pointer hover:bg-emerald-100 transition">
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
              className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500 mt-0.5"
            />
            <span className="text-xs text-slate-700 leading-relaxed">
              Saya menyatakan bahwa <strong>semua data dan dokumen yang saya berikan adalah benar</strong>, 
              dan saya bersedia <strong>diproses sesuai hukum yang berlaku</strong> apabila terdapat 
              keterangan palsu atau penyalahgunaan informasi.
            </span>
          </label>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-200 bg-slate-50 rounded-b-2xl flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 bg-white border-2 border-slate-300 text-slate-700 py-3 rounded-xl font-black uppercase text-xs tracking-wider hover:bg-slate-100 transition disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!checked || loading}
            className="flex-1 bg-emerald-700 text-white py-3 rounded-xl font-black uppercase text-xs tracking-wider hover:bg-emerald-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                Mengirim...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Saya Setuju & Kirim
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}