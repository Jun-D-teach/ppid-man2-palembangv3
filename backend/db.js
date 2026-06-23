const fs = require("fs");
const path = require("path");

const dbPath = path.join(__dirname, "db.json");

// Default initial database state
const defaultDb = {
  users: [
    {
      id: 1,
      nama_lengkap: "Junaidi -",
      nik: "1671076001900011",
      no_hp: "085656309848",
      email: "dataumumjun@gmail.com",
      password: "12345",
      role: "user",
      created_at: new Date().toISOString()
    },
    {
      id: 4,
      nama_lengkap: "admin",
      nik: "111111111111111",
      no_hp: "085366488829",
      email: "infolayananman2plg@gmail.com",
      password: "$2a$10$/xyilQEIZDyGbgK8VitizO5YPgzrZya7DwWLYH.9Zyg4HMc5hRoUW", // bcrypt hash for 'admin'
      role: "admin",
      created_at: new Date().toISOString()
    }
  ],
  informasi_beranda: [
    {
      id: 1,
      nama_instansi: "MAN 2 Palembang",
      logo_url: "",
      kontak_telepon: "085366488829",
      kontak_email: "infolayananman2plg@gmail.com",
      alamat: "Jl. Inspektur Marzuki No.2, Siring Agung, Kec. Ilir Bar. I, Kota Palembang, Sumatera Selatan",
      banner_badge: "PPID MAN 2 Palembang",
      banner_judul: "Pejabat Pengelola Informasi dan Dokumentasi",
      banner_highlight: "PPID MAN 2 Palembang",
      banner_subjudul: "Layanan informasi publik yang transparan, cepat, dan mudah diakses di lingkungan Madrasah Aliyah Negeri 2 Palembang.",
      banner_gambar: "",
      footer_deskripsi: "Sistem Pejabat Pengelola Informasi dan Dokumentasi (PPID) Madrasah Aliyah Negeri 2 Palembang.",
      prosedur_judul: "Prosedur Permohonan Informasi",
      prosedur_isi: "1. Pengguna melakukan registrasi akun.\n2. Mengajukan permohonan baru pada form yang tersedia.\n3. Admin PPID memproses permohonan.\n4. Dokumen atau berkas dikirimkan melalui sistem atau email."
    }
  ],
  informasi_publik: [
    {
      id: 1,
      kategori: "Kategori Berkala",
      judul: "Laporan Kinerja Instansi Pemerintah MAN 2 Palembang",
      deskripsi: "Dokumen Laporan Akuntabilitas Kinerja Instansi Pemerintah (LAKIP) MAN 2 Palembang tahun 2025.",
      tahun: "2025",
      status_publish: "Tampil",
      created_at: new Date().toISOString()
    }
  ],
  informasi_publik_berkas: [
    {
      id: 1,
      informasi_id: 1,
      nama_file: "lakip-man2-2025.pdf",
      nama_asli: "LAKIP_MAN2_PALEMBANG_2025.pdf",
      mime_type: "application/pdf",
      ukuran: 1542001
    }
  ],
  permohonan: [],
  navbar_items: [
    { id: 1, name: "Home", href: "/", submenu: "[]", position: 1 },
    { id: 2, name: "Profil", href: "#", submenu: JSON.stringify([
      { name: "Profil PPID", href: "/page/profil-ppid" },
      { name: "Visi & Misi", href: "/page/visi-misi" },
      { name: "Tugas & Fungsi", href: "/page/tugas-fungsi" },
      { name: "Struktur Organisasi", href: "/page/struktur-organisasi" },
      { name: "Maklumat Pelayanan", href: "/page/maklumat-pelayanan" }
    ]), position: 2 },
    { id: 3, name: "Regulasi", href: "#", submenu: JSON.stringify([
      { name: "UU KIP", href: "/page/uu-kip" },
      { name: "Peraturan Menteri", href: "/page/peraturan-menteri" },
      { name: "SOP PPID", href: "/page/sop-ppid" },
      { name: "SK PPID", href: "/page/sk-ppid" }
    ]), position: 3 },
    { id: 4, name: "Informasi Publik", href: "#", submenu: JSON.stringify([
      { name: "Informasi Berkala", href: "/page/informasi-berkala" },
      { name: "Informasi Serta Merta", href: "/page/informasi-serta-merta" },
      { name: "Informasi Setiap Saat", href: "/page/informasi-setiap-saat" },
      { name: "Informasi Dikecualikan", href: "/page/informasi-dikecualikan" }
    ]), position: 4 },
    { id: 5, name: "Layanan", href: "#", submenu: JSON.stringify([
      { name: "Prosedur Permohonan", href: "/page/prosedur-permohonan" },
      { name: "Prosedur Keberatan", href: "/page/prosedur-keberatan" },
      { name: "Biaya Layanan", href: "/page/biaya-layanan" },
      { name: "Hak & Tata Cara", href: "/page/hak-tata-cara" }
    ]), position: 5 },
    { id: 6, name: "Laporan", href: "#", submenu: JSON.stringify([
      { name: "Laporan Tahunan", href: "/page/laporan-tahunan" },
      { name: "Laporan Statistik", href: "/page/laporan-statistik" },
      { name: "Laporan Akses", href: "/page/laporan-akses" }
    ]), position: 6 }
  ],
  menu_pages: [
    {
      id: 1,
      parent_menu: "PROFIL",
      menu_label: "Profil PPID",
      slug: "profil-ppid",
      judul: "Profil PPID",
      isi: "Sistem Informasi Pejabat Pengelola Informasi dan Dokumentasi (PPID) Madrasah Aliyah Negeri 2 Palembang siap melayani permohonan informasi publik secara transparan.",
      status_publish: "Tampil",
      position: 1,
      is_builtin: 1,
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      parent_menu: "PROFIL",
      menu_label: "Visi & Misi",
      slug: "visi-misi",
      judul: "Visi & Misi",
      isi: "Visi: Menjadi garda pelayanan informasi madrasah yang unggul, terpercaya, dan transparan.\nMisi: Menyediakan informasi publik secara terbuka, akurat, dan inovatif.",
      status_publish: "Tampil",
      position: 2,
      is_builtin: 1,
      created_at: new Date().toISOString()
    }
  ],
  menu_page_files: [],
  submenu_pages: [
    { id: 1, title: "Profil PPID", slug: "profil-ppid" },
    { id: 2, title: "Visi & Misi", slug: "visi-misi" }
  ],
  content_blocks: [],
  content_posts: []
};

