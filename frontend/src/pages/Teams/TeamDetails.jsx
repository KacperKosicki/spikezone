import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiFetch } from "../../api/api";
import styles from "./TeamDetails.module.scss";

export default function TeamDetails() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [team, setTeam] = useState(null);
  const [msg, setMsg] = useState("Ładowanie...");

  useEffect(() => {
    (async () => {
      try {
        setMsg("Ładowanie...");
        const data = await apiFetch(`/api/teams/${slug}`);
        setTeam(data);
        setMsg("");
      } catch (e) {
        setMsg(`❌ ${e.message}`);
      }
    })();
  }, [slug]);

  return (
    <section className={styles.page}>
      <div className={styles.container}>
        <button className={styles.back} onClick={() => navigate("/teams")}>
          ← Wróć
        </button>

        {msg && <div className={styles.msg}>{msg}</div>}

        {team && (
          <div className={styles.details}>
            <h1 className={styles.title}>{team.name}</h1>

            <div className={styles.meta}>
              <span className={styles.badge}>{team.status}</span>
              <span className={styles.badge}>{team.members?.length || 0} zawodników</span>
            </div>

            {team.description && (
              <p className={styles.desc}>{team.description}</p>
            )}

            <div className={styles.section}>
              <h2>Skład</h2>
              <ul className={styles.teamList}>
                {(team.members || []).map((m, idx) => (
                  <li key={idx} className={styles.teamItem}>
                    <strong>{m.fullName}</strong>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
