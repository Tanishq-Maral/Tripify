import { useEffect, useState, ChangeEvent } from "react";
import { useAuth } from "../context/AuthContext";
import API from "../api/api";
import TripCard, { Trip } from "../components/TripCard";
import TripFilters, { Filters } from "../components/TripFilters";
import { Link, useNavigate } from "react-router-dom";

export default function Home() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filters, setFilters] = useState<Filters>({
    destination: "",
    pickupLocation: "",
    budget: "",
    month: "",
    year: "",
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [hasInitialLoad, setHasInitialLoad] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");

  const loadTrips = async (currentFilters: Filters = { destination: "", pickupLocation: "", budget: "", month: "", year: "", sortBy: "createdAt", sortOrder: "desc" }, search: string = "") => {
    try {
      setLoading(true);
      const params: Record<string, string> = { ...currentFilters } as Record<string, string>;
      if (search) params.search = search;
      const response = await API.get<Trip[]>("/trips", { params });
      setTrips(response.data);
    } catch (error) {
      console.error("Error loading trips:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && !hasInitialLoad) {
      loadTrips();
      setHasInitialLoad(true);
    }
  }, [user, hasInitialLoad]);

  const handleFiltersChange = (newFilters: Filters) => {
    setFilters(newFilters);
    loadTrips(newFilters, searchTerm);
  };

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setTimeout(() => {
      loadTrips(filters, value);
    }, 300);
  };

  const clearSearch = () => {
    setSearchTerm("");
    loadTrips(filters, "");
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const hasActiveFilters =
    filters.destination !== "" ||
    filters.pickupLocation !== "" ||
    filters.budget !== "" ||
    filters.month !== "" ||
    filters.year !== "" ||
    (filters.sortBy !== "createdAt" || filters.sortOrder !== "desc");

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900">
        <section
          className="relative min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `linear-gradient(rgba(0,0,0,0.7),rgba(0,0,0,0.7)), url('/src/assets/background.jpg')` }}
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Welcome to <span className="text-blue-400">Tripify</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
              Connect with like-minded travelers and plan amazing trips together.
              Discover new destinations, share experiences, and create unforgettable memories.
            </p>
            <Link
              to="/auth"
              className="inline-flex items-center px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl shadow-lg"
            >
              Get Started
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </section>

        <section className="py-20 bg-gray-800">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Why Choose <span className="text-blue-400">Tripify</span>?
              </h2>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto">Everything you need for collaborative travel planning</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { icon: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z", color: "bg-blue-500", title: "Discover Destinations", desc: "Browse through amazing trips created by travelers from around the world." },
                { icon: "M15.5 3.354a2 2 0 110 7.292M12.4 3.754a4 4 0 11-5 0 4 4 0 015 0z M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197", color: "bg-green-500", title: "Join Communities", desc: "Connect with like-minded travelers and build your travel squad." },
                { icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z", color: "bg-purple-500", title: "Real-time Chat", desc: "Plan together with instant messaging within your trip groups." },
              ].map((feature) => (
                <div key={feature.title} className="bg-gray-700 rounded-2xl p-8 text-center hover:transform hover:-translate-y-2 transition-all duration-300 hover:shadow-2xl">
                  <div className={`w-20 h-20 ${feature.color} rounded-full flex items-center justify-center mx-auto mb-6`}>
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={feature.icon} />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">{feature.title}</h3>
                  <p className="text-gray-300 text-lg">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 bg-gradient-to-t from-gray-700 to-gray-700">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Ready to Start Your Adventure?</h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">Join thousands of travelers sharing their journeys</p>
            <Link
              to="/auth"
              className="inline-flex items-center px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl shadow-lg"
            >
              Create Your Account
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </section>

        <footer className="bg-black py-4 border-t border-gray-800">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-gray-400 text-sm">&copy; 2024 Tripify. All rights reserved. Connect, Explore, Remember.</p>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-end mt-1 mb-5 -mr-20">
          <button
            onClick={() => { logout(); nav("/"); }}
            className="bg-gradient-to-r from-blue-900 to-purple-900 hover:from-red-700 hover:to-red-800 text-white px-6 py-3 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>

        <div className="text-center mb-12 mt-10">
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-6">
            Discover Your Next
            <span className="block bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Adventure</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Connect with fellow travelers and find trips that match your style. Your perfect journey awaits.
          </p>
        </div>

        <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-700/50 p-8 mb-8">
          <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
            <div className="flex-1 w-full lg:w-auto">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search trips by destination, description..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="w-full p-4 pl-12 pr-12 bg-gray-700/50 border border-gray-600 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/30 focus:border-blue-500 backdrop-blur-sm transition-all duration-300 placeholder-gray-400 text-white"
                />
                <svg className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {searchTerm && (
                  <button onClick={clearSearch} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors duration-200">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
            <div className="flex gap-3 w-full lg:w-auto">
              <button
                onClick={toggleFilters}
                className="flex items-center gap-3 bg-gray-700 text-gray-200 px-6 py-4 rounded-2xl font-semibold shadow-lg hover:shadow-xl border border-gray-600 hover:border-gray-500 transition-all duration-300 hover:scale-105"
              >
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                </svg>
                Filters
                {hasActiveFilters && (
                  <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold">!</span>
                )}
              </button>
              <Link
                to="/add-trip"
                className="flex items-center gap-3 bg-gradient-to-r from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800 text-white px-6 py-4 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Trip
              </Link>
            </div>
          </div>
          {showFilters && (
            <div className="mt-6 animate-in slide-in-from-top duration-300">
              <TripFilters onFiltersChange={handleFiltersChange} />
            </div>
          )}
        </div>

        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent"></div>
              <p className="text-gray-400 font-medium">Loading amazing trips...</p>
            </div>
          </div>
        )}

        {!loading && trips.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {trips.map((trip) => (
              <TripCard key={trip._id} trip={trip} />
            ))}
          </div>
        )}

        {!loading && trips.length === 0 && (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <div className="w-32 h-32 bg-gradient-to-r from-gray-700 to-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-16 h-16 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">
                {searchTerm || hasActiveFilters ? "No trips found" : "No trips available yet"}
              </h3>
              <p className="text-gray-400 mb-8 text-lg">
                {searchTerm || hasActiveFilters
                  ? "Try adjusting your search or filters to find more trips."
                  : "Be the first to create an amazing trip and start your adventure!"}
              </p>
              {!searchTerm && !hasActiveFilters && (
                <Link
                  to="/add-trip"
                  className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800 text-white font-semibold px-8 py-4 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create First Trip
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}