import { useState, useEffect, useRef, FormEvent, ChangeEvent } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API from "../api/api";

interface TripMember {
  _id: string;
  name: string;
  email: string;
}

interface TripCreatedBy {
  _id: string;
  name: string;
}

interface TripDetail {
  _id: string;
  title: string;
  description?: string;
  destination: string;
  pickupLocation: string;
  budget?: number | string;
  date?: string;
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
  date: string;
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
    date: "",
  });
  const [saving, setSaving] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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
        date: tripResponse.data.date || "",
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
        date: trip.date || "",
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-800 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent"></div>
          <p className="text-gray-400 font-medium">Loading trip details...</p>
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Trip not found or you don&apos;t have access</h2>
          <p className="text-gray-400 mb-4">This trip may be private or doesn&apos;t exist.</p>
          <Link to="/" className="text-blue-400 hover:text-blue-300">Back to trips</Link>
        </div>
      </div>
    );
  }

  const isMember = trip.members.some((member) => member._id === user?._id);
  const isCreator = trip.createdBy._id === user?._id;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-800 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {!editing && (
          <div className="mb-6">
            <Link
              to="/"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-gray-600 to-gray-700 text-white px-8 py-3 rounded-2xl font-semibold hover:from-gray-700 hover:to-gray-600 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back
            </Link>
          </div>
        )}

        <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-700/50 p-8 mb-8">
          <div className="flex justify-between items-start mb-8">
            {editing ? (
              <div className="w-full">
                <input
                  type="text"
                  name="title"
                  value={editForm.title}
                  onChange={handleEditChange}
                  maxLength={25}
                  className="text-3xl font-bold bg-gray-700/50 border border-gray-600 rounded-2xl px-3 py-3 w-full text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <div className="text-right text-sm text-gray-400 mt-1">
                  {editForm.title.length}/25 characters
                </div>
              </div>
            ) : (
              <h1 className="text-5xl font-bold block bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">{trip.title}</h1>
            )}

            <div className="flex gap-3">
              {!isMember && !isCreator && (
                <button
                  onClick={joinTrip}
                  className="bg-gradient-to-r from-green-600 to-emerald-700 text-white px-6 py-3 rounded-2xl font-semibold hover:from-green-700 hover:to-emerald-800 transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  Join Trip
                </button>
              )}
              {(isMember || isCreator) && !editing && (
                <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-3 rounded-full text-sm font-medium">
                  {isCreator ? "Trip Creator" : "Member"}
                </span>
              )}
              {isCreator && !editing && (
                <button
                  onClick={startEditing}
                  className="bg-gradient-to-r from-yellow-600 to-orange-600 text-white px-6 py-3 rounded-2xl font-semibold hover:from-yellow-700 hover:to-orange-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  Edit Trip
                </button>
              )}
              {editing && (
                <div className="flex gap-3">
                  <button
                    onClick={saveTrip}
                    disabled={saving}
                    className="bg-gradient-to-r from-green-700 to-green-500 text-white px-6 py-3 rounded-2xl font-semibold hover:from-green-700 hover:to-emerald-800 transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? "Saving..." : "Save"}
                  </button>
                  <button
                    onClick={cancelEditing}
                    className="bg-gradient-to-r from-gray-600 to-gray-500 text-white px-6 py-3 rounded-2xl font-semibold hover:from-gray-600 hover:to-gray-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  Trip Information
                </h3>
                <div className="space-y-4">
                  {editing ? (
                    <>
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-300">Destination</label>
                        <input type="text" name="destination" value={editForm.destination} onChange={handleEditChange} className="w-full p-4 bg-gray-700/50 border border-gray-600 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500 text-white placeholder-gray-400 transition-all duration-200" required />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-300">Pickup Location</label>
                        <input type="text" name="pickupLocation" value={editForm.pickupLocation} onChange={handleEditChange} className="w-full p-4 bg-gray-700/50 border border-gray-600 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-400 transition-all duration-200" required />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-300">Trip Date</label>
                        <input type="text" name="date" value={editForm.date} onChange={handleEditChange} placeholder="e.g., December-2024" className="w-full p-4 bg-gray-700/50 border border-gray-600 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-white placeholder-gray-400 transition-all duration-200" required />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-300">Budget (₹)</label>
                        <input type="number" name="budget" value={editForm.budget} onChange={handleEditChange} placeholder="Optional" className="w-full p-4 bg-gray-700/50 border border-gray-600 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-white placeholder-gray-400 transition-all duration-200" required />
                      </div>
                    </>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
                          <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">Destination</p>
                          <p className="font-bold text-blue-200">{trip.destination}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
                          <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">Pickup Location</p>
                          <p className="font-bold text-blue-200">{trip.pickupLocation}</p>
                        </div>
                      </div>
                      {trip.date && (
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center">
                            <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm text-gray-400">Trip Date</p>
                            <p className="font-bold text-blue-200">{trip.date}</p>
                          </div>
                        </div>
                      )}
                      {trip.budget && (
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                            <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm text-gray-400">Budget</p>
                            <p className="font-bold text-emerald-400 text-lg">₹{trip.budget}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                  <div className="w-8 h-8 bg-yellow-900 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    className="w-full p-4 bg-gray-700/50 border border-gray-600 rounded-2xl focus:outline-none focus:ring-2 focus:ring-yellow-500 text-white placeholder-gray-400 transition-all duration-200"
                    placeholder="Trip description..."
                  />
                ) : (
                  <p className="text-gray-300 bg-gray-700/30 rounded-2xl p-4">{trip.description || "No description provided."}</p>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                Group Members ({trip.members.length})
              </h3>
              <div className="bg-gray-700/50 rounded-2xl p-6 border border-gray-600/50">
                <div className="space-y-4">
                  {trip.members.map((member) => (
                    <div key={member._id} className="flex items-center gap-4 p-3 bg-gray-600/30 rounded-xl">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-800 to-purple-800 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                        {member.name?.charAt(0) || "U"}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-white flex items-center gap-2">
                          {member.name}
                          {member._id === trip.createdBy._id && (
                            <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs px-2 py-1 rounded-full">Creator</span>
                          )}
                        </p>
                        <p className="text-sm text-gray-400">{member.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-700 pt-6">
            <p className="text-sm text-gray-400">
              Trip created by <span className="text-blue-400">{trip.createdBy.name}</span> on {new Date(trip.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {(isMember || isCreator) && !editing && (
          <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-700/50 p-8">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              Group Chat
            </h2>

            <div className="h-80 overflow-y-auto mb-6 border border-gray-600 rounded-2xl p-6 bg-gray-700/30">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p>No messages yet. Start the conversation!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <div key={msg._id} className={`flex ${msg.sender._id === user?._id ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${msg.sender._id === user?._id ? "bg-gradient-to-r from-blue-800 to-purple-900 text-white" : "bg-gray-600 text-gray-100"}`}>
                        <p className="text-sm">{msg.text}</p>
                        <p className="text-xs opacity-75 mt-2">
                          {msg.sender.name} &bull; {new Date(msg.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            <form onSubmit={sendMessage} className="flex gap-3">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 p-4 bg-gray-700/50 border border-gray-600 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400 transition-all duration-200"
                disabled={sending}
              />
              <button
                type="submit"
                disabled={sending || !message.trim()}
                className="bg-gradient-to-r from-blue-600 to-purple-700 text-white px-8 py-4 rounded-2xl font-semibold hover:from-blue-700 hover:to-purple-800 transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? "Sending..." : "Send"}
              </button>
            </form>
          </div>
        )}

        {!isMember && !isCreator && !editing && (
          <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-2xl p-6 text-center">
            <div className="flex items-center justify-center gap-3 mb-2">
              <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <p className="text-yellow-400 font-semibold">Join this trip to participate in the group chat and get more details!</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}