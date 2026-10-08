import { useCallback, useEffect, useState } from "react";
import TaskList from "./TaskList";
import ProgressBar from "./ProgressBar";
import Navbar from "./Navbar";
import AddTaskForm from "./AddTaskForm";
import Profile from "./Profile";
import "./App.css";

const TASKS_API_URL = "https://testapi.io/api/DwzLiT/resource/tasklist";
const AUTH_API_URL = "https://testapi.io/api/DwzLiT/resource/auth";

async function readApiResponse(response) {
  if (response.status === 204) return null;
  const body = await response.text();
  if (!response.ok) {
    let message = body;
    try {
      const errorData = JSON.parse(body);
      message = errorData.message || errorData.error || body;
    } catch {
      // Jei atsakymas nėra JSON, rodom jo tekstą.
    }
    throw new Error(`Serverio klaida (${response.status})${message ? `: ${message}` : "."}`);
  }
  if (!body) return null;
  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
}

function getApiTasks(data) {
  const rows = Array.isArray(data)
    ? data
    : Array.isArray(data?.data)
      ? data.data
      : Array.isArray(data?.items)
        ? data.items
        : data && typeof data === "object"
          ? [data]
          : [];
  return rows
    .filter((task) => task?.id != null && typeof task.title === "string")
    .map((task) => ({ ...task, status: task.status || "Nepradėta", deadline: task.deadline || "" }));
}

function getApiUsers(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  return data && typeof data === "object" ? [data] : [];
}

function App() {
  const [loggedInUsername, setLoggedInUsername] = useState("");
  const user = loggedInUsername === "demo"
    ? { name: "Demo naudotojas", email: "demo" }
    : { name: "Test", email: "jonas@flowly.lt" };
  const [activePage, setActivePage] = useState("home");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [tasksError, setTasksError] = useState("");

  const loadTasks = useCallback(async () => {
    setTasksLoading(true);
    setTasksError("");
    try {
      const response = await fetch(TASKS_API_URL);
      setTasks(getApiTasks(await readApiResponse(response)));
    } catch (error) {
      setTasksError(error.message || "Nepavyko įkelti užduočių.");
    } finally {
      setTasksLoading(false);
    }
  }, []);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  const completedTasks = tasks.filter((task) => task.status === "Atlikta").length;
  const progress = tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0;

  async function handleSubmit(event) {
    event.preventDefault();
    setLoginError("");

    try {
      const response = await fetch(AUTH_API_URL);
      const users = getApiUsers(await readApiResponse(response));
      let matchingUser = users.find((user) =>
        user.username === email && user.password === password,
      );

      const builtInUsers = {
        admin: "admin",
        demo: "demo",
      };

      if (!matchingUser && builtInUsers[email] === password) {
        const createResponse = await fetch(AUTH_API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: email, password: builtInUsers[email] }),
        });
        matchingUser = await readApiResponse(createResponse);
        if (!matchingUser?.username) {
          const refreshResponse = await fetch(AUTH_API_URL);
          const refreshedUsers = getApiUsers(await readApiResponse(refreshResponse));
          matchingUser = refreshedUsers.find((user) =>
            user.username === email && user.password === password,
          );
        }
      }

      if (!matchingUser) {
        setLoginError("Neteisingas vartotojo vardas arba slaptažodis.");
        return;
      }

      setIsLoggedIn(true);
      setLoggedInUsername(matchingUser.username);
    } catch (error) {
      setLoginError(error.message || "Nepavyko patikrinti prisijungimo duomenų.");
    }
  }

  async function handleAddTask(newTask) {
    setTasksError("");
    try {
      const response = await fetch(TASKS_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTask.title, status: newTask.status, deadline: newTask.deadline }),
      });
      await readApiResponse(response);
      await loadTasks();
    } catch (error) {
      setTasksError(error.message || "Nepavyko išsaugoti užduoties.");
      throw error;
    }
  }

  async function handleUpdateTask(taskId, updates) {
    setTasksError("");
    const currentTask = tasks.find((task) => task.id === taskId);
    if (!currentTask) return;
    const updatedTask = { ...currentTask, ...updates };
    try {
      const response = await fetch(`${TASKS_API_URL}/${encodeURIComponent(taskId)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: updatedTask.title, status: updatedTask.status, deadline: updatedTask.deadline }),
      });
      await readApiResponse(response);
      await loadTasks();
    } catch (error) {
      setTasksError(error.message || "Nepavyko atnaujinti užduoties.");
      throw error;
    }
  }

  async function handleDeleteTask(taskId) {
    setTasksError("");
    try {
      const response = await fetch(`${TASKS_API_URL}/${encodeURIComponent(taskId)}`, { method: "DELETE" });
      await readApiResponse(response);
      await loadTasks();
    } catch (error) {
      setTasksError(error.message || "Nepavyko ištrinti užduoties.");
    }
  }

  return (
    <>
      <Navbar activePage={activePage} onNavigate={setActivePage} />
      {activePage === "home" && (
        <>
          {isLoggedIn && <header className="welcome-message"><h1>Sveiki sugrįžę!</h1><p>Prisijungėte kaip admin.</p></header>}
          <main className="login-page">
            {tasksError && <p className="task-api-error" role="alert">{tasksError}</p>}
            {!isLoggedIn && (
              <div className="login-card">
                <header className="login-card__header"><h1>Prisijungti</h1><p>Įveskite savo duomenis, kad tęstumėte</p></header>
                <form className="login-form" onSubmit={handleSubmit}>
                  <label className="login-field"><span>Vartotojo vardas</span><input type="text" name="username" autoComplete="username" placeholder="admin" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
                  <label className="login-field"><span>Slaptažodis</span><input type="password" name="password" autoComplete="current-password" placeholder="••••••••" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
                  <button type="submit" className="login-submit">Prisijungti</button>
                  {loginError && <p className="login-error" role="alert">{loginError}</p>}
                </form>
              </div>
            )}
            {isLoggedIn && (
              <>
                <section className="dashboard-summary" aria-label="Užduočių suvestinė">
                  <p><strong>{tasks.length} užduotys</strong><span aria-hidden="true">·</span><strong>{completedTasks} atliktos</strong><span aria-hidden="true">·</span><strong>{progress}% progresas</strong></p>
                </section>
                <TaskList tasks={tasks} loading={tasksLoading} onRefresh={loadTasks} onUpdate={handleUpdateTask} onDelete={handleDeleteTask} />
                <AddTaskForm onAddTask={handleAddTask} />
                <ProgressBar initialProgress={progress} />
              </>
            )}
          </main>
        </>
      )}
      {activePage === "profile" && <Profile user={user} tasks={tasks} />}
    </>
  );
}

export default App;
