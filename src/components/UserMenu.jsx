import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Icon from './Icon.jsx';

function UserMenu() {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    const onPointerDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [open]);

  const onResetPassword = () => {
    setOpen(false);
    navigate('/reset-password');
  };

  return (
    <div className="menu-wrap" ref={wrapRef}>
      <button
        className="icon-btn"
        aria-label="Account"
        title="Account"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <Icon name="user" />
      </button>
      {open && (
        <div className="menu fade-in" role="menu">
          <button className="menu-item" role="menuitem" onClick={onResetPassword}>
            <Icon name="key" size={18} /> Reset password
          </button>
          <button className="menu-item menu-item-danger" role="menuitem" onClick={logout}>
            <Icon name="logout" size={18} /> Log out
          </button>
        </div>
      )}
    </div>
  );
}

export default UserMenu;
