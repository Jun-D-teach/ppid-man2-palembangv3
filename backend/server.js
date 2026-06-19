const express = require("express");
const path = require("path");
const cors = require("cors");
const multer = require("multer");
const mysqlMock = require("./db");
const fs = require("fs");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

dotenv.config({ path: path.join(__dirname, "../.env") });
dotenv.config({ path: path.join(__dirname, ".env"), override: false });

const app = express();

const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",")
      .map((origin) => origin.trim())
      .filter(Boolean)
  : true;

app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
  }),
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

app.use("/uploads", express.static(uploadDir));

const useRealDb = (process.env.USE_REAL_DB === "true");

let db;
if (useRealDb) {
  const mysqlReal = require("mysql2/promise");
  console.log("Database Mode: Real MySQL (mysql2/promise)");
  db = mysqlReal.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
    queueLimit: 0,
  });
} else {
  console.log("Database Mode: Mock JSON Database (db.json)");
  db = mysqlMock.createPool();
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const safeName = file.originalname
      .replace(/\s+/g, "-")
      .replace(/[^a-zA-Z0-9._-]/g, "");

    cb(null, `${Date.now()}-${safeName}`);
  },
});

const allowedUploadMimeTypes = (
  process.env.ALLOWED_UPLOAD_MIME_TYPES ||
  [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "text/plain",
    "text/csv",
  ].join(",")
)
  .split(",")
  .map((type) => type.trim())
  .filter(Boolean);

const upload = multer({
  storage,
  limits: {
    fileSize: Number(process.env.MAX_UPLOAD_SIZE || 10 * 1024 * 1024),
  },
  fileFilter: (req, file, cb) => {
    if (allowedUploadMimeTypes.includes(file.mimetype)) {
      return cb(null, true);
    }

    return cb(new Error(`Tipe file tidak diizinkan: ${file.mimetype}`));
  },
});

const asyncHandler = (handler) => async (req, res, next) => {
  try {
    await handler(req, res, next);
  } catch (error) {
    next(error);
  }
};

const JWT_SECRET = process.env.JWT_SECRET || "dev-only-change-this-secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1d";
const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS || 10);

const isBcryptHash = (value = "") => /^\$2[aby]\$\d{2}\$/.test(value);

const hashPassword = (password) => bcrypt.hash(String(password), SALT_ROUNDS);

const verifyPassword = async (plainPassword, savedPassword) => {
  if (!savedPassword) return false;
  if (isBcryptHash(savedPassword)) {
    return bcrypt.compare(String(plainPassword), savedPassword);
  }

  // Kompatibel dengan akun lama yang password-nya masih plaintext.
  return String(plainPassword) === String(savedPassword);
};

const publicUser = (user) => ({
  id: user.id,
  nama_lengkap: user.nama_lengkap,
  nik: user.nik,
  no_hp: user.no_hp,
  email: user.email,
  role: user.role,
  created_at: user.created_at,
});

const createToken = (user) =>
  jwt.sign(
    {
      id: user.id,
      role: user.role,
      email: user.email,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN },
  );

const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res
      .status(401)
      .json({ message: "Sesi login tidak ditemukan. Silakan login ulang." });
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    return next();
  } catch (error) {
    return res
      .status(401)
      .json({ message: "Sesi login sudah tidak valid. Silakan login ulang." });
  }
};

const requireAdmin = (req, res, next) => {
  requireAuth(req, res, () => {
    if (req.user?.role !== "admin") {
      return res.status(403).json({
        message: "Akses ditolak. Hanya admin yang boleh mengakses fitur ini.",
      });
    }
    return next();
  });
};

const requireOwnerOrAdmin = (req, res, next) => {
  requireAuth(req, res, () => {
    if (
      req.user?.role === "admin" ||
      Number(req.user?.id) === Number(req.params.user_id)
    ) {
      return next();
    }
    return res
      .status(403)
      .json({ message: "Akses ditolak untuk data pengguna lain." });
  });
};

