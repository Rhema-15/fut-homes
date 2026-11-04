import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import Gallery from "@/components/public/gallery";
import { getPortal, type PortalRoom } from "@/lib/agent-portal";
import { AMENITIES } from "@/lib/amenities";
import { ROOM_TYPES, type RoomType, formatDuration, formatNaira, rentPeriodText, rentUnit } from "@/lib/options";

export const instant = false;

function savedLine(room: PortalRoom): string | null {
  if (!room.answer) return null;
  const when = room.answered_at
    ? new Date(room.answered_at).toLocaleString("en-GB", { timeZone: "Africa/Lagos", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })
    : "";
  const said = room.answer === "taken" ? "You said: not available anymore" : "You said: still available";
  const status = room.reviewed_at ? "FUT Homes has confirmed this" : "Saved. Waiting for FUT Homes to confirm";
  return `${said} · ${status}${when ? ` · ${when}` : ""}`;
}
import { answerRoom, logoutAgent } from "./actions";
import { ChangePasswordForm } from "./forms";

export const metadata: Metadata = {
  title: "Your rooms · FUT Homes",
  robots: { index: false },
};

function roomName(room: PortalRoom) {
  const type = room.room_type && room.room_type in ROOM_TYPES ? ROOM_TYPES[room.room_type as RoomType] : "Room";
  return room.title?.trim() || `${type}${room.area ? ` · ${room.area}` : ""}`;
}

