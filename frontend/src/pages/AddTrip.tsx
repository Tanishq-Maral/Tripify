import { useState, ChangeEvent, FormEvent } from "react";
import API from "../api/api";
import { useNavigate } from "react-router-dom";

interface TripForm {
  title: string;
  destination: string;
  pickupLocation: string;
  description: string;
  budget: string;
  date: string;
}

export default function AddTrip() {
  const [form, setForm] = useState<TripForm>({
    title: "",
    destination: "",
    pickupLocation: "",
    description: "",
    budget: "",
    date: "",
  });
  const [dateError, setDateError] = useState<string>("");
  const nav = useNavigate();

  const validateDate = (date: string): boolean => {
    if (!date) return true;
    const monthYearPattern = /^[A-Z][a-z]+-\d{4}$/;
    if (!monthYearPattern.test(date)) {
      setDateError("Please use format: Month-Year (e.g., 'December-2024')");
      return false;
    }
    setDateError("");
    return true;
  };

  const handleDateChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setForm({ ...form, date: value });
    validateDate(value);
  };

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateDate(form.date)) return;
    await API.post("/trips", form);
    nav("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-800 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Form Container */}
        <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-700/50 p-8">
          <div className="flex items-center justify-center gap-3 mb-8 text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div>
              <h2 className="text-4xl block bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Create New Trip</h2>
              <p className="text-gray-400">Fill in the details of your adventure</p>
            </div>
          </div>

          <form onSubmit={submit} className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <label className="flex text-sm font-semibold text-gray-300 items-center gap-2">
                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Trip Title *
              </label>
              <input
                placeholder="e.g., Weekend Getaway to Mountains"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full p-4 bg-gray-700/50 border border-gray-600 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400 transition-all duration-200"
                required
              />
            </div>

            {/* Destination & Pickup Location Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="flex text-sm font-semibold text-gray-300 items-center gap-2">
                  <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                  Destination *
                </label>
                <input
                  placeholder="e.g., Manali, Himachal"
                  value={form.destination}
                  onChange={(e) => setForm({ ...form, destination: e.target.value })}
                  className="w-full p-4 bg-gray-700/50 border border-gray-600 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-white placeholder-gray-400 transition-all duration-200"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="flex text-sm font-semibold text-gray-300 items-center gap-2">
                  <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                  Pickup Location *
                </label>
                <input
                  placeholder="e.g., Pune"
                  value={form.pickupLocation}
                  onChange={(e) => setForm({ ...form, pickupLocation: e.target.value })}
                  className="w-full p-4 bg-gray-700/50 border border-gray-600 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400 transition-all duration-200"
                  required
                />
              </div>
            </div>

            {/* Budget & Date Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="flex text-sm font-semibold text-gray-300 items-center gap-2">
                  <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                  Budget (₹) *
                </label>
                <input
                  placeholder="e.g., 5000"
                  type="number"
                  value={form.budget}
                  onChange={(e) => setForm({ ...form, budget: e.target.value })}
                  className="w-full p-4 bg-gray-700/50 border border-gray-600 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-white placeholder-gray-400 transition-all duration-200"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="flex text-sm font-semibold text-gray-300 items-center gap-2">
                  <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Trip Date *
                </label>
                <input
                  placeholder="e.g., December-2025"
                  value={form.date}
                  onChange={handleDateChange}
                  className={`w-full p-4 bg-gray-700/50 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white placeholder-gray-400 transition-all duration-200 ${
                    dateError ? "border-red-500" : "border-gray-600"
                  }`}
                  required
                />
                {dateError && (
                  <div className="flex items-center gap-2 text-red-400 text-sm mt-1">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {dateError}
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="flex text-sm font-semibold text-gray-300 items-center gap-2">
                <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
                Description *
              </label>
              <textarea
                placeholder="Describe your trip plans, activities, and what you're looking for in travel companions..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={4}
                className="w-full p-4 bg-gray-700/50 border border-gray-600 rounded-2xl focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-white placeholder-gray-400 transition-all duration-200 resize-none"
                required
              />
            </div>

            {/* Submit Button */}
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => nav("/")}
                className="flex-1 flex items-center justify-center gap-2 bg-gray-700 text-gray-300 px-6 py-4 rounded-2xl font-semibold shadow-lg hover:shadow-xl border border-gray-600 hover:border-gray-500 transition-all duration-300 hover:scale-105"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800 text-white px-6 py-4 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Create Trip
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
