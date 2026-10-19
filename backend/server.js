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

let useRealDb = process.env.USE_REAL_DB === "true";
let db = mysqlMock.createPool();

const initDatabase = async () => {
  if (useRealDb) {
    try {
      const mysqlReal = require("mysql2/promise");
      console.log("Database Mode: Attempting Real MySQL Connection...");
      const realPool = mysqlReal.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        waitForConnections: true,
        connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
        queueLimit: 0,
        connectTimeout: 5000,
      });
      await realPool.query("SELECT 1");
      db = realPool;
      console.log("✅ Database Mode: Real MySQL Connected Successfully!");
    } catch (realDbError) {
      console.error("❌ Real MySQL Connection failed:", realDbError.message);
      console.log("🔄 Falling back to Mock JSON Database (db.json)");
      db = mysqlMock.createPool();
      useRealDb = false;
    }
  } else {
    console.log("Database Mode: Mock JSON Database (db.json)");
  }
};

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
/* =========================
LANDING CONTENT (Alias untuk Beranda)
========================= */
app.get(
  "/api/landing-content",
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
        id, nama_instansi, logo_url, kontak_telepon, kontak_email, 
        sosmed_ig, sosmed_fb, sosmed_twitter, sosmed_yt, sosmed_tiktok,
        alamat, banner_badge, banner_judul, banner_highlight, banner_subjudul, banner_gambar,
        footer_deskripsi, prosedur_judul, prosedur_isi
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        nama_instansi = VALUES(nama_instansi),
        logo_url = VALUES(logo_url),
        kontak_telepon = VALUES(kontak_telepon),
        kontak_email = VALUES(kontak_email),
        sosmed_ig = VALUES(sosmed_ig),
        sosmed_fb = VALUES(sosmed_fb),
        sosmed_twitter = VALUES(sosmed_twitter),
        sosmed_yt = VALUES(sosmed_yt),
        sosmed_tiktok = VALUES(sosmed_tiktok),
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
        data.sosmed_ig || "",
        data.sosmed_fb || "",
        data.sosmed_twitter || "",
        data.sosmed_yt || "",
        data.sosmed_tiktok || "",
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
      return res
        .status(400)
        .json({ message: "Parameter pencarian tidak boleh kosong" });
    }

    const searchQuery = q.trim();

    const [users] = await db.query(
      "SELECT id, nama_lengkap, email, nik FROM users WHERE email = ? OR nik = ?",
      [searchQuery, searchQuery],
    );

    const userIds = users.map((u) => u.id);

    const [allPermohonan] = await db.query(
      "SELECT * FROM permohonan ORDER BY tanggal_pengajuan DESC",
    );

    const matched = allPermohonan
      .filter((p) => {
        if (userIds.includes(Number(p.user_id))) return true;
        if (
          p.subjek &&
          p.subjek.toLowerCase().includes(searchQuery.toLowerCase())
        )
          return true;
        if (String(p.id) === searchQuery) return true;
        return false;
      })
      .map((p) => {
        const user =
          users.find((u) => Number(u.id) === Number(p.user_id)) || {};
        return {
          ...p,
          nama_lengkap: user.nama_lengkap || "Pengguna",
          nik: user.nik || "",
          email: user.email || "",
        };
      });

    res.json(matched);
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

    const [block] = await db.query(
      "SELECT * FROM content_blocks WHERE id = ?",
      [id],
    );

    if (!block.length) {
      return res.status(404).json({ message: "Block tidak ditemukan" });
    }

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
/* =========================
INFORMASI PUBLIK - GET (Public)
========================= */
app.get(
  "/api/informasi-publik",
  asyncHandler(async (req, res) => {
    const [informasi] = await db.query(
      "SELECT * FROM informasi_publik ORDER BY posisi ASC, created_at DESC",
    );
    const [berkas] = await db.query(
      "SELECT * FROM informasi_publik_berkas ORDER BY id ASC",
    );

    const result = informasi.map((item) => ({
      ...item,
      posisi: Number(item.posisi || 1), // ✅ Pastikan posisi berupa angka
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
INFORMASI PUBLIK - POST (Admin Tambah)
========================= */
app.post(
  "/api/admin/informasi-publik",
  requireAdmin,
  upload.array("berkas"),
  asyncHandler(async (req, res) => {
    const { kategori, judul, deskripsi, tahun, posisi, status_publish } =
      req.body;

    // 🔍 DEBUG: Log data yang diterima
    console.log("📥 POST /api/admin/informasi-publik:", {
      kategori,
      judul,
      tahun,
      posisi: posisi || 1,
      status_publish,
    });

    if (!kategori || !judul) {
      return res
        .status(400)
        .json({ message: "Kategori dan judul wajib diisi" });
    }

    const [result] = await db.query(
      `
      INSERT INTO informasi_publik
      (kategori, judul, deskripsi, tahun, posisi, status_publish)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
      [
        kategori,
        judul,
        deskripsi || "",
        tahun || "",
        Number(posisi || 1), // ✅ PASTIKAN ANGKA
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

/* =========================
INFORMASI PUBLIK - PUT (Admin Edit)
========================= */
app.put(
  "/api/admin/informasi-publik/:id",
  requireAdmin,
  upload.array("berkas"),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { kategori, judul, deskripsi, tahun, posisi, status_publish } =
      req.body;

    // 🔍 DEBUG
    console.log("📥 PUT /api/admin/informasi-publik/" + id, {
      kategori,
      judul,
      tahun,
      posisi: posisi || 1,
      status_publish,
    });

    await db.query(
      `
      UPDATE informasi_publik
      SET kategori = ?, judul = ?, deskripsi = ?, tahun = ?, posisi = ?, status_publish = ?
      WHERE id = ?
    `,
      [
        kategori,
        judul,
        deskripsi || "",
        tahun || "",
        Number(posisi || 1), // ✅ PASTIKAN ANGKA
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

/* =========================
INFORMASI PUBLIK - DELETE (Admin Hapus)
========================= */
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
HAPUS BERKAS INFORMASI PUBLIK
========================= */
app.delete(
  "/api/admin/informasi-publik/:id/files/:fileId",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { id, fileId } = req.params;
    const [rows] = await db.query(
      "SELECT nama_file FROM informasi_publik_berkas WHERE id = ? AND informasi_id = ? LIMIT 1",
      [fileId, id],
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Berkas tidak ditemukan" });
    }

    deleteUploadedFile(rows[0].nama_file);
    await db.query(
      "DELETE FROM informasi_publik_berkas WHERE id = ? AND informasi_id = ?",
      [fileId, id],
    );

    res.json({ message: "Berkas berhasil dihapus" });
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
/* =========================
   PERMOHONAN INFORMASI - UPDATE LENGKAP
========================= */

// Submit Permohonan dengan Data Lengkap + Upload File
app.post(
  "/api/permohonan",
  requireAuth,
  upload.fields([
    { name: "file_ktp", maxCount: 1 },
    { name: "file_foto", maxCount: 1 },
  ]),
  asyncHandler(async (req, res) => {
    const {
      nama_lengkap,
      nomor_ktp,
      alamat,
      pekerjaan,
      no_hp,
      email_pemohon,
      rincian_informasi,
      tujuan_penggunaan,
      cara_memperoleh,
      cara_salinan,
      pernyataan_disetujui,
    } = req.body;

    // Validasi field wajib
    const requiredFields = {
      nama_lengkap,
      nomor_ktp,
      alamat,
      rincian_informasi,
      tujuan_penggunaan,
      cara_memperoleh,
      cara_salinan,
    };

    for (const [field, value] of Object.entries(requiredFields)) {
      if (!value || !String(value).trim()) {
        return res.status(400).json({
          message: `Field ${field.replace(/_/g, " ")} wajib diisi`,
        });
      }
    }

    if (!pernyataan_disetujui || pernyataan_disetujui !== "true") {
      return res.status(400).json({
        message: "Anda harus menyetujui pernyataan kebenaran data",
      });
    }

    // Validasi upload file
    if (!req.files?.file_ktp?.[0]) {
      return res.status(400).json({
        message: "Upload KTP/SIM/Paspor wajib dilakukan",
      });
    }

    if (!req.files?.file_foto?.[0]) {
      return res.status(400).json({
        message: "Upload foto selfie wajib dilakukan",
      });
    }

    const fileKtp = req.files.file_ktp[0];
    const fileFoto = req.files.file_foto[0];

    // Generate nomor pendaftaran otomatis
    const now = new Date();
    const bulan = String(now.getMonth() + 1).padStart(2, "0");
    const tahun = now.getFullYear();
    const random = String(Math.floor(Math.random() * 999) + 1).padStart(3, "0");
    const nomorPendaftaran = `${random}/PPID/MAN2PLG/PIP/${bulan}/${tahun}`;

    const [result] = await db.query(
      `
      INSERT INTO permohonan
      (user_id, nama_lengkap, nomor_ktp, alamat, pekerjaan, no_hp, email_pemohon,
       rincian_informasi, tujuan_penggunaan, cara_memperoleh, cara_salinan,
       file_ktp, file_foto, nomor_pendaftaran, pernyataan_disetujui, status, tanggal_pengajuan)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'Pending', NOW())
    `,
      [
        req.user.id,
        nama_lengkap.trim(),
        nomor_ktp.trim(),
        alamat.trim(),
        pekerjaan?.trim() || "",
        no_hp?.trim() || "",
        email_pemohon?.trim() || req.user.email,
        rincian_informasi.trim(),
        tujuan_penggunaan.trim(),
        cara_memperoleh,
        cara_salinan,
        fileKtp.filename,
        fileFoto.filename,
        nomorPendaftaran,
      ]
    );

    res.status(201).json({
      message: "Permohonan berhasil dikirim",
      id: result.insertId,
      nomor_pendaftaran: nomorPendaftaran,
    });
  })
);

// Get Detail Permohonan (untuk cetak PDF)
app.get(
  "/api/permohonan/:id/detail",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const [rows] = await db.query(
      `
      SELECT p.*, u.nama_lengkap as user_nama, u.email as user_email
      FROM permohonan p
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.id = ? AND (p.user_id = ? OR ? = 'admin')
      LIMIT 1
    `,
      [id, req.user.id, req.user.role || ""]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Permohonan tidak ditemukan" });
    }

    res.json(rows[0]);
  })
);

// Admin: Verifikasi Permohonan
app.put(
  "/api/admin/permohonan/:id/verifikasi",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status, nomor_pendaftaran, alasan_penolakan } = req.body;

    const validStatus = ["Diverifikasi", "Diproses", "Selesai", "Ditolak"];
    if (!validStatus.includes(status)) {
      return res.status(400).json({ message: "Status tidak valid" });
    }

    await db.query(
      `
      UPDATE permohonan 
      SET status = ?, 
          nomor_pendaftaran = COALESCE(?, nomor_pendaftaran),
          alasan_penolakan = ?,
          tanggal_pengajuan = COALESCE(tanggal_pengajuan, NOW())
      WHERE id = ?
    `,
      [status, nomor_pendaftaran || null, alasan_penolakan || null, id]
    );

    res.json({ message: "Status permohonan berhasil diperbarui" });
  })
);

// Admin: Get Semua Permohonan (dengan filter)
app.get(
  "/api/admin/permohonan",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { status, search } = req.query;
    
    let query = `
      SELECT p.*, u.nama_lengkap as user_nama, u.email as user_email
      FROM permohonan p
      LEFT JOIN users u ON p.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += " AND p.status = ?";
      params.push(status);
    }

    if (search) {
      query += " AND (p.nama_lengkap LIKE ? OR p.nomor_pendaftaran LIKE ? OR p.nomor_ktp LIKE ?)";
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam);
    }

    query += " ORDER BY p.tanggal_pengajuan DESC";

    const [rows] = await db.query(query, params);
    res.json(rows);
  })
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

/* =========================================================================
   FIXED/UPDATED ROUTE: GET /api/posts/:slug dengan Fallback Menu Pages 
========================================================================= */
app.get("/api/posts/:slug", async (req, res) => {
  try {
    const { slug } = req.params;

    // 1. Coba cari di submenu_pages terlebih dahulu
    const [submenu] = await db.query(
      "SELECT * FROM submenu_pages WHERE slug = ?",
      [slug],
    );

    if (submenu.length > 0) {
      const menu = submenu[0];
      const [posts] = await db.query(
        `SELECT * FROM content_posts 
         WHERE submenu_id = ? AND status = 'publish'
         ORDER BY created_at DESC`,
        [menu.id],
      );

      return res.json({
        submenu: menu,
        posts,
      });
    }

    // 2. Fallback: Jika tidak ada di submenu_pages, cari di menu_pages (seperti profil-ppid, visi-misi)
    const [menuPages] = await db.query(
      "SELECT * FROM menu_pages WHERE slug = ? LIMIT 1",
      [slug],
    );

    if (menuPages.length > 0) {
      const page = menuPages[0];

      // Ambil berkas jika ada
      const [files] = await db.query(
        "SELECT * FROM menu_page_files WHERE page_id = ? ORDER BY id ASC",
        [page.id],
      );

      // Ubah format data menu_page agar menyerupai objek post yang dimengerti frontend
      return res.json({
        submenu: {
          id: page.id,
          title: page.judul,
          slug: page.slug,
          content: page.isi,
        },
        posts: [
          {
            id: page.id,
            title: page.judul,
            content: page.isi,
            created_at: page.created_at,
            berkas_list: files,
          },
        ],
      });
    }

    return res.status(404).json({ message: "Halaman/Submenu tidak ditemukan" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetch posts atau menu fallback" });
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
    parent_menu: "REGULASI",
    menu_label: "UU KIP",
    slug: "uu-kip",
    judul: "UU KIP",
    isi: "Konten regulasi UU KIP dapat diedit dan dilengkapi berkas melalui Panel Admin.",
    position: 1,
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
    parent_menu: "LAYANAN INFORMASI",
    menu_label: "Biaya Layanan",
    slug: "biaya-layanan",
    judul: "Biaya Layanan",
    isi: "Informasi biaya layanan dapat diedit melalui Panel Admin.",
    position: 3,
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

const ensureAllTables = async () => {
  if (!useRealDb) return;
  try {
    const [tables] = await db.query("SHOW TABLES");
    const tableNames = tables.map((row) =>
      String(Object.values(row)[0]).toLowerCase(),
    );

    if (
      !tableNames.includes("users") ||
      !tableNames.includes("informasi_beranda")
    ) {
      console.log(
        "Database empty or missing required tables. Bootstrapping tables from db_ppid_man2.sql...",
      );
      const sqlPath = path.resolve(__dirname, "../db_ppid_man2.sql");
      if (fs.existsSync(sqlPath)) {
        const sqlContent = fs.readFileSync(sqlPath, "utf8");
        const lines = sqlContent.split("\n");
        let cleaned = "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (
            trimmed.startsWith("--") ||
            trimmed.startsWith("#") ||
            (trimmed.startsWith("/*") && trimmed.endsWith("*/"))
          ) {
            continue;
          }
          cleaned += line + "\n";
        }
        const queries = cleaned
          .split(";")
          .map((q) => q.trim())
          .filter((q) => q.length > 0);

        for (const queryStr of queries) {
          try {
            await db.query(queryStr);
          } catch (queryErr) {
            console.error(
              "Error executing SQL statement during auto-import:",
              queryStr.substring(0, 80) + "...",
              "\nError:",
              queryErr.message,
            );
          }
        }
        console.log(
          "✅ Database bootstrapped successfully from db_ppid_man2.sql!",
        );
      } else {
        console.warn(
          "⚠️ Warning: db_ppid_man2.sql was not found at expected path:",
          sqlPath,
        );
      }
    } else {
      console.log("Database checked: Required tables exist.");
    }
  } catch (error) {
    console.error(
      "❌ Exception during db_ppid_man2.sql auto-bootstrap check:",
      error.message,
    );
  }
};

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

  try {
    await db.query(
      `UPDATE menu_pages SET parent_menu = 'LAYANAN INFORMASI' WHERE parent_menu = 'LAYANAN'`,
    );
  } catch (err) {
    console.error(
      "Migration: failed to migrate parent_menu LAYANAN:",
      err.message,
    );
  }

  for (const item of defaultMenuPages) {
    try {
      const [existing] = await db.query(
        "SELECT id FROM menu_pages WHERE slug = ? LIMIT 1",
        [item.slug],
      );
      if (existing.length === 0) {
        await db.query(
          `INSERT INTO menu_pages
            (parent_menu, menu_label, slug, judul, isi, status_publish, position, is_builtin)
            VALUES (?, ?, ?, ?, ?, ?, ?, 1)
          `,
          [
            item.parent_menu,
            item.menu_label,
            item.slug,
            item.judul,
            item.isi || `Konten ${item.menu_label} belum diisi oleh admin.`,
            "Tampil",
            item.position,
          ],
        );
      }
    } catch (err) {
      console.error(
        `Migration: failed to seed default page ${item.slug}:`,
        err.message,
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
      `SELECT * FROM menu_pages ${where} ORDER BY FIELD(parent_menu, 'PROFIL', 'REGULASI', 'INFORMASI PUBLIK', 'LAYANAN', 'LAYANAN INFORMASI', 'LAPORAN'), position ASC, id ASC`,
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
      `SELECT * FROM menu_pages ORDER BY FIELD(parent_menu, 'PROFIL', 'REGULASI', 'INFORMASI PUBLIK', 'LAYANAN', 'LAYANAN INFORMASI', 'LAPORAN'), position ASC, id ASC`,
    );

    res.json(await attachMenuPageFiles(pages));
  }),
);
app.get(
  "/api/admin/menu-pages/:id",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const [pages] = await db.query(
      "SELECT * FROM menu_pages WHERE id = ? LIMIT 1",
      [id],
    );

    if (pages.length === 0) {
      return res.status(404).json({ message: "Halaman tidak ditemukan" });
    }

    // Attach files jika ada
    const result = await attachMenuPageFiles(pages);
    res.json(result[0]);
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
      `INSERT INTO menu_pages
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
          `INSERT INTO menu_page_files
          (page_id, nama_file, nama_asli, mime_type, ukuran)
          VALUES (?, ?, ?, ?, ?)`,
          [pageId, file.filename, file.originalname, file.mimetype, file.size],
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
        finalSlug,
        judul,
        isi || "",
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
/* =========================
GET SINGLE MENU PAGE BY ID (Admin)
========================= */

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
   ADMIN: KELOLA PENGGUNA (USERS)
   (Diletakkan SEBELUM middleware catch-all /api)
========================= */

// GET: Ambil semua pengguna
// PUT: Reset password pengguna (Admin)
app.put(
  "/api/admin/users/:id/reset-password",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: "Password minimal 6 karakter" });
    }

    // Gunakan fungsi hashPassword yang sudah ada di atas file ini
    const hashedPassword = await hashPassword(newPassword);
    
    await db.query("UPDATE users SET password = ? WHERE id = ?", [hashedPassword, id]);
    res.json({ message: "Password berhasil direset" });
  })
);
app.get(
  "/api/admin/users",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const [rows] = await db.query(
      `SELECT id, nama_lengkap, nik, no_hp, email, role, created_at 
       FROM users 
       ORDER BY created_at DESC`
    );
    res.json(rows);
  })
);

// DELETE: Hapus pengguna (tidak bisa hapus admin)
app.delete(
  "/api/admin/users/:id",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const [user] = await db.query("SELECT role FROM users WHERE id = ?", [id]);
    if (user.length === 0) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }
    if (user[0].role === "admin") {
      return res.status(403).json({ message: "Tidak bisa menghapus akun admin" });
    }
    await db.query("DELETE FROM users WHERE id = ?", [id]);
    res.json({ message: "Pengguna berhasil dihapus" });
  })
);

// PUT: Ubah role pengguna (admin/user)
app.put(
  "/api/admin/users/:id/role",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;
    if (!["admin", "user"].includes(role)) {
      return res.status(400).json({ message: "Role tidak valid" });
    }
    await db.query("UPDATE users SET role = ? WHERE id = ?", [role, id]);
    res.json({ message: "Role pengguna berhasil diperbarui" });
  })
);
// PUT: Reset password pengguna (Admin)
app.put(
  "/api/admin/users/:id/reset-password",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: "Password minimal 6 karakter" });
    }

    const hashedPassword = await hashPassword(newPassword);
    await db.query("UPDATE users SET password = ? WHERE id = ?", [hashedPassword, id]);
    res.json({ message: "Password berhasil direset" });
  })
);
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
  const distPath = path.resolve(__dirname, "../dist");
  const hasVite = fs.existsSync(
    path.resolve(__dirname, "../node_modules/vite"),
  );

  if (process.env.NODE_ENV !== "production" && hasVite) {
    try {
      const { createServer: createViteServer } = require("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } catch (e) {
      console.warn(
        "⚠️ Gagal memuat Vite, fallback ke file statis dist:",
        e.message,
      );
      app.use(express.static(distPath));
      app.get("*", (req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    }
  } else {
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  await initDatabase();

  app.listen(PORT, "0.0.0.0", async () => {
    try {
      console.log(
        `✅ Database terinisialisasi (${useRealDb ? "Real MySQL" : "Mock JSON"})`,
      );
      await ensureAllTables();
      await ensureMenuCmsTables();
      console.log("✅ Tabel CMS menu siap");
    } catch (error) {
      console.error("❌ Gagal inisialisasi database server:", error.message);
    }

    console.log(`🚀 Server berjalan di port ${PORT}`);
  });
}

startServer();