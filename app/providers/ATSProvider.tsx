"use client";

import React, { createContext, useContext, useState } from "react";
import type { Client } from "../types/client";
import type { Project } from "../types/project";

interface ATSContextType {
  selectedClient: Client | null;
  setSelectedClient: (client: Client | null) => void;
  selectedProject: Project | null;
  setSelectedProject: (project: Project | null) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const ATSContext = createContext<ATSContextType | undefined>(undefined);

export function ATSProvider({ children }: { children: React.ReactNode }) {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <ATSContext.Provider
      value={{
        selectedClient,
        setSelectedClient,
        selectedProject,
        setSelectedProject,
        sidebarOpen,
        setSidebarOpen,
      }}
    >
      {children}
    </ATSContext.Provider>
  );
}

export function useATS() {
  const context = useContext(ATSContext);
  if (context === undefined) {
    throw new Error("useATS must be used within an ATSProvider");
  }
  return context;
}
