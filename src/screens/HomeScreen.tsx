import { Camera } from "lucide-react";
import { useRef, useState } from "react";
import { useNavigate } from "react-router";
import type { Entry, ProfileInput, UserSummary } from "../../shared/pixel";
import { ArtworkGrid } from "../components/ArtworkGrid";
import { AvatarLightbox } from "../components/AvatarLightbox";
import { Heatmap } from "../components/Heatmap";
import { InlineProfileField } from "../components/InlineProfileField";
import { calendarDateKey, calendarDateLabel } from "../lib/calendar";

function practiceDays(entries: Entry[]) {
  return new Set(entries.map((entry) => entry.createdAt.slice(0, 10))).size;
}

export function HomeScreen({
  user,
  entries,
  editable = true,
  onSaveProfile,
  onAvatarUpload,
}: {
  user: UserSummary;
  entries: Entry[];
  editable?: boolean;
  onSaveProfile?: (input: ProfileInput) => Promise<void>;
  onAvatarUpload?: (file: File) => Promise<void>;
}) {
  const navigate = useNavigate();
  const [avatarSaving, setAvatarSaving] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const since = new Intl.DateTimeFormat("en", { month: "short", year: "numeric" })
    .format(new Date(user.practiceStartedAt))
    .toLowerCase();
  const profile = {
    username: user.username,
    displayName: user.displayName ?? "",
    bio: user.bio ?? "",
    website: user.website ?? "",
  };
  const activeDate =
    selectedDate && entries.some((entry) => calendarDateKey(entry.createdAt) === selectedDate)
      ? selectedDate
      : undefined;
  const visibleEntries = activeDate
    ? entries.filter((entry) => calendarDateKey(entry.createdAt) === activeDate)
    : entries;

  function saveField(field: keyof ProfileInput, value: string) {
    if (!onSaveProfile) return Promise.reject(new Error("Profile is read only"));
    return onSaveProfile({ ...profile, [field]: value });
  }

  async function uploadAvatar(file?: File) {
    if (!file || !onAvatarUpload) return;
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
        {editable ? (
          <>
            <button
              className="profile-avatar-control"
              type="button"
              data-saving={avatarSaving || undefined}
              disabled={avatarSaving}
              onClick={() => {
                const input = avatarInputRef.current;
                if (!input) return;
                input.value = "";
                input.click();
              }}
            >
              <img
                className="profile-mark"
                src={user.avatarUrl ?? "/avatar.png"}
                alt="Profile avatar"
              />
              <span>
                <Camera size={15} /> {avatarSaving ? "uploading" : "change"}
              </span>
            </button>
            <input
              ref={avatarInputRef}
              className="profile-avatar-input"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              disabled={avatarSaving}
              onChange={(event) => {
                const file = event.currentTarget.files?.[0];
                event.currentTarget.value = "";
                void uploadAvatar(file);
              }}
            />
          </>
        ) : (
          <button
            className="profile-avatar-viewer"
            type="button"
            onClick={() => setAvatarOpen(true)}
            aria-label={`Open ${user.username} avatar`}
          >
            <img
              className="profile-mark"
              src={user.avatarUrl ?? "/avatar.png"}
              alt="Profile avatar"
            />
          </button>
        )}
        <div className="profile-copy">
          {editable ? (
            <>
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
            </>
          ) : (
            <>
              <h1>@{profile.username}</h1>
              {profile.displayName && <p className="profile-note">{profile.displayName}</p>}
              {profile.bio && <p className="profile-bio">{profile.bio}</p>}
              {profile.website && (
                <a className="profile-link" href={profile.website} target="_blank" rel="noreferrer">
                  {profile.website.replace(/^https?:\/\//, "")}
                </a>
              )}
            </>
          )}
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
      <Heatmap entries={entries} selectedDate={activeDate} onSelectDate={setSelectedDate} />
      <section className="profile-gallery" aria-label="works">
        {entries.length > 0 ? (
          <>
            {activeDate && (
              <div className="gallery-date-filter">
                <span>{calendarDateLabel(activeDate)}</span>
                <button type="button" onClick={() => setSelectedDate(undefined)}>
                  clear ×
                </button>
              </div>
            )}
            <ArtworkGrid
              works={visibleEntries.map((entry) => ({ entry, author: user, canEdit: editable }))}
              layout="masonry"
              visibilityControls={editable}
              onOpen={(entry) =>
                void navigate(`/entries/${entry.id}`, {
                  state: { returnTo: editable ? "/profile" : `/${user.username}` },
                })
              }
              onEdit={
                editable
                  ? (entry) =>
                      void navigate(`/entries/${entry.id}`, {
                        state: { returnTo: "/profile", edit: true },
                      })
                  : undefined
              }
            />
          </>
        ) : (
          <p className="profile-gallery-empty">No works yet</p>
        )}
      </section>
      {avatarOpen && (
        <AvatarLightbox
          src={user.avatarUrl ?? "/avatar.png"}
          name={user.username}
          onClose={() => setAvatarOpen(false)}
        />
      )}
    </>
  );
}
