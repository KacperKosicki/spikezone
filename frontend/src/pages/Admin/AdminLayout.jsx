import { NavLink, Outlet } from "react-router-dom";
import styles from "./AdminLayout.module.scss";

export default function AdminLayout() {
  return (
    <section className={styles.wrap}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>SPIKEZONE • ADMIN</div>

        <nav className={styles.nav}>
          <NavLink end to="/admin" className={({ isActive }) => (isActive ? styles.active : "")}>
            Dashboard
          </NavLink>

          <NavLink
            to="/admin/tournaments"
            className={({ isActive }) => (isActive ? styles.active : "")}
          >
            Turnieje
          </NavLink>

          <NavLink
            to="/admin/teams"
            className={({ isActive }) => (isActive ? styles.active : "")}
          >
            Drużyny
          </NavLink>

          <NavLink
            to="/admin/users"
            className={({ isActive }) => (isActive ? styles.active : "")}
          >
            Użytkownicy
          </NavLink>
        </nav>
      </aside>

      <main className={styles.main}>
        <Outlet />
      </main>
    </section>
  );
}
