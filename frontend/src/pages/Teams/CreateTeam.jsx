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
  const [description, setDescription] = useState("");
  const [members, setMembers] = useState([{ fullName: "" }]);

  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);

  // status: idle | invalid | checking | ok | taken | error
  const [nameCheck, setNameCheck] = useState({ status: "idle", message: "" });

  const [logoFile, setLogoFile] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);

  const logoPreview = useMemo(
    () => (logoFile ? URL.createObjectURL(logoFile) : ""),
    [logoFile]
  );
  const bannerPreview = useMemo(
    () => (bannerFile ? URL.createObjectURL(bannerFile) : ""),
    [bannerFile]
  );

  useEffect(() => {
    return () => {
      if (logoPreview) URL.revokeObjectURL(logoPreview);
      if (bannerPreview) URL.revokeObjectURL(bannerPreview);
    };
  }, [logoPreview, bannerPreview]);

  const canAddMember = useMemo(() => members.length < 10, [members.length]);
  const membersCount = useMemo(
    () =>
      members
        .map((m) => String(m?.fullName || "").trim())
        .filter(Boolean).length,
    [members]
  );

  // load my team -> jeśli istnieje, przenosimy na /team/me
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setMsg("");

        const team = await apiFetch("/api/team/me");
        if (team) {
          navigate("/team/me", { replace: true });
          return;
        }

        setEditMode(false);
      } catch (e) {
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
    if (n.length > 60) {
      setNameCheck({ status: "invalid", message: "❌ Nazwa max 60 znaków" });
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
    if (invalidIdx !== -1)
      return { ok: false, message: `❌ Zawodnik #${invalidIdx + 1} musi mieć min. 3 znaki` };

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
    name.trim().length <= 60 &&
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
    if (nameTrim.length > 60) return setMsg("❌ Nazwa drużyny może mieć max 60 znaków");

    if (nameCheck.status === "checking") return setMsg("⏳ Sprawdzam dostępność nazwy...");
    if (nameCheck.status === "taken") return setMsg("❌ Ta nazwa drużyny jest już zajęta");
    if (nameCheck.status !== "ok") return setMsg("❌ Podaj poprawną nazwę drużyny");

    const membersRes = validateAndBuildMembers();
    if (!membersRes.ok) return setMsg(membersRes.message);

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
          members: membersRes.members,
        },
      });

      // 2) upload logo/banner jeśli wybrane
      if (logoFile) await uploadImage("logo", logoFile);
      if (bannerFile) await uploadImage("banner", bannerFile);

      await refreshMyTeam?.();

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
      <section className={styles.section}>
        <div className={styles.bgGlow} aria-hidden="true" />
        <div className={styles.container}>
          <button className={styles.backModern} onClick={() => navigate("/teams")} type="button">
            <span className={styles.backIcon}>←</span>
            <span>Wróć</span>
          </button>
          <div className={styles.msg}>Ładowanie...</div>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.section}>
      <div className={styles.bgGlow} aria-hidden="true" />
      <div className={styles.container}>
        <button className={styles.backModern} onClick={() => navigate("/teams")} type="button">
          <span className={styles.backIcon}>←</span>
          <span>Wróć</span>
        </button>

        {msg && <div className={styles.msg}>{msg}</div>}

        <div className={styles.detailsCard}>
          {/* HEADER: media + coverBar jak reszta */}
          <div className={styles.top}>
            <div className={styles.media}>
              {bannerPreview ? (
                <img className={styles.banner} src={bannerPreview} alt="Podgląd bannera" />
              ) : (
                <div className={styles.bannerFallback} />
              )}

              <div className={styles.mediaOverlay} />

              <div className={styles.coverBar}>
                <div className={styles.logoWrap}>
                  {logoPreview ? (
                    <img className={styles.logo} src={logoPreview} alt="Podgląd logo" />
                  ) : (
                    <div className={styles.logoFallback}>
                      {String(name || "?").slice(0, 1).toUpperCase()}
                    </div>
                  )}
                </div>

                <div className={styles.headerText}>
                  <h1 className={styles.teamName}>Stwórz drużynę</h1>

                  <div className={styles.pills}>
                    <span className={`${styles.pillSoft} ${styles.pillOk}`}>
                      <span className={styles.dot} />
                      TWORZENIE
                    </span>
                    <span className={styles.pillSoft}>{membersCount} zawodników</span>
                  </div>
                </div>

                <div className={styles.headerActions} aria-hidden="true" />
              </div>
            </div>
          </div>

          {/* FORM */}
          <div className={styles.block}>
            <div className={styles.blockHead}>
              <div className={styles.blockTitle}>
                <h2>Dane drużyny</h2>
                <span className={styles.blockSub}>
                  Po wysłaniu drużyna trafia do moderacji. Możesz od razu dodać logo i banner.
                </span>
              </div>
              <span className={styles.blockBadge}>CREATE</span>
            </div>

            <form className={styles.form} onSubmit={onSubmit}>
              <div className={styles.grid}>
                <label className={styles.field}>
                  <span>Nazwa drużyny *</span>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={60}
                    disabled={saving}
                  />

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
                  {bannerPreview && (
                    <img className={styles.previewBanner} src={bannerPreview} alt="banner preview" />
                  )}
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

              <div className={styles.blockInner}>
                <div className={styles.blockHead}>
                  <div className={styles.blockTitle}>
                    <h2>Skład</h2>
                    <span className={styles.blockSub}>Lista zawodników w drużynie (max 10)</span>
                  </div>
                  <span className={styles.blockBadge}>{membersCount}</span>
                </div>

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

                <button
                  type="button"
                  className={styles.addMember}
                  onClick={addMember}
                  disabled={!canAddMember || saving}
                >
                  + Dodaj zawodnika
                </button>
              </div>

              <div className={styles.actions}>
                <button className={styles.btnPrimary} disabled={!canSubmitCreate || saving} type="submit">
                  {saving ? "Wysyłanie..." : "Wyślij do weryfikacji"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
