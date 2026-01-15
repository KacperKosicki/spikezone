import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../../api/api";
import styles from "./AdminPages.module.scss";

const STATUS_LABEL = {
  all: "Wszystkie",
  pending: "Do akceptacji",
  approved: "Zaakceptowane",
  rejected: "Odrzucone",
};

export default function AdminTeams() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("pending");
  const [q, setQ] = useState("");
  const [msg, setMsg] = useState("Ładowanie...");
  const [err, setErr] = useState("");
  const [busyId, setBusyId] = useState(null);

  // draft notatki admina per team
  const [noteDraft, setNoteDraft] = useState({});

  const load = async () => {
    setErr("");
    setMsg("Ładowanie...");

    try {
      const data = await apiFetch("/api/admin/teams");
      const arr = Array.isArray(data) ? data : [];

      setItems(arr);

      // uzupełnij draft notatek tylko jeśli brak
      setNoteDraft((prev) => {
        const next = { ...prev };
        for (const t of arr) {
          if (next[t._id] === undefined) next[t._id] = t.adminNote || "";
        }
        return next;
      });

      setMsg("");
    } catch (e) {
      setErr(e.message);
      setMsg("");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const counts = useMemo(() => {
    const c = { pending: 0, approved: 0, rejected: 0, all: items.length };
    for (const t of items) {
      if (t.status === "pending") c.pending++;
      else if (t.status === "approved") c.approved++;
      else if (t.status === "rejected") c.rejected++;
    }
    return c;
  }, [items]);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();

    return items
      .filter((t) => (filter === "all" ? true : t.status === filter))
      .filter((t) => {
        if (!qq) return true;
        const hay = `${t.name || ""} ${t.slug || ""}`.toLowerCase();
        return hay.includes(qq);
      });
  }, [items, filter, q]);

  const setStatus = async (teamId, status) => {
    try {
      setBusyId(teamId);
      setErr("");
      setMsg("");

      await apiFetch(`/api/admin/teams/${teamId}/status`, {
        method: "PATCH",
        body: {
          status,
          adminNote: String(noteDraft[teamId] || "").trim(),
        },
      });

      setMsg(status === "approved" ? "✅ Drużyna zaakceptowana" : "✅ Drużyna odrzucona");
      await load();
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.headRow}>
        <div>
          <h1 className={styles.h1}>Drużyny</h1>
          <p className={styles.sub}>Moderacja i zarządzanie zgłoszeniami drużyn.</p>
        </div>

        <button className={styles.btnGhost} onClick={load} disabled={busyId !== null}>
          Odśwież
        </button>
      </div>

      {err && <div className={styles.msgErr}>❌ {err}</div>}
      {msg && (
        <div className={msg.startsWith("✅") ? styles.msgOk : styles.msgInfo}>
          {msg}
        </div>
      )}

      <div className={styles.toolbar}>
        <div className={styles.tabs}>
          {Object.keys(STATUS_LABEL).map((k) => (
            <button
              key={k}
              type="button"
              className={`${styles.tab} ${filter === k ? styles.tabActive : ""}`}
              onClick={() => setFilter(k)}
            >
              {STATUS_LABEL[k]}
              <span className={styles.tabCount}>
                {k === "all" ? counts.all : counts[k]}
              </span>
            </button>
          ))}
        </div>

        <input
          className={styles.search}
          placeholder="Szukaj po nazwie / slugu…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className={styles.empty}>Brak wyników.</div>
      ) : (
        <div className={styles.table}>
          <div className={styles.thead}>
            <div>Nazwa</div>
            <div>Status</div>
            <div>Skład</div>
            <div>Admin note</div>
            <div className={styles.thActions}>Akcje</div>
          </div>

          {filtered.map((t) => (
            <div key={t._id} className={styles.trow}>
              <div className={styles.cellMain}>
                <div className={styles.title}>{t.name}</div>
                <div className={styles.muted}>{t.slug}</div>
              </div>

              <div>
                <span className={`${styles.badge} ${styles[`badge_${t.status}`]}`}>
                  {t.status}
                </span>
              </div>

              <div className={styles.muted}>{t.members?.length || 0}</div>

              <div>
                <input
                  className={styles.noteInput}
                  placeholder="Notatka dla właściciela (opcjonalnie)…"
                  value={noteDraft[t._id] ?? ""}
                  onChange={(e) =>
                    setNoteDraft((prev) => ({ ...prev, [t._id]: e.target.value }))
                  }
                  maxLength={300}
                  disabled={busyId === t._id}
                />
              </div>

              <div className={styles.rowActionsRight}>
                <button
                  className={styles.btnOk}
                  disabled={busyId === t._id}
                  onClick={() => setStatus(t._id, "approved")}
                  type="button"
                >
                  {busyId === t._id ? "..." : "Akceptuj"}
                </button>

                <button
                  className={styles.btnBad}
                  disabled={busyId === t._id}
                  onClick={() => setStatus(t._id, "rejected")}
                  type="button"
                >
                  {busyId === t._id ? "..." : "Odrzuć"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