// Ensure database file exists
if (!fs.existsSync(dbPath)) {
  fs.writeFileSync(dbPath, JSON.stringify(defaultDb, null, 2));
}

function readData() {
  try {
    const raw = JSON.parse(fs.readFileSync(dbPath, "utf-8"));
    const requiredTables = [
      "users", "beranda", "informasi_beranda", "informasi_publik", 
      "informasi_publik_berkas", "informasi_publik_files", "menu_pages", 
      "menu_page_files", "navbar", "navbar_items", "permohonan", 
      "submenu_pages", "content_blocks", "content_posts"
    ];
    let changed = false;
    requiredTables.forEach(table => {
      if (!raw[table]) {
        raw[table] = [];
        changed = true;
      }
    });
    if (changed) {
      fs.writeFileSync(dbPath, JSON.stringify(raw, null, 2));
    }
    return raw;
  } catch (err) {
    return defaultDb;
  }
}

function writeData(data) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

// Simple query simulator
const query = async (sql, params = []) => {
  const data = readData();
  const sqlUpper = sql.trim().toUpperCase();

  // 1. SELECT 1 or SELECT 1 FROM...
  if (sqlUpper.startsWith("SELECT 1") && !sqlUpper.includes("FROM")) {
    return [[{ "1": 1 }]];
  }

  // 2. CREATE TABLE
  if (sqlUpper.startsWith("CREATE TABLE")) {
    return [true];
  }

  // 3. SELECT COUNT
  if (sqlUpper.startsWith("SELECT COUNT")) {
    const match = sqlUpper.match(/FROM\s+([A-Za-z0-9_`]+)/);
    if (match) {
      const tableName = match[1].replace(/[`"']/g, "");
      const count = (data[tableName] || []).length;
      return [[{ total: count }]];
    }
  }

  // 4. USERS SELECT / AUTH
  if (sqlUpper.startsWith("SELECT") && sqlUpper.includes("USERS")) {
    // SELECT id FROM users WHERE email = ? OR nik = ? LIMIT 1
    if (sqlUpper.includes("EMAIL = ? OR NIK = ?") || sqlUpper.includes("EMAIL = ? OR NIK = ?") || sqlUpper.includes("LOWER(EMAIL) = ? OR NIK = ?")) {
      const email = params[0] ? String(params[0]).toLowerCase().trim() : "";
      const nik = params[1];
      const found = data.users.filter(u => (u.email && String(u.email).toLowerCase().trim() === email) || u.nik === nik);
      return [found];
    }
    // SELECT * FROM users WHERE email = ?
    if (sqlUpper.includes("EMAIL = ?") || sqlUpper.includes("LOWER(EMAIL) = ?")) {
      const email = params[0] ? String(params[0]).toLowerCase().trim() : "";
      const found = data.users.filter(u => u.email && String(u.email).toLowerCase().trim() === email);
      return [found];
    }
    // SELECT password FROM users WHERE id = ? LIMIT 1
    if (sqlUpper.includes("PASSWORD") && sqlUpper.includes("ID = ?")) {
      const id = Number(params[0]);
      const found = data.users.filter(u => Number(u.id) === id);
      return [found];
    }
    return [data.users];
  }

  // 5. BERANDA
  if (sqlUpper.startsWith("SELECT") && sqlUpper.includes("INFORMASI_BERANDA")) {
    return [data.informasi_beranda];
  }

  // 6. NAVBAR ITEMS
  if (sqlUpper.startsWith("SELECT") && sqlUpper.includes("NAVBAR_ITEMS")) {
    const items = [...(data.navbar_items || [])].sort((a, b) => a.position - b.position);
    return [items];
  }

  // 7. SUBMENU_PAGES
  if (sqlUpper.startsWith("SELECT") && sqlUpper.includes("SUBMENU_PAGES")) {
    if (sqlUpper.includes("SLUG = ?")) {
      const slug = params[0];
      // Auto-create in-memory if not exists to facilitate dynamic pages
      let found = data.submenu_pages.filter(s => s.slug === slug);
      if (found.length === 0) {
        // Fallback: look in menu_pages and map
        const menuPage = data.menu_pages.find(m => m.slug === slug);
        if (menuPage) {
          const newSub = { id: data.submenu_pages.length + 1, title: menuPage.judul, slug: menuPage.slug };
          data.submenu_pages.push(newSub);
          writeData(data);
          found = [newSub];
        } else {
          // Create virtual
          const newSub = { id: data.submenu_pages.length + 1, title: slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" "), slug };
          data.submenu_pages.push(newSub);
          writeData(data);
          found = [newSub];
        }
      }
      return [found];
    }
    return [data.submenu_pages];
  }

  // 8. CONTENT BLOCKS
  if (sqlUpper.startsWith("SELECT") && sqlUpper.includes("CONTENT_BLOCKS")) {
    if (sqlUpper.includes("SUBMENU_ID = ?")) {
      const subId = Number(params[0]);
      const blocks = (data.content_blocks || [])
        .filter(b => Number(b.submenu_id) === subId && !b.deleted_at)
        .sort((a, b) => a.sort_order - b.sort_order);
      return [blocks];
    }
    return [data.content_blocks || []];
  }

  // 9. CONTENT POSTS
  if (sqlUpper.startsWith("SELECT") && sqlUpper.includes("CONTENT_POSTS")) {
    if (sqlUpper.includes("SUBMENU_ID = ?")) {
      const subId = Number(params[0]);
      const posts = (data.content_posts || [])
        .filter(p => Number(p.submenu_id) === subId && p.status === "publish")
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      return [posts];
    }
    return [data.content_posts || []];
  }

  // 10. INFORMASI PUBLIK
  if (sqlUpper.startsWith("SELECT") && sqlUpper.includes("INFORMASI_PUBLIK_BERKAS")) {
    if (sqlUpper.includes("INFORMASI_ID = ?") || sqlUpper.includes("INFORMASI_ID IN")) {
      // Return matching
      return [data.informasi_publik_berkas];
    }
    return [data.informasi_publik_berkas];
  }

  if (sqlUpper.startsWith("SELECT") && sqlUpper.includes("INFORMASI_PUBLIK")) {
    const list = [...(data.informasi_publik || [])].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return [list];
  }

  // 11. MENU PAGES
  if (sqlUpper.startsWith("SELECT") && sqlUpper.includes("MENU_PAGE_FILES")) {
    return [data.menu_page_files || []];
  }

  if (sqlUpper.startsWith("SELECT") && sqlUpper.includes("MENU_PAGES")) {
    if (sqlUpper.includes("SLUG = ?")) {
      const slug = params[0];
      const found = data.menu_pages.filter(m => m.slug === slug);
      return [found];
    }
    return [data.menu_pages];
  }

  // 12. PERMOHONAN SELECT
  if (sqlUpper.startsWith("SELECT") && sqlUpper.includes("PERMOHONAN")) {
    if (sqlUpper.includes("USER_ID = ?")) {
      const userId = Number(params[0]);
      const list = data.permohonan.filter(p => Number(p.user_id) === userId);
      return [list];
    }
    // Admin query with LEFT JOIN users
    const joined = data.permohonan.map(p => {
      const user = data.users.find(u => Number(u.id) === Number(p.user_id)) || {};
      return {
        ...p,
        nama_lengkap: user.nama_lengkap || "Pengguna",
        nik: user.nik || "",
        no_hp: user.no_hp || "",
        email: user.email || ""
      };
    });
    return [joined];
  }

  // 13. INSERTS
  if (sqlUpper.startsWith("INSERT INTO")) {
    const tableNameMatch = sqlUpper.match(/INSERT INTO\s+([A-Za-z0-9_`]+)/);
    if (tableNameMatch) {
      const tableName = tableNameMatch[1].replace(/[`"']/g, "").toLowerCase();
      if (!data[tableName]) data[tableName] = [];

      // Create new record based on table and values
      const newId = data[tableName].reduce((max, item) => Math.max(max, item.id || 0), 0) + 1;
      const record = { id: newId };

      // Parse insert column names and values to map correctly
      // Simple insert resolver
      if (tableName === "users") {
        record.nama_lengkap = params[0];
        record.nik = params[1];
        record.no_hp = params[2];
        record.email = params[3];
        record.password = params[4];
        record.role = params[5] || "user";
        record.created_at = new Date().toISOString();
      } else if (tableName === "informasi_publik") {
        record.kategori = params[0];
        record.judul = params[1];
        record.deskripsi = params[2];
        record.tahun = params[3];
        record.status_publish = params[4] || "Tampil";
        record.created_at = new Date().toISOString();
      } else if (tableName === "informasi_publik_berkas") {
        record.informasi_id = Number(params[0]);
        record.nama_file = params[1];
        record.nama_asli = params[2];
        record.mime_type = params[3];
        record.ukuran = params[4];
      } else if (tableName === "permohonan") {
        record.user_id = Number(params[0]);
        record.subjek = params[1];
        record.tujuan_informasi = params[2];
        record.cara_memperoleh = params[3];
        record.status = "Pending";
        record.tanggal_pengajuan = new Date().toISOString();
      } else if (tableName === "navbar_items") {
        record.name = params[0];
        record.href = params[1];
        record.submenu = params[2];
        record.position = Number(params[3] || 1);
      } else if (tableName === "menu_pages") {
        record.parent_menu = params[0];
        record.menu_label = params[1];
        record.slug = params[2];
        record.judul = params[3];
        record.isi = params[4];
        record.status_publish = params[5] || "Tampil";
        record.position = Number(params[6] || 1);
        record.is_builtin = 0;
        record.created_at = new Date().toISOString();
      } else if (tableName === "content_blocks") {
        record.submenu_id = Number(params[0]);
        record.type = params[1];
        record.title = params[2];
        record.content = params[3];
        record.url = params[4];
        record.file_path = params[5];
        record.sort_order = Number(params[6] || 0);
      } else if (tableName === "content_posts") {
        record.submenu_id = Number(params[0]);
        record.title = params[1];
        record.content = params[2];
        record.image = params[3];
        record.file = params[4];
        record.link = params[5];
        record.status = params[6] || "publish";
        record.created_at = new Date().toISOString();
      }

      data[tableName].push(record);
      writeData(data);
      return [{ insertId: record.id }];
    }
  }

  // 14. UPDATES
  if (sqlUpper.startsWith("UPDATE")) {
    const tableNameMatch = sqlUpper.match(/UPDATE\s+([A-Za-z0-9_`]+)/);
    if (tableNameMatch) {
      const tableName = tableNameMatch[1].replace(/[`"']/g, "").toLowerCase();
      if (tableName === "users") {
        // UPDATE users SET password = ? WHERE id = ?
        if (sqlUpper.includes("PASSWORD = ?")) {
          const pass = params[0];
          const id = Number(params[1]);
          const user = data.users.find(u => Number(u.id) === id);
          if (user) user.password = pass;
        }
      } else if (tableName === "informasi_beranda") {
        // ON DUPLICATE KEY UPDATE / INSERT OR REPLACE
        // Always set the first record on ID 1
        const fields = [
          "nama_instansi", "logo_url", "kontak_telepon", "kontak_email", "alamat",
          "banner_badge", "banner_judul", "banner_highlight", "banner_subjudul",
          "banner_gambar", "footer_deskripsi", "prosedur_judul", "prosedur_isi"
        ];
        const beranda = data.informasi_beranda[0] || { id: 1 };
        // Map elements
        beranda.nama_instansi = params[1];
        beranda.logo_url = params[2];
        beranda.kontak_telepon = params[3];
        beranda.kontak_email = params[4];
        beranda.alamat = params[5];
        beranda.banner_badge = params[6];
        beranda.banner_judul = params[7];
        beranda.banner_highlight = params[8];
        beranda.banner_subjudul = params[9];
        beranda.banner_gambar = params[10];
        beranda.footer_deskripsi = params[11];
        beranda.prosedur_judul = params[12];
        beranda.prosedur_isi = params[13];
        data.informasi_beranda[0] = beranda;
      } else if (tableName === "informasi_publik") {
        // UPDATE informasi_publik SET kategori=?, judul=?, ... WHERE id=?
        const id = Number(params[5]);
        const p = data.informasi_publik.find(x => Number(x.id) === id);
        if (p) {
          p.kategori = params[0];
          p.judul = params[1];
          p.deskripsi = params[2];
          p.tahun = params[3];
          p.status_publish = params[4];
        }
      } else if (tableName === "permohonan") {
        // UPDATE permohonan SET status = ?, estimasi = ?, catatan_admin = ? WHERE id = ?
        if (sqlUpper.includes("STATUS =") && sqlUpper.includes("ESTIMASI =")) {
          const id = Number(params[3]);
          const p = data.permohonan.find(x => Number(x.id) === id);
          if (p) {
            p.status = params[0];
            p.estimasi = params[1];
            p.catatan_admin = params[2];
          }
        }
        // UPDATE permohonan SET berkas_balasan = COALESCE(?, berkas_balasan)... WHERE id = ?
        else if (sqlUpper.includes("BERKAS_BALASAN =")) {
          const file = params[0];
          const msg = params[1];
          const id = Number(params[2]);
          const p = data.permohonan.find(x => Number(x.id) === id);
          if (p) {
            if (file !== null) p.berkas_balasan = file;
            p.pesan_admin = msg;
            p.tanggal_jawaban = new Date().toISOString();
            p.status = "Selesai";
          }
        }
      } else if (tableName === "navbar_items") {
        const id = Number(params[4]);
        const item = data.navbar_items.find(x => Number(x.id) === id);
        if (item) {
          item.name = params[0];
          item.href = params[1];
          item.submenu = params[2];
          item.position = Number(params[3]);
        }
      } else if (tableName === "menu_pages") {
        const id = Number(params[7]);
        const item = data.menu_pages.find(x => Number(x.id) === id);
        if (item) {
          item.parent_menu = params[0];
          item.menu_label = params[1];
          item.slug = params[2];
          item.judul = params[3];
          item.isi = params[4];
          item.status_publish = params[5];
          item.position = Number(params[6]);
        }
      } else if (tableName === "content_blocks") {
        // UPDATE content_blocks SET title=?, content=?, url=?, file_path=?, sort_order=? WHERE id=?
        if (sqlUpper.includes("TITLE=?")) {
          const id = Number(params[5]);
          const block = data.content_blocks.find(x => Number(x.id) === id);
          if (block) {
            block.title = params[0];
            block.content = params[1];
            block.url = params[2];
            block.file_path = params[3];
            block.sort_order = Number(params[4]);
          }
        }
        // soft delete: UPDATE content_blocks SET deleted_at = NOW() WHERE id = ?
        else if (sqlUpper.includes("DELETED_AT = NOW()")) {
          const id = Number(params[0]);
          const block = data.content_blocks.find(x => Number(x.id) === id);
          if (block) {
            block.deleted_at = new Date().toISOString();
          }
        }
      }

      writeData(data);
      return [{ affectedRows: 1 }];
    }
  }

  // 15. DELETES
  if (sqlUpper.startsWith("DELETE FROM")) {
    const tableNameMatch = sqlUpper.match(/DELETE FROM\s+([A-Za-z0-9_`]+)/);
    if (tableNameMatch) {
      const tableName = tableNameMatch[1].replace(/[`"']/g, "").toLowerCase();
      const id = Number(params[0]);

      if (data[tableName]) {
        // For menu_page_files when id & page_id are passed
        if (tableName === "menu_page_files" && params.length > 1) {
          const fileId = Number(params[0]);
          const pageId = Number(params[1]);
          data.menu_page_files = data.menu_page_files.filter(x => !(Number(x.id) === fileId && Number(x.page_id) === pageId));
        } else {
          data[tableName] = data[tableName].filter(x => Number(x.id) !== id);
        }
        writeData(data);
      }
      return [{ affectedRows: 1 }];
    }
  }

  return [[]];
};

module.exports = {
  createPool: () => ({
    query,
    execute: query
  })
};
