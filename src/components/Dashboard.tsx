"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

type Resource = {
  id: string; name: string; type: string; location: string; capacity: number;
  description: string | null; isActive: boolean; _count?: { reservations: number };
};
type Reservation = {
  id: string; resourceId: string; requesterName: string; requesterEmail: string;
  purpose: string; startAt: string; endAt: string; status: "CONFIRMED" | "CANCELLED";
  resource: { id: string; name: string; type: string; location: string };
};

const dateLabel = (value: string) => new Date(value).toLocaleString([], {
  year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
});
const localInputDate = (date: Date) => {
  const shifted = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return shifted.toISOString().slice(0, 16);
};

export default function Dashboard() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [resourceForm, setResourceForm] = useState({ name: "", type: "Meeting Room", location: "", capacity: "1", description: "" });
  const [reservationForm, setReservationForm] = useState({
    resourceId: "", requesterName: "", requesterEmail: "", purpose: "",
    startAt: localInputDate(new Date(Date.now() + 60 * 60 * 1000)),
    endAt: localInputDate(new Date(Date.now() + 2 * 60 * 60 * 1000)),
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [resourceResponse, reservationResponse] = await Promise.all([fetch("/api/resources"), fetch("/api/reservations")]);
      const [resourceData, reservationData] = await Promise.all([resourceResponse.json(), reservationResponse.json()]);
      if (!resourceResponse.ok) throw new Error(resourceData.error || "Failed to load resources.");
      if (!reservationResponse.ok) throw new Error(reservationData.error || "Failed to load reservations.");
      setResources(resourceData);
      setReservations(reservationData);
      setError("");
      setReservationForm((current) => ({
        ...current,
        resourceId: current.resourceId || resourceData.find((r: Resource) => r.isActive)?.id || "",
      }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to connect to the application.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadData(); }, [loadData]);

  const activeResources = resources.filter((resource) => resource.isActive);
  const upcoming = reservations.filter((item) => item.status === "CONFIRMED" && new Date(item.startAt) >= new Date()).length;
  const filteredReservations = useMemo(() => reservations.filter((item) => {
    const matchesStatus = statusFilter === "ALL" || item.status === statusFilter;
    const text = `${item.resource.name} ${item.requesterName} ${item.purpose}`.toLowerCase();
    return matchesStatus && text.includes(query.toLowerCase());
  }), [reservations, statusFilter, query]);

  async function submitResource(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setNotice("");
    const response = await fetch("/api/resources", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...resourceForm, capacity: Number(resourceForm.capacity) }) });
    const data = await response.json();
    if (!response.ok) { setError(data.error || "Could not add resource."); return; }
    setResourceForm({ name: "", type: "Meeting Room", location: "", capacity: "1", description: "" });
    setNotice("Resource added successfully."); await loadData();
  }

  async function submitReservation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setNotice("");
    const response = await fetch("/api/reservations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...reservationForm, startAt: new Date(reservationForm.startAt).toISOString(), endAt: new Date(reservationForm.endAt).toISOString() }) });
    const data = await response.json();
    if (!response.ok) { setError(data.error || "Could not create reservation."); return; }
    setNotice("Reservation created successfully."); await loadData();
  }

  async function cancelReservation(id: string) {
    if (!window.confirm("Cancel this reservation?")) return;
    setError(""); setNotice("");
    const response = await fetch(`/api/reservations/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "CANCELLED" }) });
    const data = await response.json();
    if (!response.ok) { setError(data.error || "Could not cancel reservation."); return; }
    setNotice("Reservation cancelled."); await loadData();
  }

  async function toggleResource(resource: Resource) {
    setError(""); setNotice("");
    const response = await fetch(`/api/resources/${resource.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !resource.isActive }) });
    const data = await response.json();
    if (!response.ok) { setError(data.error || "Could not update resource."); return; }
    setNotice(`Resource ${resource.isActive ? "deactivated" : "activated"}.`); await loadData();
  }

  return <main className="shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark">R</div><div><strong>ResourceHub</strong><span>WORKSPACE TOOLS</span></div></div>
      <div className="side-label">WORKSPACE</div>
      <a className="side-link active" href="#overview"><span>▦</span> Overview</a>
      <a className="side-link" href="#reservations"><span>◷</span> Reservations</a>
      <a className="side-link" href="#resources"><span>▤</span> Resources</a>
      <div className="sidebar-bottom"><div className="avatar">PW</div><div><strong>Workspace admin</strong><span>Resource coordinator</span></div></div>
    </aside>

    <section className="main-area">
      <header className="topbar"><div><span className="breadcrumb">Workspace / </span><strong>Overview</strong></div><div className="top-right"><span className="live-dot"></span> Local workspace <div className="avatar small">PW</div></div></header>
      <div className="content">
        <div className="page-heading"><div><p className="eyebrow">RESOURCE MANAGEMENT</p><h1>Good day. Let’s get organized.</h1><p className="subheading">Manage shared spaces and keep every reservation running smoothly.</p></div><button className="button primary" onClick={() => document.getElementById("new-reservation")?.scrollIntoView({ behavior: "smooth" })}>＋ New reservation</button></div>

        {error && <div className="alert error" role="alert">{error}<button onClick={() => setError("")}>×</button></div>}
        {notice && <div className="alert success" role="status">{notice}<button onClick={() => setNotice("")}>×</button></div>}

        <section id="overview" className="stats-grid">
          <article className="stat-card"><div className="stat-top"><span>Active resources</span><span className="stat-icon purple">▤</span></div><div className="stat-number">{resources.filter(r => r.isActive).length}</div><div className="stat-foot">Available to book</div></article>
          <article className="stat-card"><div className="stat-top"><span>Upcoming reservations</span><span className="stat-icon blue">◷</span></div><div className="stat-number">{upcoming}</div><div className="stat-foot">Confirmed future bookings</div></article>
          <article className="stat-card"><div className="stat-top"><span>Total reservations</span><span className="stat-icon green">✓</span></div><div className="stat-number">{reservations.length}</div><div className="stat-foot">Including cancelled records</div></article>
        </section>

        <section className="panel" id="reservations">
          <div className="panel-heading"><div><h2>Reservations</h2><p>Review bookings and avoid scheduling conflicts.</p></div><div className="filters"><input aria-label="Search reservations" placeholder="Search reservations..." value={query} onChange={e => setQuery(e.target.value)} /><select aria-label="Filter status" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}><option value="ALL">All statuses</option><option value="CONFIRMED">Confirmed</option><option value="CANCELLED">Cancelled</option></select></div></div>
          {loading ? <div className="empty">Loading workspace data…</div> : filteredReservations.length === 0 ? <div className="empty"><div className="empty-icon">◷</div><strong>No reservations found</strong><span>Create a reservation or adjust your search filters.</span></div> :
            <div className="table-wrap"><table><thead><tr><th>RESOURCE</th><th>REQUESTED BY</th><th>DATE & TIME</th><th>PURPOSE</th><th>STATUS</th><th></th></tr></thead><tbody>{filteredReservations.map(item => <tr key={item.id}><td><div className="resource-cell"><div className="row-icon">▤</div><div><strong>{item.resource.name}</strong><span>{item.resource.location}</span></div></div></td><td><strong className="normal">{item.requesterName}</strong><span className="cell-sub">{item.requesterEmail}</span></td><td><strong className="normal">{dateLabel(item.startAt)}</strong><span className="cell-sub">to {dateLabel(item.endAt)}</span></td><td className="purpose">{item.purpose}</td><td><span className={`status ${item.status === "CONFIRMED" ? "confirmed" : "cancelled"}`}><i></i>{item.status === "CONFIRMED" ? "Confirmed" : "Cancelled"}</span></td><td>{item.status === "CONFIRMED" && <button className="text-button" onClick={() => void cancelReservation(item.id)}>Cancel</button>}</td></tr>)}</tbody></table></div>}
        </section>

        <div className="lower-grid">
          <section className="panel form-panel" id="new-reservation">
            <div className="panel-heading"><div><h2>Create a reservation</h2><p>Book a resource for a specific time.</p></div><span className="form-symbol">◷</span></div>
            <form onSubmit={submitReservation} className="form">
              <label>Resource<select required value={reservationForm.resourceId} onChange={e => setReservationForm({ ...reservationForm, resourceId: e.target.value })}><option value="">Select a resource</option>{activeResources.map(r => <option key={r.id} value={r.id}>{r.name} · {r.location}</option>)}</select></label>
              <div className="form-row"><label>Your name<input required minLength={2} value={reservationForm.requesterName} onChange={e => setReservationForm({ ...reservationForm, requesterName: e.target.value })} placeholder="e.g. Alex Perera" /></label><label>Email address<input required type="email" value={reservationForm.requesterEmail} onChange={e => setReservationForm({ ...reservationForm, requesterEmail: e.target.value })} placeholder="alex@company.com" /></label></div>
              <label>Purpose<input required minLength={3} value={reservationForm.purpose} onChange={e => setReservationForm({ ...reservationForm, purpose: e.target.value })} placeholder="e.g. Weekly project meeting" /></label>
              <div className="form-row"><label>Start date & time<input required type="datetime-local" value={reservationForm.startAt} onChange={e => setReservationForm({ ...reservationForm, startAt: e.target.value })} /></label><label>End date & time<input required type="datetime-local" value={reservationForm.endAt} onChange={e => setReservationForm({ ...reservationForm, endAt: e.target.value })} /></label></div>
              <button className="button primary full" type="submit" disabled={activeResources.length === 0}>Confirm reservation</button>
              {activeResources.length === 0 && <p className="hint">Add or activate a resource before making a reservation.</p>}
            </form>
          </section>

          <section className="panel form-panel" id="resources">
            <div className="panel-heading"><div><h2>Resource directory</h2><p>Shared spaces and equipment.</p></div><span className="form-symbol">▤</span></div>
            <div className="resource-list">{resources.map(resource => <div className="resource-item" key={resource.id}><div className="resource-avatar">{resource.type.toLowerCase().includes("room") ? "▦" : resource.type.toLowerCase().includes("vehicle") ? "↗" : "▤"}</div><div className="resource-info"><strong>{resource.name}</strong><span>{resource.type} · {resource.location}</span><span className="capacity">Capacity: {resource.capacity}{resource._count ? ` · ${resource._count.reservations} bookings` : ""}</span></div><div className="resource-actions"><span className={`mini-status ${resource.isActive ? "on" : "off"}`}>{resource.isActive ? "Active" : "Inactive"}</span><button className="icon-button" title={resource.isActive ? "Deactivate resource" : "Activate resource"} aria-label={resource.isActive ? "Deactivate resource" : "Activate resource"} onClick={() => void toggleResource(resource)}>{resource.isActive ? "Ⅱ" : "▶"}</button></div></div>)}
              {resources.length === 0 && <div className="empty compact">No resources yet. Add your first resource below.</div>}</div>
            <div className="divider"></div>
            <h3 className="form-subtitle">Add a resource</h3>
            <form onSubmit={submitResource} className="form">
              <label>Resource name<input required minLength={2} value={resourceForm.name} onChange={e => setResourceForm({ ...resourceForm, name: e.target.value })} placeholder="e.g. Meeting Room A" /></label>
              <div className="form-row"><label>Type<select value={resourceForm.type} onChange={e => setResourceForm({ ...resourceForm, type: e.target.value })}><option>Meeting Room</option><option>Vehicle</option><option>Equipment</option><option>Workspace</option><option>Other</option></select></label><label>Capacity<input required type="number" min="1" max="10000" value={resourceForm.capacity} onChange={e => setResourceForm({ ...resourceForm, capacity: e.target.value })} /></label></div>
              <label>Location<input required minLength={2} value={resourceForm.location} onChange={e => setResourceForm({ ...resourceForm, location: e.target.value })} placeholder="e.g. Level 2, Building A" /></label>
              <label>Description <span className="optional">(optional)</span><textarea rows={2} maxLength={500} value={resourceForm.description} onChange={e => setResourceForm({ ...resourceForm, description: e.target.value })} placeholder="Any useful details about this resource" /></label>
              <button className="button secondary full" type="submit">＋ Add resource</button>
            </form>
          </section>
        </div>
        <footer>ResourceHub <span>·</span> Resource reservation management <span>·</span> Built for reliable scheduling</footer>
      </div>
    </section>
  </main>;
}
