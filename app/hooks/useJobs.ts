"use client";

import { useState, useMemo } from "react";
import { jobs as initialJobs } from "../data/jobs";
import type { Job } from "../types/job";

export function useJobs(projectId?: string) {
  const [jobs, setJobs] = useState<Job[]>(initialJobs);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [priorityFilter, setpriorityFilter] = useState<string | null>(null);

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const matchesSearch =
        job.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.project.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.jdSummary.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === null || job.status === statusFilter;

      const matchesPriority = priorityFilter === null || job.priority === priorityFilter;

      const matchesProject = projectId === undefined || job.projectId === projectId;

      return matchesSearch && matchesStatus && matchesPriority && matchesProject;
    });
  }, [jobs, searchTerm, statusFilter, priorityFilter, projectId]);

  const addJob = (job: Omit<Job, "id">) => {
    const newJob: Job = {
      ...job,
      id: `job-${Date.now()}`,
    };
    setJobs((prev) => [newJob, ...prev]);
    return newJob;
  };

  const updateJob = (id: string, updates: Partial<Job>) => {
    setJobs((prev) =>
      prev.map((job) =>
        job.id === id ? { ...job, ...updates, statusChangedAt: new Date().toISOString() } : job
      )
    );
  };

  const deleteJob = (id: string) => {
    setJobs((prev) => prev.filter((job) => job.id !== id));
  };

  const getJobById = (id: string) => jobs.find((j) => j.id === id);

  const getJobsByProject = (projectId: string) =>
    jobs.filter((j) => j.projectId === projectId);

  const getJobsByClient = (clientId: string) =>
    jobs.filter((j) => j.clientId === clientId);

  return {
    jobs,
    filteredJobs,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    priorityFilter,
    setpriorityFilter,
    addJob,
    updateJob,
    deleteJob,
    getJobById,
    getJobsByProject,
    getJobsByClient,
  };
}
