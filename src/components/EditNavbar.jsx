import React, { useState } from 'react';
import { api } from "../api";

const EditNavbar = ({ navbarData }) => {
  const [name, setName] = useState(navbarData.name);
  const [href, setHref] = useState(navbarData.href);
  const [submenu, setSubmenu] = useState(navbarData.submenu || '[]');
  const [position, setPosition] = useState(navbarData.position);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await api.put(`/api/admin/navbar/${navbarData.id}`, { name, href, submenu, position });
      alert('Menu berhasil diperbarui');
    } catch (err) {
      alert('Gagal memperbarui menu');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Nama Menu:</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div>
        <label>Link:</label>
        <input type="text" value={href} onChange={(e) => setHref(e.target.value)} required />
      </div>
      <div>
        <label>Submenu (JSON Format):</label>
        <textarea value={submenu} onChange={(e) => setSubmenu(e.target.value)} />
      </div>
      <div>
        <label>Urutan:</label>
        <input type="number" value={position} onChange={(e) => setPosition(e.target.value)} required />
      </div>
      <button type="submit">Simpan</button>
    </form>
  );
};

export default EditNavbar;