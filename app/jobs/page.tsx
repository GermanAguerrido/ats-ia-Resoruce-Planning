"use client";

import { useState } from "react";
import { ProjectColumn } from "../components/resource-planning/ProjectColumn";
import { ResourcePlanningDetailModal } from "../components/resource-planning/ResourcePlanningDetailModal";
import { resourcePlanningMock as initialProjectColumns } from "../data/resourcePlanningMock";
import type {
  PositionCard as PositionCardType,
  CandidateMini,
  ProjectColumn as ProjectColumnType,
} from "../data/resourcePlanningMock";

export default function JobsPage() {
  const [projectColumns] = useState(initialProjectColumns);
  const [selectedProject, setSelectedProject] = useState<ProjectColumnType | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<{
    position: PositionCardType;
    project: ProjectColumnType;
  } | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<{
    candidate: CandidateMini;
    project: ProjectColumnType;
    position: PositionCardType;
  } | null>(null);

  const activeModalData = selectedCandidate
    ? {
        project: selectedCandidate.project,
        initialPosition: selectedCandidate.position,
        initialCandidate: selectedCandidate.candidate,
      }
    : selectedPosition
      ? {
          project: selectedPosition.project,
          initialPosition: selectedPosition.position,
          initialCandidate: null,
        }
      : selectedProject
        ? {
            project: selectedProject,
            initialPosition: null,
            initialCandidate: null,
          }
        : null;

  return (
    <main className="min-h-screen app-bg">
      {/* Header */}
      <div className="sticky top-0 z-20 border-b px-6 py-4 backdrop-blur-xl app-bg app-border">
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-semibold tracking-tight app-text-primary">
            Resource Planning
          </h1>
          <img
            src="/trick-studios-logo.png.png"
            alt="Trick Studios"
            className="h-10 w-auto"
          />
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto flex max-w-[1600px] flex-col gap-6 px-6 py-6">
        {/* KANBAN BOARD */}
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
            {projectColumns.map((project) => (
              <ProjectColumn
                key={project.id}
                project={project}
                onProjectClick={() => {
                  setSelectedProject(project);
                  setSelectedPosition(null);
                  setSelectedCandidate(null);
                }}
                onPositionClick={(position) => {
                  setSelectedProject(project);
                  setSelectedPosition({ position, project });
                  setSelectedCandidate(null);
                }}
                onCandidateClick={(candidate, position) => {
                  setSelectedProject(project);
                  setSelectedPosition({ position, project });
                  setSelectedCandidate({ candidate, project, position });
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {activeModalData && (
        <ResourcePlanningDetailModal
          project={activeModalData.project}
          initialPosition={activeModalData.initialPosition}
          initialCandidate={activeModalData.initialCandidate}
          onClose={() => {
            setSelectedProject(null);
            setSelectedPosition(null);
            setSelectedCandidate(null);
          }}
        />
      )}
    </main>
  );
}
