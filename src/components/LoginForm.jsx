import { useState } from "react";
import { logIn } from "../supabase.js";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await logIn(email.trim(), password);
    } catch (err) {
      setError(err.message === "Invalid login credentials" ? "Wrong email or password." : err.message);
      setBusy(false);
    }
  }

  return (
    <form className="login" onSubmit={submit}>
      <h1>Log in</h1>
      <p className="lede">Log in to use the exercise library and your lists.</p>
      <label>
        Email
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
               autoComplete="username" required />
      </label>
      <label>
        Password
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
               autoComplete="current-password" required />
      </label>
      {error && <p className="error" role="alert">{error}</p>}
      <button className="chip primary big" disabled={busy}>{busy ? "Logging in…" : "Log in"}</button>
    </form>
  );
}
