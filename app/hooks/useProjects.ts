"use client";

import { useState, useMemo } from "react";
import { projects as initialProjects } from "../data/projects";
import type { Project } from "../types/project";

export function useProjects(clientId?: string) {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const matchesSearch =
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === null || project.status === statusFilter;

      const matchesClient = clientId === undefined || project.clientId === clientId;

      return matchesSearch && matchesStatus && matchesClient;
    });
  }, [projects, searchTerm, statusFilter, clientId]);

  const addProject = (project: Omit<Project, "id" | "createdAt" | "updatedAt">) => {
    const newProject: Project = {
      ...project,
      id: `project-${Date.now()}`,
      createdAt: new Date().toISOString().split("T")[0],
      updatedAt: new Date().toISOString().split("T")[0],
    };
    setProjects((prev) => [newProject, ...prev]);
    return newProject;
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    setProjects((prev) =>
      prev.map((project) =>
        project.id === id
          ? { ...project, ...updates, updatedAt: new Date().toISOString().split("T")[0] }
          : project
      )
    );
  };

  const deleteProject = (id: string) => {
    setProjects((prev) => prev.filter((project) => project.id !== id));
  };

  const getProjectById = (id: string) => projects.find((p) => p.id === id);

  const getProjectsByClient = (clientId: string) =>
    projects.filter((p) => p.clientId === clientId);

  return {
    projects,
    filteredProjects,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    addProject,
    updateProject,
    deleteProject,
    getProjectById,
    getProjectsByClient,
  };
}
