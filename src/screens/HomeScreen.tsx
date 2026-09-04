import { Camera } from "lucide-react";
import { useState } from "react";
import type { Entry, ProfileInput, UserSummary } from "../../shared/pixel";
import { Heatmap } from "../components/Heatmap";
import { InlineProfileField } from "../components/InlineProfileField";
import { Timeline } from "../components/Timeline";

function practiceDays(entries: Entry[]) {
  return new Set(entries.map((entry) => entry.createdAt.slice(0, 10))).size;
}

export function HomeScreen({
  user,
  entries,
  onSaveProfile,
  onAvatarUpload,
}: {
  user: UserSummary;
  entries: Entry[];
  onSaveProfile: (input: ProfileInput) => Promise<void>;
  onAvatarUpload: (file: File) => Promise<void>;
}) {
  const [avatarSaving, setAvatarSaving] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const since = new Intl.DateTimeFormat("en", { month: "short", year: "numeric" })
    .format(new Date(user.practiceStartedAt))
    .toLowerCase();
  const profile = {
    username: user.username,
    displayName: user.displayName ?? "",
    bio: user.bio ?? "",
    website: user.website ?? "",
  };

  function saveField(field: keyof ProfileInput, value: string) {
    return onSaveProfile({ ...profile, [field]: value });
  }

  async function uploadAvatar(file?: File) {
    if (!file) return;
    setAvatarSaving(true);
    setAvatarError("");
    try {
      await onAvatarUpload(file);
    } catch (caught) {
      setAvatarError(caught instanceof Error ? caught.message : "Could not update avatar");
    } finally {
      setAvatarSaving(false);
    }
  }

  return (
    <>
      <section className="profile-block">
        <label className="profile-avatar-control" data-saving={avatarSaving || undefined}>
          <img
            className="profile-mark"
            src={user.avatarUrl ?? "/avatar.png"}
            alt="Profile avatar"
          />
          <span>
            <Camera size={13} /> {avatarSaving ? "uploading" : "change"}
          </span>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            disabled={avatarSaving}
            onChange={(event) => void uploadAvatar(event.target.files?.[0])}
          />
        </label>
        <div className="profile-copy">
          <InlineProfileField
            kind="handle"
            value={profile.username}
            emptyLabel="handle"
            onSave={(value) => saveField("username", value)}
          />
          <InlineProfileField
            kind="displayName"
            value={profile.displayName}
            emptyLabel="add display name"
            onSave={(value) => saveField("displayName", value)}
          />
          <InlineProfileField
            kind="bio"
            value={profile.bio}
            emptyLabel="add bio"
            onSave={(value) => saveField("bio", value)}
          />
          <InlineProfileField
            kind="website"
            value={profile.website}
            emptyLabel="add website"
            onSave={(value) => saveField("website", value)}
          />
          {avatarError && <p className="profile-inline-error">{avatarError}</p>}
        </div>
        <dl className="stats">
          <div>
            <dt>since</dt>
            <dd>{since}</dd>
          </div>
          <div>
            <dt>pieces</dt>
            <dd>{entries.length}</dd>
          </div>
          <div>
            <dt>practice days</dt>
            <dd>{practiceDays(entries)}</dd>
          </div>
        </dl>
      </section>
      <Heatmap entries={entries} />
      <Timeline entries={entries} />
    </>
  );
}
