-- phpMyAdmin SQL Dump
-- version 4.9.2
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: May 29, 2026 at 09:46 AM
-- Server version: 10.4.11-MariaDB
-- PHP Version: 7.4.1

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `db_ppid_man2`
--

-- --------------------------------------------------------

--
-- Table structure for table `beranda`
--

CREATE TABLE `beranda` (
  `id` int(11) NOT NULL,
  `nama_instansi` varchar(255) NOT NULL,
  `logo_url` varchar(255) DEFAULT NULL,
  `kontak_telepon` varchar(50) DEFAULT NULL,
  `kontak_email` varchar(100) DEFAULT NULL,
  `alamat` text DEFAULT NULL,
  `banner_badge` varchar(255) DEFAULT NULL,
  `banner_judul` varchar(255) DEFAULT NULL,
  `banner_highlight` varchar(255) DEFAULT NULL,
  `banner_subjudul` text DEFAULT NULL,
  `banner_gambar` varchar(255) DEFAULT NULL,
  `footer_deskripsi` text DEFAULT NULL,
  `prosedur_judul` varchar(255) DEFAULT NULL,
  `prosedur_isi` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `informasi_beranda`
--

CREATE TABLE `informasi_beranda` (
  `id` int(11) NOT NULL DEFAULT 1,
  `banner_judul` varchar(255) DEFAULT NULL,
  `banner_subjudul` text DEFAULT NULL,
  `info_berkala` text DEFAULT NULL,
  `info_serta_merta` text DEFAULT NULL,
  `info_setiap_saat` text DEFAULT NULL,
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `nama_instansi` varchar(255) DEFAULT NULL,
  `logo_url` text DEFAULT NULL,
  `kontak_telepon` varchar(100) DEFAULT NULL,
  `kontak_email` varchar(255) DEFAULT NULL,
  `alamat` text DEFAULT NULL,
  `banner_badge` varchar(255) DEFAULT NULL,
  `banner_highlight` varchar(255) DEFAULT NULL,
  `banner_gambar` text DEFAULT NULL,
  `footer_deskripsi` text DEFAULT NULL,
  `prosedur_judul` varchar(255) DEFAULT NULL,
  `prosedur_isi` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `informasi_beranda`
--

INSERT INTO `informasi_beranda` (`id`, `banner_judul`, `banner_subjudul`, `info_berkala`, `info_serta_merta`, `info_setiap_saat`, `updated_at`, `nama_instansi`, `logo_url`, `kontak_telepon`, `kontak_email`, `alamat`, `banner_badge`, `banner_highlight`, `banner_gambar`, `footer_deskripsi`, `prosedur_judul`, `prosedur_isi`) VALUES
(1, 'Keterbukaan Informasi', 'Pejabat Pengelola Informasi dan Dokumentasi (PPID) MAN 2 Palembang memberikan pelayanan informasi yang transparan dan akuntabel bagi seluruh masyarakat.', NULL, NULL, NULL, '2026-05-20 12:31:27', 'PPID UNIT MAN 12 Kota Palembang', 'https://man2plg.sch.id/Foto/logo.png', '(0711) 123456', 'ppid@man2plg.sch.id', 'Jl. Prof. KH. Zainal Abidin, Kec. Kemuning, Palembang', 'Portal Layanan Informasi', 'Adalah Hak Anda.', 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80', 'Mewujudkan keterbukaan informasi madrasah yang modern dan transparan.', 'Makan Nasi', '1. cuci tangan\n2. makan nasi');

-- --------------------------------------------------------

--
-- Table structure for table `informasi_publik`
--

CREATE TABLE `informasi_publik` (
  `id` int(11) NOT NULL,
  `kategori` enum('Informasi Berkala','Informasi Serta Merta','Informasi Setiap Saat','Informasi Dikecualikan','Laporan Tahunan','Laporan Statistik','Regulasi','Layanan') NOT NULL,
  `judul` varchar(255) NOT NULL,
  `deskripsi` text DEFAULT NULL,
  `tahun` varchar(20) DEFAULT NULL,
  `status_publish` enum('Tampil','Sembunyi') DEFAULT 'Tampil',
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `informasi_publik`
--

INSERT INTO `informasi_publik` (`id`, `kategori`, `judul`, `deskripsi`, `tahun`, `status_publish`, `created_at`, `updated_at`) VALUES
(3, 'Layanan', 'tes', 'tes', '2026', 'Tampil', '2026-05-12 08:34:30', '2026-05-12 08:34:30'),
(4, 'Layanan', 'tweas4', 'ters', '2026', 'Tampil', '2026-05-12 08:35:21', '2026-05-12 08:35:21'),
(5, 'Regulasi', 'ytytyty', 'tytytytyt', '2026', 'Tampil', '2026-05-12 10:09:04', '2026-05-12 10:09:04');

-- --------------------------------------------------------

--
-- Table structure for table `informasi_publik_berkas`
--

CREATE TABLE `informasi_publik_berkas` (
  `id` int(11) NOT NULL,
  `informasi_id` int(11) NOT NULL,
  `nama_file` varchar(255) NOT NULL,
  `nama_asli` varchar(255) DEFAULT NULL,
  `mime_type` varchar(100) DEFAULT NULL,
  `ukuran` int(11) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `informasi_publik_files`
--

CREATE TABLE `informasi_publik_files` (
  `id` int(11) NOT NULL,
  `informasi_id` int(11) NOT NULL,
  `nama_file` varchar(255) NOT NULL,
  `nama_asli` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `menu_pages`
--

CREATE TABLE `menu_pages` (
  `id` int(11) NOT NULL,
  `parent_menu` varchar(100) NOT NULL,
  `menu_label` varchar(150) NOT NULL,
  `slug` varchar(180) NOT NULL,
  `judul` varchar(255) NOT NULL,
  `isi` longtext DEFAULT NULL,
  `status_publish` varchar(20) DEFAULT 'Tampil',
  `position` int(11) DEFAULT 1,
  `is_builtin` tinyint(1) DEFAULT 0,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `menu_pages`
--

INSERT INTO `menu_pages` (`id`, `parent_menu`, `menu_label`, `slug`, `judul`, `isi`, `status_publish`, `position`, `is_builtin`, `created_at`, `updated_at`) VALUES
(1, 'PROFIL', 'Profil PPID', 'profil-ppid', 'Profil PPID', 'Selamat Datang', 'Tampil', 1, 1, '2026-05-26 10:15:18', '2026-05-26 10:20:17'),
(2, 'PROFIL', 'Visi & Misi', 'visi-misi', 'Visi & Misi', 'Visi dan misi PPID dapat diedit melalui Panel Admin > Atur Menu Website.', 'Tampil', 2, 1, '2026-05-26 10:15:18', '2026-05-26 10:15:18'),
(3, 'PROFIL', 'Tugas & Fungsi', 'tugas-fungsi', 'Tugas & Fungsi', 'Tugas dan fungsi PPID dapat diedit melalui Panel Admin > Atur Menu Website.', 'Tampil', 3, 1, '2026-05-26 10:15:18', '2026-05-26 10:15:18'),
(4, 'PROFIL', 'Struktur Organisasi', 'struktur-organisasi', 'Struktur Organisasi', 'Struktur organisasi dapat diedit dan dilengkapi berkas melalui Panel Admin.', 'Tampil', 4, 1, '2026-05-26 10:15:18', '2026-05-26 10:15:18'),
(5, 'PROFIL', 'Maklumat Pelayanan', 'maklumat-pelayanan', 'Maklumat Pelayanan', 'Maklumat pelayanan dapat diedit melalui Panel Admin.', 'Tampil', 5, 1, '2026-05-26 10:15:18', '2026-05-26 10:15:18'),
(6, 'REGULASI', 'UU KIP', 'uu-kip', 'UU KIP', 'Konten regulasi UU KIP dapat diedit dan dilengkapi berkas melalui Panel Admin.', 'Tampil', 1, 1, '2026-05-26 10:15:18', '2026-05-26 10:15:18'),
(7, 'REGULASI', 'Peraturan Menteri', 'peraturan-menteri', 'Peraturan Menteri', 'Konten peraturan menteri dapat diedit dan dilengkapi berkas melalui Panel Admin.', 'Tampil', 2, 1, '2026-05-26 10:15:18', '2026-05-26 10:15:18'),
(8, 'REGULASI', 'SOP PPID', 'sop-ppid', 'SOP PPID', 'SOP PPID dapat diedit dan dilengkapi berkas melalui Panel Admin.', 'Tampil', 3, 1, '2026-05-26 10:15:18', '2026-05-26 10:15:18'),
(9, 'REGULASI', 'SK PPID', 'sk-ppid', 'SK PPID', 'SK PPID dapat diedit dan dilengkapi berkas melalui Panel Admin.', 'Tampil', 4, 1, '2026-05-26 10:15:18', '2026-05-26 10:15:18'),
(10, 'INFORMASI PUBLIK', 'Informasi Berkala', 'informasi-berkala', 'Informasi Berkala', 'Klik menu ini untuk melihat daftar dokumen informasi berkala pada tabel informasi publik.', 'Tampil', 1, 1, '2026-05-26 10:15:18', '2026-05-26 10:15:18'),
(11, 'INFORMASI PUBLIK', 'Informasi Serta Merta', 'informasi-serta-merta', 'Informasi Serta Merta', 'Klik menu ini untuk melihat daftar dokumen informasi serta merta pada tabel informasi publik.', 'Tampil', 2, 1, '2026-05-26 10:15:18', '2026-05-26 10:15:18'),
(12, 'INFORMASI PUBLIK', 'Informasi Setiap Saat', 'informasi-setiap-saat', 'Informasi Setiap Saat', 'Klik menu ini untuk melihat daftar dokumen informasi setiap saat pada tabel informasi publik.', 'Tampil', 3, 1, '2026-05-26 10:15:18', '2026-05-26 10:15:18'),
(13, 'INFORMASI PUBLIK', 'Informasi Dikecualikan', 'informasi-dikecualikan', 'Informasi Dikecualikan', 'Klik menu ini untuk melihat daftar dokumen informasi dikecualikan pada tabel informasi publik.', 'Tampil', 4, 1, '2026-05-26 10:15:18', '2026-05-26 10:15:18'),
(14, 'LAYANAN', 'Prosedur Permohonan', 'prosedur-permohonan', 'Prosedur Permohonan', 'SIP', 'Tampil', 1, 1, '2026-05-26 10:15:18', '2026-05-26 10:24:42'),
(15, 'LAYANAN', 'Prosedur Keberatan', 'prosedur-keberatan', 'Prosedur Keberatan', 'Prosedur keberatan dapat diedit melalui Panel Admin.', 'Tampil', 2, 1, '2026-05-26 10:15:18', '2026-05-26 10:15:18'),
(16, 'LAYANAN', 'Biaya Layanan', 'biaya-layanan', 'Biaya Layanan', 'Informasi biaya layanan dapat diedit melalui Panel Admin.', 'Tampil', 3, 1, '2026-05-26 10:15:18', '2026-05-26 10:15:18'),
(17, 'LAYANAN', 'Hak & Tata Cara', 'hak-tata-cara', 'Hak & Tata Cara', 'Hak dan tata cara memperoleh informasi dapat diedit melalui Panel Admin.', 'Tampil', 4, 1, '2026-05-26 10:15:18', '2026-05-26 10:15:18'),
(18, 'LAPORAN', 'Laporan Tahunan', 'laporan-tahunan', 'Laporan Tahunan', 'Laporan tahunan dapat diedit dan dilengkapi berkas melalui Panel Admin.', 'Tampil', 1, 1, '2026-05-26 10:15:18', '2026-05-26 10:15:18'),
(19, 'LAPORAN', 'Laporan Statistik', 'laporan-statistik', 'Laporan Statistik', 'Laporan statistik dapat diedit dan dilengkapi berkas melalui Panel Admin.', 'Tampil', 2, 1, '2026-05-26 10:15:18', '2026-05-26 10:15:18'),
(20, 'LAPORAN', 'Laporan Akses', 'laporan-akses', 'Laporan Akses', 'Laporan akses informasi dapat diedit dan dilengkapi berkas melalui Panel Admin.', 'Tampil', 3, 1, '2026-05-26 10:15:18', '2026-05-26 10:15:18');

-- --------------------------------------------------------

--
-- Table structure for table `menu_page_files`
--

CREATE TABLE `menu_page_files` (
  `id` int(11) NOT NULL,
  `page_id` int(11) NOT NULL,
  `nama_file` varchar(255) NOT NULL,
  `nama_asli` varchar(255) DEFAULT NULL,
  `mime_type` varchar(120) DEFAULT NULL,
  `ukuran` int(11) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `menu_page_files`
--

INSERT INTO `menu_page_files` (`id`, `page_id`, `nama_file`, `nama_asli`, `mime_type`, `ukuran`, `created_at`) VALUES
(1, 13, '1779766178302-guest-form.docx', 'guest form.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 25081, '2026-05-26 10:29:38'),
(2, 6, '1779766594373-Server-Js-Cleaned.docx', 'Server Js Cleaned.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 10981, '2026-05-26 10:36:34'),
(3, 10, '1779769217644-Server-Js-Cleaned.docx', 'Server Js Cleaned.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 10981, '2026-05-26 11:20:17');

-- --------------------------------------------------------

--
-- Table structure for table `navbar`
--

CREATE TABLE `navbar` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `href` varchar(255) NOT NULL,
  `submenu` text DEFAULT NULL,
  `position` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `navbar`
--

INSERT INTO `navbar` (`id`, `name`, `href`, `submenu`, `position`) VALUES
(2, 'dfsdfdsfdfdf', '#', '[]', 2);

-- --------------------------------------------------------

--
-- Table structure for table `navbar_items`
--

CREATE TABLE `navbar_items` (
  `id` int(11) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `href` varchar(255) DEFAULT NULL,
  `submenu` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`submenu`)),
  `position` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `navbar_items`
--

INSERT INTO `navbar_items` (`id`, `name`, `href`, `submenu`, `position`) VALUES
(1, 'ZONA INTEGRITAS', '#', '[{\"name\":\"Tes\",\"href\":\"#\"}]', 1),
(2, 'Makan', '#', '[]', 1);

-- --------------------------------------------------------

--
-- Table structure for table `permohonan`
--

CREATE TABLE `permohonan` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `subjek` varchar(255) DEFAULT NULL,
  `tujuan_informasi` text DEFAULT NULL,
  `cara_memperoleh` varchar(50) DEFAULT NULL,
  `status` enum('Pending','Diproses','Selesai','Ditolak') DEFAULT 'Pending',
  `tanggal_pengajuan` timestamp NOT NULL DEFAULT current_timestamp(),
  `estimasi` varchar(100) DEFAULT NULL,
  `berkas_balasan` varchar(255) DEFAULT NULL,
  `pesan_admin` text DEFAULT NULL,
  `tanggal_jawaban` datetime DEFAULT NULL,
  `catatan_admin` text DEFAULT NULL,
  `jawaban_admin` text DEFAULT NULL,
  `berkas_jawaban` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `berkas_permohonan` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `permohonan`
--

INSERT INTO `permohonan` (`id`, `user_id`, `subjek`, `tujuan_informasi`, `cara_memperoleh`, `status`, `tanggal_pengajuan`, `estimasi`, `berkas_balasan`, `pesan_admin`, `tanggal_jawaban`, `catatan_admin`, `jawaban_admin`, `berkas_jawaban`, `created_at`, `berkas_permohonan`) VALUES
(1, 1, 'testing', 'testing', 'Email', 'Diproses', '2026-05-09 22:20:15', '30 mei 2026', NULL, NULL, NULL, NULL, NULL, NULL, '2026-05-12 01:28:34', NULL),
(2, 1, 'tes2', 'tes2', 'Email', 'Diproses', '2026-05-09 22:29:53', '13 mei 2026', NULL, NULL, NULL, NULL, NULL, NULL, '2026-05-12 01:28:34', NULL),
(3, 1, 'tes3', 'tes3', 'Email', 'Diproses', '2026-05-10 02:12:21', '23 b 5098', NULL, NULL, NULL, NULL, NULL, NULL, '2026-05-12 01:28:34', NULL),
(4, 1, 'makan', 'makan', 'Email', 'Selesai', '2026-05-11 04:41:22', '3 hari kerja', NULL, 'tyrtyrt', '2026-05-11 13:11:09', NULL, NULL, NULL, '2026-05-12 01:28:34', NULL),
(5, 1, 'tes5', 'yertwererewrer', 'Email', 'Diproses', '2026-05-20 05:32:28', '12 Juni 2026', NULL, NULL, NULL, 'mencoba itu ok', NULL, NULL, '2026-05-20 05:32:28', NULL),
(6, 1, 'anggaran 23', 'Uji Coba', 'Email', 'Diproses', '2026-05-20 05:35:43', '3 hARI KERJA', NULL, NULL, NULL, NULL, NULL, NULL, '2026-05-20 05:35:43', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `nama_lengkap` varchar(100) NOT NULL,
  `nik` varchar(20) NOT NULL,
  `no_hp` varchar(20) DEFAULT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('user','admin') DEFAULT 'user',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `nama_lengkap`, `nik`, `no_hp`, `email`, `password`, `role`, `created_at`) VALUES
(1, 'Junaidi -', '1671076001900011', '085656309848', 'dataumumjun@gmail.com', '12345', 'user', '2026-05-07 08:22:52'),
(4, 'admin', '111111111111111', '085366488829', 'infolayananman2plg@gmail.com', '$2a$10$/xyilQEIZDyGbgK8VitizO5YPgzrZya7DwWLYH.9Zyg4HMc5hRoUW', 'admin', '2026-05-07 08:22:52');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `beranda`
--
ALTER TABLE `beranda`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `informasi_beranda`
--
ALTER TABLE `informasi_beranda`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `informasi_publik`
--
ALTER TABLE `informasi_publik`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `informasi_publik_berkas`
--
ALTER TABLE `informasi_publik_berkas`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_informasi_publik_berkas` (`informasi_id`);

--
-- Indexes for table `informasi_publik_files`
--
ALTER TABLE `informasi_publik_files`
  ADD PRIMARY KEY (`id`),
  ADD KEY `informasi_id` (`informasi_id`);

--
-- Indexes for table `menu_pages`
--
ALTER TABLE `menu_pages`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`);

--
-- Indexes for table `menu_page_files`
--
ALTER TABLE `menu_page_files`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_menu_page_files_page` (`page_id`);

--
-- Indexes for table `navbar`
--
ALTER TABLE `navbar`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `navbar_items`
--
ALTER TABLE `navbar_items`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `permohonan`
--
ALTER TABLE `permohonan`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nik` (`nik`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `beranda`
--
ALTER TABLE `beranda`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `informasi_publik`
--
ALTER TABLE `informasi_publik`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `informasi_publik_berkas`
--
ALTER TABLE `informasi_publik_berkas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `informasi_publik_files`
--
ALTER TABLE `informasi_publik_files`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `menu_pages`
--
ALTER TABLE `menu_pages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT for table `menu_page_files`
--
ALTER TABLE `menu_page_files`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `navbar`
--
ALTER TABLE `navbar`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `navbar_items`
--
ALTER TABLE `navbar_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `permohonan`
--
ALTER TABLE `permohonan`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `informasi_publik_berkas`
--
ALTER TABLE `informasi_publik_berkas`
  ADD CONSTRAINT `fk_informasi_publik_berkas` FOREIGN KEY (`informasi_id`) REFERENCES `informasi_publik` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `menu_page_files`
--
ALTER TABLE `menu_page_files`
  ADD CONSTRAINT `fk_menu_page_files_page` FOREIGN KEY (`page_id`) REFERENCES `menu_pages` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `permohonan`
--
ALTER TABLE `permohonan`
  ADD CONSTRAINT `permohonan_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
