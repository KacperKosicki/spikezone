import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../../api/api";
import styles from "./AdminPages.module.scss";

const STATUS_LABEL = {
  all: "Wszystkie",
  pending: "Do akceptacji",
  approved: "Zaakceptowane",
  rejected: "Odrzucone",
};

const prettyDT = (d) => {
  try {
    if (!d) return "—";
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return "—";
    return dt.toLocaleString("pl-PL", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
};

const clamp = (s, n = 120) => {
  const t = String(s || "").trim();
  if (!t) return "";
  return t.length > n ? `${t.slice(0, n - 1)}…` : t;
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
        const hay = `${t.name || ""} ${t.slug || ""} ${t.ownerUid || ""}`.toLowerCase();
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
      {msg && <div className={msg.startsWith("✅") ? styles.msgOk : styles.msgInfo}>{msg}</div>}

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
              <span className={styles.tabCount}>{k === "all" ? counts.all : counts[k]}</span>
            </button>
          ))}
        </div>

        <input
          className={styles.search}
          placeholder="Szukaj po nazwie / slugu / ownerUid…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className={styles.empty}>Brak wyników.</div>
      ) : (
        <div className={styles.table}>
          <div className={styles.thead}>
            <div>Drużyna</div>
            <div>Status</div>
            <div>Skład</div>
            <div>Media / opis</div>
            <div>Admin note</div>
            <div className={styles.thActions}>Akcje</div>
          </div>

          {filtered.map((t) => {
            const members = Array.isArray(t.members) ? t.members : [];
            const preview = members.slice(0, 3);
            const rest = Math.max(0, members.length - preview.length);

            const logo = t.logoUrl || "";
            const banner = t.bannerUrl || "";
            const desc = clamp(t.description, 140);

            return (
              <div key={t._id} className={styles.trow}>
                {/* DRUŻYNA */}
                <div className={styles.cellMain}>
                  <div className={styles.titleRow}>
                    <div className={styles.title}>{t.name || "—"}</div>

                    <div className={styles.metaBadges}>
                      {!!t.ownerUid && <span className={styles.miniBadge}>UID: {t.ownerUid}</span>}
                      {!!t.createdAt && <span className={styles.miniBadge}>Utw.: {prettyDT(t.createdAt)}</span>}
                      {!!t.updatedAt && <span className={styles.miniBadge}>Akt.: {prettyDT(t.updatedAt)}</span>}
                    </div>
                  </div>

                  <div className={styles.muted}>{t.slug || "—"}</div>
                </div>

                {/* STATUS */}
                <div>
                  <span className={`${styles.badge} ${styles[`badge_${t.status}`]}`}>{t.status}</span>
                </div>

                {/* SKŁAD */}
                <div className={styles.membersCol}>
                  <div className={styles.membersCount}>{members.length}</div>

                  {members.length === 0 ? (
                    <div className={styles.muted}>Brak zawodników</div>
                  ) : (
                    <ul className={styles.membersList}>
                      {preview.map((m, idx) => (
                        <li key={`${t._id}-m-${idx}`}>{m.fullName}</li>
                      ))}
                      {rest > 0 && <li className={styles.membersMore}>+{rest} więcej</li>}
                    </ul>
                  )}
                </div>

                {/* MEDIA / OPIS */}
                <div className={styles.mediaCol}>
                  <div className={styles.mediaRow}>
                    <div className={styles.thumbGroup}>
                      <div className={styles.thumb}>
                        {logo ? <img src={logo} alt="" loading="lazy" /> : <div className={styles.thumbPh}>LOGO</div>}
                      </div>
                      <div className={styles.thumbWide}>
                        {banner ? (
                          <img src={banner} alt="" loading="lazy" />
                        ) : (
                          <div className={styles.thumbPh}>BANNER</div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className={styles.descPreview}>{desc || <span className={styles.muted}>Brak opisu</span>}</div>
                </div>

                {/* ADMIN NOTE */}
                <div>
                  <input
                    className={styles.noteInput}
                    placeholder="Notatka dla właściciela (opcjonalnie)…"
                    value={noteDraft[t._id] ?? ""}
                    onChange={(e) => setNoteDraft((prev) => ({ ...prev, [t._id]: e.target.value }))}
                    maxLength={300}
                    disabled={busyId === t._id}
                  />
                  <div className={styles.noteHint}>
                    {String(noteDraft[t._id] ?? "").length}/300
                  </div>
                </div>

                {/* AKCJE */}
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
            );
          })}
        </div>
      )}
    </div>
  );
}