const deleteUploadedFile = (fileName) => {
  if (!fileName) return;
  const filePath = path.join(uploadDir, fileName);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

app.get(
  "/api/health",
  asyncHandler(async (req, res) => {
    await db.query("SELECT 1");
    res.json({ status: "ok", message: "API PPID aktif" });
  }),
);

/* =========================
   AUTH
========================= */

app.post(
  "/api/register",
  asyncHandler(async (req, res) => {
    const { nama_lengkap, nik, no_hp, email, password } = req.body;

    if (!nama_lengkap || !nik || !email || !password) {
      return res.status(400).json({
        message: "Nama lengkap, NIK, email, dan password wajib diisi",
      });
    }

    const sanitizedEmail = String(email).trim().toLowerCase();

    const [existing] = await db.query(
      "SELECT id FROM users WHERE email = ? OR nik = ? LIMIT 1",
      [sanitizedEmail, nik],
    );

    if (existing.length > 0) {
      return res.status(409).json({
        message: "Email atau NIK sudah terdaftar",
      });
    }

    const hashedPassword = await hashPassword(password);

    await db.query(
      `
      INSERT INTO users
      (nama_lengkap, nik, no_hp, email, password, role)
      VALUES (?, ?, ?, ?, ?, 'user')
    `,
      [nama_lengkap, nik, no_hp || "", sanitizedEmail, hashedPassword],
    );

    res.status(201).json({ message: "Pendaftaran berhasil" });
  }),
);

app.post(
  "/api/login",
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email dan password wajib diisi" });
    }

    const sanitizedEmail = String(email).trim().toLowerCase();

    const [rows] = await db.query(
      `
      SELECT id, nama_lengkap, nik, no_hp, email, password, role, created_at
      FROM users
      WHERE email = ?
      LIMIT 1
    `,
      [sanitizedEmail],
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: "Email atau password salah" });
    }

    const user = rows[0];
    const isValid = await verifyPassword(password, user.password);

    if (!isValid) {
      return res.status(401).json({ message: "Email atau password salah" });
    }

    // Upgrade otomatis akun lama: plaintext -> bcrypt setelah login berhasil.
    if (!isBcryptHash(user.password)) {
      const upgradedHash = await hashPassword(password);
      await db.query("UPDATE users SET password = ? WHERE id = ?", [
        upgradedHash,
        user.id,
      ]);
    }

    const safeUser = publicUser(user);
    const token = createToken(safeUser);

    res.json({ message: "Login berhasil", user: safeUser, token });
  }),
);

/* =========================
   BERANDA
========================= */

app.get(
  "/api/beranda",
  asyncHandler(async (req, res) => {
    const [rows] = await db.query(
      "SELECT * FROM informasi_beranda WHERE id = 1 LIMIT 1",
    );
    res.json(rows[0] || {});
  }),
);

app.put(
  "/api/admin/beranda",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const data = req.body;

    await db.query(
      `
      INSERT INTO informasi_beranda
      (
        id,
        nama_instansi,
        logo_url,
        kontak_telepon,
        kontak_email,
        alamat,
        banner_badge,
        banner_judul,
        banner_highlight,
        banner_subjudul,
        banner_gambar,
        footer_deskripsi,
        prosedur_judul,
        prosedur_isi
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        nama_instansi = VALUES(nama_instansi),
        logo_url = VALUES(logo_url),
        kontak_telepon = VALUES(kontak_telepon),
        kontak_email = VALUES(kontak_email),
        alamat = VALUES(alamat),
        banner_badge = VALUES(banner_badge),
        banner_judul = VALUES(banner_judul),
        banner_highlight = VALUES(banner_highlight),
        banner_subjudul = VALUES(banner_subjudul),
        banner_gambar = VALUES(banner_gambar),
        footer_deskripsi = VALUES(footer_deskripsi),
        prosedur_judul = VALUES(prosedur_judul),
        prosedur_isi = VALUES(prosedur_isi)
    `,
      [
        1,
        data.nama_instansi || "",
        data.logo_url || "",
        data.kontak_telepon || "",
        data.kontak_email || "",
        data.alamat || "",
        data.banner_badge || "",
        data.banner_judul || "",
        data.banner_highlight || "",
        data.banner_subjudul || "",
        data.banner_gambar || "",
        data.footer_deskripsi || "",
        data.prosedur_judul || "",
        data.prosedur_isi || "",
      ],
    );

    res.json({ message: "Beranda berhasil diperbarui" });
  }),
);

/* =========================
   INFORMASI PUBLIK
========================= */

app.get(
  "/api/informasi-publik",
  asyncHandler(async (req, res) => {
    const [informasi] = await db.query(
      "SELECT * FROM informasi_publik ORDER BY created_at DESC",
    );

    const [berkas] = await db.query(
      "SELECT * FROM informasi_publik_berkas ORDER BY id ASC",
    );

    const result = informasi.map((item) => ({
      ...item,
      berkas_list: berkas
        .filter((file) => Number(file.informasi_id) === Number(item.id))
        .map((file) => ({
          id: file.id,
          nama_file: file.nama_file,
          nama_asli: file.nama_asli,
          mime_type: file.mime_type,
          ukuran: file.ukuran,
        })),
    }));

    res.json(result);
  }),
);

/* =========================
   CEK STATUS LAYANAN
========================= */

