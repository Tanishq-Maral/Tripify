import { useState, useEffect, useRef, FormEvent, ChangeEvent } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API from "../api/api";

function formatRange(start?: string, end?: string) {
  if (!start && !end) return "";
  const fmt = (iso?: string) => {
    if (!iso) return "";
    try {
      const d = new Date(iso);
      return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
    } catch {
      return iso || "";
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

interface TripCreatedBy {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
}

interface TripDetail {
  _id: string;
  title: string;
  description?: string;
  destination: string;
  pickupLocation: string;
  budget?: number | string;
  startDate?: string;
  endDate?: string;
  members: TripMember[];
  createdBy: TripCreatedBy;
  createdAt: string;
}

interface ChatMessage {
  _id: string;
  text: string;
  sender: { _id: string; name: string };
  createdAt: string;
}

interface EditForm {
  title: string;
  description: string;
  destination: string;
  pickupLocation: string;
  budget: string | number;
  startDate: string;
  endDate: string;
}

export default function TripDetails() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const socket = null;
  const [trip, setTrip] = useState<TripDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [message, setMessage] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sending, setSending] = useState<boolean>(false);
  const [editing, setEditing] = useState<boolean>(false);
  const [editForm, setEditForm] = useState<EditForm>({
    title: "",
    description: "",
    destination: "",
    pickupLocation: "",
    budget: "",
    startDate: "",
    endDate: "",
  });
  const [saving, setSaving] = useState<boolean>(false);
  const [dateError, setDateError] = useState<string>("");
  const [showContactModal, setShowContactModal] = useState<boolean>(false);
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const [reportReason, setReportReason] = useState<string>("");
  const [reportNotes, setReportNotes] = useState<string>("");
  const [reportError, setReportError] = useState<string>("");
  const [reportSuccess, setReportSuccess] = useState<string>("");
  const [reporting, setReporting] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const todayStr = new Date().toISOString().slice(0,10);

  const validateDates = (start?: string, end?: string) => {
    setDateError("");
    if (!start) return false;
    const s = new Date(start);
    s.setHours(0,0,0,0);
    const today = new Date();
    today.setHours(0,0,0,0);
    if (s < today) {
      setDateError("Start date must be today or in the future");
      return false;
    }
    if (end) {
      const e = new Date(end);
      e.setHours(0,0,0,0);
      if (e < s) {
        setDateError("End date must be same as or after start date");
        return false;
      }
    }
    return true;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const groupMessagesByDay = (msgs: ChatMessage[]) => {
    const groups: { dateLabel: string; dateISO: string; items: ChatMessage[] }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const msg of msgs) {
      const d = new Date(msg.createdAt);
      const msgDay = new Date(d);
      msgDay.setHours(0, 0, 0, 0);
      const iso = msgDay.toISOString().slice(0, 10);

      const last = groups.length ? groups[groups.length - 1] : null;
      if (last && last.dateISO === iso) {
        last.items.push(msg);
      } else {
        const diffDays = Math.round((today.getTime() - msgDay.getTime()) / (1000 * 60 * 60 * 24));
        let label = "";
        if (diffDays === 0) label = "Today";
        else if (diffDays === 1) label = "Yesterday";
        else {
          const sameYear = d.getFullYear() === today.getFullYear();
          label = d.toLocaleDateString(undefined, { month: "short", day: "numeric", ...(sameYear ? {} : { year: "numeric" }) });
        }

        groups.push({ dateLabel: label, dateISO: iso, items: [msg] });
      }
    }

    return groups;
  };

  const formatTime12 = (isoOrDate: string | Date) => {
    const d = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
    return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (socket) {
      console.log("Socket connected");
    }
  }, [socket]);

  const loadTripData = async () => {
    try {
      setLoading(true);
      const tripResponse = await API.get<TripDetail>(`/trips/${id}`);
      setTrip(tripResponse.data);
      setEditForm({
        title: tripResponse.data.title,
        description: tripResponse.data.description || "",
        destination: tripResponse.data.destination,
        pickupLocation: tripResponse.data.pickupLocation,
        budget: tripResponse.data.budget || "",
        startDate: tripResponse.data.startDate ? tripResponse.data.startDate.slice(0, 10) : "",
        endDate: tripResponse.data.endDate ? tripResponse.data.endDate.slice(0, 10) : "",
      });

      const isMember = tripResponse.data.members.some((member) => member._id === user?._id);
      const isCreator = tripResponse.data.createdBy._id === user?._id;

      if (isMember || isCreator) {
        const messagesResponse = await API.get<ChatMessage[]>(`/trips/${id}/messages`);
        setMessages(messagesResponse.data);
      } else {
        setMessages([]);
      }
    } catch (error) {
      console.error("Error loading trip:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTripData();
  }, [id]);

  const joinTrip = async () => {
    try {
      await API.post(`/trips/${id}/join`);
      await loadTripData();
    } catch (error) {
      console.error("Error joining trip:", error);
    }
  };

  const removeMember = async (memberId: string) => {
    if (!trip || !isCreator) return;

    const member = trip.members.find((m) => m._id === memberId);
    const memberName = member?.name || "this member";
    const confirmed = window.confirm(`Remove ${memberName} from this trip?`);
    if (!confirmed) return;

    try {
      const response = await API.delete<TripDetail>(`/trips/${trip._id}/members/${memberId}`);
      setTrip(response.data);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Failed to remove member.";
      alert(errorMessage);
    }
  };

  const sendMessage = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!message.trim() || sending) return;

    try {
      setSending(true);
      const response = await API.post<ChatMessage>(`/trips/${id}/messages`, { text: message });
      setMessages((prev) => [...prev, response.data]);
      setMessage("");
    } catch (error: any) {
      console.error("Error sending message:", error);
      const errorMessage = error.response?.data?.message || "Failed to send message. Please try again.";
      alert(`Error: ${errorMessage}`);
    } finally {
      setSending(false);
    }
  };

  const startEditing = () => {
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
    if (trip) {
      setEditForm({
        title: trip.title,
        description: trip.description || "",
        destination: trip.destination,
        pickupLocation: trip.pickupLocation,
        budget: trip.budget || "",
        startDate: trip.startDate ? trip.startDate.slice(0, 10) : "",
        endDate: trip.endDate ? trip.endDate.slice(0, 10) : "",
      });
    }
  };

  const handleEditChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const saveTrip = async (e: FormEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (saving) return;

    if (!validateDates(editForm.startDate, editForm.endDate)) return;

    try {
      setSaving(true);
      const response = await API.put<TripDetail>(`/trips/${id}`, editForm);
      setTrip(response.data);
      setEditing(false);
    } catch (error: any) {
      console.error("Error updating trip:", error);
      const errorMessage = error.response?.data?.message || "Failed to update trip. Please try again.";
      alert(`Error: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  const submitReport = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!reportReason) {
      setReportError("Please select a reason for the report.");
      return;
    }

    try {
      setReporting(true);
      setReportError("");
      setReportSuccess("");

      await API.post(`/trips/${id}/report`, {
        reason: reportReason,
        notes: reportNotes.trim() || undefined,
      });

      setReportSuccess("Report submitted. Thank you for letting us know.");
      setReportNotes("");
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Failed to submit report.";
      setReportError(errorMessage);
    } finally {
      setReporting(false);
    }
  };

  if (loading) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-100 via-rose-50 to-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-sky-500 border-t-transparent"></div>
          <p className="text-slate-600 font-medium">Loading trip details...</p>
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-100 via-rose-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Trip not found or you don&apos;t have access</h2>
          <p className="text-slate-600 mb-4">This trip may be private or doesn&apos;t exist.</p>
          <Link to="/" className="text-sky-600 hover:text-sky-700">Back to trips</Link>
        </div>
      </div>
    );
  }

  const isMember = trip.members.some((member) => member._id === user?._id);
  const isCreator = trip.createdBy._id === user?._id;
  const canJoinTrip = user?.role === "user" && !isMember && !isCreator;

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-100 via-rose-50 to-slate-100">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 left-[-5rem] h-80 w-80 rounded-full bg-rose-200/45 blur-3xl" />
        <div className="absolute top-1/3 right-[-6rem] h-96 w-96 rounded-full bg-white/60 blur-3xl" />
        <div className="absolute bottom-[-7rem] left-1/4 h-96 w-96 rounded-full bg-rose-100/50 blur-3xl" />
      </div>
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!editing && (
          <div className="mb-6">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back
            </Link>
          </div>
        )}

        <div className="rounded-3xl border border-black/20 bg-white/60 shadow-md backdrop-blur p-8 mb-8">
          <div className="flex justify-between items-start mb-8">
            {editing ? (
              <div className="w-full">
                <input
                  type="text"
                  name="title"
                  value={editForm.title}
                  onChange={handleEditChange}
                  maxLength={20}
                  className="text-3xl font-bold bg-white border border-slate-300 rounded-2xl px-3 py-3 w-full text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-400"
                  required
                />
                <div className="text-right text-sm text-slate-500 mt-1">
                  {editForm.title.length}/20 characters
                </div>
              </div>
            ) : (
              <h1 className="text-4xl md:text-5xl font-bold text-slate-900">{trip.title}</h1>
            )}

            <div className="flex gap-3">
              {canJoinTrip && (
                <button
                  onClick={joinTrip}
                  className="rounded-xl border border-sky-700 bg-sky-100 px-5 py-3 text-sm font-semibold text-sky-900 transition hover:bg-sky-200"
                >
                  Join Trip
                </button>
              )}
              {(isMember || isCreator) && !editing && (
                <span className="rounded-full border border-slate-300 bg-purple-200 px-4 py-2 text-sm font-medium flex items-center justify-center text-slate-800">
                  {isCreator ? "Trip Creator" : "Member"}
                </span>
              )}
              {isCreator && !editing && (
                <button
                  onClick={startEditing}
                  className="rounded-xl border border-amber-400 bg-amber-100 px-5 py-3 text-sm font-semibold text-amber-800 transition hover:bg-amber-200"
                >
                  Edit Trip
                </button>
              )}
              {editing && (
                <div className="flex gap-3">
                  <button
                    onClick={saveTrip}
                    disabled={saving}
                    className="rounded-xl border border-emerald-400 bg-emerald-100 ml-5 px-5 py-3 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? "Saving..." : "Save"}
                  </button>
                  <button
                    onClick={cancelEditing}
                    className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>

          {user?.role === "creator" && !isCreator ? (
            <div className="mb-6 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              You can view this trip, but only users can join trips. As a creator, you can fully manage trips that you create.
            </div>
          ) : null}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="space-y-6">
              <div>
                {/* <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  Trip Information
                </h3> */}
                <div className="space-y-4">
                  {editing ? (
                    <>
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700">Destination</label>
                        <input type="text" name="destination" value={editForm.destination} onChange={handleEditChange} className="w-full p-4 bg-white border border-slate-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-sky-400 text-slate-900 placeholder-slate-400 transition-all duration-200" required />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700">Pickup Location</label>
                        <input type="text" name="pickupLocation" value={editForm.pickupLocation} onChange={handleEditChange} className="w-full p-4 bg-white border border-slate-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-sky-400 text-slate-900 placeholder-slate-400 transition-all duration-200" required />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700">Start Date</label>
                        <input type="date" name="startDate" value={editForm.startDate} onChange={handleEditChange} min={todayStr} className="w-full p-4 bg-white border border-slate-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-sky-400 text-slate-900 placeholder-slate-400 transition-all duration-200" required />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700">End Date</label>
                        <input type="date" name="endDate" value={editForm.endDate} onChange={handleEditChange} min={editForm.startDate || todayStr} className="w-full p-4 bg-white border border-slate-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-sky-400 text-slate-900 placeholder-slate-400 transition-all duration-200" required />
                      </div>
                      {dateError && <p className="text-sm text-red-600 mt-1">{dateError}</p>}
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700">Budget (₹)</label>
                        <input type="number" name="budget" value={editForm.budget} onChange={handleEditChange} placeholder="Optional" className="w-full p-4 bg-white border border-slate-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-sky-400 text-slate-900 placeholder-slate-400 transition-all duration-200" required />
                      </div>
                    </>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center">
                          <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm text-slate-600">Destination</p>
                          <p className="font-bold text-slate-900">{trip.destination}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center">
                          <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm text-slate-600">Pickup Location</p>
                          <p className="font-bold text-slate-900">{trip.pickupLocation}</p>
                        </div>
                      </div>
                      {(trip.startDate || trip.endDate) && (
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center">
                            <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm text-slate-600">Trip Date</p>
                            <p className="font-bold text-slate-900">{formatRange(trip.startDate, trip.endDate)}</p>
                          </div>
                        </div>
                      )}
                      {trip.budget && (
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center text-amber-600 text-xl font-bold">
                            ₹
                          </div>
                          <div>
                            <p className="text-sm text-slate-600">Budget</p>
                            <p className="font-bold text-emerald-600 text-lg">₹{trip.budget}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                  <div className="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                  </div>
                  Description
                </h3>
                {editing ? (
                  <textarea
                    name="description"
                    value={editForm.description}
                    onChange={handleEditChange}
                    rows={4}
                    className="w-full p-4 bg-white border border-slate-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-sky-400 text-slate-900 placeholder-slate-400 transition-all duration-200"
                    placeholder="Trip description..."
                  />
                ) : (
                  <p className="text-slate-700 border border-slate-300 bg-slate-100 rounded-2xl p-4">{trip.description || "No description provided."}</p>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                <div className="w-8 h-8 bg-sky-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                Group Members ({trip.members.length})
              </h3>
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-300">
                <div className={`space-y-4 ${trip.members.length > 3 ? "max-h-60 overflow-y-auto pr-2" : ""}`}>
                  {trip.members.map((member) => (
                    <div key={member._id} className="flex items-center gap-4 p-3 bg-white rounded-xl border border-slate-300">
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-purple-400 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                        {member.name?.charAt(0) || "U"}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900 flex items-center gap-2">
                          {member.name}
                          {member._id === trip.createdBy._id && (
                            <span className="bg-gradient-to-r from-sky-400 to-sky-500 text-white text-xs px-2 py-1 rounded-full">Creator</span>
                          )}
                        </p>
                      </div>
                      {isCreator && member._id !== trip.createdBy._id && (
                        <button
                          onClick={() => removeMember(member._id)}
                          className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

            <div className="border-t border-gray-700 pt-6 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Trip created by <span className="text-blue-600">{trip.createdBy.name}</span> on {new Date(trip.createdAt).toLocaleDateString()}
            </p>
            {isMember && !isCreator && (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowContactModal(true)}
                  className="rounded-lg border border-sky-400 bg-sky-100/50 px-4 py-2 text-sm font-semibold text-sky-900 transition hover:bg-sky-100"
                >
                  Contact Creator
                </button>
                <button
                  onClick={() => {
                    setReportError("");
                    setReportSuccess("");
                    setReportReason("");
                    setReportNotes("");
                    setShowReportModal(true);
                  }}
                  className="rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                >
                  Report Creator
                </button>
              </div>
            )}
          </div>
        </div>

        {(isMember || isCreator) && !editing && (
          <div className="rounded-3xl border border-gray-300 bg-white/80 shadow-md backdrop-blur p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
              <div className="w-10 h-10 bg-sky-500/20 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              Group Chat
            </h2>

            <div className="h-80 overflow-y-auto mb-6 border border-slate-200 rounded-2xl p-6 bg-slate-50">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-500">
                  <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p>No messages yet. Start the conversation!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {(() => {
                    const grouped = groupMessagesByDay(messages);
                    return (
                      <>
                        {grouped.map((group) => (
                          <div key={group.dateISO}>
                            <div className="flex justify-center my-3">
                              <span className="text-xs bg-slate-200 text-slate-700 px-3 py-1 rounded-full">{group.dateLabel}</span>
                            </div>
                            <div className="space-y-3">
                              {group.items.map((msg) => (
                                <div key={msg._id} className={`flex ${msg.sender._id === user?._id ? "justify-end" : "justify-start"}`}>
                                  <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl break-words ${msg.sender._id === user?._id ? "bg-sky-500/60 text-black" : "bg-slate-200 text-slate-900"}`}>
                                    <p className="text-sm whitespace-pre-wrap break-words">{msg.text}</p>
                                    <p className="text-xs opacity-75 mt-2 text-right">
                                      {msg.sender.name} &bull; {formatTime12(msg.createdAt)}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                        <div ref={messagesEndRef} />
                      </>
                    );
                  })()}
                </div>
              )}
            </div>

            <form onSubmit={sendMessage} className="flex gap-3">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 p-4 bg-white border border-slate-300 rounded-2xl focus:outline-none focus:ring-1 focus:ring-sky-400 text-slate-900 placeholder-slate-400 transition-all duration-200"
                disabled={sending}
              />
              <button
                type="submit"
                disabled={sending || !message.trim()}
                className="rounded-xl border border-sky-700 bg-sky-100 px-8 py-3 font-semibold text-sky-900 transition hover:bg-sky-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? "Sending..." : "Send"}
              </button>
            </form>
          </div>
        )}


        {showContactModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="rounded-3xl border border-sky-300 bg-white/95 shadow-2xl p-8 max-w-sm w-full">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-sky-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                  {trip.createdBy.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">{trip.createdBy.name}</h3>
                  <p className="text-sm text-slate-500">Trip Creator</p>
                </div>
              </div>
              <div className="space-y-4 mb-6">
                {trip.createdBy.email && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-sky-50 border border-sky-200">
                    <svg className="w-5 h-5 text-sky-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <div>
                      <p className="text-xs text-slate-500 font-semibold">Email</p>
                      <p className="text-sm text-slate-900 font-medium break-all">{trip.createdBy.email}</p>
                    </div>
                  </div>
                )}
                {trip.createdBy.phone && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                    <svg className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <div>
                      <p className="text-xs text-slate-500 font-semibold">Phone</p>
                      <p className="text-sm text-slate-900 font-medium">{trip.createdBy.phone}</p>
                    </div>
                  </div>
                )}
              </div>
              <p className="text-sm text-slate-600 mb-6 italic">You can also connect through the group chat to discuss trip details.</p>
              <button onClick={() => setShowContactModal(false)} className="w-full rounded-lg border border-sky-300 bg-sky-100 px-4 py-3 text-sm font-semibold text-sky-900 transition hover:bg-sky-200">Close</button>
            </div>
          </div>
        )}

        {showReportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="rounded-3xl border border-red-200 bg-white/95 shadow-2xl p-8 max-w-lg w-full">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-slate-900">Report Creator</h3>
                <p className="text-sm text-slate-600 mt-1">
                  Reports are reviewed by the Tripify team. Please provide accurate details.
                </p>
              </div>

              <form onSubmit={submitReport} className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Reason</label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100"
                    required
                  >
                    <option value="">Select a reason</option>
                    <option value="Spam or misleading">Spam or misleading</option>
                    <option value="Harassment or abuse">Harassment or abuse</option>
                    <option value="Scam or fraud">Scam or fraud</option>
                    <option value="Inappropriate content">Inappropriate content</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Notes (optional)</label>
                  <textarea
                    value={reportNotes}
                    onChange={(e) => setReportNotes(e.target.value)}
                    rows={4}
                    placeholder="Share any additional details..."
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100"
                  />
                </div>

                {reportError ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                    {reportError}
                  </div>
                ) : null}

                {reportSuccess ? (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                    {reportSuccess}
                  </div>
                ) : null}

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowReportModal(false)}
                    className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={reporting}
                    className="rounded-lg border border-red-300 bg-red-100 px-4 py-2 text-sm font-semibold text-red-800 transition hover:bg-red-200 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {reporting ? "Submitting..." : "Submit Report"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {!isMember && !isCreator && !editing && (
          <div className="rounded-3xl border border-amber-500 bg-amber-50/80 backdrop-blur p-6 text-center">
            <div className="flex items-center justify-center gap-3 mb-2">
              <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <p className="text-amber-800 font-semibold">Join this trip to participate in the group chat and get more details!</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

