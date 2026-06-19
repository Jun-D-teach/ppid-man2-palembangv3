import React, { useState } from "react";
import { api } from "../api";

const AddMenu = () => {
  const [name, setName] = useState("");
  const [href, setHref] = useState("");
  const [submenu, setSubmenu] = useState([]);
  const [position, setPosition] = useState(1);
  const [submenuName, setSubmenuName] = useState("");
  const [submenuHref, setSubmenuHref] = useState("");

  const handleAddMenu = async (e) => {
    e.preventDefault();
    try {
      await api.post("/api/admin/navbar", { name, href, submenu, position });
      alert("Menu berhasil ditambahkan");
    } catch (err) {
      alert("Gagal menambah menu");
    }
  };

  const handleAddSubmenu = () => {
    setSubmenu([...submenu, { name: submenuName, href: submenuHref }]);
    setSubmenuName("");
    setSubmenuHref("");
  };

  return (
    <div>
      <h1>Tambah Menu Baru</h1>
      <form onSubmit={handleAddMenu}>
        <label>
          Nama Menu:
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label>
          Link Menu:
          <input type="text" value={href} onChange={(e) => setHref(e.target.value)} required />
        </label>
        <label>
          Posisi Menu:
          <input type="number" value={position} onChange={(e) => setPosition(Number(e.target.value))} required />
        </label>

        <div>
          <h3>Submenu</h3>
          <label>
            Nama Submenu:
            <input
              type="text"
              value={submenuName}
              onChange={(e) => setSubmenuName(e.target.value)}
            />
          </label>
          <label>
            Link Submenu:
            <input
              type="text"
              value={submenuHref}
              onChange={(e) => setSubmenuHref(e.target.value)}
            />
          </label>
          <button type="button" onClick={handleAddSubmenu}>Tambah Submenu</button>
          <ul>
            {submenu.map((item, index) => (
              <li key={index}>
                {item.name} - {item.href}
              </li>
            ))}
          </ul>
        </div>

        <button type="submit">Tambah Menu</button>
      </form>
    </div>
  );
};

export default AddMenu;