app.get(
  "/api/cek-status",
  asyncHandler(async (req, res) => {
    const { q } = req.query;
    if (!q || !q.trim()) {
      return res.status(400).json({ message: "Parameter pencarian tidak boleh kosong" });
    }

    const searchQuery = q.trim();

    // Cari user ID yang cocok dengan email atau NIK pencarian
    const [users] = await db.query(
      "SELECT id, nama_lengkap, email, nik FROM users WHERE email = ? OR nik = ?",
      [searchQuery, searchQuery]
    );

    const userIds = users.map(u => u.id);

    // Ambil seluruh permohonan
    const [allPermohonan] = await db.query(
      "SELECT * FROM permohonan ORDER BY tanggal_pengajuan DESC"
    );

    // Filter permohonan yang berhubungan
    const matched = allPermohonan.filter(p => {
      if (userIds.includes(Number(p.user_id))) return true;
      if (p.subjek && p.subjek.toLowerCase().includes(searchQuery.toLowerCase())) return true;
      if (String(p.id) === searchQuery) return true;
      return false;
    }).map(p => {
      const user = users.find(u => Number(u.id) === Number(p.user_id)) || {};
      return {
        ...p,
        nama_lengkap: user.nama_lengkap || "Pengguna",
        nik: user.nik || "",
        email: user.email || ""
      };
    });

    res.json(matched);
  })
);

app.post(
  "/api/admin/informasi-publik",
  requireAdmin,
  upload.array("berkas"),
  asyncHandler(async (req, res) => {
    const { kategori, judul, deskripsi, tahun, status_publish } = req.body;

    if (!kategori || !judul) {
      return res
        .status(400)
        .json({ message: "Kategori dan judul wajib diisi" });
    }

    const [result] = await db.query(
      `
      INSERT INTO informasi_publik
      (kategori, judul, deskripsi, tahun, status_publish)
      VALUES (?, ?, ?, ?, ?)
    `,
      [
        kategori,
        judul,
        deskripsi || "",
        tahun || "",
        status_publish || "Tampil",
      ],
    );

    const informasiId = result.insertId;

    if (req.files?.length) {
      for (const file of req.files) {
        await db.query(
          `
          INSERT INTO informasi_publik_berkas
          (informasi_id, nama_file, nama_asli, mime_type, ukuran)
          VALUES (?, ?, ?, ?, ?)
        `,
          [
            informasiId,
            file.filename,
            file.originalname,
            file.mimetype,
            file.size,
          ],
        );
      }
    }

    res.status(201).json({ message: "Informasi publik berhasil ditambahkan" });
  }),
);
app.put("/api/content-blocks/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const { title, content, url, file_path, sort_order } = req.body;

    await db.query(
      `UPDATE content_blocks 
       SET title=?, content=?, url=?, file_path=?, sort_order=?
       WHERE id=?`,
      [title, content, url, file_path, sort_order, id],
    );

    res.json({ message: "Updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error updating block" });
  }
});
app.delete("/api/content-blocks/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // cek apakah block ada
    const [block] = await db.query(
      "SELECT * FROM content_blocks WHERE id = ?",
      [id],
    );

    if (!block.length) {
      return res.status(404).json({ message: "Block tidak ditemukan" });
    }

    // delete block
    await db.query(
      "UPDATE content_blocks SET deleted_at = NOW() WHERE id = ?",
      [id],
    );
    res.json({
      success: true,
      message: "Content block berhasil dihapus",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server error saat delete block",
    });
  }
});
app.put(
  "/api/admin/informasi-publik/:id",
  requireAdmin,
  upload.array("berkas"),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { kategori, judul, deskripsi, tahun, status_publish } = req.body;

    await db.query(
      `
      UPDATE informasi_publik
      SET kategori = ?, judul = ?, deskripsi = ?, tahun = ?, status_publish = ?
      WHERE id = ?
    `,
      [
        kategori,
        judul,
        deskripsi || "",
        tahun || "",
        status_publish || "Tampil",
        id,
      ],
    );

    if (req.files?.length) {
      for (const file of req.files) {
        await db.query(
          `
          INSERT INTO informasi_publik_berkas
          (informasi_id, nama_file, nama_asli, mime_type, ukuran)
          VALUES (?, ?, ?, ?, ?)
        `,
          [id, file.filename, file.originalname, file.mimetype, file.size],
        );
      }
    }

    res.json({ message: "Informasi publik berhasil diperbarui" });
  }),
);

app.delete(
  "/api/admin/informasi-publik/:id",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const [files] = await db.query(
      "SELECT nama_file FROM informasi_publik_berkas WHERE informasi_id = ?",
      [id],
    );

    await db.query("DELETE FROM informasi_publik WHERE id = ?", [id]);
    files.forEach((file) => deleteUploadedFile(file.nama_file));

    res.json({ message: "Informasi publik berhasil dihapus" });
  }),
);