function RoomCard({ room, number, total }: { room: PortalRoom; number: number; total: number }) {
  const code = room.id.replace(/-/g, "").slice(0, 6).toUpperCase();
  const period = rentPeriodText(room.rent_months);
  const rows = [
    { label: room.room_type === "shared" ? `Your share (${period})` : `Rent (${period})`, amount: room.price },
    room.agent_fee != null ? { label: "Agent fee", amount: room.agent_fee } : null,
    room.caution_fee != null ? { label: "Caution fee", amount: room.caution_fee } : null,
  ].filter((r): r is { label: string; amount: number } => r !== null);
  const total_ = rows.reduce((s, r) => s + r.amount, 0);
  const amenities = (room.amenities ?? []).map((a) => (AMENITIES as Record<string, string>)[a]).filter(Boolean);
  const answered = room.answer !== null;

  return (
    <li id={room.id} className="sticker overflow-hidden rounded-lg bg-white">
      <div className="flex items-center justify-between gap-2 border-b-2 border-ink px-4 py-2 text-sm font-bold text-ink">
        <span>
          Room {number} of {total}
        </span>
        <span className="text-xs text-muted">#{code}</span>
      </div>

      <Gallery
        photos={room.photos}
        title={roomName(room)}
        taken={false}
        videoPath={room.video_path}
        videoLabel={formatDuration(room.video_seconds)}
        backHref="/agent"
      />

      <div className="flex flex-col gap-4 p-4">
        <div>
          <h2 className="text-xl leading-6 font-extrabold text-ink">{roomName(room)}</h2>
          <p className="mt-1 text-lg font-extrabold text-ink">
            {formatNaira(room.price)}
            <span className="text-sm font-semibold text-muted">{rentUnit(room.rent_months, true)}</span>
          </p>
          {room.room_type === "shared" && room.roommate_gender && (
            <p className="mt-1 text-sm font-bold text-ink">
              Roommate: {room.roommate_gender === "female" ? "females only" : room.roommate_gender === "male" ? "males only" : "any gender"}
            </p>
          )}
        </div>

        {rows.length > 1 && (
          <dl className="rounded-md border-2 border-ink bg-brand-50 p-3 text-sm">
            {rows.map((r) => (
              <div key={r.label} className="flex justify-between gap-3 py-0.5 text-ink">
                <dt>{r.label}</dt>
                <dd className="font-bold">{formatNaira(r.amount)}</dd>
              </div>
            ))}
            <div className="mt-1 flex justify-between gap-3 border-t-2 border-ink pt-2 font-extrabold text-ink">
              <dt>Total to move in</dt>
              <dd>{formatNaira(total_)}</dd>
            </div>
          </dl>
        )}

        {room.fees_note && <p className="text-sm text-ink">Also: {room.fees_note}</p>}
        {room.description && <p className="text-sm leading-6 text-ink">{room.description}</p>}
        {amenities.length > 0 && (
          <div>
            <p className="text-sm font-bold text-ink">Included</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {amenities.map((a) => (
                <span key={a} className="rounded-full border-2 border-ink bg-white px-3 py-1 text-xs font-bold text-ink">
                  {a}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="border-t-2 border-ink pt-4">
          {savedLine(room) && (
            <p role="status" className="mb-3 rounded-md border-2 border-ink bg-brand-50 p-3 text-sm font-bold text-ink">
              {savedLine(room)}
            </p>
          )}
          <p className="text-base font-extrabold text-ink">Is this room still available?</p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <form action={answerRoom.bind(null, room.id, "available")}>
              <button
                type="submit"
                aria-pressed={room.answer === "available"}
                className={
                  "sticker min-h-14 w-full rounded-md px-3 py-3 text-base font-extrabold text-ink " +
                  (room.answer === "available" ? "bg-sticker-mint" : "bg-white")
                }
              >
                {room.answer === "available" ? "✓ Still available" : "Still available"}
              </button>
            </form>
            <form action={answerRoom.bind(null, room.id, "taken")}>
              <button
                type="submit"
                aria-pressed={room.answer === "taken"}
                className={
                  "sticker min-h-14 w-full rounded-md px-3 py-3 text-base font-extrabold text-ink " +
                  (room.answer === "taken" ? "bg-sticker-pink" : "bg-white")
                }
              >
                {room.answer === "taken" ? "✓ Not available" : "Not available anymore"}
              </button>
            </form>
          </div>
        </div>

        <Link
          href={`/rooms/${room.id}`}
          target="_blank"
          rel="noopener"
          className="text-center text-sm font-bold text-brand-700 underline"
        >
          Open on site (new tab)
        </Link>
      </div>
    </li>
  );
}

export default async function AgentPortalPage() {
  const portal = await getPortal();
  if (!portal) redirect("/agent/login");
  const first = portal.name.trim().split(/\s+/)[0];
  const total = portal.rooms.length;
  const answered = portal.rooms.filter((r) => r.answer !== null).length;

  return (
    <div className="mx-auto w-full max-w-lg pb-12">
      <div className="sticky top-0 z-10 border-b-2 border-ink bg-brand-50 px-[18px] py-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-base font-extrabold text-ink">Hi {first}</p>
          <p className="text-sm font-bold text-ink" aria-live="polite">
            {answered} of {total} answered
          </p>
        </div>
        {total > 0 && (
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full border-2 border-ink bg-white" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={answered}>
            <div className="h-full bg-brand-700" style={{ width: `${(answered / total) * 100}%` }} />
          </div>
        )}
      </div>

      <div className="px-[18px] pt-5">
        <p className="text-base text-muted">
          Check each room below. If it&apos;s taken, tap <b className="text-ink">Not available anymore</b>. If it&apos;s still free, tap{" "}
          <b className="text-ink">Still available</b>. FUT Homes checks your answers and updates the site.
        </p>

        {portal.must_change && (
          <p role="status" className="mt-4 rounded-md border-2 border-ink bg-warning-50 p-3 text-sm font-bold text-ink">
            Please change the password FUT Homes gave you. <a href="#password" className="text-brand-700 underline">Change it now</a>
          </p>
        )}

        {total === 0 ? (
          <p className="mt-6 rounded-md border-2 border-ink bg-white p-4 text-base font-bold text-ink">You have no rooms on FUT Homes right now.</p>
        ) : (
          <ol className="mt-6 flex flex-col gap-6">
            {portal.rooms.map((room, i) => (
              <RoomCard key={room.id} room={room} number={i + 1} total={total} />
            ))}
          </ol>
        )}

        <section id="password" className="mt-12 border-t-2 border-ink pt-6">
          <h2 className="text-xl font-extrabold text-ink">Change password</h2>
          <ChangePasswordForm />
        </section>
        <form action={logoutAgent} className="mt-8">
          <button type="submit" className="text-sm font-bold text-muted underline">
            Log out
          </button>
        </form>
      </div>
    </div>
  );
          }
