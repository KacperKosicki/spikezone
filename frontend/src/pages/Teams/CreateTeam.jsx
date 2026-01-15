import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../api/api";
import styles from "./CreateTeam.module.scss";
import { useAuth } from "../../context/AuthContext";

export default function CreateTeam() {
  const navigate = useNavigate();
  const { refreshMyTeam } = useAuth();

  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);

  const [name, setName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [description, setDescription] = useState("");
  const [members, setMembers] = useState([{ fullName: "" }]);

  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);

  // ✅ sprawdzanie nazwy (tylko dla create)
  // status: idle | invalid | checking | ok | taken | error
  const [nameCheck, setNameCheck] = useState({ status: "idle", message: "" });

  const canAddMember = useMemo(() => members.length < 10, [members.length]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setMsg("");

        const team = await apiFetch("/api/team/me"); // GET /api/team/me

        if (team) {
          // ✅ jeśli jest pending -> nie pozwalamy edytować
          if (team.status === "pending") {
            setMsg("⏳ Drużyna jest w trakcie rozpatrywania. Edycja jest zablokowana do czasu decyzji admina.");
            navigate("/team/me", { replace: true });
            return;
          }

          setEditMode(true);
          setName(team.name || "");
          setLogoUrl(team.logoUrl || "");
          setBannerUrl(team.bannerUrl || "");
          setDescription(team.description || "");
          setMembers(
            Array.isArray(team.members) && team.members.length
              ? team.members.map((m) => ({ fullName: m.fullName || "" }))
              : [{ fullName: "" }]
          );
        } else {
          setEditMode(false);
        }
      } catch (e) {
        setMsg(`❌ ${e.message}`);
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  // ✅ debounce check nazwy (tylko gdy tworzymy)
  useEffect(() => {
    if (editMode) return;

    const n = String(name || "").trim();

    if (!n) {
      setNameCheck({ status: "idle", message: "" });
      return;
    }

    if (n.length < 2) {
      setNameCheck({ status: "invalid", message: "❌ Nazwa min. 2 znaki" });
      return;
    }

    if (n.length > 40) {
      setNameCheck({ status: "invalid", message: "❌ Nazwa max 40 znaków" });
      return;
    }

    setNameCheck({ status: "checking", message: "⏳ Sprawdzam dostępność..." });

    const t = setTimeout(async () => {
      try {
        const res = await apiFetch(`/api/teams/check-name?name=${encodeURIComponent(n)}`);
        if (res?.available) {
          setNameCheck({ status: "ok", message: "✅ Nazwa dostępna" });
        } else {
          setNameCheck({ status: "taken", message: "❌ Ta nazwa jest już zajęta" });
        }
      } catch (err) {
        setNameCheck({ status: "error", message: "❌ Nie udało się sprawdzić nazwy" });
      }
    }, 450);

    return () => clearTimeout(t);
  }, [name, editMode]);

  const updateMember = (idx, value) => {
    setMembers((prev) => prev.map((m, i) => (i === idx ? { fullName: value } : m)));
  };

  const addMember = () => {
    if (!canAddMember) return;
    setMembers((prev) => [...prev, { fullName: "" }]);
  };

  const removeMember = (idx) => {
    setMembers((prev) => prev.filter((_, i) => i !== idx));
  };

  const validateAndBuildMembers = () => {
    const normalized = members.map((m) => String(m.fullName || "").trim());

    const invalidIdx = normalized.findIndex((v) => v.length > 0 && v.length < 3);
    if (invalidIdx !== -1) {
      return { ok: false, message: `❌ Zawodnik #${invalidIdx + 1} musi mieć min. 3 znaki` };
    }

    const nonEmpty = normalized.filter((v) => v.length > 0);

    if (nonEmpty.length === 0) {
      return { ok: false, message: "❌ Dodaj przynajmniej jednego zawodnika" };
    }

    if (nonEmpty.length > 10) {
      return { ok: false, message: "❌ Maksymalnie 10 członków" };
    }

    const lower = nonEmpty.map((v) => v.toLowerCase());
    const dup = lower.find((v, i) => lower.indexOf(v) !== i);
    if (dup) {
      return { ok: false, message: "❌ W składzie są duplikaty (usuń powtórzenia)" };
    }

    return { ok: true, members: nonEmpty.map((fullName) => ({ fullName })) };
  };

  const canSubmitCreate =
    !saving &&
    name.trim().length >= 2 &&
    name.trim().length <= 40 &&
    nameCheck.status === "ok";

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg("");

    const nameTrim = name.trim();

    if (!editMode) {
      if (!nameTrim) return setMsg("❌ Podaj nazwę drużyny");
      if (nameTrim.length < 2) return setMsg("❌ Nazwa drużyny musi mieć min. 2 znaki");
      if (nameTrim.length > 40) return setMsg("❌ Nazwa drużyny może mieć max 40 znaków");

      if (nameCheck.status === "checking") return setMsg("⏳ Sprawdzam dostępność nazwy...");
      if (nameCheck.status === "taken") return setMsg("❌ Ta nazwa drużyny jest już zajęta");
      if (nameCheck.status !== "ok") return setMsg("❌ Podaj poprawną nazwę drużyny");
    }

    const membersRes = validateAndBuildMembers();
    if (!membersRes.ok) return setMsg(membersRes.message);

    const cleanMembers = membersRes.members;

    try {
      setSaving(true);

      if (editMode) {
        await apiFetch("/api/team/me", {
          method: "PATCH",
          body: {
            logoUrl: logoUrl.trim(),
            bannerUrl: bannerUrl.trim(),
            description: description.trim(),
            members: cleanMembers,
          },
        });

        await refreshMyTeam?.();
        setMsg("✅ Zapisano zmiany. Drużyna wróciła do moderacji (pending).");
        navigate("/team/me", { replace: true });
      } else {
        await apiFetch("/api/team", {
          method: "POST",
          body: {
            name: nameTrim,
            logoUrl: logoUrl.trim(),
            bannerUrl: bannerUrl.trim(),
            description: description.trim(),
            members: cleanMembers,
          },
        });

        await refreshMyTeam?.();
        setMsg("✅ Drużyna wysłana do weryfikacji");
        navigate("/team/me", { replace: true });
      }
    } catch (e2) {
      setMsg(`❌ ${e2.message}`);
    } finally {
      setSaving(false);
    }
  };

  const title = editMode ? "Edytuj drużynę" : "Stwórz drużynę";
  const subText = editMode
    ? "Po zapisaniu zmian drużyna wraca do moderacji. Status: pending."
    : "Po wysłaniu drużyna trafia do moderacji. Status: pending.";

  if (loading) {
    return (
      <section className={styles.page}>
        <div className={styles.container}>
          <button className={styles.back} onClick={() => navigate("/teams")}>
            ← Wróć
          </button>
          <div className={styles.msg}>Ładowanie...</div>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.page}>
      <div className={styles.container}>
        <button className={styles.back} onClick={() => navigate("/teams")}>
          ← Wróć
        </button>

        <h1 className={styles.h1}>{title}</h1>
        <p className={styles.sub}>{subText}</p>

        {msg && <div className={styles.msg}>{msg}</div>}

        <form className={styles.form} onSubmit={onSubmit}>
          <div className={styles.grid}>
            <label className={styles.field}>
              <span>Nazwa drużyny *</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={40}
                disabled={editMode}
              />

              {!editMode && nameCheck.message && (
                <div
                  className={`${styles.nameHint} ${
                    nameCheck.status === "ok"
                      ? styles.nameOk
                      : nameCheck.status === "checking"
                      ? styles.nameChecking
                      : styles.nameBad
                  }`}
                >
                  {nameCheck.message}
                </div>
              )}
            </label>

            <label className={styles.field}>
              <span>Logo (URL)</span>
              <input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} />
            </label>

            <label className={styles.field}>
              <span>Banner (URL)</span>
              <input value={bannerUrl} onChange={(e) => setBannerUrl(e.target.value)} />
            </label>

            <label className={`${styles.field} ${styles.full}`}>
              <span>Opis</span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
                maxLength={2000}
              />
            </label>
          </div>

          <div className={styles.section}>
            <h2>Skład (max 10)</h2>

            <div className={styles.members}>
              {members.map((m, idx) => (
                <div className={styles.memberRow} key={idx}>
                  <input
                    className={styles.memberInput}
                    placeholder="Imię i nazwisko"
                    value={m.fullName}
                    onChange={(e) => updateMember(idx, e.target.value)}
                    maxLength={60}
                  />
                  {members.length > 1 && (
                    <button
                      type="button"
                      className={styles.memberRemove}
                      onClick={() => removeMember(idx)}
                    >
                      Usuń
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              type="button"
              className={styles.addMember}
              onClick={addMember}
              disabled={!canAddMember}
            >
              + Dodaj zawodnika
            </button>
          </div>

          <div className={styles.actions}>
            <button
              className={styles.btnPrimary}
              disabled={editMode ? saving : !canSubmitCreate}
              title={
                editMode
                  ? ""
                  : nameCheck.status === "taken"
                  ? "Ta nazwa jest zajęta"
                  : nameCheck.status === "checking"
                  ? "Sprawdzam nazwę..."
                  : nameCheck.status !== "ok"
                  ? "Podaj poprawną i wolną nazwę"
                  : ""
              }
            >
              {saving ? "Zapisywanie..." : editMode ? "Zapisz zmiany" : "Wyślij do weryfikacji"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