/* =========================
   PERMOHONAN INFORMASI
========================= */

app.post(
  "/api/permohonan",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { user_id, subjek, tujuan_informasi, cara_memperoleh } = req.body;
    const pemohonId =
      req.user.role === "admin" && user_id ? user_id : req.user.id;

    if (!pemohonId || !subjek || !tujuan_informasi) {
      return res.status(400).json({
        message: "User, subjek, dan tujuan informasi wajib diisi",
      });
    }

    const [result] = await db.query(
      `
      INSERT INTO permohonan
      (user_id, subjek, tujuan_informasi, cara_memperoleh, status)
      VALUES (?, ?, ?, ?, 'Pending')
    `,
      [pemohonId, subjek, tujuan_informasi, cara_memperoleh || "Email"],
    );

    res
      .status(201)
      .json({ message: "Permohonan berhasil dikirim", id: result.insertId });
  }),
);

app.get(
  "/api/permohonan/:user_id",
  requireOwnerOrAdmin,
  asyncHandler(async (req, res) => {
    const { user_id } = req.params;

    const [rows] = await db.query(
      `
      SELECT *
      FROM permohonan
      WHERE user_id = ?
      ORDER BY tanggal_pengajuan DESC
    `,
      [user_id],
    );

    res.json(rows);
  }),
);

app.get(
  "/api/admin/permohonan",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const [rows] = await db.query(
      `
      SELECT
        p.*,
        u.nama_lengkap,
        u.nik,
        u.no_hp,
        u.email
      FROM permohonan p
      LEFT JOIN users u ON p.user_id = u.id
      ORDER BY p.tanggal_pengajuan DESC
    `,
    );

    res.json(rows);
  }),
);

app.put(
  "/api/permohonan/:id",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status, estimasi, catatan_admin } = req.body;

    await db.query(
      `
      UPDATE permohonan
      SET status = ?, estimasi = ?, catatan_admin = ?
      WHERE id = ?
    `,
      [status || "Diproses", estimasi || null, catatan_admin || null, id],
    );

    res.json({ message: "Status permohonan berhasil diperbarui" });
  }),
);

app.put(
  "/api/permohonan/upload/:id",
  requireAdmin,
  upload.single("berkas"),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { pesan_admin, hapus_berkas } = req.body;

    if (hapus_berkas === "true") {
      const [rows] = await db.query(
        "SELECT berkas_balasan FROM permohonan WHERE id = ? LIMIT 1",
        [id],
      );

      deleteUploadedFile(rows[0]?.berkas_balasan);

      await db.query(
        `
        UPDATE permohonan
        SET berkas_balasan = NULL,
            pesan_admin = NULL,
            tanggal_jawaban = NULL,
            status = 'Diproses'
        WHERE id = ?
      `,
        [id],
      );

      return res.json({ message: "Jawaban admin berhasil dihapus" });
    }

    const uploadedFile = req.file ? req.file.filename : null;

    if (uploadedFile) {
      const [rows] = await db.query(
        "SELECT berkas_balasan FROM permohonan WHERE id = ? LIMIT 1",
        [id],
      );

      deleteUploadedFile(rows[0]?.berkas_balasan);
    }

    await db.query(
      `
      UPDATE permohonan
      SET berkas_balasan = COALESCE(?, berkas_balasan),
          pesan_admin = ?,
          tanggal_jawaban = NOW(),
          status = 'Selesai'
      WHERE id = ?
    `,
      [uploadedFile, pesan_admin || "", id],
    );

    res.json({ message: "Jawaban admin berhasil dikirim" });
  }),
);

