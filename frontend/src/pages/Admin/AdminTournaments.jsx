import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../../api/api";
import styles from "./AdminPages.module.scss";

const emptyForm = {
  title: "",
  slug: "",
  status: "draft",
  city: "",
  venue: "",
  startDate: "",
  endDate: "",
  description: "",
  teamLimit: 16,
  entryFee: 0,
};

const formatDateInput = (d) => {
  if (!d) return "";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return "";
  // yyyy-mm-dd
  return date.toISOString().slice(0, 10);
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

  // simple filter/search
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
      startDate: formatDateInput(t.startDate),
      endDate: formatDateInput(t.endDate),
      description: t.description || "",
      teamLimit: Number(t.teamLimit ?? 16),
      entryFee: Number(t.entryFee ?? 0),
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const validate = () => {
    if (!form.title.trim()) return "Brak tytułu";
    if (!form.startDate) return "Brak daty startu";
    if (!form.endDate) return "Brak daty końca";
    if (new Date(form.endDate) < new Date(form.startDate)) return "endDate nie może być wcześniej niż startDate";
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

    const payload = {
      ...form,
      teamLimit: Number(form.teamLimit ?? 16),
      entryFee: Number(form.entryFee ?? 0),
      // backend przyjmie ISO / Date string
      startDate: form.startDate,
      endDate: form.endDate,
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

      {(msg || err) && (
        <div className={msg ? styles.msgOk : styles.msgErr}>{msg || err}</div>
      )}

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

          <label className={styles.field}>
            <span>Start *</span>
            <input type="date" value={form.startDate} onChange={(e) => setField("startDate", e.target.value)} />
          </label>

          <label className={styles.field}>
            <span>Koniec *</span>
            <input type="date" value={form.endDate} onChange={(e) => setField("endDate", e.target.value)} />
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

        {!loading && filtered.length === 0 && (
          <div className={styles.msgErr}>Brak turniejów do wyświetlenia.</div>
        )}

        {!loading &&
          filtered.map((t) => (
            <div key={t._id} className={styles.row}>
              <div className={styles.rowMain}>
                <strong>{t.title}</strong>
                <div className={styles.meta}>
                  <span className={styles.badge}>{t.status}</span>
                  <span>•</span>
                  <span>{t.city || "—"}</span>
                  <span>•</span>
                  <span>
                    {formatDateInput(t.startDate)} → {formatDateInput(t.endDate)}
                  </span>
                  <span>•</span>
                  <span>slug: {t.slug}</span>
                </div>
              </div>

              <div className={styles.rowActions}>
                <button className={styles.btn} type="button" onClick={() => beginEdit(t)}>
                  Edytuj
                </button>

                {t.status !== "published" && (
                  <button
                    className={styles.btn}
                    type="button"
                    onClick={() => quickStatus(t._id, "published")}
                  >
                    Opublikuj
                  </button>
                )}

                {t.status !== "draft" && (
                  <button
                    className={styles.btn}
                    type="button"
                    onClick={() => quickStatus(t._id, "draft")}
                  >
                    Cofnij do draft
                  </button>
                )}

                {t.status !== "archived" && (
                  <button
                    className={styles.btn}
                    type="button"
                    onClick={() => quickStatus(t._id, "archived")}
                  >
                    Archiwizuj
                  </button>
                )}

                <button className={styles.btnDanger} type="button" onClick={() => remove(t._id)}>
                  Usuń
                </button>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
