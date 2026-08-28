import { FormEvent, useEffect, useRef, useState } from "react";
import axios from "axios";
import API from "../api/api";

type TripPlan = {
  title: string;
  summary: string;
  bestTime: string;
  estimatedBudget: string;
  tips: string[];
  itinerary: { day: number; title: string; activities: string[] }[];
};

type PlannerHistory = {
  _id: string;
  prompt: string;
  plan: TripPlan;
  createdAt: string;
};

const starterPrompt = "Plan a 4-day trip to Goa for two friends who like beaches, local food, and relaxed evenings. Keep it mid-range and include a rough budget.";

export default function TripPlanner() {
  const [prompt, setPrompt] = useState("");
  const [plan, setPlan] = useState<TripPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [history, setHistory] = useState<PlannerHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(440);
  const isResizing = useRef(false);

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const response = await API.get<PlannerHistory[]>("/planner/history");
      setHistory(response.data);
    } catch (requestError) {
      console.error("Could not load planner history:", requestError);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadHistory();
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      if (!isResizing.current) return;
      const nextWidth = window.innerWidth - event.clientX;
      setSidebarWidth(Math.min(Math.max(nextWidth, 360), Math.min(760, window.innerWidth - 24)));
    };
    const stopResizing = () => {
      isResizing.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", stopResizing);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", stopResizing);
    };
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!prompt.trim()) return;

    setIsOpen(true);
    setLoading(true);
    setError("");
    try {
      const response = await API.post<TripPlan>("/planner", { prompt });
      setPlan(response.data);
      await loadHistory();
    } catch (requestError) {
      if (axios.isAxiosError(requestError)) {
        setError(requestError.response?.data?.message || "We could not create your plan. Please try again.");
      } else {
        setError("We could not create your plan. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <section className="relative isolate overflow-hidden rounded-3xl border border-sky-600/80 bg-gradient-to-br from-sky-100/85 via-white/75 to-cyan-50/80 p-5 text-slate-900 shadow-md backdrop-blur md:p-6">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(125,211,252,0.35),transparent_45%),radial-gradient(circle_at_bottom_left,rgba(165,243,252,0.3),transparent_50%)]" />
        <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-sky-100 text-sky-700">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v3m0 12v3M3 12h3m12 0h3m-4.22-4.22l2.12-2.12M6.1 17.9l2.12-2.12m0-7.56L6.1 6.1m11.8 11.8l-2.12-2.12M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">AI trip planner</p>
              <h2 className="mt-1 text-xl font-bold text-slate-900">Turn a feeling into a plan.</h2>
              <p className="mt-1 text-sm text-slate-600">Describe your ideal trip and get a day-by-day route.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="inline-flex items-center justify-center rounded-xl border border-sky-500 bg-white px-5 py-3 text-sm font-semibold text-sky-900 transition hover:bg-sky-100"
          >
            Open planner
            <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      </section>

      {isOpen ? (
        <>
          <button type="button" aria-label="Close trip planner" onClick={() => setIsOpen(false)} className="fixed inset-0 z-[100] cursor-default bg-slate-900/25 backdrop-blur-md" />
          <aside style={{ width: `min(${sidebarWidth}px, 100vw)` }} className="fixed right-0 top-0 z-[110] flex h-[100dvh] w-full max-w-full flex-col border-l border-slate-200 bg-white/95 shadow-2xl backdrop-blur-xl">
            <div
              role="separator"
              aria-label="Resize trip planner sidebar"
              aria-orientation="vertical"
              onPointerDown={(event) => {
                event.preventDefault();
                isResizing.current = true;
                document.body.style.cursor = "ew-resize";
                document.body.style.userSelect = "none";
              }}
              className="absolute left-0 top-0 z-10 hidden h-full w-2 -translate-x-1/2 cursor-ew-resize items-center justify-center md:flex"
            >
              <span className="h-16 w-1 rounded-full bg-slate-300 transition-colors hover:bg-sky-500" />
            </div>
            <div className="flex items-center justify-between border-b border-slate-200 bg-white/90 px-5 py-4 backdrop-blur-xl">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">Tripify assistant</p>
                <h2 className="mt-1 text-lg font-bold text-slate-900">Plan your next adventure</h2>
              </div>
              <button type="button" onClick={() => setIsOpen(false)} aria-label="Close planner" className="grid h-9 w-9 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-800">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {history.length > 0 ? (
                <div className="mb-6 border-b border-slate-200 pb-5">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Recent plans</h3>
                    {historyLoading ? <span className="text-xs text-slate-400">Loading...</span> : null}
                  </div>
                  <div className="space-y-1.5">
                    {history.map((item) => (
                      <button
                        type="button"
                        key={item._id}
                        onClick={() => {
                          setPrompt(item.prompt);
                          setPlan(item.plan);
                          setError("");
                        }}
                        className="w-full rounded-xl px-3 py-2 text-left transition hover:bg-sky-50"
                      >
                        <p className="truncate text-sm font-semibold text-slate-700">{item.plan.title}</p>
                        <p className="mt-0.5 truncate text-xs text-slate-500">{item.prompt}</p>
                      </button>
                    ))}
                  </div>
                </div>
              ) : historyLoading ? (
                <p className="mb-6 border-b border-slate-200 pb-5 text-sm text-slate-500">Loading recent plans...</p>
              ) : null}

              <form onSubmit={handleSubmit} className="flex flex-col">
                <label htmlFor="trip-plan-prompt" className="mb-2 text-sm font-semibold text-slate-700">What kind of trip are you imagining?</label>
                <textarea
                  id="trip-plan-prompt"
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  maxLength={4000}
                  rows={6}
                  placeholder="Example: Plan 5 days in Rajasthan for my parents in November..."
                  className="w-full resize-y rounded-xl border border-sky-300 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-sky-600 focus:ring-2 focus:ring-sky-300"
                />
                <div className="mt-2 flex items-center justify-between text-xs text-slate-500"><span>More detail means a more personal plan.</span><span>{prompt.length}/4000</span></div>
                <button type="button" onClick={() => setPrompt(starterPrompt)} className="mt-4 self-start text-sm font-semibold text-sky-700 underline decoration-sky-300 underline-offset-4 transition hover:text-sky-900">Try an example request</button>
                <button type="submit" disabled={loading || !prompt.trim()} className="mt-5 mb-6 inline-flex items-center justify-center rounded-xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50">{loading ? "Building your itinerary..." : "Plan my trip"}</button>
                {error ? <p role="alert" className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
              </form>

              {plan ? (
                <div className="mt-8 border-t border-slate-200 pt-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">Your suggested route</p>
                  <h3 className="mt-2 text-2xl font-bold text-slate-900">{plan.title}</h3>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold"><span className="rounded-full bg-slate-100 px-3 py-1.5">Best time: {plan.bestTime}</span><span className="rounded-full bg-emerald-100 px-3 py-1.5 text-emerald-800">Budget: {plan.estimatedBudget}</span></div>
                  <p className="mt-4 text-sm leading-relaxed text-slate-600">{plan.summary}</p>
                  <div className="mt-6 space-y-3">
                    {plan.itinerary.map((day) => (
                      <article key={`${day.day}-${day.title}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-700">Day {day.day}</p>
                        <h4 className="mt-1 font-bold text-slate-900">{day.title}</h4>
                        <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-slate-600">{day.activities.map((activity) => <li key={activity} className="flex gap-2"><span className="text-sky-600">•</span><span>{activity}</span></li>)}</ul>
                      </article>
                    ))}
                  </div>
                  {plan.tips?.length ? <div className="mt-5 rounded-2xl bg-amber-50 p-4"><h4 className="font-bold text-amber-950">Useful before you go</h4><ul className="mt-2 space-y-1.5 text-sm text-amber-900">{plan.tips.map((tip) => <li key={tip} className="flex gap-2"><span>•</span><span>{tip}</span></li>)}</ul></div> : null}
                  <p className="mt-5 text-xs leading-relaxed text-slate-500">Verify current prices, opening hours, transport, and entry requirements before booking.</p>
                </div>
              ) : null}
            </div>
          </aside>
        </>
      ) : null}
    </>
  );
}