app.get("/api/submenu/:slug", async (req, res) => {
  try {
    const { slug } = req.params;

    const [submenu] = await db.query(
      "SELECT * FROM submenu_pages WHERE slug = ?",
      [slug],
    );

    if (!submenu.length) {
      return res.status(404).json({ message: "Not found" });
    }

    const page = submenu[0];

    const [blocks] = await db.query(
      "SELECT * FROM content_blocks WHERE submenu_id = ? ORDER BY sort_order ASC",
      [page.id],
    );

    res.json({
      submenu: page,
      content_blocks: blocks,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});
app.post("/api/posts", async (req, res) => {
  try {
    const { submenu_id, title, content, image, file, link, status } = req.body;

    await db.query(
      `
      INSERT INTO content_posts
      (submenu_id, title, content, image, file, link, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
      [
        submenu_id,
        title,
        content,
        image || null,
        file || null,
        link || null,
        status || "publish",
      ],
    );

    res.json({ message: "Post created" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error create post" });
  }
});
app.get("/api/posts/:slug", async (req, res) => {
  try {
    const { slug } = req.params;

    const [submenu] = await db.query(
      "SELECT * FROM submenu_pages WHERE slug = ?",
      [slug],
    );

    if (!submenu.length) {
      return res.status(404).json({ message: "Submenu not found" });
    }

    const menu = submenu[0];

    const [posts] = await db.query(
      `SELECT * FROM content_posts 
       WHERE submenu_id = ? AND status = 'publish'
       ORDER BY created_at DESC`,
      [menu.id],
    );

    res.json({
      submenu: menu,
      posts,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetch posts" });
  }
});
app.delete("/api/posts/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await db.query("DELETE FROM content_posts WHERE id = ?", [id]);

    res.json({ message: "Post deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error delete post" });
  }
});
app.post("/api/content-blocks", async (req, res) => {
  try {
    const { submenu_id, type, title, content, url, file_path, sort_order } =
      req.body;

    await db.query(
      `INSERT INTO content_blocks 
      (submenu_id, type, title, content, url, file_path, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        submenu_id,
        type,
        title || null,
        content || null,
        url || null,
        file_path || null,
        sort_order || 0,
      ],
    );

    res.json({ message: "Block created" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error creating block" });
  }
});
/* =========================
   NAVBAR CMS SEDERHANA
========================= */

app.get(
  "/api/admin/navbar",
  asyncHandler(async (req, res) => {
    const [rows] = await db.query(
      "SELECT * FROM navbar_items ORDER BY position ASC, id ASC",
    );
    res.json(rows);
  }),
);

app.post(
  "/api/admin/navbar",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { name, href, submenu, position } = req.body;

    if (!name || !href) {
      return res
        .status(400)
        .json({ message: "Nama dan link menu wajib diisi" });
    }

    const normalizedSubmenu = Array.isArray(submenu)
      ? JSON.stringify(submenu)
      : submenu || "[]";

    const [result] = await db.query(
      "INSERT INTO navbar_items (name, href, submenu, position) VALUES (?, ?, ?, ?)",
      [name, href, normalizedSubmenu, position || 1],
    );

    res
      .status(201)
      .json({ message: "Menu berhasil ditambahkan", id: result.insertId });
  }),
);

app.put(
  "/api/admin/navbar/:id",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, href, submenu, position } = req.body;
    const normalizedSubmenu = Array.isArray(submenu)
      ? JSON.stringify(submenu)
      : submenu || "[]";

    await db.query(
      "UPDATE navbar_items SET name = ?, href = ?, submenu = ?, position = ? WHERE id = ?",
      [name, href, normalizedSubmenu, position || 1, id],
    );

    res.json({ message: "Menu berhasil diperbarui" });
  }),
);

app.delete(
  "/api/admin/navbar/:id",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    await db.query("DELETE FROM navbar_items WHERE id = ?", [id]);
    res.json({ message: "Menu berhasil dihapus" });
  }),
);

/* =========================
   CMS MENU WEBSITE
========================= */

