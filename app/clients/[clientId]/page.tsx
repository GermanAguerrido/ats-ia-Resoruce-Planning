"use client";

import { useParams, useRouter } from "next/navigation";
import { useClients } from "../../hooks/useClients";
import { useProjects } from "../../hooks/useProjects";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.clientId as string;

  const { getClientById } = useClients();
  const { getProjectsByClient } = useProjects();

  const client = getClientById(clientId);
  const projects = getProjectsByClient(clientId);

  if (!client) {
    return (
      <main className="min-h-screen app-bg">
        <div className="mx-auto max-w-[1600px] px-6 py-6">
          <div className="flex items-center justify-center py-20">
            <p className="text-lg app-text-muted">Client not found</p>
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
                Client Details
              </p>
              <h1 className="mt-2 text-4xl font-semibold tracking-tight app-text-primary">
                {client.name}
              </h1>
            </div>
          </div>
        </div>

        {/* Client Info */}
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-xl border p-6 app-card">
            <p className="text-xs app-text-muted">Status</p>
            <p className="mt-2 text-lg font-semibold app-text-primary">{client.status}</p>
          </div>

          <div className="rounded-xl border p-6 app-card">
            <p className="text-xs app-text-muted">Country</p>
            <p className="mt-2 text-lg font-semibold app-text-primary">{client.country}</p>
          </div>

          <div className="rounded-xl border p-6 app-card">
            <p className="text-xs app-text-muted">Email</p>
            <p className="mt-2 text-lg font-semibold app-text-primary">{client.contactEmail}</p>
          </div>
        </div>

        {/* Description */}
        <div className="rounded-xl border p-6 app-card">
          <p className="text-xs app-text-muted">Description</p>
          <p className="mt-2 text-sm app-text-secondary">{client.description}</p>
        </div>

        {/* Projects Section */}
        <div>
          <h2 className="text-2xl font-semibold app-text-primary mb-4">Projects</h2>

          {projects.length === 0 ? (
            <div className="rounded-xl border p-8 text-center app-card">
              <p className="app-text-muted">No projects for this client</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <Link key={project.id} href={`/projects/${project.id}`}>
                  <div className="group cursor-pointer rounded-xl border p-6 transition-all hover:border-blue-500 hover:shadow-lg app-card">
                    <h3 className="text-lg font-semibold app-text-primary">{project.name}</h3>
                    <p className="mt-2 text-sm app-text-secondary">{project.description}</p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {project.technologies.slice(0, 3).map((tech) => (
                        <span
                          key={tech}
                          className="inline-block px-2 py-1 rounded text-xs bg-blue-500/20 text-blue-400"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                          project.status === "active"
                            ? "bg-green-500/20 text-green-400"
                            : project.status === "completed"
                              ? "bg-blue-500/20 text-blue-400"
                              : "bg-gray-500/20 text-gray-400"
                        }`}
                      >
                        {project.status}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
