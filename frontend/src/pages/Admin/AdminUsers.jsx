import { useEffect, useState } from "react";
import { apiFetch } from "../../api/api";
import styles from "./AdminPages.module.scss";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [msg, setMsg] = useState("");

  const load = async () => {
    setMsg("");
    const data = await apiFetch("/api/admin/users");
    setUsers(data);
  };

  useEffect(() => {
    load().catch((e) => setMsg(`❌ ${e.message}`));
  }, []);

  const setRole = async (id, role) => {
    setMsg("");
    try {
      await apiFetch(`/api/admin/users/${id}/role`, { method: "PATCH", body: { role } });
      setMsg("✅ Zmieniono rolę");
      await load();
    } catch (e) {
      setMsg(`❌ ${e.message}`);
    }
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.h1}>Użytkownicy</h1>
      <p className={styles.sub}>Lista kont w SPIKEZONE + zarządzanie rolami.</p>

      {msg && <div className={msg.startsWith("✅") ? styles.msgOk : styles.msgErr}>{msg}</div>}

      <div className={styles.list}>
        {users.map((u) => (
          <div key={u._id} className={styles.row}>
            <div className={styles.rowMain}>
              <strong>{u.displayName || "—"}</strong>
              <div className={styles.meta}>
                <span>{u.email}</span>
                <span>•</span>
                <span className={styles.badge}>{u.role || "user"}</span>
              </div>
            </div>

            <div className={styles.rowActions}>
              <button className={styles.btn} onClick={() => setRole(u._id, "user")}>user</button>
              <button className={styles.btn} onClick={() => setRole(u._id, "admin")}>admin</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
