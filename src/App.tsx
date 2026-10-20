import { useCallback, useEffect, useMemo, useState } from "react";
import {
  API_BASE_URL,
  createJob,
  fetchHealth,
  fetchJobs,
  fetchJobTypes,
  type HealthResponse,
  type Job,
  type JobType,
} from "./api/client";

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

function pretty(value: unknown) {
  return JSON.stringify(value, null, 2);
}

export default function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [jobTypes, setJobTypes] = useState<JobType[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedType, setSelectedType] = useState("hira_collect");
  const [mode, setMode] = useState("dry-run");
  const [limit, setLimit] = useState(100);
  const [source, setSource] = useState("");
  const [runError, setRunError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const refresh = useCallback(async () => {
    const [healthResult, typeResult, jobResult] = await Promise.allSettled([
      fetchHealth(),
      fetchJobTypes(),
      fetchJobs(),
    ]);

    if (healthResult.status === "fulfilled") {
      setHealth(healthResult.value);
      setHealthError(null);
    } else {
      setHealth(null);
      setHealthError(healthResult.reason?.message || "health check failed");
    }

    if (typeResult.status === "fulfilled") {
      setJobTypes(typeResult.value);
    }

    if (jobResult.status === "fulfilled") {
      setJobs(jobResult.value);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(), 3000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  const selected = useMemo(
    () => jobTypes.find((item) => item.id === selectedType),
    [jobTypes, selectedType],
  );

  async function runJob() {
    setSubmitting(true);
    setRunError(null);

    const params: Record<string, unknown> = { mode };
    if (selectedType === "hira_collect") {
      params.limit = limit;
    }
    if (selectedType === "tour_import") {
      params.source = source;
    }

    try {
      await createJob(selectedType, params);
      await refresh();
    } catch (error) {
      setRunError(error instanceof Error ? error.message : "job creation failed");
    } finally {
      setSubmitting(false);
    }
  }

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
              {healthError ? "not connected" : "checking"}
            </span>
          )}
        </div>
        <div>
          <strong>API URL</strong>
          <code>{API_BASE_URL}</code>
        </div>
      </section>

      <section className="controlPanel">
        <div className="sectionHeading">
          <div>
            <p className="eyebrow">OPERATOR CONTROL</p>
            <h2>Backend Job Runner</h2>
          </div>
          <button className="secondaryButton" onClick={() => void refresh()}>
            Refresh
          </button>
        </div>

        <div className="controlGrid">
          <label>
            Job
            <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
              {jobTypes.map((item) => (
                <option value={item.id} key={item.id}>{item.label}</option>
              ))}
            </select>
          </label>

          <label>
            Mode
            <select value={mode} onChange={(e) => setMode(e.target.value)}>
              <option value="dry-run">dry-run</option>
              <option value="live">live</option>
            </select>
          </label>

          {selectedType === "hira_collect" && (
            <label>
              Limit
              <input
                type="number"
                min={1}
                max={10000}
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
              />
            </label>
          )}

          {selectedType === "tour_import" && (
            <label className="wideField">
              Source
              <input
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="mounted/uploaded source path"
              />
            </label>
          )}
        </div>

        {selected && <p className="helperText">{selected.description}</p>}
        {runError && <p className="errorText">{runError}</p>}

        <button className="runButton" disabled={submitting} onClick={() => void runJob()}>
          {submitting ? "Queueing..." : "Run Job"}
        </button>
      </section>

      <section className="jobsPanel">
        <div className="sectionHeading">
          <div>
            <p className="eyebrow">LIVE JOBS</p>
            <h2>Execution History</h2>
          </div>
        </div>

        <div className="jobList">
          {jobs.length === 0 && <p className="emptyText">No jobs yet.</p>}
          {jobs.map((job) => (
            <article className="jobRow" key={job.id}>
              <div className="jobTop">
                <strong>{job.job_type}</strong>
                <span className={`status job-${job.status}`}>{job.status}</span>
              </div>
              <code>{job.id}</code>
              <details>
                <summary>params / result / error</summary>
                <pre>{pretty({ params: job.params, result: job.result, error: job.error })}</pre>
              </details>
            </article>
          ))}
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
