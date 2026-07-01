import React, { useState, useEffect } from "react";

const AccessibilityWidget = () => {
  const [isOpen, setIsOpen] = useState(false);

  // State untuk semua fitur aksesibilitas
  const [textScale, setTextScale] = useState(100); // 100%, 120%, 140%, 160%
  const [contrast, setContrast] = useState("normal"); // normal, dark, light, invert
  const [letterSpacing, setLetterSpacing] = useState("normal"); // normal, wide, wider
  const [underlineLinks, setUnderlineLinks] = useState(false);
  const [bigCursor, setBigCursor] = useState(false);
  const [stopAnimations, setStopAnimations] = useState(false);
  const [readableFont, setReadableFont] = useState(false);
  const [isReading, setIsReading] = useState(false);

  // Effect untuk menerapkan perubahan pada tag <html> atau <body>
  useEffect(() => {
    const root = document.documentElement;

    // 1. Ukuran Teks
    root.style.fontSize = textScale === 100 ? "" : `${textScale}%`;

    // 2. Kontras
    root.classList.remove("accessibility-dark", "accessibility-light", "accessibility-invert");
    if (contrast !== "normal") {
      root.classList.add(`accessibility-${contrast}`);
    }

    // 3. Jarak Huruf
    root.style.letterSpacing =
      letterSpacing === "wide" ? "0.1em" : letterSpacing === "wider" ? "0.2em" : "";

    // 4. Garis Bawah Link
    if (underlineLinks) {
      root.classList.add("accessibility-underline-links");
    } else {
      root.classList.remove("accessibility-underline-links");
    }

    // 5. Kursor Besar
    if (bigCursor) {
      root.classList.add("accessibility-big-cursor");
    } else {
      root.classList.remove("accessibility-big-cursor");
    }

    // 6. Hentikan Animasi
    if (stopAnimations) {
      root.classList.add("accessibility-stop-animations");
    } else {
      root.classList.remove("accessibility-stop-animations");
    }

    // 7. Font Mudah Dibaca (Dyslexia Friendly/Sans-serif standar)
    if (readableFont) {
      root.classList.add("accessibility-readable-font");
    } else {
      root.classList.remove("accessibility-readable-font");
    }
  }, [textScale, contrast, letterSpacing, underlineLinks, bigCursor, stopAnimations, readableFont]);

  // Fungsi Text to Speech (Membaca Halaman)
  const handleReadPage = () => {
    if (isReading) {
      window.speechSynthesis.cancel();
      setIsReading(false);
    } else {
      const pageText = document.body.innerText || "";
      const utterance = new SpeechSynthesisUtterance(pageText);
      utterance.lang = "id-ID"; // Bahasa Indonesia
      utterance.onend = () => setIsReading(false);
      window.speechSynthesis.speak(utterance);
      setIsReading(true);
    }
  };

  // Reset Semua Pengaturan
  const handleReset = () => {
    setTextScale(100);
    setContrast("normal");
    setLetterSpacing("normal");
    setUnderlineLinks(false);
    setBigCursor(false);
    setStopAnimations(false);
    setReadableFont(false);
    window.speechSynthesis.cancel();
    setIsReading(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] font-sans select-none">
      {/* Tombol Utama Aksesibilitas */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-2xl hover:bg-blue-700 hover:scale-105 transition-all cursor-pointer border-2 border-white"
        title="Menu Aksesibilitas"
      >
        {isOpen ? (
          <span className="text-2xl font-bold">✕</span>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-8 h-8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.05 4.575a1.575 1.575 0 1 0-3.15 0v3m3.15-3v-1.5a1.5.15 0 0 0-3.15 0v1.5m3.15 0 .075 11.25a3 3 0 1 1-6 0V4.575m12 6h.008v.008H18v-.008Zm0 3h.008v.008H18v-.008Zm0 3h.008v.008H18v-.008Zm-3-6h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" />
          </svg>
        )}
      </button>

      {/* Panel Menu Banyak Grid */}
      {isOpen && (
        <div className="absolute bottom-18 right-0 w-80 sm:w-96 rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-200 text-slate-800">
          <div className="flex items-center justify-between border-b pb-3 mb-4">
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">Menu Aksesibilitas</h3>
              <p className="text-[10px] text-slate-400 font-medium">Penyesuaian ramah disabilitas</p>
            </div>
            <button
              onClick={handleReset}
              className="rounded-lg bg-slate-100 px-3 py-1.5 text-[10px] font-bold uppercase text-slate-600 hover:bg-red-50 hover:text-red-600 transition cursor-pointer"
            >
              Reset 🔄
            </button>
          </div>

          {/* Grid Menu Fitur */}
          <div className="grid grid-cols-2 gap-3">
            
            {/* 1. Ukuran Teks */}
            <button
              onClick={() => setTextScale(prev => prev >= 160 ? 100 : prev + 20)}
              className={`flex flex-col items-center justify-center p-4 rounded-2xl border text-center transition cursor-pointer ${textScale > 100 ? 'bg-blue-50 border-blue-400 text-blue-900 font-bold' : 'bg-slate-50 border-slate-100 hover:bg-slate-100'}`}
            >
              <span className="text-xl mb-1">🔍</span>
              <span className="text-[11px] uppercase tracking-wide">Ukuran Teks</span>
              <span className="text-[9px] opacity-60 mt-0.5">{textScale}%</span>
            </button>

            {/* 2. Kontras Warna */}
            <button
              onClick={() => setContrast(prev => prev === "normal" ? "dark" : prev === "dark" ? "light" : prev === "light" ? "invert" : "normal")}
              className={`flex flex-col items-center justify-center p-4 rounded-2xl border text-center transition cursor-pointer ${contrast !== "normal" ? 'bg-blue-50 border-blue-400 text-blue-900 font-bold' : 'bg-slate-50 border-slate-100 hover:bg-slate-100'}`}
            >
              <span className="text-xl mb-1">🌓</span>
              <span className="text-[11px] uppercase tracking-wide">Kontras Warna</span>
              <span className="text-[9px] opacity-60 mt-0.5 capitalize">{contrast}</span>
            </button>

            {/* 3. Baca Halaman (TTS) */}
            <button
              onClick={handleReadPage}
              className={`flex flex-col items-center justify-center p-4 rounded-2xl border text-center transition cursor-pointer ${isReading ? 'bg-emerald-50 border-emerald-400 text-emerald-900 font-bold animate-pulse' : 'bg-slate-50 border-slate-100 hover:bg-slate-100'}`}
            >
              <span className="text-xl mb-1">🗣️</span>
              <span className="text-[11px] uppercase tracking-wide">Baca Halaman</span>
              <span className="text-[9px] opacity-60 mt-0.5">{isReading ? "Membaca..." : "Matikan Suara"}</span>
            </button>

            {/* 4. Font Mudah Dibaca */}
            <button
              onClick={() => setReadableFont(!readableFont)}
              className={`flex flex-col items-center justify-center p-4 rounded-2xl border text-center transition cursor-pointer ${readableFont ? 'bg-blue-50 border-blue-400 text-blue-900 font-bold' : 'bg-slate-50 border-slate-100 hover:bg-slate-100'}`}
            >
              <span className="text-xl mb-1">🔤</span>
              <span className="text-[11px] uppercase tracking-wide">Font Terbaca</span>
              <span className="text-[9px] opacity-60 mt-0.5">{readableFont ? "Aktif" : "Bawaan"}</span>
            </button>

            {/* 5. Jarak Huruf */}
            <button
              onClick={() => setLetterSpacing(prev => prev === "normal" ? "wide" : prev === "wide" ? "wider" : "normal")}
              className={`flex flex-col items-center justify-center p-4 rounded-2xl border text-center transition cursor-pointer ${letterSpacing !== "normal" ? 'bg-blue-50 border-blue-400 text-blue-900 font-bold' : 'bg-slate-50 border-slate-100 hover:bg-slate-100'}`}
            >
              <span className="text-xl mb-1">↔️</span>
              <span className="text-[11px] uppercase tracking-wide">Jarak Huruf</span>
              <span className="text-[9px] opacity-60 mt-0.5 capitalize">{letterSpacing}</span>
            </button>

            {/* 6. Garis Bawah Link */}
            <button
              onClick={() => setUnderlineLinks(!underlineLinks)}
              className={`flex flex-col items-center justify-center p-4 rounded-2xl border text-center transition cursor-pointer ${underlineLinks ? 'bg-blue-50 border-blue-400 text-blue-900 font-bold' : 'bg-slate-50 border-slate-100 hover:bg-slate-100'}`}
            >
              <span className="text-xl mb-1">🔗</span>
              <span className="text-[11px] uppercase tracking-wide">Garis Bawah Link</span>
              <span className="text-[9px] opacity-60 mt-0.5">{underlineLinks ? "Aktif" : "Mati"}</span>
            </button>

            {/* 7. Kursor Besar */}
            <button
              onClick={() => setBigCursor(!bigCursor)}
              className={`flex flex-col items-center justify-center p-4 rounded-2xl border text-center transition cursor-pointer ${bigCursor ? 'bg-blue-50 border-blue-400 text-blue-900 font-bold' : 'bg-slate-50 border-slate-100 hover:bg-slate-100'}`}
            >
              <span className="text-xl mb-1">🖱️</span>
              <span className="text-[11px] uppercase tracking-wide">Kursor Besar</span>
              <span className="text-[9px] opacity-60 mt-0.5">{bigCursor ? "Aktif" : "Mati"}</span>
            </button>

            {/* 8. Hentikan Animasi */}
            <button
              onClick={() => setStopAnimations(!stopAnimations)}
              className={`flex flex-col items-center justify-center p-4 rounded-2xl border text-center transition cursor-pointer ${stopAnimations ? 'bg-blue-50 border-blue-400 text-blue-900 font-bold' : 'bg-slate-50 border-slate-100 hover:bg-slate-100'}`}
            >
              <span className="text-xl mb-1">🚫</span>
              <span className="text-[11px] uppercase tracking-wide">Hentikan Animasi</span>
              <span className="text-[9px] opacity-60 mt-0.5">{stopAnimations ? "Aktif" : "Mati"}</span>
            </button>

          </div>
        </div>
      )}
    </div>
  );
};

export default AccessibilityWidget;
