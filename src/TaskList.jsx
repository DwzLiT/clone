import { useState } from "react";
import "./TaskList.css";

const STATUSES = ["Nepradėta", "Vykdoma", "Atlikta"];

function TaskList({ tasks = [], loading = false, onRefresh, onUpdate, onDelete }) {
  const [editingId, setEditingId] = useState(null);
  const [editedTitle, setEditedTitle] = useState("");
  const [savingId, setSavingId] = useState(null);

  async function updateTask(taskId, updates) {
    setSavingId(taskId);
    try {
      await onUpdate?.(taskId, updates);
    } finally {
      setSavingId(null);
    }
  }

  async function saveTitle(task) {
    const title = editedTitle.trim();
    if (!title || title === task.title) {
      setEditingId(null);
      return;
    }
    try {
      await updateTask(task.id, { title });
      setEditingId(null);
    } catch {
      // Klaida rodoma pagrindinėje API klaidos vietoje.
    }
  }

  return (
    <section className="task-card">
      <header className="task-card__header">
        <div>
          <h2>Užduotys</h2>
          <p>Artimiausi darbai ir jų būsena</p>
        </div>
        <button className="task-action" type="button" onClick={onRefresh} disabled={loading}>
          {loading ? "Kraunama..." : "Atnaujinti"}
        </button>
      </header>
      {loading ? (
        <p className="task-state">Kraunamos užduotys...</p>
      ) : tasks.length === 0 ? (
        <p className="task-state">Užduočių kol kas nėra.</p>
      ) : (
        <div className="task-list">
          {tasks.map((task) => (
            <article className="task-item" key={task.id}>
              {editingId === task.id ? (
                <form className="task-edit-form" onSubmit={(event) => { event.preventDefault(); saveTitle(task); }}>
                  <label className="task-edit-field">
                    <span className="visually-hidden">Užduoties pavadinimas</span>
                    <input autoFocus value={editedTitle} onChange={(event) => setEditedTitle(event.target.value)} required />
                  </label>
                  <div className="task-actions">
                    <button className="task-action task-action--save" type="submit" disabled={savingId === task.id}>Išsaugoti</button>
                    <button className="task-action" type="button" onClick={() => setEditingId(null)}>Atšaukti</button>
                  </div>
                </form>
              ) : (
                <div className="task-item__top">
                  <h3>{task.title}</h3>
                  <div className="task-actions">
                    <button className="task-action" type="button" onClick={() => { setEditedTitle(task.title); setEditingId(task.id); }}>Pavadinimą keisti</button>
                    <button className="task-action task-action--delete" type="button" onClick={() => onDelete?.(task.id)} disabled={savingId === task.id}>Ištrinti</button>
                  </div>
                </div>
              )}
              <div className="task-details">
                <label className="task-detail-field">
                  <span>Statusas</span>
                  <select
                    value={task.status}
                    onChange={(event) => updateTask(task.id, { status: event.target.value }).catch(() => {})}
                    disabled={savingId === task.id}
                  >
                    {STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
                  </select>
                </label>
                <label className="task-detail-field">
                  <span>Terminas</span>
                  <input
                    type="date"
                    value={task.deadline}
                    onChange={(event) => updateTask(task.id, { deadline: event.target.value }).catch(() => {})}
                    disabled={savingId === task.id}
                  />
                </label>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default TaskList;
