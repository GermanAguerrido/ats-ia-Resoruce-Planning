"use client";

const dashboardStats = [
  {
    title: "Candidatos",
    value: "124",
    subtitle: "activos",
    accentClassName: "text-sky-500",
  },
  {
    title: "Vacantes",
    value: "18",
    subtitle: "abiertas",
    accentClassName: "text-green-500",
  },
  {
    title: "Interviews",
    value: "32",
    subtitle: "esta semana",
    accentClassName: "text-orange-500",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen app-bg px-8 py-8">
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold app-text-primary">Dashboard</h1>

          <p className="mt-3 text-lg app-text-secondary">
            Recruiter Intelligence Overview
          </p>
        </div>

        <div className="flex flex-wrap gap-6">
          {dashboardStats.map((stat) => (
            <div
              key={stat.title}
              className="w-full rounded-2xl border p-5 shadow-sm md:w-64 app-card"
            >
              <p className="text-lg font-semibold app-text-primary">
                {stat.title}
              </p>

              <p className={`mt-5 text-3xl font-bold ${stat.accentClassName}`}>
                {stat.value}
              </p>

              <p className="mt-1 text-base app-text-secondary">
                {stat.subtitle}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}