const defaultMenuPages = [
  {
    parent_menu: "PROFIL",
    menu_label: "Profil PPID",
    slug: "profil-ppid",
    judul: "Profil PPID",
    isi: "Isi profil PPID dapat diedit melalui Panel Admin > Atur Menu Website.",
    position: 1,
  },
  {
    parent_menu: "PROFIL",
    menu_label: "Visi & Misi",
    slug: "visi-misi",
    judul: "Visi & Misi",
    isi: "Visi dan misi PPID dapat diedit melalui Panel Admin > Atur Menu Website.",
    position: 2,
  },
  {
    parent_menu: "PROFIL",
    menu_label: "Tugas & Fungsi",
    slug: "tugas-fungsi",
    judul: "Tugas & Fungsi",
    isi: "Tugas dan fungsi PPID dapat diedit melalui Panel Admin > Atur Menu Website.",
    position: 3,
  },
  {
    parent_menu: "PROFIL",
    menu_label: "Struktur Organisasi",
    slug: "struktur-organisasi",
    judul: "Struktur Organisasi",
    isi: "Struktur organisasi dapat diedit dan dilengkapi berkas melalui Panel Admin.",
    position: 4,
  },
  {
    parent_menu: "PROFIL",
    menu_label: "Maklumat Pelayanan",
    slug: "maklumat-pelayanan",
    judul: "Maklumat Pelayanan",
    isi: "Maklumat pelayanan dapat diedit melalui Panel Admin.",
    position: 5,
  },

  {
    parent_menu: "REGULASI",
    menu_label: "UU KIP",
    slug: "uu-kip",
    judul: "UU KIP",
    isi: "Konten regulasi UU KIP dapat diedit dan dilengkapi berkas melalui Panel Admin.",
    position: 1,
  },
  {
    parent_menu: "REGULASI",
    menu_label: "Peraturan Menteri",
    slug: "peraturan-menteri",
    judul: "Peraturan Menteri",
    isi: "Konten peraturan menteri dapat diedit dan dilengkapi berkas melalui Panel Admin.",
    position: 2,
  },
  {
    parent_menu: "REGULASI",
    menu_label: "SOP PPID",
    slug: "sop-ppid",
    judul: "SOP PPID",
    isi: "SOP PPID dapat diedit dan dilengkapi berkas melalui Panel Admin.",
    position: 3,
  },
  {
    parent_menu: "REGULASI",
    menu_label: "SK PPID",
    slug: "sk-ppid",
    judul: "SK PPID",
    isi: "SK PPID dapat diedit dan dilengkapi berkas melalui Panel Admin.",
    position: 4,
  },

  {
    parent_menu: "INFORMASI PUBLIK",
    menu_label: "Informasi Berkala",
    slug: "informasi-berkala",
    judul: "Informasi Berkala",
    isi: "Klik menu ini untuk melihat daftar dokumen informasi berkala pada tabel informasi publik.",
    position: 1,
  },
  {
    parent_menu: "INFORMASI PUBLIK",
    menu_label: "Informasi Serta Merta",
    slug: "informasi-serta-merta",
    judul: "Informasi Serta Merta",
    isi: "Klik menu ini untuk melihat daftar dokumen informasi serta merta pada tabel informasi publik.",
    position: 2,
  },
  {
    parent_menu: "INFORMASI PUBLIK",
    menu_label: "Informasi Setiap Saat",
    slug: "informasi-setiap-saat",
    judul: "Informasi Setiap Saat",
    isi: "Klik menu ini untuk melihat daftar dokumen informasi setiap saat pada tabel informasi publik.",
    position: 3,
  },
  {
    parent_menu: "INFORMASI PUBLIK",
    menu_label: "Informasi Dikecualikan",
    slug: "informasi-dikecualikan",
    judul: "Informasi Dikecualikan",
    isi: "Klik menu ini untuk melihat daftar dokumen informasi dikecualikan pada tabel informasi publik.",
    position: 4,
  },

  {
    parent_menu: "LAYANAN",
    menu_label: "Prosedur Permohonan",
    slug: "prosedur-permohonan",
    judul: "Prosedur Permohonan",
    isi: "Prosedur permohonan informasi dapat diedit melalui Panel Admin > Atur Menu Website.",
    position: 1,
  },
  {
    parent_menu: "LAYANAN",
    menu_label: "Prosedur Keberatan",
    slug: "prosedur-keberatan",
    judul: "Prosedur Keberatan",
    isi: "Prosedur keberatan dapat diedit melalui Panel Admin.",
    position: 2,
  },
  {
    parent_menu: "LAYANAN",
    menu_label: "Biaya Layanan",
    slug: "biaya-layanan",
    judul: "Biaya Layanan",
    isi: "Informasi biaya layanan dapat diedit melalui Panel Admin.",
    position: 3,
  },
  {
    parent_menu: "LAYANAN",
    menu_label: "Hak & Tata Cara",
    slug: "hak-tata-cara",
    judul: "Hak & Tata Cara",
    isi: "Hak dan tata cara memperoleh informasi dapat diedit melalui Panel Admin.",
    position: 4,
  },

  {
    parent_menu: "LAPORAN",
    menu_label: "Laporan Tahunan",
    slug: "laporan-tahunan",
    judul: "Laporan Tahunan",
    isi: "Laporan tahunan dapat diedit dan dilengkapi berkas melalui Panel Admin.",
    position: 1,
  },
  {
    parent_menu: "LAPORAN",
    menu_label: "Laporan Statistik",
    slug: "laporan-statistik",
    judul: "Laporan Statistik",
    isi: "Laporan statistik dapat diedit dan dilengkapi berkas melalui Panel Admin.",
    position: 2,
  },
  {
    parent_menu: "LAPORAN",
    menu_label: "Laporan Akses",
    slug: "laporan-akses",
    judul: "Laporan Akses",
    isi: "Laporan akses informasi dapat diedit dan dilengkapi berkas melalui Panel Admin.",
    position: 3,
  },
];

