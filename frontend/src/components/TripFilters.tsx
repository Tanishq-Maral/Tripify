import { useState, useEffect } from "react";
import API from "../api/api";

export interface Filters {
  destination: string;
  pickupLocation: string;
  budget: string;
  month: string;
  year: string;
  sortBy: string;
  sortOrder: string;
}

interface FilterOptions {
  destinations: string[];
  pickupLocations: string[];
  dates: string[];
  budgets: number[];
}

interface BudgetOption {
  value: string;
  label: string;
}

interface TripFiltersProps {
  onFiltersChange: (filters: Filters) => void;
  isCreator?: boolean;
  tripViewMode?: "all" | "mine";
  onTripViewModeChange?: (mode: "all" | "mine") => void;
}

export default function TripFilters({
  onFiltersChange,
  isCreator = false,
  tripViewMode = "all",
  onTripViewModeChange,
}: TripFiltersProps) {
  const [filters, setFilters] = useState<Filters>({
    destination: "",
    pickupLocation: "",
    budget: "",
    month: "",
    year: "",
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    destinations: [],
    pickupLocations: [],
    dates: [],
    budgets: [],
  });

  const budgetOptions: BudgetOption[] = [
    { value: "", label: "Any Budget" },
    { value: "500", label: "Under \u20b9500" },
    { value: "1000", label: "Under \u20b91,000" },
    { value: "2000", label: "Under \u20b92,000" },
    { value: "5000", label: "Under \u20b95,000" },
    { value: "10000", label: "Under \u20b910,000" },
    { value: "15000", label: "Under \u20b915,000" },
    { value: "20000", label: "Under \u20b920,000" },
    { value: "25000", label: "Under \u20b925,000" },
    { value: "50000", label: "Under \u20b950,000" },
    { value: "100000", label: "Under \u20b91,00,000" },
    { value: "100001", label: "Above \u20b91,00,000" },
  ];

  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        const response = await API.get("/trips/filters");
        setFilterOptions(response.data as FilterOptions);
      } catch (error) {
        console.error("Error loading filter options:", error);
      }
    };
    loadFilterOptions();
  }, []);

  const handleFilterChange = (key: keyof Filters, value: string) => {
    const newFilters: Filters = { ...filters, [key]: value };
    setFilters(newFilters);
  };

  const applyFilters = () => {
    onFiltersChange(filters);
  };

  const clearFilters = () => {
    const clearedFilters: Filters = {
      destination: "",
      pickupLocation: "",
      budget: "",
      month: "",
      year: "",
      sortBy: "createdAt",
      sortOrder: "desc",
    };
    setFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  return (
    <div className="rounded-2xl border border-white/80 bg-white p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#072466] rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
            </svg>
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">Filter Trips</h3>
            <p className="text-sm text-slate-500">Refine your search</p>
          </div>
        </div>
      </div>

      {isCreator && onTripViewModeChange ? (
        <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="mb-3">
            <h4 className="text-sm font-semibold text-slate-900">Trip View</h4>
            <p className="text-xs text-slate-500">Switch between community trips and only the trips you created.</p>
          </div>
          <div className="inline-flex rounded-xl border border-slate-300 bg-white p-1">
            <button
              type="button"
              onClick={() => onTripViewModeChange("all")}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                tripViewMode === "all"
                  ? "bg-sky-100 text-sky-900"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              All Trips
            </button>
            <button
              type="button"
              onClick={() => onTripViewModeChange("mine")}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                tripViewMode === "mine"
                  ? "bg-sky-100 text-sky-900"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              My Trips
            </button>
          </div>
        </div>
      ) : null}

      {/* Filters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Destination */}
        <div className="space-y-2">
          <label className="flex text-sm font-semibold text-slate-600 items-center gap-2">
            <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
            Destination
          </label>
          <select
            value={filters.destination}
            onChange={(e) => handleFilterChange("destination", e.target.value)}
            className="w-full p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white text-slate-800 transition-all duration-200"
          >
            <option value="">All Destinations</option>
            {filterOptions.destinations.map((dest) => (
              <option key={dest} value={dest}>{dest}</option>
            ))}
          </select>
        </div>

        {/* Pickup Location */}
        <div className="space-y-2">
          <label className="flex text-sm font-semibold text-slate-600 items-center gap-2">
            <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
            Pickup Location
          </label>
          <select
            value={filters.pickupLocation}
            onChange={(e) => handleFilterChange("pickupLocation", e.target.value)}
            className="w-full p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white text-slate-800 transition-all duration-200"
          >
            <option value="">All Locations</option>
            {filterOptions.pickupLocations.map((location) => (
              <option key={location} value={location}>{location}</option>
            ))}
          </select>
        </div>

        {/* Budget Range */}
        <div className="space-y-2">
          <label className="flex text-sm font-semibold text-slate-600 items-center gap-2">
            <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
            Budget Range
          </label>
          <select
            value={filters.budget}
            onChange={(e) => handleFilterChange("budget", e.target.value)}
            className="w-full p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white text-slate-800 transition-all duration-200"
          >
            {budgetOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Month */}
        <div className="space-y-2">
          <label className="flex text-sm font-semibold text-slate-600 items-center gap-2">
            <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Month
          </label>
          <select
            value={filters.month}
            onChange={(e) => handleFilterChange("month", e.target.value)}
            className="w-full p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white text-slate-800 transition-all duration-200"
          >
            <option value="">Any Month</option>
            {["january","february","march","april","may","june","july","august","september","october","november","december"].map((m) => (
              <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>
            ))}
          </select>
        </div>

        {/* Year */}
        <div className="space-y-2">
          <label className="flex text-sm font-semibold text-slate-600 items-center gap-2">
            <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Year
          </label>
          <input
            type="number"
            placeholder="e.g., 2024"
            value={filters.year}
            onChange={(e) => handleFilterChange("year", e.target.value)}
            className="w-full p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white text-slate-800 transition-all duration-200 placeholder-slate-400"
          />
        </div>

        {/* Sort By */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-600">Sort By</label>
          <select
            value={filters.sortBy}
            onChange={(e) => handleFilterChange("sortBy", e.target.value)}
            className="w-full p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white text-slate-800 transition-all duration-200"
          >
            <option value="createdAt">Date Created</option>
            <option value="budget">Budget</option>
            <option value="date">Trip Date</option>
            <option value="title">Title</option>
          </select>
        </div>

        {/* Sort Order */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-600">Sort Order</label>
          <select
            value={filters.sortOrder}
            onChange={(e) => handleFilterChange("sortOrder", e.target.value)}
            className="w-full p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white text-slate-800 transition-all duration-200"
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          onClick={applyFilters}
          className="rounded-xl border border-sky-700 bg-sky-100 px-5 py-2.5 text-sm font-semibold text-sky-900 transition hover:bg-sky-200"
        >
          Apply Filters
        </button>
        <button
          onClick={clearFilters}
          className="rounded-xl border border-slate-300 bg-slate-50 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
        >
          Clear All
        </button>
      </div>
    </div>
  );
}