import React, { useState, useEffect } from 'react';
import { api } from "../api";
import EditNavbar from './EditNavbar';

const Navbar = () => {
  const [navbarItems, setNavbarItems] = useState([]);
  const [editItem, setEditItem] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false); // toggle menu mobile

  useEffect(() => {
    const fetchNavbarItems = async () => {
      try {
        const response = await api.get("/api/admin/navbar");
        setNavbarItems(response.data);
      } catch (error) {
        console.error('Gagal mengambil data navbar', error);
      }
    };
    fetchNavbarItems();
  }, []);

  const handleEditClick = (item) => setEditItem(item);

  const getSubmenuList = (submenu) => {
    if (!submenu) return [];
    if (Array.isArray(submenu)) return submenu;
    if (typeof submenu === 'object') return [];
    try {
      const parsed = JSON.parse(submenu);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error("Gagal parse submenu:", e);
      return [];
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 w-full bg-white z-50 shadow-md px-6 py-3">
      <div className="flex justify-between items-center max-w-screen-xl mx-auto">
        {/* Logo */}
        <div className="text-lg font-bold">PPID UNIT MAN 2 PALEMBANG</div>

        {/* Desktop menu */}
        <div className="hidden md:flex gap-6">
          {navbarItems.map(item => {
            const submenuItems = getSubmenuList(item.submenu);
            return (
              <div key={item.id} className="relative group">
                <a href={item.href} className="text-sm font-medium text-gray-700 hover:text-gray-900">
                  {item.name}
                </a>
                {submenuItems.length > 0 && (
                  <div className="absolute left-0 top-full hidden group-hover:flex flex-col bg-white border border-gray-200 shadow-lg mt-2">
                    {submenuItems.map(subitem => (
                      <a href={subitem.href} key={subitem.name} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        {subitem.name}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Hamburger Mobile */}
        <div className="md:hidden">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="text-gray-700"
          >
            ☰
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="flex flex-col md:hidden bg-white shadow-md w-full">
          {navbarItems.map(item => {
            const submenuItems = getSubmenuList(item.submenu);
            return (
              <div key={item.id} className="relative">
                <a href={item.href} className="block px-4 py-2 text-gray-700 font-medium hover:bg-gray-100">{item.name}</a>
                {submenuItems.length > 0 && (
                  <div className="flex flex-col pl-4">
                    {submenuItems.map(subitem => (
                      <a href={subitem.href} key={subitem.name} className="block px-4 py-2 text-gray-600 hover:bg-gray-50">
                        {subitem.name}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Edit popup */}
      {editItem && <EditNavbar navbarData={editItem} />}
    </nav>
  );
};

export default Navbar;