const slugify = (value = "") =>
  String(value)
    .toLowerCase()
    .trim()
    .replace(/&/g, "dan")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const ensureMenuCmsTables = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS menu_pages (
      id INT AUTO_INCREMENT PRIMARY KEY,
      parent_menu VARCHAR(100) NOT NULL,
      menu_label VARCHAR(150) NOT NULL,
      slug VARCHAR(180) NOT NULL UNIQUE,
      judul VARCHAR(255) NOT NULL,
      isi LONGTEXT NULL,
      status_publish VARCHAR(20) DEFAULT 'Tampil',
      position INT DEFAULT 1,
      is_builtin TINYINT(1) DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS menu_page_files (
      id INT AUTO_INCREMENT PRIMARY KEY,
      page_id INT NOT NULL,
      nama_file VARCHAR(255) NOT NULL,
      nama_asli VARCHAR(255) DEFAULT NULL,
      mime_type VARCHAR(120) DEFAULT NULL,
      ukuran INT DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_menu_page_files_page
        FOREIGN KEY (page_id) REFERENCES menu_pages(id)
        ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  const [rows] = await db.query("SELECT COUNT(*) AS total FROM menu_pages");
  if (Number(rows[0]?.total || 0) === 0) {
    for (const item of defaultMenuPages) {
      await db.query(
        `INSERT INTO menu_pages
          (parent_menu, menu_label, slug, judul, isi, status_publish, position, is_builtin)
          VALUES (?, ?, ?, ?, ?, 'Tampil', ?, 1)
        `,
        [
          item.parent_menu,
          item.menu_label,
          item.slug,
          item.judul,
          item.isi,
          item.position,
        ],
      );
    }
  }
};

const attachMenuPageFiles = async (pages) => {
  if (!pages.length) return [];

  const pageIds = pages.map((item) => item.id);
  const [files] = await db.query(
    `SELECT * FROM menu_page_files WHERE page_id IN (?) ORDER BY id ASC`,
    [pageIds],
  );

  return pages.map((page) => ({
    ...page,
    berkas_list: files
      .filter((file) => Number(file.page_id) === Number(page.id))
      .map((file) => ({
        id: file.id,
        page_id: file.page_id,
        nama_file: file.nama_file,
        nama_asli: file.nama_asli,
        mime_type: file.mime_type,
        ukuran: file.ukuran,
        created_at: file.created_at,
      })),
  }));
};

app.get(
  "/api/menu-pages",
  asyncHandler(async (req, res) => {
    const includeHidden =
      req.query.includeHidden === "true" && req.user?.role === "admin";
    const where = includeHidden ? "" : "WHERE status_publish = 'Tampil'";
    const [pages] = await db.query(
      `SELECT * FROM menu_pages ${where} ORDER BY FIELD(parent_menu, 'PROFIL', 'REGULASI', 'INFORMASI PUBLIK', 'LAYANAN', 'LAPORAN'), position ASC, id ASC`,
    );

    res.json(await attachMenuPageFiles(pages));
  }),
);

app.get(
  "/api/menu-pages/:slug",
  asyncHandler(async (req, res) => {
    const { slug } = req.params;
    const [pages] = await db.query(
      "SELECT * FROM menu_pages WHERE slug = ? AND status_publish = 'Tampil' LIMIT 1",
      [slug],
    );

    if (pages.length === 0) {
      return res.status(404).json({ message: "Halaman menu tidak ditemukan" });
    }

    const result = await attachMenuPageFiles(pages);
    res.json(result[0]);
  }),
);

app.get(
  "/api/admin/menu-pages",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const [pages] = await db.query(
      `SELECT * FROM menu_pages ORDER BY FIELD(parent_menu, 'PROFIL', 'REGULASI', 'INFORMASI PUBLIK', 'LAYANAN', 'LAPORAN'), position ASC, id ASC`,
    );

    res.json(await attachMenuPageFiles(pages));
  }),
);

