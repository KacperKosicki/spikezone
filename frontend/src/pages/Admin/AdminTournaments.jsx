import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../../api/api";
import styles from "./AdminPages.module.scss";

const emptyForm = {
  title: "",
  slug: "",
  status: "draft",
  city: "",
  venue: "",

  // ✅ NOWE POLA
  regStartAt: "",
  regEndAt: "",
  eventStartAt: "",
  eventEndAt: "",

  description: "",
  teamLimit: 16,
  entryFee: 0,
};

// datetime-local wants: "YYYY-MM-DDTHH:mm"
const formatDateTimeInput = (d) => {
  if (!d) return "";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return "";

  const pad = (n) => String(n).padStart(2, "0");
  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const mi = pad(date.getMinutes());

  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
};

// do listy / meta (czytelnie)
const formatPL = (d) => {
  if (!d) return "—";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("pl-PL", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// status zapisów (admin podgląd)
const regStatusFor = (t) => {
  const now = new Date();

  const rs = t?.regStartAt ? new Date(t.regStartAt) : null;
  const re = t?.regEndAt ? new Date(t.regEndAt) : null;

  const rsOk = rs && !Number.isNaN(rs.getTime());
  const reOk = re && !Number.isNaN(re.getTime());

  if (reOk && now > re) return { text: "Zapisy zakończone", tone: "done" };
  if (rsOk && now < rs) return { text: "Zapisy nieaktywne", tone: "upcoming" };
  if (rsOk && (!reOk || now <= re)) return { text: "Zapisy trwają", tone: "live" };
  return { text: "Brak okna zapisów", tone: "neutral" };
};

export default function AdminTournaments() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  // create / edit
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null); // null => create
  const isEditing = !!editingId;

  // filter/search
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const load = async () => {
    setErr("");
    setMsg("");
    setLoading(true);
    try {
      const data = await apiFetch("/api/admin/tournaments");
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return items
      .filter((t) => (statusFilter === "all" ? true : t.status === statusFilter))
      .filter((t) => {
        if (!qq) return true;
        const hay = `${t.title || ""} ${t.slug || ""} ${t.city || ""} ${t.venue || ""}`.toLowerCase();
        return hay.includes(qq);
      });
  }, [items, q, statusFilter]);

  const setField = (name, value) => setForm((f) => ({ ...f, [name]: value }));

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const beginEdit = (t) => {
    setMsg("");
    setErr("");
    setEditingId(t._id);

    setForm({
      title: t.title || "",
      slug: t.slug || "",
      status: t.status || "draft",
      city: t.city || "",
      venue: t.venue || "",

      // ✅ NOWE POLA
      regStartAt: formatDateTimeInput(t.regStartAt),
      regEndAt: formatDateTimeInput(t.regEndAt),
      eventStartAt: formatDateTimeInput(t.eventStartAt),
      eventEndAt: formatDateTimeInput(t.eventEndAt),

      description: t.description || "",
      teamLimit: Number(t.teamLimit ?? 16),
      entryFee: Number(t.entryFee ?? 0),
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const validate = () => {
    if (!form.title.trim()) return "Brak tytułu";
    if (!form.regStartAt) return "Brak daty startu zapisów";
    if (!form.regEndAt) return "Brak daty końca zapisów";
    if (!form.eventStartAt) return "Brak daty rozpoczęcia turnieju";

    const rs = new Date(form.regStartAt);
    const re = new Date(form.regEndAt);
    const es = new Date(form.eventStartAt);
    const ee = form.eventEndAt ? new Date(form.eventEndAt) : null;

    if (Number.isNaN(rs.getTime())) return "Niepoprawna data startu zapisów";
    if (Number.isNaN(re.getTime())) return "Niepoprawna data końca zapisów";
    if (Number.isNaN(es.getTime())) return "Niepoprawna data rozpoczęcia turnieju";
    if (ee && Number.isNaN(ee.getTime())) return "Niepoprawna data zakończenia turnieju";

    if (re < rs) return "Koniec zapisów nie może być przed startem zapisów";
    if (es < rs) return "Turniej nie może zaczynać się przed startem zapisów";
    if (es < re) {
      // to możesz poluzować, ale logicznie lepiej tak:
      // zapisy kończą się przed rozpoczęciem turnieju
      return "Koniec zapisów powinien być przed rozpoczęciem turnieju";
    }
    if (ee && ee < es) return "Zakończenie turnieju nie może być przed startem turnieju";

    return "";
  };

  const submit = async (e) => {
    e.preventDefault();
    setMsg("");
    setErr("");

    const v = validate();
    if (v) {
      setErr(v);
      return;
    }

    // ✅ payload: wysyłamy pola dokładnie jak w modelu
    const payload = {
      title: form.title,
      slug: form.slug,
      status: form.status,
      city: form.city,
      venue: form.venue,

      regStartAt: form.regStartAt,
      regEndAt: form.regEndAt,
      eventStartAt: form.eventStartAt,
      eventEndAt: form.eventEndAt || "",

      description: form.description,
      teamLimit: Number(form.teamLimit ?? 16),
      entryFee: Number(form.entryFee ?? 0),
    };

    try {
      if (isEditing) {
        await apiFetch(`/api/admin/tournaments/${editingId}`, { method: "PATCH", body: payload });
        setMsg("✅ Zapisano zmiany");
      } else {
        await apiFetch(`/api/admin/tournaments`, { method: "POST", body: payload });
        setMsg("✅ Utworzono turniej");
      }
      resetForm();
      await load();
    } catch (e2) {
      setErr(`❌ ${e2.message}`);
    }
  };

  const remove = async (id) => {
    setMsg("");
    setErr("");
    const ok = window.confirm("Na pewno usunąć turniej? Tego nie da się cofnąć.");
    if (!ok) return;

    try {
      await apiFetch(`/api/admin/tournaments/${id}`, { method: "DELETE" });
      setMsg("✅ Usunięto turniej");
      await load();
      if (editingId === id) resetForm();
    } catch (e) {
      setErr(`❌ ${e.message}`);
    }
  };

  const quickStatus = async (id, status) => {
    setMsg("");
    setErr("");
    try {
      await apiFetch(`/api/admin/tournaments/${id}`, { method: "PATCH", body: { status } });
      setMsg("✅ Zmieniono status");
      await load();
    } catch (e) {
      setErr(`❌ ${e.message}`);
    }
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.h1}>Turnieje</h1>
      <p className={styles.sub}>Dodawanie, edycja i publikacja turniejów.</p>

      {(msg || err) && <div className={msg ? styles.msgOk : styles.msgErr}>{msg || err}</div>}

      {/* FORM */}
      <div className={styles.card} style={{ marginBottom: 16 }}>
        <div className={styles.cardTitle} style={{ marginBottom: 10 }}>
          {isEditing ? "Edytuj turniej" : "Dodaj nowy turniej"}
        </div>

        <form onSubmit={submit} className={styles.formGrid}>
          <label className={styles.field}>
            <span>Tytuł *</span>
            <input
              value={form.title}
              onChange={(e) => setField("title", e.target.value)}
              placeholder="np. SPIKEZONE Winter Cup 2026"
            />
          </label>

          <label className={styles.field}>
            <span>Slug (opcjonalnie)</span>
            <input
              value={form.slug}
              onChange={(e) => setField("slug", e.target.value)}
              placeholder="np. winter-cup-2026"
            />
          </label>

          <label className={styles.field}>
            <span>Status</span>
            <select value={form.status} onChange={(e) => setField("status", e.target.value)}>
              <option value="draft">draft</option>
              <option value="published">published</option>
              <option value="archived">archived</option>
            </select>
          </label>

          <label className={styles.field}>
            <span>Miasto</span>
            <input value={form.city} onChange={(e) => setField("city", e.target.value)} placeholder="np. Poznań" />
          </label>

          <label className={styles.field}>
            <span>Miejsce</span>
            <input value={form.venue} onChange={(e) => setField("venue", e.target.value)} placeholder="np. Hala XYZ" />
          </label>

          {/* ✅ NOWE DATY */}
          <label className={styles.field}>
            <span>Start zapisów *</span>
            <input
              type="datetime-local"
              value={form.regStartAt}
              onChange={(e) => setField("regStartAt", e.target.value)}
            />
          </label>

          <label className={styles.field}>
            <span>Koniec zapisów *</span>
            <input
              type="datetime-local"
              value={form.regEndAt}
              onChange={(e) => setField("regEndAt", e.target.value)}
            />
          </label>

          <label className={styles.field}>
            <span>Start turnieju *</span>
            <input
              type="datetime-local"
              value={form.eventStartAt}
              onChange={(e) => setField("eventStartAt", e.target.value)}
            />
          </label>

          <label className={styles.field}>
            <span>Koniec turnieju (opcjonalnie)</span>
            <input
              type="datetime-local"
              value={form.eventEndAt}
              onChange={(e) => setField("eventEndAt", e.target.value)}
            />
          </label>

          <label className={styles.field}>
            <span>Limit drużyn</span>
            <input
              type="number"
              min={2}
              max={256}
              value={form.teamLimit}
              onChange={(e) => setField("teamLimit", e.target.value)}
            />
          </label>

          <label className={styles.field}>
            <span>Wpisowe (zł)</span>
            <input
              type="number"
              min={0}
              max={100000}
              value={form.entryFee}
              onChange={(e) => setField("entryFee", e.target.value)}
            />
          </label>

          <label className={styles.field} style={{ gridColumn: "1 / -1" }}>
            <span>Opis</span>
            <textarea
              rows={4}
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
              placeholder="Opis turnieju, zasady, nagrody, kontakt..."
            />
          </label>

          <div className={styles.formActions}>
            <button className={styles.btnPrimary} type="submit">
              {isEditing ? "Zapisz zmiany" : "Utwórz turniej"}
            </button>

            {isEditing && (
              <button className={styles.btn} type="button" onClick={resetForm}>
                Anuluj edycję
              </button>
            )}
          </div>
        </form>
      </div>

      {/* FILTERS */}
      <div className={styles.card} style={{ marginBottom: 14 }}>
        <div className={styles.filters}>
          <input
            className={styles.search}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Szukaj: tytuł / slug / miasto / miejsce..."
          />

          <select className={styles.select} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">Wszystkie statusy</option>
            <option value="draft">draft</option>
            <option value="published">published</option>
            <option value="archived">archived</option>
          </select>

          <button className={styles.btn} type="button" onClick={load}>
            Odśwież
          </button>
        </div>
      </div>

      {/* LIST */}
      <div className={styles.list}>
        {loading && <div className={styles.msgOk}>Ładowanie...</div>}

        {!loading && filtered.length === 0 && <div className={styles.msgErr}>Brak turniejów do wyświetlenia.</div>}

        {!loading &&
          filtered.map((t) => {
            const rs = regStatusFor(t);

            return (
              <div key={t._id} className={styles.row}>
                <div className={styles.rowMain}>
                  <strong>{t.title}</strong>

                  <div className={styles.meta}>
                    <span className={styles.badge}>{t.status}</span>
                    <span>•</span>
                    <span>{t.city || "—"}</span>
                    <span>•</span>
                    <span style={{ opacity: 0.9 }}>
                      Zapisy: {formatPL(t.regStartAt)} → {formatPL(t.regEndAt)}
                    </span>
                    <span>•</span>
                    <span style={{ opacity: 0.9 }}>
                      Turniej: {formatPL(t.eventStartAt)}
                      {t.eventEndAt ? ` → ${formatPL(t.eventEndAt)}` : ""}
                    </span>
                    <span>•</span>
                    <span style={{ opacity: 0.9 }}>Limit: {t.teamLimit ?? 16}</span>
                    <span>•</span>
                    <span style={{ opacity: 0.9 }}>Wpisowe: {t.entryFee ?? 0} zł</span>
                    <span>•</span>
                    <span>slug: {t.slug}</span>
                    <span>•</span>
                    <span className={styles.badge} style={{ opacity: 0.9 }}>
                      {rs.text}
                    </span>
                  </div>
                </div>

                <div className={styles.rowActions}>
                  <button className={styles.btn} type="button" onClick={() => beginEdit(t)}>
                    Edytuj
                  </button>

                  {t.status !== "published" && (
                    <button className={styles.btn} type="button" onClick={() => quickStatus(t._id, "published")}>
                      Opublikuj
                    </button>
                  )}

                  {t.status !== "draft" && (
                    <button className={styles.btn} type="button" onClick={() => quickStatus(t._id, "draft")}>
                      Cofnij do draft
                    </button>
                  )}

                  {t.status !== "archived" && (
                    <button className={styles.btn} type="button" onClick={() => quickStatus(t._id, "archived")}>
                      Archiwizuj
                    </button>
                  )}

                  <button className={styles.btnDanger} type="button" onClick={() => remove(t._id)}>
                    Usuń
                  </button>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
