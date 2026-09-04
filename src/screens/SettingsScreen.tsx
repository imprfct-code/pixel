import { Camera, ChevronLeft } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link } from "react-router";
import type { ProfileInput, UserSummary } from "../../shared/pixel";

export function SettingsScreen({
  user,
  onSave,
  onAvatarUpload,
}: {
  user: UserSummary;
  onSave: (input: ProfileInput) => Promise<void>;
  onAvatarUpload: (file: File) => Promise<void>;
}) {
  const [username, setUsername] = useState(user.username);
  const [displayName, setDisplayName] = useState(user.displayName ?? "");
  const [bio, setBio] = useState(user.bio ?? "");
  const [website, setWebsite] = useState(user.website ?? "");
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setStatus("saving");
    try {
      await onSave({ username, displayName, bio, website });
      setStatus("saved");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save profile");
      setStatus("idle");
    }
  }

  async function uploadAvatar(file: File | undefined) {
    if (!file) return;
    setError("");
    try {
      await onAvatarUpload(file);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not update avatar");
    }
  }

  return (
    <section className="settings-page">
      <Link className="back-link" to="/">
        <ChevronLeft size={13} /> profile
      </Link>
      <div className="settings-heading">
        <p className="eyebrow">account</p>
        <h1>settings</h1>
      </div>
      <form className="settings-form" onSubmit={submit}>
        <div className="avatar-setting">
          <img src={user.avatarUrl ?? "/avatar.png"} alt="" />
          <label className="button" data-drop-exclude="true">
            <Camera size={13} /> avatar
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={(event) => void uploadAvatar(event.target.files?.[0])}
            />
          </label>
        </div>
        <label>
          username
          <input
            required
            minLength={2}
            maxLength={32}
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
        </label>
        <label>
          display name
          <input
            maxLength={80}
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
          />
        </label>
        <label>
          bio
          <textarea maxLength={240} value={bio} onChange={(event) => setBio(event.target.value)} />
        </label>
        <label>
          website
          <input
            type="url"
            maxLength={160}
            placeholder="https://"
            value={website}
            onChange={(event) => setWebsite(event.target.value)}
          />
        </label>
        {error && <p className="form-error">{error}</p>}
        <div className="settings-actions">
          <button className="button primary" type="submit" disabled={status === "saving"}>
            {status === "saving" ? "saving" : "save profile"}
          </button>
          {status === "saved" && <span>saved</span>}
        </div>
      </form>
    </section>
  );
}