app.post(
  "/api/admin/menu-pages",
  requireAdmin,
  upload.array("berkas"),
  asyncHandler(async (req, res) => {
    const {
      parent_menu,
      menu_label,
      slug,
      judul,
      isi,
      status_publish,
      position,
    } = req.body;

    if (!parent_menu || !menu_label || !judul) {
      return res.status(400).json({
        message: "Menu utama, nama submenu, dan judul halaman wajib diisi",
      });
    }

    const finalSlug = slugify(slug || menu_label || judul);
    if (!finalSlug) {
      return res.status(400).json({ message: "Slug/link menu tidak valid" });
    }

    const [result] = await db.query(
      `const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-");
};
      INSERT INTO menu_pages
      (parent_menu, menu_label, slug, judul, isi, status_publish, position, is_builtin)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0)
    `,
      [
        String(parent_menu).toUpperCase(),
        menu_label,
        finalSlug,
        judul,
        isi || "",
        status_publish || "Tampil",
        Number(position || 1),
      ],
    );

    const pageId = result.insertId;

    if (req.files?.length) {
      for (const file of req.files) {
        await db.query(
          `const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-");
};
          INSERT INTO menu_pages
    (parent_menu, menu_label, slug, judul, isi, status_publish, position, is_builtin)
    VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
          [
            String(parent_menu).toUpperCase(),
            menu_label,
            slug,
            judul,
            isi || "", // <-- pastikan isi dikirim dari pop-up
            status_publish || "Tampil",
            Number(position || 1),
          ],
        );
      }
    }

    res
      .status(201)
      .json({ message: "Halaman menu berhasil ditambahkan", id: pageId });
  }),
);

app.put(
  "/api/admin/menu-pages/:id",
  requireAdmin,
  upload.array("berkas"),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const {
      parent_menu,
      menu_label,
      slug,
      judul,
      isi,
      status_publish,
      position,
    } = req.body;

    if (!parent_menu || !menu_label || !judul) {
      return res.status(400).json({
        message: "Menu utama, nama submenu, dan judul halaman wajib diisi",
      });
    }

    const finalSlug = slugify(slug || menu_label || judul);

    await db.query(
      `UPDATE menu_pages
    SET parent_menu = ?, menu_label = ?, slug = ?, judul = ?, isi = ?, status_publish = ?, position = ?
    WHERE id = ?`,
      [
        String(parent_menu).toUpperCase(),
        menu_label,
        slug,
        judul,
        isi || "", // <-- simpan teks pop-up ke kolom isi
        status_publish || "Tampil",
        Number(position || 1),
        id,
      ],
    );

    if (req.files?.length) {
      for (const file of req.files) {
        await db.query(
          `
          INSERT INTO menu_page_files
          (page_id, nama_file, nama_asli, mime_type, ukuran)
          VALUES (?, ?, ?, ?, ?)
        `,
          [id, file.filename, file.originalname, file.mimetype, file.size],
        );
      }
    }

    res.json({ message: "Halaman menu berhasil diperbarui" });
  }),
);

app.delete(
  "/api/admin/menu-pages/:id",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const [files] = await db.query(
      "SELECT nama_file FROM menu_page_files WHERE page_id = ?",
      [id],
    );
    await db.query("DELETE FROM menu_pages WHERE id = ?", [id]);
    files.forEach((file) => deleteUploadedFile(file.nama_file));

    res.json({ message: "Halaman menu berhasil dihapus" });
  }),
);

app.delete(
  "/api/admin/menu-pages/:id/files/:fileId",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { id, fileId } = req.params;
    const [rows] = await db.query(
      "SELECT nama_file FROM menu_page_files WHERE id = ? AND page_id = ? LIMIT 1",
      [fileId, id],
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Berkas tidak ditemukan" });
    }

    deleteUploadedFile(rows[0].nama_file);
    await db.query("DELETE FROM menu_page_files WHERE id = ? AND page_id = ?", [
      fileId,
      id,
    ]);
    res.json({ message: "Berkas berhasil dihapus" });
  }),
);

/* =========================
   UBAH PASSWORD USER/ADMIN
========================= */

app.put(
  "/api/user/:id/password",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { oldPassword, newPassword } = req.body;

    if (Number(req.user.id) !== Number(id) && req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Tidak boleh mengubah password pengguna lain" });
    }

    if (!oldPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "Password lama dan password baru wajib diisi" });
    }

    const [rows] = await db.query(
      "SELECT password FROM users WHERE id = ? LIMIT 1",
      [id],
    );
    if (rows.length === 0)
      return res.status(404).json({ message: "User tidak ditemukan" });

    const valid = await verifyPassword(oldPassword, rows[0].password);
    if (!valid) return res.status(401).json({ message: "Password lama salah" });

    const hashedPassword = await hashPassword(newPassword);
    await db.query("UPDATE users SET password = ? WHERE id = ?", [
      hashedPassword,
      id,
    ]);

    res.json({ message: "Password berhasil diubah" });
  }),
);

/* =========================
   FRONTEND PRODUCTION
========================= */

/* =========================
   FRONTEND VITE MIDDLEWARE & STATIC SERVING
========================= */

app.use("/api", (req, res) => {
  res.status(404).json({ message: "Endpoint API tidak ditemukan" });
});

app.use((error, req, res, next) => {
  console.error("❌ SERVER ERROR:", error);

  if (error instanceof multer.MulterError) {
    return res.status(400).json({ message: error.message });
  }

  res.status(500).json({
    message: "Terjadi kesalahan pada server",
    error: process.env.NODE_ENV === "production" ? undefined : error.message,
  });
});

const PORT = 3000;

async function startServer() {
  // Mount Vite after API routes
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = require("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", async () => {
    try {
      await db.query("SELECT 1");
      console.log("✅ Database terkoneksi (Mock JSON)");
      await ensureMenuCmsTables();
      console.log("✅ Tabel CMS menu siap");
    } catch (error) {
      console.error("❌ Gagal koneksi database:", error.message);
    }

    console.log(`🚀 Server berjalan di port ${PORT}`);
  });
}

startServer();
