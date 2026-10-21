import { useCallback, useEffect, useState } from "react";
import {
  API_BASE_URL,
  createJob,
  fetchHealth,
  fetchHospitalConfig,
  fetchHospitalStats,
  fetchJobs,
  fetchJobTypes,
  type HealthResponse,
  type HospitalConfig,
  type HospitalStats,
  type Job,
  type JobType,
} from "./api/client";

function pretty(value: unknown) {
  return JSON.stringify(value, null, 2);
}

export default function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [jobTypes, setJobTypes] = useState<JobType[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [hospitalConfig, setHospitalConfig] = useState<HospitalConfig | null>(null);
  const [hospitalStats, setHospitalStats] = useState<HospitalStats | null>(null);

  const [selectedType, setSelectedType] = useState("hira_collect");
  const [mode, setMode] = useState("dry-run");
  const [preset, setPreset] = useState("beauty");
  const [departmentCode, setDepartmentCode] = useState("14");
  const [sidoCd, setSidoCd] = useState("");
  const [sgguCd, setSgguCd] = useState("");
  const [hospitalName, setHospitalName] = useState("");
  const [limit, setLimit] = useState(1000);
  const [source, setSource] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const results = await Promise.allSettled([
      fetchHealth(),
      fetchJobTypes(),
      fetchJobs(),
      fetchHospitalConfig(),
      fetchHospitalStats(),
    ]);

    if (results[0].status === "fulfilled") setHealth(results[0].value);
    if (results[1].status === "fulfilled") setJobTypes(results[1].value);
    if (results[2].status === "fulfilled") setJobs(results[2].value);
    if (results[3].status === "fulfilled") setHospitalConfig(results[3].value);
    if (results[4].status === "fulfilled") setHospitalStats(results[4].value);
  }, []);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(), 3000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  async function runJob() {
    setSubmitting(true);
    setRunError(null);

    let params: Record<string, unknown>;

    if (selectedType === "hira_collect") {
      params = {
        mode,
        preset,
        dgsbjt_cd: preset === "single" ? departmentCode : "",
        sido_cd: sidoCd,
        sggu_cd: sgguCd,
        yadm_nm: hospitalName,
        limit,
        page_size: Math.min(limit, 1000),
      };
    } else {
      params = {
        mode,
        source,
      };
    }

    try {
      await createJob(selectedType, params);
      await refresh();
    } catch (error) {
      setRunError(error instanceof Error ? error.message : "작업 등록 실패");
    } finally {
      setSubmitting(false);
    }
  }

  const liveBlocked =
    selectedType === "hira_collect" &&
    mode === "live" &&
    hospitalConfig?.hira_service_key_configured === false;

  return (
    <main className="page">
      <section className="hero">
        <p className="eyebrow">AI CONSULT BEAUTY / OPERATOR</p>
        <h1>K-Beauty Data Control</h1>
        <p className="lead">
          심평원 병원 Master 수집부터 기존 Tour 데이터 이관까지 프론트에서 작업을 실행하고 결과를 추적합니다.
        </p>
      </section>

      <section className="statusPanel">
        <div>
          <strong>Frontend</strong>
          <span className="status ok">ONLINE</span>
        </div>
        <div>
          <strong>Backend / DB</strong>
          <span className={`status ${health?.database === "ok" ? "ok" : "pending"}`}>
            {health ? `${health.service} / DB ${health.database}` : "checking"}
          </span>
        </div>
        <div>
          <strong>HIRA API Key</strong>
          <span className={`status ${hospitalConfig?.hira_service_key_configured ? "ok" : "pending"}`}>
            {hospitalConfig?.hira_service_key_configured ? "CONFIGURED" : "NOT CONFIGURED"}
          </span>
        </div>
        <div>
          <strong>API</strong>
          <code>{API_BASE_URL}</code>
        </div>
      </section>

      <section className="statsGrid">
        <article>
          <span>전체 병원</span>
          <strong>{hospitalStats?.total_hospitals ?? 0}</strong>
        </article>
        <article>
          <span>Beauty 병원 합계</span>
          <strong>{hospitalStats?.beauty_hospitals ?? 0}</strong>
        </article>
        <article>
          <span>성형외과 08</span>
          <strong>{hospitalStats?.plastic_surgery ?? 0}</strong>
        </article>
        <article>
          <span>피부과 14</span>
          <strong>{hospitalStats?.dermatology ?? 0}</strong>
        </article>
      </section>

      <section className="controlPanel">
        <div className="sectionHeading">
          <div>
            <p className="eyebrow">EXECUTION</p>
            <h2>Backend Job Runner</h2>
          </div>
          <button className="secondaryButton" onClick={() => void refresh()}>
            새로고침
          </button>
        </div>

        <div className="controlGrid">
          <label>
            작업
            <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
              {jobTypes.map((item) => (
                <option value={item.id} key={item.id}>{item.label}</option>
              ))}
            </select>
          </label>

          <label>
            실행모드
            <select value={mode} onChange={(e) => setMode(e.target.value)}>
              <option value="dry-run">dry-run</option>
              <option value="live">live</option>
            </select>
          </label>

          {selectedType === "hira_collect" && (
            <>
              <label>
                수집범위
                <select value={preset} onChange={(e) => setPreset(e.target.value)}>
                  <option value="beauty">Beauty 전체: 성형외과 + 피부과</option>
                  <option value="single">진료과목 1개</option>
                </select>
              </label>

              {preset === "single" && (
                <label>
                  진료과목 코드
                  <select value={departmentCode} onChange={(e) => setDepartmentCode(e.target.value)}>
                    <option value="08">08 성형외과</option>
                    <option value="14">14 피부과</option>
                  </select>
                </label>
              )}

              <label>
                시도 코드
                <input
                  value={sidoCd}
                  onChange={(e) => setSidoCd(e.target.value)}
                  placeholder="예: 110000 / 비우면 전국"
                />
              </label>

              <label>
                시군구 코드
                <input
                  value={sgguCd}
                  onChange={(e) => setSgguCd(e.target.value)}
                  placeholder="비우면 전체"
                />
              </label>

              <label>
                병원명 검색
                <input
                  value={hospitalName}
                  onChange={(e) => setHospitalName(e.target.value)}
                  placeholder="선택 입력"
                />
              </label>

              <label>
                진료과목당 최대 수집건수
                <input
                  type="number"
                  min={1}
                  max={100000}
                  value={limit}
                  onChange={(e) => setLimit(Number(e.target.value))}
                />
              </label>
            </>
          )}

          {selectedType === "tour_import" && (
            <label className="wideField">
              원본 경로
              <input
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="업로드 또는 연결된 tour/touranal 원본"
              />
            </label>
          )}
        </div>

        {liveBlocked && (
          <p className="errorText">
            live 수집을 실행하려면 Railway beauty-api/beauty-worker에 HIRA_API_KEY가 설정되어야 합니다.
          </p>
        )}
        {runError && <p className="errorText">{runError}</p>}

        <button
          className="runButton"
          disabled={submitting || liveBlocked}
          onClick={() => void runJob()}
        >
          {submitting ? "작업 등록 중..." : "실행"}
        </button>
      </section>

      <section className="jobsPanel">
        <div className="sectionHeading">
          <div>
            <p className="eyebrow">EXECUTION HISTORY</p>
            <h2>실행 결과 / 로그</h2>
          </div>
        </div>

        <div className="jobList">
          {jobs.length === 0 && <p className="emptyText">아직 실행 작업이 없습니다.</p>}
          {jobs.map((job) => (
            <article className="jobRow" key={job.id}>
              <div className="jobTop">
                <strong>{job.job_type}</strong>
                <span className={`status job-${job.status}`}>{job.status}</span>
              </div>
              <code>{job.id}</code>
              <details open={job.status === "failed"}>
                <summary>입력값 / 결과 / 오류</summary>
                <pre>{pretty({ params: job.params, result: job.result, error: job.error })}</pre>
              </details>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
