import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../api/api";
import styles from "./MyTeam.module.scss";

export default function MyTeam() {
  const navigate = useNavigate();
  const [team, setTeam] = useState(null);
  const [msg, setMsg] = useState("Ładowanie...");

  useEffect(() => {
    (async () => {
      try {
        setMsg("Ładowanie...");
        const data = await apiFetch("/api/team/me"); // auth
        setTeam(data);
        setMsg("");
      } catch (e) {
        setMsg(`❌ ${e.message}`);
      }
    })();
  }, []);

  if (msg && !team) {
    return (
      <section className={styles.page}>
        <div className={styles.container}>
          <button className={styles.back} onClick={() => navigate("/teams")}>
            ← Wróć
          </button>
          <div className={styles.msg}>{msg}</div>
        </div>
      </section>
    );
  }

  if (!team) {
    return (
      <section className={styles.page}>
        <div className={styles.container}>
          <button className={styles.back} onClick={() => navigate("/teams")}>
            ← Wróć
          </button>
          <div className={styles.msg}>Nie masz drużyny. Utwórz ją tutaj:</div>
          <button className={styles.btnPrimary} onClick={() => navigate("/team/create")}>
            Stwórz drużynę
          </button>
        </div>
      </section>
    );
  }

  const statusText =
    team.status === "pending"
      ? "ROZPATRYWANIE"
      : team.status === "rejected"
      ? "ODRZUCONA"
      : "ZAAKCEPTOWANA";

  // ✅ blokada edycji tylko dla PENDING
  const isPending = team.status === "pending";

  return (
    <section className={styles.page}>
      <div className={styles.container}>
        <button className={styles.back} onClick={() => navigate("/teams")}>
          ← Wróć
        </button>

        <div className={styles.card}>
          <h1 className={styles.h1}>{team.name}</h1>

          <div className={styles.meta}>
            <span className={styles.badge}>{statusText}</span>
            <span className={styles.badge}>{team.members?.length || 0} zawodników</span>
          </div>

          {team.adminNote && (
            <div className={styles.note}>
              <strong>Uwaga od admina:</strong> {team.adminNote}
            </div>
          )}

          {team.description && <p className={styles.desc}>{team.description}</p>}

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

          <div className={styles.actions}>
            <button
              className={styles.btnGhost}
              onClick={() => navigate("/team/create")}
              disabled={isPending}
              title={
                isPending
                  ? "Drużyna jest w trakcie rozpatrywania – edycja zablokowana"
                  : "Edytuj drużynę"
              }
            >
              {isPending ? "Edycja zablokowana (ROZPATRYWANIE)" : "Edytuj drużynę"}
            </button>
          </div>

          {isPending && (
            <div className={styles.pendingInfo}>
              ⏳ Twoja drużyna jest w trakcie rozpatrywania. Edycja będzie dostępna po decyzji admina.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
