import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import {
  HiOutlineHome,
  HiOutlineMap,
  HiOutlinePhone,
  HiOutlineUser,
  HiOutlineLogout,
  HiOutlineMenu,
  HiOutlineX,
} from 'react-icons/hi';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: HiOutlineHome },
  { to: '/plan', label: 'Plan Journey', icon: HiOutlineMap },
  { to: '/contacts', label: 'Contacts', icon: HiOutlinePhone },
  { to: '/profile', label: 'Profile', icon: HiOutlineUser },
];

export default function Navbar() {
  const { logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <nav className="glass-card sticky top-0 z-50 px-4 py-3 mb-6">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link to="/dashboard" className="flex items-center gap-2 no-underline">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <span className="text-lg font-bold gradient-text">SafePath</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all no-underline
                ${location.pathname === to
                  ? 'bg-primary-500/15 text-primary-400'
                  : 'text-surface-200 hover:bg-white/5 hover:text-white'
                }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-surface-200 hover:bg-danger-500/10 hover:text-danger-400 transition-all ml-2 cursor-pointer bg-transparent border-none"
          >
            <HiOutlineLogout className="w-4 h-4" />
            Logout
          </button>
        </div>

        {/* Mobile Hamburger */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden text-surface-200 hover:text-white transition-colors bg-transparent border-none cursor-pointer"
          aria-label="Toggle menu"
        >
          {menuOpen ? <HiOutlineX className="w-6 h-6" /> : <HiOutlineMenu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden mt-3 pt-3 border-t border-white/5 animate-fade-in">
          {navItems.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setMenuOpen(false)}
              className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all no-underline
                ${location.pathname === to
                  ? 'bg-primary-500/15 text-primary-400'
                  : 'text-surface-200 hover:bg-white/5'
                }`}
            >
              <Icon className="w-5 h-5" />
              {label}
            </Link>
          ))}
          <button
            onClick={() => { setMenuOpen(false); handleLogout(); }}
            className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-surface-200 hover:bg-danger-500/10 hover:text-danger-400 transition-all w-full bg-transparent border-none cursor-pointer"
          >
            <HiOutlineLogout className="w-5 h-5" />
            Logout
          </button>
        </div>
      )}
    </nav>
  );
}
