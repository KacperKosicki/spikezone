import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../api/api";
import styles from "./Teams.module.scss";

export default function Teams() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [msg, setMsg] = useState("Ładowanie...");

  useEffect(() => {
    (async () => {
      try {
        setMsg("Ładowanie...");
        const data = await apiFetch("/api/teams"); // public
        setItems(Array.isArray(data) ? data : []);
        setMsg("");
      } catch (e) {
        setMsg(`❌ ${e.message}`);
      }
    })();
  }, []);

  return (
    <section className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.h1}>Drużyny</h1>
        <p className={styles.sub}>Lista zaakceptowanych drużyn w SPIKEZONE.</p>

        {msg && <div className={styles.msg}>{msg}</div>}

        <div className={styles.grid}>
          {items.map((t) => (
            <button
              key={t._id}
              className={styles.card}
              onClick={() => navigate(`/teams/${t.slug}`)}
              type="button"
            >
              <div className={styles.title}>{t.name}</div>

              <div className={styles.meta}>
                <span className={styles.badge}>
                  {t.members?.length || 0} zawodników
                </span>
              </div>

              {t.description && (
                <div className={styles.desc}>
                  {String(t.description).slice(0, 140)}
                  {String(t.description).length > 140 ? "..." : ""}
                </div>
              )}

              <div className={styles.open}>Otwórz →</div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
