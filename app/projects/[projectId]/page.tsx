"use client";

import { useParams, useRouter } from "next/navigation";
import { useProjects } from "../../hooks/useProjects";
import { useJobs } from "../../hooks/useJobs";
import { useClients } from "../../hooks/useClients";
import { ChevronLeft } from "lucide-react";

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;

  const { getProjectById } = useProjects();
  const { getJobsByProject } = useJobs();
  const { getClientById } = useClients();

  const project = getProjectById(projectId);
  const jobs = getJobsByProject(projectId);
  const client = project ? getClientById(project.clientId) : null;

  if (!project) {
    return (
      <main className="min-h-screen app-bg">
        <div className="mx-auto max-w-[1600px] px-6 py-6">
          <div className="flex items-center justify-center py-20">
            <p className="text-lg app-text-muted">Project not found</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen app-bg">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-6 px-6 py-6">
        {/* Header */}
        <div className="sticky top-0 z-20 -mx-6 border-b px-6 pb-6 pt-2 backdrop-blur-xl app-bg app-border">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="rounded-lg p-2 transition hover:bg-gray-500/20"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <div className="flex-1">
              <p className="text-xs font-medium uppercase tracking-[0.2em] app-text-muted">
                Project Details
              </p>
              <h1 className="mt-2 text-4xl font-semibold tracking-tight app-text-primary">
                {project.name}
              </h1>
              <p className="mt-1 text-sm app-text-secondary">{client?.name}</p>
            </div>
          </div>
        </div>

        {/* Project Info */}
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-xl border p-6 app-card">
            <p className="text-xs app-text-muted">Status</p>
            <p className="mt-2 text-lg font-semibold app-text-primary">{project.status}</p>
          </div>

          <div className="rounded-xl border p-6 app-card">
            <p className="text-xs app-text-muted">Start Date</p>
            <p className="mt-2 text-lg font-semibold app-text-primary">{project.startDate}</p>
          </div>

          <div className="rounded-xl border p-6 app-card">
            <p className="text-xs app-text-muted">Open Positions</p>
            <p className="mt-2 text-lg font-semibold app-text-primary">
              {jobs.filter((j) => j.status === "open").length}
            </p>
          </div>
        </div>

        {/* Description */}
        <div className="rounded-xl border p-6 app-card">
          <p className="text-xs app-text-muted">Description</p>
          <p className="mt-2 text-sm app-text-secondary">{project.description}</p>
        </div>

        {/* Technologies */}
        <div className="rounded-xl border p-6 app-card">
          <p className="text-xs app-text-muted mb-3">Technologies</p>
          <div className="flex flex-wrap gap-2">
            {project.technologies.map((tech) => (
              <span
                key={tech}
                className="inline-block px-3 py-1 rounded-full text-sm bg-blue-500/20 text-blue-400 font-medium"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>

        {/* Jobs Section */}
        <div>
          <h2 className="text-2xl font-semibold app-text-primary mb-4">Open Positions</h2>

          {jobs.length === 0 ? (
            <div className="rounded-xl border p-8 text-center app-card">
              <p className="app-text-muted">No positions for this project</p>
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => (
                <div key={job.id} className="rounded-xl border p-6 app-card">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold app-text-primary">{job.position}</h3>
                      <p className="mt-1 text-sm app-text-secondary">{job.jdSummary}</p>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {job.requiredSkills.map((skill) => (
                          <span
                            key={skill}
                            className="inline-block px-2 py-1 rounded text-xs bg-green-500/20 text-green-400"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>

                      <div className="mt-4 flex gap-4 text-sm">
                        <span className="app-text-muted">
                          <strong>Seniority:</strong> {job.seniority}
                        </span>
                        <span className="app-text-muted">
                          <strong>Quantity:</strong> {job.quantity}
                        </span>
                        <span className="app-text-muted">
                          <strong>Priority:</strong> {job.priority}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                        job.status === "open"
                          ? "bg-green-500/20 text-green-400"
                          : job.status === "completed"
                            ? "bg-blue-500/20 text-blue-400"
                            : job.status === "on_hold"
                              ? "bg-yellow-500/20 text-yellow-400"
                              : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {job.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
