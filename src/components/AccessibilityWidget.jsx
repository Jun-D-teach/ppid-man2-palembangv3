import React, { useState, useEffect } from "react";

export default function AccessibilityWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [fontSize, setFontSize] = useState(100); // dalam persen (%)
  const [highContrast, setHighContrast] = useState(false);

  // Menerapkan pengaturan langsung ke elemen HTML root/body global
  useEffect(() => {
    // 1. Pengaturan Ukuran Font Global
    document.documentElement.style.fontSize = `${fontSize}%`;

    // 2. Pengaturan Kontras Tinggi Global
    if (highContrast) {
      document.documentElement.classList.add("high-contrast-mode");
      // Menambahkan style manual cadangan jika tailwind class belum diatur
      const style = document.createElement("style");
      style.id = "high-contrast-styles";
      style.innerHTML = `
        .high-contrast-mode body, 
        .high-contrast-mode div:not(.accessibility-menu), 
        .high-contrast-mode header, 
        .high-contrast-mode main, 
        .high-contrast-mode table, 
        .high-contrast-mode section {
          background-color: #000000 !important;
          color: #FFFF00 !important;
          border-color: #FFFF00 !important;
        }
        .high-contrast-mode a, 
        .high-contrast-mode button:not(.accessibility-toggle-btn) {
          color: #00FFFF !important;
          text-decoration: underline !important;
        }
      `;
      if (!document.getElementById("high-contrast-styles")) {
        document.head.appendChild(style);
      }
    } else {
      document.documentElement.classList.remove("high-contrast-mode");
      const styleElement = document.getElementById("high-contrast-styles");
      if (styleElement) styleElement.remove();
    }
  }, [fontSize, highContrast]);

  const handleReset = () => {
    setFontSize(100);
    setHighContrast(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] font-sans text-slate-800">
      {/* TOMBOL UTAMA UTK BUKA/TUTUP (IKON DISABILITAS) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="accessibility-toggle-btn flex h-14 w-14 items-center justify-center rounded-full bg-emerald-800 text-white shadow-2xl hover:bg-emerald-700 active:scale-95 transition-all border-2 border-white"
        title="Menu Aksesibilitas Disabilitas"
        type="button"
      >
        {isOpen ? (
          <span className="text-xl font-bold">✕</span>
        ) : (
          // Ikon Orang Disabilitas Universal
          <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24">
            <path d="M12 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm9 7h-6v13h-2v-6h-2v6H9V9H3V7h18v2z" />
          </svg>
        )}
      </button>

      {/* MENU POPUP PENGATURAN AKSESIBILITAS */}
      {isOpen && (
        <div className="accessibility-menu absolute bottom-16 right-0 w-72 rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl animate-fade-in">
          <div className="border-b border-gray-100 pb-2 mb-4">
            <h3 className="font-black text-xs uppercase tracking-wider text-emerald-900">
              ♿ Alat Bantu Aksesibilitas
            </h3>
            <p className="text-[10px] text-slate-400 font-medium">
              Ramah Disabilitas & Ramah Netra
            </p>
          </div>

          <div className="space-y-4">
            {/* OPSI 1: UKURAN HURUF */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-slate-600 mb-2">
                🔎 Ukuran Teks: <span className="text-emerald-700">{fontSize}%</span>
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setFontSize(Math.max(80, fontSize - 10))}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2 rounded-lg text-xs transition"
                >
                  A- (Perkecil)
                </button>
                <button
                  type="button"
                  onClick={() => setFontSize(Math.min(150, fontSize + 10))}
                  className="flex-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold py-2 rounded-lg text-xs transition border border-emerald-200"
                >
                  A+ (Perbesar)
                </button>
              </div>
            </div>

            {/* OPSI 2: KONTRAS TINGGI */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-slate-600 mb-1.5">
                🎨 Mode Warna Tampilan:
              </label>
              <button
                type="button"
                onClick={() => setHighContrast(!highContrast)}
                className={`w-full font-bold py-2 px-3 rounded-lg text-xs transition border flex items-center justify-between ${
                  highContrast
                    ? "bg-yellow-400 border-yellow-500 text-black shadow-inner"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-gray-200"
                }`}
              >
                <span>⚫ Kontras Tinggi (High Contrast)</span>
                <span>{highContrast ? "AKTIF" : "NONAKTIF"}</span>
              </button>
            </div>

            {/* OPSI 3: RESET */}
            <div className="pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={handleReset}
                className="w-full bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-100 font-bold py-2 rounded-lg text-xs tracking-wider uppercase transition"
              >
                🔄 Kembalikan Normal (Reset)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}