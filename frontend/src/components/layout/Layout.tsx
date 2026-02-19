import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import styles from './Layout.module.css';

export default function Layout() {
  const { user, logout } = useAuth();

  const navItems = [
    { text: 'Dashboard', path: '/' },
    { text: 'Vehicles', path: '/vehicles' },
    { text: 'Financials', path: '/financials' },
  ];

  if (user?.role === 'admin') {
    navItems.push({ text: 'Reports', path: '/financials/reports' });
  }

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <div className={styles.logo}>Clearing ERP</div>
        <nav className={styles.nav}>
          <ul>
            {navItems.map((item) => (
              <li key={item.text}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) => (isActive ? styles.active : '')}
                >
                  {item.text}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className={styles.user}>
          <span>{user?.email}</span>
          <button onClick={logout}>Logout</button>
        </div>
      </header>
      <main className={styles.main}>
        <div className={styles.container}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}