"use client";

import { useState, useMemo } from "react";
import { clients as initialClients } from "../data/clients";
import type { Client } from "../types/client";

export function useClients() {
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      const matchesSearch =
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.description.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === null || client.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [clients, searchTerm, statusFilter]);

  const addClient = (client: Omit<Client, "id" | "createdAt" | "updatedAt">) => {
    const newClient: Client = {
      ...client,
      id: `client-${Date.now()}`,
      createdAt: new Date().toISOString().split("T")[0],
      updatedAt: new Date().toISOString().split("T")[0],
    };
    setClients((prev) => [newClient, ...prev]);
    return newClient;
  };

  const updateClient = (id: string, updates: Partial<Client>) => {
    setClients((prev) =>
      prev.map((client) =>
        client.id === id
          ? { ...client, ...updates, updatedAt: new Date().toISOString().split("T")[0] }
          : client
      )
    );
  };

  const deleteClient = (id: string) => {
    setClients((prev) => prev.filter((client) => client.id !== id));
  };

  const getClientById = (id: string) => clients.find((c) => c.id === id);

  return {
    clients,
    filteredClients,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    addClient,
    updateClient,
    deleteClient,
    getClientById,
  };
}
