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
    <section className={styles.section}>
      <div className={styles.container}>
        <button className={styles.backModern} onClick={() => navigate("/teams")} type="button">
          ← Wróć do listy
        </button>

        {msg && <div className={styles.msg}>{msg}</div>}

        {team && (
          <div className={styles.detailsCard}>
            {/* HEADER */}
            <div className={styles.top}>
              <div className={styles.head}>
                <h1 className={styles.title}>{team.name}</h1>

                <div className={styles.metaRow}>
                  <span className={styles.pillSoft}>{team.status}</span>
                  <span className={styles.pillSoft}>{team.members?.length || 0} zawodników</span>
                </div>
              </div>
            </div>

            {/* DESC */}
            {team.description ? (
              <div className={styles.desc}>{team.description}</div>
            ) : (
              <div className={styles.msgInline}>Brak opisu drużyny.</div>
            )}

            {/* SQUAD */}
            <div className={styles.block}>
              <div className={styles.blockHead}>
                <h2>Skład</h2>
                <span className={styles.blockBadge}>{team.members?.length || 0}</span>
              </div>

              <ul className={styles.membersGrid}>
                {(team.members || []).map((m, idx) => (
                  <li key={idx} className={styles.memberCard}>
                    <span className={styles.memberName}>{m.fullName}</span>
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
