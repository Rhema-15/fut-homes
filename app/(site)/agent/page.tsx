import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getPortal, type PortalRoom } from "@/lib/agent-portal";
import { ROOM_TYPES, type RoomType, formatNaira, photoUrl, rentUnit } from "@/lib/options";
import { answerRoom, logoutAgent } from "./actions";
import { ChangePasswordForm } from "./forms";

export const instant = false;

export const metadata: Metadata = {
  title: "Your rooms · FUT Homes",
  robots: { index: false },
};

function RoomCard({ room }: { room: PortalRoom }) {
  const type = room.room_type && room.room_type in ROOM_TYPES ? ROOM_TYPES[room.room_type as RoomType] : "Room";
  const said = room.answer === "available" ? "You said: still available" : room.answer === "taken" ? "You said: not available anymore" : null;
  return (
    <li className="sticker flex flex-col gap-3 rounded-lg bg-white p-3">
      <div className="flex gap-3">
        {room.photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl(room.photo)} alt="" className="h-20 w-24 shrink-0 rounded-md border-2 border-ink object-cover" />
        ) : (
          <div className="h-20 w-24 shrink-0 rounded-md border-2 border-ink bg-brand-50" />
        )}
        <div className="min-w-0">
          <p className="text-lg leading-6 font-extrabold text-ink">
            {type}
            {room.area ? ` · ${room.area}` : ""}
          </p>
          <p className="text-base font-bold text-ink">
            {formatNaira(room.price)}
            <span className="text-sm font-semibold text-muted">{rentUnit(room.rent_months, true)}</span>
          </p>
          <p className="text-xs font-semibold text-muted">Listing #{room.id.replace(/-/g, "").slice(0, 6).toUpperCase()}</p>
        </div>
      </div>
      {said && <p className="text-sm font-bold text-muted">{said}</p>}
      <div className="grid grid-cols-2 gap-3">
        <form action={answerRoom.bind(null, room.id, "available")}>
          <button
            type="submit"
            className={"sticker w-full rounded-md px-3 py-3 text-base font-extrabold text-ink " + (room.answer === "available" ? "bg-sticker-mint" : "bg-white")}
          >
            {room.answer === "available" ? "✓ Still available" : "Still available"}
          </button>
        </form>
        <form action={answerRoom.bind(null, room.id, "taken")}>
          <button
            type="submit"
            className={"sticker w-full rounded-md px-3 py-3 text-base font-extrabold text-ink " + (room.answer === "taken" ? "bg-sticker-pink" : "bg-white")}
          >
            {room.answer === "taken" ? "✓ Not available" : "Not available anymore"}
          </button>
        </form>
      </div>
    </li>
  );
}

export default async function AgentPortalPage() {
  const portal = await getPortal();
  if (!portal) redirect("/agent/login");
  const first = portal.name.trim().split(/\s+/)[0];
  return (
    <div className="mx-auto w-full max-w-lg px-[18px] py-8">
      <h1 className="text-3xl leading-9 font-extrabold text-ink">Hi {first}</h1>
      <p className="mt-2 text-base text-muted">
        These are the rooms you gave FUT Homes. When a room is taken, tap <b>Not available anymore</b>. If it is still free, tap{" "}
        <b>Still available</b>. FUT Homes checks your answers and updates the site.
      </p>
      {portal.must_change && (
        <p role="status" className="mt-4 rounded-md border-2 border-ink bg-warning-50 p-3 text-sm font-bold text-ink">
          Please change the password FUT Homes gave you. <a href="#password" className="text-brand-700 underline">Change it now</a>
        </p>
      )}
      {portal.rooms.length === 0 ? (
        <p className="mt-6 rounded-md bg-white p-4 text-base font-bold text-ink">You have no rooms on FUT Homes right now.</p>
      ) : (
        <ul className="mt-6 flex flex-col gap-4">
          {portal.rooms.map((room) => (
            <RoomCard key={room.id} room={room} />
          ))}
        </ul>
      )}
      <section id="password" className="mt-10 border-t-2 border-ink pt-6">
        <h2 className="text-xl font-extrabold text-ink">Change password</h2>
        <ChangePasswordForm />
      </section>
      <form action={logoutAgent} className="mt-8">
        <button type="submit" className="text-sm font-bold text-muted underline">
          Log out
        </button>
      </form>
    </div>
  );
}
