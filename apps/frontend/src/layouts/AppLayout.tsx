import { NavLink, Outlet } from 'react-router-dom';
import './AppLayout.css';

function GridIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

export function AppLayout() {
  return (
    <div className="app-layout">
      <aside className="sidebar">
        <a className="brand" href="/" aria-label="WebPilot home">
          <span className="brand-mark" aria-hidden="true">W</span>
          <span>WebPilot</span>
        </a>

        <nav className="primary-nav" aria-label="Primary navigation">
          <NavLink to="/" end>
            <GridIcon />
            Projects
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <div className="avatar" aria-hidden="true">MS</div>
          <div className="account-copy">
            <strong>My workspace</strong>
            <span>Personal</span>
          </div>
          <button className="icon-button" type="button" aria-label="Workspace options">•••</button>
        </div>
      </aside>

      <div className="main-column">
        <header className="topbar">
          <span className="topbar-title">Workspace</span>
          <button className="help-button" type="button" aria-label="Help">?</button>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
