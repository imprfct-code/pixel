import type { Entry, UserSummary } from "../../shared/pixel";
import { Heatmap } from "../components/Heatmap";
import { Timeline } from "../components/Timeline";

function practiceDays(entries: Entry[]) {
  return new Set(entries.map((entry) => entry.createdAt.slice(0, 10))).size;
}

export function HomeScreen({ user, entries }: { user: UserSummary; entries: Entry[] }) {
  const since = new Intl.DateTimeFormat("en", { month: "short", year: "numeric" })
    .format(new Date(user.practiceStartedAt))
    .toLowerCase();

  return (
    <>
      <section className="profile-block">
        <img className="profile-mark" src={user.avatarUrl ?? "/avatar.png"} alt="" />
        <div className="profile-copy">
          <h1>@{user.username}</h1>
          {user.displayName && <p className="profile-note">{user.displayName}</p>}
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
