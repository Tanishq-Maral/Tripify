import { Link } from "react-router-dom";

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
  budget?: number;
  members: TripMember[];
  createdBy: TripMember;
  description?: string;
  createdAt: string;
}

interface TripCardProps {
  trip: Trip;
}

export default function TripCard({ trip }: TripCardProps) {
  return (
    <div className="bg-gray-900 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-700 overflow-hidden group hover:transform hover:-translate-y-2">
      {/* Header with gradient */}
      <div className="bg-gradient-to-r from-purple-900 to-purple-700 p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
        <h3 className="text-xl font-bold text-white line-clamp-2 relative z-10">{trip.title}</h3>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Destination */}
        <div className="flex items-center gap-3 mb-4 group/item">
          <div className="w-10 h-10 bg-gray-700 rounded-xl flex items-center justify-center group-hover/item:scale-110 transition-transform duration-200">
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-400 font-medium">Destination</p>
            <p className="font-bold text-blue-100 truncate">{trip.destination}</p>
          </div>
        </div>

        {/* Pickup Location */}
        <div className="flex items-center gap-3 mb-4 group/item">
          <div className="w-10 h-10 bg-gray-700 rounded-xl flex items-center justify-center group-hover/item:scale-110 transition-transform duration-200">
            <svg className="w-5 h-5 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-400 font-medium">Pickup Location</p>
            <p className="font-bold text-blue-100 truncate">{trip.pickupLocation}</p>
          </div>
        </div>

        {/* Date */}
        {trip.date && (
          <div className="flex items-center gap-3 mb-4 group/item">
            <div className="w-10 h-10 bg-gray-700 rounded-xl flex items-center justify-center group-hover/item:scale-110 transition-transform duration-200">
              <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-400 font-medium">Trip Date</p>
              <p className="font-bold text-blue-100">{trip.date}</p>
            </div>
          </div>
        )}

        {/* Budget */}
        {trip.budget && (
          <div className="flex items-center gap-3 mb-6 group/item">
            <div className="w-10 h-10 bg-gray-700 rounded-xl flex items-center justify-center group-hover/item:scale-110 transition-transform duration-200">
              <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-400 font-medium">Budget</p>
              <p className="font-bold text-emerald-400 text-lg">₹{trip.budget}</p>
            </div>
          </div>
        )}

        {/* View Details Button */}
        <Link
          to={`/trips/${trip._id}`}
          className="w-full bg-gradient-to-r from-purple-800 to-purple-700 hover:from-blue-700 hover:to-purple-800 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 transform hover:scale-[1.02] flex items-center justify-center gap-2 shadow-lg hover:shadow-xl relative overflow-hidden group/btn"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 transform translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700"></div>
          <span className="relative z-10">View Details</span>
          <svg className="w-4 h-4 relative z-10 group-hover/btn:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </Link>
      </div>
    </div>
  );
}