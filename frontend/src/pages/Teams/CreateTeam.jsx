import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./CreateTeam.module.scss";
import { useAuth } from "../../context/AuthContext";
import { apiFetch, apiUpload } from "../../api/api";

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

  // status: idle | invalid | checking | ok | taken | error
  const [nameCheck, setNameCheck] = useState({ status: "idle", message: "" });

  // pliki do uploadu (działają też przy create)
  const [logoFile, setLogoFile] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);

  const logoPreview = useMemo(() => (logoFile ? URL.createObjectURL(logoFile) : ""), [logoFile]);
  const bannerPreview = useMemo(() => (bannerFile ? URL.createObjectURL(bannerFile) : ""), [bannerFile]);

  useEffect(() => {
    return () => {
      if (logoPreview) URL.revokeObjectURL(logoPreview);
      if (bannerPreview) URL.revokeObjectURL(bannerPreview);
    };
  }, [logoPreview, bannerPreview]);

  const canAddMember = useMemo(() => members.length < 10, [members.length]);

  // load my team -> edit/create mode
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setMsg("");

        const team = await apiFetch("/api/team/me");

        // jeśli team istnieje -> nie siedzimy w create, przenosimy na /team/me
        if (team) {
          navigate("/team/me", { replace: true });
          return;
        }

        setEditMode(false);
      } catch (e) {
        // jeśli brak tokena albo inny błąd, pokaż info
        setMsg(`❌ ${e.message}`);
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  // debounce check nazwy (tylko create)
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
        if (res?.available) setNameCheck({ status: "ok", message: "✅ Nazwa dostępna" });
        else setNameCheck({ status: "taken", message: "❌ Ta nazwa jest już zajęta" });
      } catch {
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
    if (invalidIdx !== -1) return { ok: false, message: `❌ Zawodnik #${invalidIdx + 1} musi mieć min. 3 znaki` };

    const nonEmpty = normalized.filter((v) => v.length > 0);
    if (nonEmpty.length === 0) return { ok: false, message: "❌ Dodaj przynajmniej jednego zawodnika" };
    if (nonEmpty.length > 10) return { ok: false, message: "❌ Maksymalnie 10 członków" };

    const lower = nonEmpty.map((v) => v.toLowerCase());
    const dup = lower.find((v, i) => lower.indexOf(v) !== i);
    if (dup) return { ok: false, message: "❌ W składzie są duplikaty (usuń powtórzenia)" };

    return { ok: true, members: nonEmpty.map((fullName) => ({ fullName })) };
  };

  const canSubmitCreate =
    !saving &&
    name.trim().length >= 2 &&
    name.trim().length <= 40 &&
    nameCheck.status === "ok";

  const uploadImage = async (kind, file) => {
    const form = new FormData();
    form.append(kind, file);
    return await apiUpload(`/api/team/upload/${kind}`, form);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg("");

    const nameTrim = name.trim();

    if (!nameTrim) return setMsg("❌ Podaj nazwę drużyny");
    if (nameTrim.length < 2) return setMsg("❌ Nazwa drużyny musi mieć min. 2 znaki");
    if (nameTrim.length > 40) return setMsg("❌ Nazwa drużyny może mieć max 40 znaków");

    if (nameCheck.status === "checking") return setMsg("⏳ Sprawdzam dostępność nazwy...");
    if (nameCheck.status === "taken") return setMsg("❌ Ta nazwa drużyny jest już zajęta");
    if (nameCheck.status !== "ok") return setMsg("❌ Podaj poprawną nazwę drużyny");

    const membersRes = validateAndBuildMembers();
    if (!membersRes.ok) return setMsg(membersRes.message);

    const cleanMembers = membersRes.members;

    try {
      setSaving(true);

      // 1) create team
      await apiFetch("/api/team", {
        method: "POST",
        body: {
          name: nameTrim,
          logoUrl: "",
          bannerUrl: "",
          description: description.trim(),
          members: cleanMembers,
        },
      });

      // 2) upload logo/banner jeśli wybrane
      if (logoFile) await uploadImage("logo", logoFile);
      if (bannerFile) await uploadImage("banner", bannerFile);

      await refreshMyTeam?.();

      // ✅ PRZENOSIMY Z FLASH MESSAGE
      navigate("/team/me", {
        replace: true,
        state: { flash: "✅ Drużyna wysłana do weryfikacji. Status: ROZPATRYWANIE." },
      });
    } catch (e2) {
      setMsg(`❌ ${e2.message}`);
    } finally {
      setSaving(false);
    }
  };

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

        <h1 className={styles.h1}>Stwórz drużynę</h1>
        <p className={styles.sub}>Po wysłaniu drużyna trafia do moderacji. Możesz od razu dodać logo i banner.</p>

        {msg && <div className={styles.msg}>{msg}</div>}

        <form className={styles.form} onSubmit={onSubmit}>
          <div className={styles.grid}>
            <label className={styles.field}>
              <span>Nazwa drużyny *</span>
              <input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} disabled={saving} />

              {nameCheck.message && (
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
              <span>Logo (plik)</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                disabled={saving}
              />
              {logoPreview && <img className={styles.preview} src={logoPreview} alt="logo preview" />}
            </label>

            <label className={styles.field}>
              <span>Banner (plik)</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => setBannerFile(e.target.files?.[0] || null)}
                disabled={saving}
              />
              {bannerPreview && <img className={styles.previewBanner} src={bannerPreview} alt="banner preview" />}
            </label>

            <label className={`${styles.field} ${styles.full}`}>
              <span>Opis</span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
                maxLength={2000}
                disabled={saving}
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
                    disabled={saving}
                  />
                  {members.length > 1 && (
                    <button
                      type="button"
                      className={styles.memberRemove}
                      onClick={() => removeMember(idx)}
                      disabled={saving}
                    >
                      Usuń
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button type="button" className={styles.addMember} onClick={addMember} disabled={!canAddMember || saving}>
              + Dodaj zawodnika
            </button>
          </div>

          <div className={styles.actions}>
            <button className={styles.btnPrimary} disabled={!canSubmitCreate || saving}>
              {saving ? "Wysyłanie..." : "Wyślij do weryfikacji"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
