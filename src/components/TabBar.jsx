import { useLocation, useNavigate } from 'react-router-dom';
import Icon from './Icon.jsx';

const TABS = [
  { id: 'workouts', label: 'Workouts', icon: 'calendar', path: '/' },
  { id: 'progress', label: 'Progress', icon: 'activity', path: '/progress' },
];

function TabBar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const active = pathname === '/progress' ? 'progress' : 'workouts';

  return (
    <nav className="tabbar">
      {TABS.map((it) => (
        <button
          key={it.id}
          className={'tab-btn' + (active === it.id ? ' is-on' : '')}
          onClick={() => navigate(it.path)}
          aria-current={active === it.id ? 'page' : undefined}
        >
          <span className="tab-ico">
            <Icon name={it.icon} size={21} stroke={active === it.id ? 2.3 : 2} />
          </span>
          <span className="tab-lbl">{it.label}</span>
        </button>
      ))}
    </nav>
  );
}

export default TabBar;
