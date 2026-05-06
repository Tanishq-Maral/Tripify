import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../api/api";
import { useAuth, AuthUser } from "../context/AuthContext";

interface SettingsForm {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

interface ProfileData {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: "creator" | "user";
}

export default function Settings() {
  const { user, login } = useAuth();
  const [form, setForm] = useState<SettingsForm>({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const response = await API.get<ProfileData>("/auth/profile");
        setForm((prev) => ({
          ...prev,
          name: response.data.name,
          email: response.data.email,
          phone: response.data.phone || "",
        }));
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load settings");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError("");
    setSuccess("");
  };

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!form.name.trim() || !form.email.trim()) {
      setError("Name and email are required");
      return;
    }

    if (user?.role === "creator" && !form.phone.trim()) {
      setError("Phone number is required for creator accounts");
      return;
    }

    if (form.phone && !/^[0-9]{10}$/.test(form.phone)) {
      setError("Phone number must be exactly 10 digits");
      return;
    }

    if (form.password && form.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Password and confirm password do not match");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const payload: { name: string; email: string; phone?: string; password?: string } = {
        name: form.name.trim(),
        email: form.email.trim(),
      };

      if (form.phone) {
        payload.phone = form.phone.trim();
      }

      if (form.password) {
        payload.password = form.password;
      }

      const response = await API.put<AuthUser>("/auth/settings", payload);

      const keepSignedIn = !!localStorage.getItem("token");
      login(response.data, response.data.token, keepSignedIn);

      setForm((prev) => ({
        ...prev,
        password: "",
        confirmPassword: "",
      }));
      setSuccess("Settings updated successfully.");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-100 via-rose-50 to-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-14 w-14 animate-spin rounded-full border-4 border-sky-500 border-t-transparent" />
          <p className="font-medium text-slate-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-100 via-rose-50 to-slate-100">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 left-[-5rem] h-80 w-80 rounded-full bg-rose-200/45 blur-3xl" />
        <div className="absolute top-1/3 right-[-6rem] h-96 w-96 rounded-full bg-white/60 blur-3xl" />
      </div>
      <div className="relative z-10 mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </Link>
        </div>

        <section className="rounded-3xl border border-slate-300 bg-white/80 p-8 shadow-md backdrop-blur">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
            <p className="mt-2 text-sm text-slate-600">
              Update your account details for your {user?.role || "user"} account.
            </p>
          </div>

          <form onSubmit={submit} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Name</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100"
                required
              />
            </div>

            {user?.role === "creator" && (
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={(e) => {
                    const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setForm((prev) => ({ ...prev, phone: digitsOnly }));
                    setError("");
                  }}
                  inputMode="numeric"
                  placeholder="10-digit phone number"
                  maxLength={10}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100"
                  required={user?.role === "creator"}
                />
                <p className="mt-1 text-xs text-slate-500">Only digits allowed, max 10 characters</p>
              </div>
            )}

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">New Password</label>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Leave blank to keep current"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Repeat new password"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100"
                />
              </div>
            </div>

            {error ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {error}
              </div>
            ) : null}

            {success ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                {success}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={saving}
              className="inline-flex rounded-xl border border-sky-700 bg-sky-100 px-6 py-3 text-sm font-semibold text-sky-900 transition hover:bg-sky-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
