"use client";

import { useProjects } from "../hooks/useProjects";
import { useClients } from "../hooks/useClients";
import { useATS } from "../providers/ATSProvider";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export default function ProjectsPage() {
  const { filteredClients } = useClients();
  const { filteredProjects, searchTerm, setSearchTerm, statusFilter, setStatusFilter } =
    useProjects();
  const { setSelectedProject } = useATS();

  const statusOptions = ["All", "active", "inactive", "completed", "on_hold", "planning"];

  return (
    <main className="min-h-screen app-bg">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-6 px-6 py-6">
        {/* Header */}
        <div className="sticky top-0 z-20 -mx-6 border-b px-6 pb-6 pt-2 backdrop-blur-xl app-bg app-border">
          <div className="flex flex-col gap-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.2em] app-text-muted">
                  Recruiting Management
                </p>
                <h1 className="mt-2 text-4xl font-semibold tracking-tight app-text-primary">
                  Projects
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 app-text-secondary">
                  View all projects, their status, and associated jobs.
                </p>
              </div>

              <div className="hidden items-center gap-3 lg:flex">
                <div className="rounded-xl border px-4 py-3 app-card">
                  <p className="text-xs app-text-muted">Total Projects</p>
                  <p className="mt-1 text-xl font-semibold app-text-primary">
                    {filteredProjects.length}
                  </p>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="flex gap-3 flex-wrap">
              <input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 min-w-[250px] rounded-lg border px-4 py-2 text-sm app-border app-bg app-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <select
                value={statusFilter || "All"}
                onChange={(e) =>
                  setStatusFilter(e.target.value === "All" ? null : e.target.value)
                }
                className="rounded-lg border px-4 py-2 text-sm app-border app-bg app-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {statusOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Projects Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => {
            const client = filteredClients.find((c) => c.id === project.clientId);

            return (
              <Link key={project.id} href={`/projects/${project.id}`}>
                <div
                  className="group cursor-pointer rounded-xl border p-6 transition-all hover:border-blue-500 hover:shadow-lg app-card"
                  onClick={() => setSelectedProject(project)}
                >
                  <div className="flex flex-col gap-3">
                    <div>
                      <p className="text-xs app-text-muted">{client?.name || "Unknown Client"}</p>
                      <h3 className="mt-1 text-lg font-semibold app-text-primary">
                        {project.name}
                      </h3>
                      <p className="mt-1 text-sm app-text-secondary">{project.description}</p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {project.technologies.map((tech) => (
                        <span
                          key={tech}
                          className="inline-block px-2 py-1 rounded text-xs bg-blue-500/20 text-blue-400"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                          project.status === "active"
                            ? "bg-green-500/20 text-green-400"
                            : project.status === "completed"
                              ? "bg-blue-500/20 text-blue-400"
                              : project.status === "on_hold"
                                ? "bg-yellow-500/20 text-yellow-400"
                                : project.status === "planning"
                                  ? "bg-purple-500/20 text-purple-400"
                                  : "bg-gray-500/20 text-gray-400"
                        }`}
                      >
                        {project.status}
                      </span>

                      <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1 app-text-muted" />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {filteredProjects.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-lg app-text-muted">No projects found</p>
          </div>
        )}
      </div>
    </main>
  );
}
