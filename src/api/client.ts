const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") || "http://localhost:8000";

export type HealthResponse = {
  ok: boolean;
  service: string;
  database: string;
};

export type JobType = {
  id: string;
  label: string;
  description: string;
  params: Record<string, {
    type: "select" | "number" | "text";
    options?: string[];
    default?: string | number;
    min?: number;
    max?: number;
  }>;
};

export type Job = {
  id: string;
  job_type: string;
  status: "queued" | "running" | "succeeded" | "failed";
  params: Record<string, unknown>;
  result: Record<string, unknown> | null;
  error: string | null;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
};

export type HospitalConfig = {
  hira_service_key_configured: boolean;
  hira_endpoint: string;
  beauty_departments: Record<string, string>;
};

export type HospitalStats = {
  total_hospitals: number;
  beauty_hospitals: number;
  plastic_surgery: number;
  dermatology: number;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });

  if (!response.ok) {
    let detail = `HTTP ${response.status}`;
    try {
      const body = await response.json();
      detail = body.detail || detail;
    } catch {
      // ignore JSON parse failure
    }
    throw new Error(detail);
  }

  return response.json() as Promise<T>;
}

export function fetchHealth(): Promise<HealthResponse> {
  return request<HealthResponse>("/health");
}

export function fetchJobTypes(): Promise<JobType[]> {
  return request<JobType[]>("/api/jobs/types");
}

export function fetchJobs(limit = 50): Promise<Job[]> {
  return request<Job[]>(`/api/jobs?limit=${limit}`);
}

export function createJob(
  jobType: string,
  params: Record<string, unknown>,
): Promise<Job> {
  return request<Job>("/api/jobs", {
    method: "POST",
    body: JSON.stringify({
      job_type: jobType,
      params,
    }),
  });
}

export function fetchHospitalConfig(): Promise<HospitalConfig> {
  return request<HospitalConfig>("/api/hospitals/config");
}

export function fetchHospitalStats(): Promise<HospitalStats> {
  return request<HospitalStats>("/api/hospitals/stats");
}

export { API_BASE_URL };
