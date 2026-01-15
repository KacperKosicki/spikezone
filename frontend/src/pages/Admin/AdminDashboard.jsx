import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../../api/api";
import styles from "./AdminPages.module.scss";
import { Link } from "react-router-dom";

export default function AdminDashboard() {
  const [stats, setStats] = useState({ users: 0, tournaments: 0, teams: 0, teamsPending: 0 });
  const [pendingTeams, setPendingTeams] = useState([]);
  const [err, setErr] = useState("");
  const [actionMsg, setActionMsg] = useState("");
  const [busyId, setBusyId] = useState(null);

  const pendingCount = useMemo(() => pendingTeams.length, [pendingTeams]);

  const load = async () => {
    setErr("");
    setActionMsg("");

    try {
      const [users, tournaments, teams] = await Promise.all([
        apiFetch("/api/admin/users"),
        apiFetch("/api/admin/tournaments"),
        apiFetch("/api/admin/teams"),
      ]);

      const allTeams = Array.isArray(teams) ? teams : [];
      const pending = allTeams.filter((t) => t.status === "pending");

      setStats({
        users: Array.isArray(users) ? users.length : 0,
        tournaments: Array.isArray(tournaments) ? tournaments.length : 0,
        teams: allTeams.length,
        teamsPending: pending.length,
      });

      // pokaż ostatnie 6 do akcji
      setPendingTeams(pending.slice(0, 6));
    } catch (e) {
      setErr(e.message);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const setTeamStatus = async (id, status) => {
    try {
      setBusyId(id);
      setActionMsg("");
      await apiFetch(`/api/admin/teams/${id}/status`, {
        method: "PATCH",
        body: { status, adminNote: "" },
      });

      setActionMsg(status === "approved" ? "✅ Drużyna zaakceptowana" : "✅ Drużyna odrzucona");

      // odśwież listę i staty
      await load();
    } catch (e) {
      setActionMsg(`❌ ${e.message}`);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.h1}>Dashboard</h1>
      <p className={styles.sub}>Szybki podgląd panelu administracyjnego.</p>

      {err && <div className={styles.msgErr}>❌ {err}</div>}
      {actionMsg && (
        <div className={actionMsg.startsWith("❌") ? styles.msgErr : styles.msgOk}>
          {actionMsg}
        </div>
      )}

      <div className={styles.grid3}>
        <div className={styles.card}>
          <div className={styles.cardTitle}>Użytkownicy</div>
          <div className={styles.cardBig}>{stats.users}</div>
          <Link className={styles.cardLink} to="/admin/users">
            Zobacz listę →
          </Link>
        </div>

        <div className={styles.card}>
          <div className={styles.cardTitle}>Turnieje</div>
          <div className={styles.cardBig}>{stats.tournaments}</div>
          <Link className={styles.cardLink} to="/admin/tournaments">
            Zarządzaj →
          </Link>
        </div>

        <div className={styles.card}>
          <div className={styles.cardTitle}>Drużyny</div>
          <div className={styles.cardBig}>
            {stats.teamsPending}
            <span className={styles.cardSmall}> / {stats.teams}</span>
          </div>
          <div className={styles.cardText}>
            Do akceptacji: <b>{stats.teamsPending}</b>
          </div>
          <Link className={styles.cardLink} to="/admin/teams">
            Moderuj drużyny →
          </Link>
        </div>
      </div>

      {/* Szybka lista pending */}
      <div className={styles.section}>
        <div className={styles.sectionHead}>
          <h2 className={styles.h2}>Drużyny do akceptacji</h2>
          <Link className={styles.link} to="/admin/teams">
            Otwórz pełną listę →
          </Link>
        </div>

        {pendingCount === 0 ? (
          <div className={styles.empty}>Brak drużyn w kolejce 🎉</div>
        ) : (
          <div className={styles.list}>
            {pendingTeams.map((t) => (
              <div key={t._id} className={styles.row}>
                <div className={styles.rowMain}>
                  <div className={styles.rowTitle}>{t.name}</div>
                  <div className={styles.rowSub}>
                    {t.slug} • {t.members?.length || 0} zawodników
                  </div>
                </div>

                <div className={styles.rowActions}>
                  <button
                    className={styles.btnOk}
                    disabled={busyId === t._id}
                    onClick={() => setTeamStatus(t._id, "approved")}
                  >
                    {busyId === t._id ? "..." : "Akceptuj"}
                  </button>
                  <button
                    className={styles.btnBad}
                    disabled={busyId === t._id}
                    onClick={() => setTeamStatus(t._id, "rejected")}
                  >
                    {busyId === t._id ? "..." : "Odrzuć"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
