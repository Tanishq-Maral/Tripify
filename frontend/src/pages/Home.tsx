import { useEffect, useRef, useState, ChangeEvent, ReactNode } from "react";
import { useAuth } from "../context/AuthContext";
import API from "../api/api";
import TripCard, { Trip } from "../components/TripCard";
import TripFilters, { Filters } from "../components/TripFilters";
import { Link, useNavigate } from "react-router-dom";
import backgroundImage from "../assets/background.jpg";

function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "success" | "warning" | "info" }) {
  const toneClass = {
    neutral: "bg-slate-100 text-slate-700",
    success: "bg-emerald-100 text-emerald-700",
    warning: "bg-amber-100 text-amber-700",
    info: "bg-sky-100 text-sky-700",
  };

  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${toneClass[tone] || toneClass.neutral}`}>
      {children}
    </span>
  );
}

export default function Home() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const isCreator = user?.role === "creator";
  const [showLandingHeader, setShowLandingHeader] = useState<boolean>(false);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [tripViewMode, setTripViewMode] = useState<"all" | "mine">("all");
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
  const [showProfileMenu, setShowProfileMenu] = useState<boolean>(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
    if (user) {
      setShowLandingHeader(false);
      return;
    }

    const onScroll = () => {
      setShowLandingHeader(window.scrollY > 90);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, [user]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

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

  const displayedTrips =
    isCreator && tripViewMode === "mine"
      ? trips.filter((trip) => trip.createdBy?._id === user?._id)
      : trips;

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900">
        <header
          className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
            showLandingHeader
              ? "opacity-100 translate-y-0"
              : "opacity-0 -translate-y-4 pointer-events-none"
          }`}
        >
          <div className="border-b border-white/20 bg-slate-900/35 backdrop-blur-lg shadow-lg shadow-black/25">
          {/* <div className="mx-3 mt-3 rounded-2xl border border-white/20 bg-slate-900/35 backdrop-blur-xl shadow-2xl shadow-black/30"> */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
              <Link to="/" className="flex items-center gap-3 text-white">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-800 flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M21 16v-2l-8-5V3.5C13 2.67 12.33 2 11.5 2S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
                  </svg>
                </div>
                <span className="text-lg font-bold tracking-wide">Tripifyyy</span>
              </Link>
              <div className="flex items-center gap-2 sm:gap-3">
                <Link
                  to="/auth?mode=login"
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-white/95 border border-white/25 hover:bg-white/10 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/auth?mode=signup"
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 transition-colors shadow-lg shadow-blue-600/30"
                >
                  Sign Up
                </Link>
              </div>
            </div>
          </div>
        </header>

        <section
          className="relative min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `linear-gradient(rgba(0,0,0,0.7),rgba(0,0,0,0.7)), url(${backgroundImage})` }}
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Welcome to <span className="text-blue-400">Tripifyyy</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
              Connect with like-minded travelers and plan amazing trips together.
              Discover new destinations, share experiences, and create unforgettable memories.
            </p>
            <Link
              to="/auth?mode=login"
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
                Why Choose <span className="text-blue-400">Tripifyyy</span>?
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

        <section className="relative py-20 bg-gradient-to-t from-gray-700 to-gray-700">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Ready to Start Your Adventure?</h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">Join thousands of travelers sharing their journeys</p>
            <Link
              to="/auth?mode=signup"
              className="inline-flex items-center px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl shadow-lg"
            >
              Create Your Account
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
          
        </section>
        <div>
          <p className="absolute bottom-2 left-2 sm:left-2 lg:left-2 text-gray-400 text-xs">Made by Tanishq Maral</p>
        </div>

        <footer className="bg-black py-4 border-t border-gray-800">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-gray-400 text-sm">&copy; 2024 Tripifyyy. All rights reserved. Connect, Explore, Remember.</p>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-100 via-rose-50 to-slate-100">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 left-[-5rem] h-80 w-80 rounded-full bg-rose-200/45 blur-3xl" />
        <div className="absolute top-1/3 right-[-6rem] h-96 w-96 rounded-full bg-white/60 blur-3xl" />
        <div className="absolute bottom-[-7rem] left-1/4 h-96 w-96 rounded-full bg-rose-100/50 blur-3xl" />
      </div>
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-7 rounded-3xl border border-white/80 bg-white/80 p-4 shadow-md backdrop-blur md:p-5">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-900 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M21 16v-2l-8-5V3.5C13 2.67 12.33 2 11.5 2S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
                </svg>
              </div>
              <span className="text-2xl font-semibold text-slate-900">Tripifyyy</span>
            </Link>
            <div ref={profileMenuRef} className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="grid h-10 w-10 place-items-center rounded-full border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-100"
                title={user?.name || user?.email || "Profile"}
                aria-label="Profile"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A9 9 0 1118.88 17.8M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              {showProfileMenu && (
                <div className="absolute right-0 top-12 z-50 rounded-xl border border-slate-200 bg-white shadow-lg min-w-48">
                  <div className="p-3 border-b border-slate-100">
                    <p className="text-sm font-semibold text-slate-900">{user?.name || user?.email}</p>
                    <p className="text-xs text-slate-500">{user?.email}</p>
                  </div>
                  <button
                    className="block w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition"
                    onClick={() => {
                      setShowProfileMenu(false);
                      nav("/profile");
                    }}
                  >
                    Profile
                  </button>
                  <button
                    className="block w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition"
                    onClick={() => {
                      setShowProfileMenu(false);
                      nav("/settings");
                    }}
                  >
                    Settings
                  </button>
                  <div className="border-t border-slate-100"></div>
                  <button
                    className="block w-full px-4 py-2 text-left rounded-xl text-sm text-red-600 hover:bg-red-50  transition"
                    onClick={() => {
                      setShowProfileMenu(false);
                      logout();
                      nav("/");
                    }}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <section className="space-y-6">
          <div className="rounded-3xl border border-gray-500 bg-purple-600/30 p-7 text-[#202020] shadow-xl md:p-9 ">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#9b6907]">Community Travel Planner</p>
            <h2 className="mt-3 text-3xl font-bold md:text-5xl">Discover Your Next Adventure</h2>
            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-slate-900 md:text-base">
              Explore trips created by travelers, filter by your preferences, and start planning memorable experiences together.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Badge tone="info">Smart Search</Badge>
              <Badge tone="info">Flexible Filters</Badge>
              <Badge tone="info">Collaborative Trips</Badge>
              <Badge tone="info">Fast Discovery</Badge>
            </div>
          </div>

          <div className="rounded-3xl border border-gray-500 bg-gray-200 p-6 shadow-xl md:p-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative w-full flex-1">
                <input
                  type="text"
                  placeholder="Search trips by destination, description..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="w-full rounded-xl border border-sky-300 bg-white px-4 py-3 pr-10 text-slate-800 shadow-sm focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-300"
                />
                {searchTerm && (
                  <button onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              <div className="flex w-full gap-2 lg:w-auto">
                <button
                  onClick={toggleFilters}
                  className="rounded-xl border border-sky-500 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-sky-100"
                >
                  Filters {hasActiveFilters ? "• Active" : ""}
                </button>
                {isCreator ? (
                  <Link
                    to="/add-trip"
                    className="rounded-xl border border-sky-500 bg-sky-100 px-5 py-3 text-sm font-semibold text-sky-900 transition hover:bg-sky-200"
                  >
                    Create Trip
                  </Link>
                ) : null}
              </div>
            </div>

            {showFilters ? (
              <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
                <TripFilters
                  onFiltersChange={handleFiltersChange}
                  isCreator={isCreator}
                  tripViewMode={tripViewMode}
                  onTripViewModeChange={setTripViewMode}
                />
              </div>
            ) : null}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-4">
                <div className="h-16 w-16 animate-spin rounded-full border-4 border-sky-500 border-t-transparent"></div>
                <p className="font-medium text-slate-500">Loading amazing trips...</p>
              </div>
            </div>
          ) : null}

          {!loading && displayedTrips.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {displayedTrips.map((trip) => (
                <TripCard key={trip._id} trip={trip} currentUserId={user?._id} />
              ))}
            </div>
          ) : null}

          {!loading && displayedTrips.length === 0 ? (
            <div className="rounded-3xl border border-white/80 bg-white/70 p-10 text-center shadow-sm">
              <h3 className="text-2xl font-semibold text-slate-900">
                {searchTerm || hasActiveFilters
                  ? "No trips found"
                  : isCreator && tripViewMode === "mine"
                  ? "You have not created any trips yet"
                  : "No trips available yet"}
              </h3>
              <p className="mx-auto mt-3 max-w-lg text-sm text-slate-600">
                {searchTerm || hasActiveFilters
                  ? "Try adjusting your search or filters to find more trips."
                  : isCreator && tripViewMode === "mine"
                  ? "Switch to All Trips to explore community trips, or create your first trip now."
                  : "Be the first to create an amazing trip and start your adventure."}
              </p>
              {!searchTerm && !hasActiveFilters && isCreator ? (
                <Link
                  to="/add-trip"
                  className="mt-6 inline-flex rounded-xl bg-[#0f172a] px-5 py-3 text-sm font-semibold text-[#f8f4ea] transition hover:opacity-90"
                >
                  Create First Trip
                </Link>
              ) : null}
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}