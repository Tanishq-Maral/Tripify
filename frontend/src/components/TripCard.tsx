import { Link } from "react-router-dom";

function formatRange(start?: string, end?: string, legacy?: string) {
  if (legacy) return legacy;
  if (!start && !end) return "";
  const fmt = (iso?: string) => {
    if (!iso) return "";
    try {
      const d = new Date(iso);
      return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
    } catch {
      return iso;
    }
  };
  if (start && end) return `${fmt(start)} - ${fmt(end)}`;
  return fmt(start || end);
}

interface TripMember {
  _id: string;
  name: string;
  email: string;
}

export interface Trip {
  _id: string;
  title: string;
  destination: string;
  pickupLocation: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  budget?: number;
  members: TripMember[];
  createdBy: TripMember;
  description?: string;
  createdAt: string;
}

interface TripCardProps {
  trip: Trip;
  currentUserId?: string;
}

export default function TripCard({ trip, currentUserId }: TripCardProps) {
  const isOwnedByCurrentUser = !!currentUserId && trip.createdBy?._id === currentUserId;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-gray-500 bg-sky-50/80 shadow-sm backdrop-blur-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-md">
      <div className="border-b border-gray-400 bg-sky-700/15 px-5 py-3 text-gray-900">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 text-2xl font-bold">{trip.title}</h3>
          {isOwnedByCurrentUser ? (
            <span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-800">
              Your Trip
            </span>
          ) : null}
        </div>
        {trip.description ? <p className="mt-2 line-clamp-1 text-xs text-sky-800">{trip.description}</p> : null}
      </div>

      <div className="flex-1 space-y-4 px-5 py-5">
        {/* Pickup → Destination Row */}
        <div className="flex items-center justify-between gap-5">
          <div className="flex-[0.49] min-w-0 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-200">
                <svg className="w-4 h-4 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Pickup</p>
                <p className="truncate text-sm font-semibold text-slate-900">{trip.pickupLocation}</p>
              </div>
            </div>
          </div>
          <svg className="w-10 h-8 text-slate-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
          <div className="flex-[0.51] min-w-0 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-200">
                <svg className="w-4 h-4 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Destination</p>
                <p className="truncate text-sm font-semibold text-slate-900">{trip.destination}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Date */}
        {(trip.startDate || trip.endDate || trip.date) && (
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-200">
              <svg className="w-4 h-4 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase text-slate-500">Date</p>
              <p className="truncate text-sm font-semibold text-slate-700">
                {formatRange(trip.startDate, trip.endDate, trip.date)}
              </p>
            </div>
          </div>
        )}

        {/* Budget */}
        {trip.budget && (
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-600 font-bold text-sm">
              ₹
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase text-slate-500">Budget</p>
              <p className="text-sm font-semibold text-slate-700">₹{trip.budget}</p>
            </div>
          </div>
        )}

        <div className="border-t border-sky-100 pt-4">
          <div className="flex items-center gap-3">
            <div className="flex -space-x-3">
              {trip.members.slice(0, 3).map((member) => (
                <div key={member._id} className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-[#833e98] text-xs font-bold text-[#f8f4ea]">
                  {member.name.charAt(0).toUpperCase()}
                </div>
              ))}
            </div>
            <span className="text-xs font-semibold text-slate-600">{trip.members.length} member{trip.members.length !== 1 ? "s" : ""}</span>
          </div>
        </div>
      </div>

      <Link
        to={`/trips/${trip._id}`}
        className="mx-5 mb-5 flex items-center justify-center gap-2 rounded-xl border border-sky-700 bg-sky-100 px-5 py-3 text-sm font-semibold text-sky-900 transition hover:bg-sky-200"
      >
        <span>Explore Trip</span>
        <svg className="h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      </Link>
    </article>
  );
}