import { useEffect, useState } from "react";
import { API_BASE_URL, fetchHealth, type HealthResponse } from "./api/client";

const modules = [
  {
    title: "AI K-Beauty Consultation",
    description: "Face/video + conversation + long-term beauty profile",
    status: "next",
  },
  {
    title: "Beauty Shopping",
    description: "Migrate selected product and commerce modules from the existing tourism project",
    status: "planned",
  },
  {
    title: "Hospitals & Procedures",
    description: "HIRA master data with beauty-specific hospital/procedure enrichment",
    status: "planned",
  },
  {
    title: "Beauty Stay & Mobility",
    description: "Stay, airport pickup, delivery and Korea concierge functions",
    status: "planned",
  },
];

export default function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);

  useEffect(() => {
    fetchHealth()
      .then((value) => {
        setHealth(value);
        setHealthError(null);
      })
      .catch((error: Error) => {
        setHealth(null);
        setHealthError(error.message);
      });
  }, []);

  return (
    <main className="page">
      <section className="hero">
        <p className="eyebrow">AI CONSULTATION PLATFORM</p>
        <h1>AI Consult Beauty</h1>
        <p className="lead">
          K-Beauty consultation first, with commerce, hospitals, stay and mobility connected as action layers.
        </p>
      </section>

      <section className="statusPanel">
        <div>
          <strong>Frontend</strong>
          <span className="status ok">running</span>
        </div>
        <div>
          <strong>API</strong>
          {health ? (
            <span className="status ok">{health.service} / DB {health.database}</span>
          ) : (
            <span className="status pending">
              {healthError ? "not connected yet" : "checking"}
            </span>
          )}
        </div>
        <div>
          <strong>API URL</strong>
          <code>{API_BASE_URL}</code>
        </div>
      </section>

      <section className="grid">
        {modules.map((module) => (
          <article className="card" key={module.title}>
            <span className="badge">{module.status}</span>
            <h2>{module.title}</h2>
            <p>{module.description}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
