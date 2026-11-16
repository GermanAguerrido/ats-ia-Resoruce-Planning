"use client";

import { useState } from "react";

import { pushNotification } from "@/app/lib/notifications";
import {
  MONTH_NAMES,
  addMonths,
  REQUEST_STATUS_LABELS,
  defaultRate,
  hireBillingState,
  monthLabel,
  requestTotal,
  updateBilling,
  type BillingRate,
  type BillingRequest,
  type BillingState,
  type Hire,
} from "@/app/lib/consultora";
import { Tag } from "../candidates/CandidatesStyles";
import { DialogFrame, FIELD_CLASS, FieldLabel } from "../resource-planning/DialogFrame";

const RATE_LABELS: Record<BillingRate, string> = { standard: "Standard", lead: "LEAD" };

function fmt(date?: string) {
  return date
    ? new Date(`${date.slice(0, 10)}T00:00:00`).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    : "—";
}

function money(value: number | null) {
  return value === null ? "—" : `USD ${value.toLocaleString("en-US")}`;
}

function statusTone(status: BillingRequest["status"]) {
  return status === "invoiced" ? "green" : status === "approved" ? "blue" : status === "rejected" ? "red" : "amber";
}

function notifyAll(names: string[], from: string, text: string, state: "pending" | "info") {
  names
    .filter((name) => name !== from)
    .forEach((name) =>
      pushNotification({
        to: name,
        from,
        kind: "info",
        state,
        text,
        href: "/consultora?tab=billing",
      })
    );
}

function HiresTable({ hires, billing, action }: { hires: Hire[]; billing: BillingState; action?: (hire: Hire) => React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-2xl border app-border app-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[11px] uppercase tracking-wide app-text-muted">
            <th className="px-4 py-2.5 font-semibold">Candidate</th>
            <th className="px-4 py-2.5 font-semibold">Role</th>
            <th className="px-4 py-2.5 font-semibold">Start date</th>
            <th className="px-4 py-2.5 font-semibold">3 months</th>
            <th className="px-4 py-2.5 font-semibold">Status</th>
            {action && <th className="px-4 py-2.5" />}
          </tr>
        </thead>

        <tbody>
          {hires.map((hire) => {
            const state = hireBillingState(hire, billing);

            return (
              <tr key={hire.candidate.id} className="border-t app-border">
                <td className="px-4 py-2.5 font-semibold app-text-primary">
                  {hire.candidate.name}
                  <p className="text-xs font-normal app-text-muted">{hire.candidate.consultora}</p>
                </td>
                <td className="px-4 py-2.5 app-text-secondary">
                  {hire.position.title}
                  <p className="text-xs app-text-muted">{hire.position.seniority}</p>
                </td>
                <td className="px-4 py-2.5 text-xs app-text-secondary">{fmt(hire.candidate.startDate)}</td>
                <td className="px-4 py-2.5 text-xs app-text-secondary">
                  {fmt(addMonths(hire.candidate.startDate ?? "", 3))}
                </td>
                <td className="px-4 py-2.5">
                  {state.kind === "not_billable" && <Tag tone="red" small>Not billable</Tag>}
                  {state.kind === "in_request" && (
                    <Tag tone={statusTone(state.request.status)} small>
                      {monthLabel(state.request.month, state.request.year)} · {REQUEST_STATUS_LABELS[state.request.status]}
                    </Tag>
                  )}
                  {state.kind === "eligible" && <Tag tone="violet" small>Eligible</Tag>}
                  {state.kind === "guarantee" && (
                    <>
                      <Tag tone="gray" small>In guarantee</Tag>
                      <p className="mt-0.5 text-xs app-text-muted">{state.daysLeft} days left</p>
                    </>
                  )}
                </td>
                {action && <td className="px-4 py-2.5 text-right">{action(hire)}</td>}
              </tr>
            );
          })}

          {hires.length === 0 && (
            <tr>
              <td colSpan={action ? 6 : 5} className="px-4 py-8 text-center text-sm app-text-muted">
                No hires with a start date yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// ---------- Solicitud de la consultora ----------
function RequestDialog({
  eligible,
  company,
  user,
  talents,
  onClose,
}: {
  eligible: Hire[];
  company: string;
  user: string;
  talents: string[];
  onClose: () => void;
}) {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [picked, setPicked] = useState<Record<string, BillingRate>>({});

  const toggle = (hire: Hire) =>
    setPicked((current) => {
      const next = { ...current };

      if (next[hire.candidate.id]) {
        delete next[hire.candidate.id];
      } else {
        next[hire.candidate.id] = defaultRate(hire);
      }

      return next;
    });

  const submit = () => {
    const items = eligible
      .filter((hire) => picked[hire.candidate.id])
      .map((hire) => ({
        candidateId: hire.candidate.id,
        candidateName: hire.candidate.name,
        role: hire.position.title,
        seniority: hire.position.seniority,
        startDate: hire.candidate.startDate as string,
        rate: picked[hire.candidate.id],
      }));
    const request: BillingRequest = {
      id: `bill-${Date.now()}`,
      consultora: company,
      month,
      year,
      items,
      status: "requested",
      requestedAt: new Date().toISOString(),
      requestedBy: user,
    };

    updateBilling((state) => ({ ...state, requests: [request, ...state.requests] }));
    notifyAll(
      talents,
      user,
      `${company} requests approval to bill ${items.length} hire${items.length === 1 ? "" : "s"} for ${monthLabel(month, year)}.`,
      "pending"
    );
    onClose();
  };

  return (
    <DialogFrame
      title="New billing request"
      subtitle="Choose the billing month and the hires to bill. Talent approves it and then you can attach the invoice."
      confirmLabel="Send request"
      confirmDisabled={Object.keys(picked).length === 0}
      wide
      onClose={onClose}
      onConfirm={submit}
    >
      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel required>Billing month</FieldLabel>
          <select value={month} onChange={(event) => setMonth(Number(event.target.value))} className={FIELD_CLASS}>
            {MONTH_NAMES.map((name, index) => (
              <option key={name} value={index + 1}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <FieldLabel required>Year</FieldLabel>
          <select value={year} onChange={(event) => setYear(Number(event.target.value))} className={FIELD_CLASS}>
            {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>
      </div>

      <FieldLabel required>Hires to bill (3 months completed)</FieldLabel>

      {eligible.length === 0 ? (
        <p className="rounded-xl border px-3 py-4 text-sm app-border app-text-muted">
          No hire has completed 3 months yet.
        </p>
      ) : (
        <div className="space-y-1.5">
          {eligible.map((hire) => {
            const rate = picked[hire.candidate.id];

            return (
              <div key={hire.candidate.id} className="flex items-center gap-3 rounded-xl border px-3 py-2 text-sm app-border">
                <input type="checkbox" checked={Boolean(rate)} onChange={() => toggle(hire)} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold app-text-primary">{hire.candidate.name}</p>
                  <p className="text-xs app-text-muted">
                    {hire.position.title} · {hire.position.seniority} · start {fmt(hire.candidate.startDate)}
                  </p>
                </div>
                <select
                  disabled={!rate}
                  value={rate ?? defaultRate(hire)}
                  onChange={(event) =>
                    setPicked((current) => ({ ...current, [hire.candidate.id]: event.target.value as BillingRate }))
                  }
                  className="app-input rounded-lg border px-2 py-1 text-xs outline-none disabled:opacity-40"
                >
                  <option value="standard">Standard</option>
                  <option value="lead">LEAD</option>
                </select>
              </div>
            );
          })}
        </div>
      )}

      <p className="mt-3 text-xs app-text-muted">
        Standard is for regular hires; pick LEAD for profiles that were hired as Lead.
      </p>
    </DialogFrame>
  );
}

function InvoiceDialog({
  request,
  user,
  talents,
  onClose,
}: {
  request: BillingRequest;
  user: string;
  talents: string[];
  onClose: () => void;
}) {
  const [number, setNumber] = useState("");
  const [file, setFile] = useState<{ name: string; size: number } | null>(null);

  const submit = () => {
    if (!file) {
      return;
    }

    updateBilling((state) => ({
      ...state,
      requests: state.requests.map((item) =>
        item.id === request.id
          ? {
              ...item,
              status: "invoiced",
              invoice: {
                number: number.trim(),
                fileName: file.name,
                fileSize: file.size,
                attachedAt: new Date().toISOString(),
                attachedBy: user,
              },
            }
          : item
      ),
    }));
    notifyAll(talents, user, `${request.consultora} attached the invoice for ${monthLabel(request.month, request.year)}.`, "info");
    onClose();
  };

  return (
    <DialogFrame
      title={`Attach invoice · ${monthLabel(request.month, request.year)}`}
      subtitle={`${request.items.length} hire${request.items.length === 1 ? "" : "s"} approved by Talent.`}
      confirmLabel="Attach invoice"
      confirmDisabled={!file}
      onClose={onClose}
      onConfirm={submit}
    >
      <FieldLabel>Invoice number</FieldLabel>
      <input value={number} onChange={(event) => setNumber(event.target.value)} placeholder="e.g. FC-0091" className={FIELD_CLASS} />

      <FieldLabel required>Invoice file (PDF)</FieldLabel>
      <input
        type="file"
        accept=".pdf,.png,.jpg,.jpeg"
        onChange={(event) => {
          const picked = event.target.files?.[0];

          setFile(picked ? { name: picked.name, size: picked.size } : null);
        }}
        className={FIELD_CLASS}
      />
    </DialogFrame>
  );
}

function RequestCard({
  request,
  fees,
  children,
}: {
  request: BillingRequest;
  fees: BillingState["fees"];
  children?: React.ReactNode;
}) {
  const total = requestTotal(request, fees);

  return (
    <div className="rounded-2xl border p-4 app-border app-card">
      <div className="flex flex-wrap items-center gap-3">
        <h3 className="font-bold app-text-primary">{monthLabel(request.month, request.year)}</h3>
        <Tag tone={statusTone(request.status)} small>
          {REQUEST_STATUS_LABELS[request.status]}
        </Tag>
        <span className="text-xs app-text-muted">
          {request.consultora} · requested {fmt(request.requestedAt)} by {request.requestedBy}
        </span>
        <span className="ml-auto text-sm font-semibold app-text-primary">{money(total)}</span>
      </div>

      <ul className="mt-3 space-y-1 text-sm">
        {request.items.map((item) => (
          <li key={item.candidateId} className="flex items-center gap-2 app-text-secondary">
            <span className="font-medium app-text-primary">{item.candidateName}</span>
            <span className="text-xs app-text-muted">
              {item.role} · start {fmt(item.startDate)}
            </span>
            <Tag tone={item.rate === "lead" ? "amber" : "gray"} small>
              {RATE_LABELS[item.rate]}
            </Tag>
          </li>
        ))}
      </ul>

      {request.status === "rejected" && request.rejectReason && (
        <p className="mt-3 text-xs text-red-500">Rejected: {request.rejectReason}</p>
      )}

      {request.invoice && (
        <p className="mt-3 text-xs app-text-secondary">
          Invoice {request.invoice.number ? `${request.invoice.number} · ` : ""}
          {request.invoice.fileName} ({Math.max(1, Math.round(request.invoice.fileSize / 1024))} KB) · attached{" "}
          {fmt(request.invoice.attachedAt)} by {request.invoice.attachedBy}
        </p>
      )}

      {children && <div className="mt-3 flex gap-2">{children}</div>}
    </div>
  );
}

const BUTTON = "rounded-lg border px-3 py-1.5 text-xs font-semibold app-border hover:border-violet-500";
const PRIMARY = { backgroundColor: "#7c3aed", color: "#fff", borderColor: "#7c3aed" };

/** Facturación vista por la consultora. */
export function ConsultoraBillingView({
  company,
  user,
  hires,
  billing,
  talents,
}: {
  company: string;
  user: string;
  hires: Hire[];
  billing: BillingState;
  talents: string[];
}) {
  const [creating, setCreating] = useState(false);
  const [invoiceFor, setInvoiceFor] = useState<BillingRequest | null>(null);
  const eligible = hires.filter((hire) => hireBillingState(hire, billing).kind === "eligible");
  const requests = billing.requests.filter((item) => item.consultora === company);

  return (
    <div className="space-y-5">
      <p className="max-w-3xl text-xs app-text-muted">
        Trick pays per hire once the person completes 3 months at the company. Pick the hires, assign a billing month and send
        the request. When Talent approves it you can attach the invoice.
      </p>

      <div className="flex items-center">
        <h2 className="text-sm font-bold app-text-primary">Hires</h2>
        <button
          type="button"
          disabled={eligible.length === 0}
          onClick={() => setCreating(true)}
          style={PRIMARY}
          className="ml-auto rounded-xl px-4 py-2 text-sm font-semibold hover:opacity-90 disabled:opacity-40"
        >
          + New billing request
        </button>
      </div>

      <HiresTable hires={hires} billing={billing} />

      <h2 className="text-sm font-bold app-text-primary">Requests</h2>

      <div className="space-y-3">
        {requests.map((request) => (
          <RequestCard key={request.id} request={request} fees={billing.fees}>
            {request.status === "approved" && (
              <button type="button" onClick={() => setInvoiceFor(request)} style={PRIMARY} className="rounded-lg border px-3 py-1.5 text-xs font-semibold">
                Attach invoice
              </button>
            )}
          </RequestCard>
        ))}

        {requests.length === 0 && (
          <p className="rounded-xl border px-4 py-6 text-center text-sm app-border app-text-muted">No requests yet.</p>
        )}
      </div>

      <ul className="list-disc space-y-1 rounded-xl border px-8 py-3 text-xs app-border app-text-muted">
        <li>
          <b>In guarantee</b> → <b>Eligible</b> (3 months after the start date) → <b>Waiting approval</b> → <b>Approved</b> →{" "}
          <b>Invoiced</b>.
        </li>
        <li>If the person leaves before 3 months it is <b>Not billable</b>. A rejected request frees its hires again.</li>
      </ul>

      {creating && (
        <RequestDialog eligible={eligible} company={company} user={user} talents={talents} onClose={() => setCreating(false)} />
      )}
      {invoiceFor && (
        <InvoiceDialog request={invoiceFor} user={user} talents={talents} onClose={() => setInvoiceFor(null)} />
      )}
    </div>
  );
}

/** Aprobación de cobros vista por Talent y Owner. */
export function TalentBillingView({
  user,
  hires,
  billing,
}: {
  user: string;
  hires: Hire[];
  billing: BillingState;
}) {
  const [rejecting, setRejecting] = useState<BillingRequest | null>(null);
  const [reason, setReason] = useState("");
  const pending = billing.requests.filter((item) => item.status === "requested");
  const others = billing.requests.filter((item) => item.status !== "requested");

  const decide = (request: BillingRequest, approved: boolean, why?: string) => {
    updateBilling((state) => ({
      ...state,
      requests: state.requests.map((item) =>
        item.id === request.id
          ? {
              ...item,
              status: approved ? "approved" : "rejected",
              decidedAt: new Date().toISOString(),
              decidedBy: user,
              rejectReason: approved ? undefined : why,
            }
          : item
      ),
    }));
    // Cierra el pedido pendiente de los demás Talent y avisa a la consultora
    request.requestedBy &&
      pushNotification({
        to: request.requestedBy,
        from: user,
        kind: "info",
        state: "info",
        text: approved
          ? `Your billing request for ${monthLabel(request.month, request.year)} was approved. You can attach the invoice.`
          : `Your billing request for ${monthLabel(request.month, request.year)} was rejected${why ? `: ${why}` : "."}`,
        href: "/consultora?tab=billing",
      });
  };

  const setFee = (key: "standard" | "lead", value: string) => {
    const number = value.trim() === "" ? undefined : Number(value);

    updateBilling((state) => ({
      ...state,
      fees: { ...state.fees, [key]: number !== undefined && Number.isFinite(number) && number >= 0 ? number : undefined },
    }));
  };

  return (
    <div className="space-y-5">
      <p className="max-w-3xl text-xs app-text-muted">
        Validate that each hire is still at the company after 3 months. Approving lets the consultora attach the invoice, so
        everything stays registered here.
      </p>

      <div className="rounded-2xl border p-4 app-border app-card">
        <h2 className="text-sm font-bold app-text-primary">Billing parameters (USD per hire)</h2>

        <div className="mt-3 flex flex-wrap gap-4">
          {(["standard", "lead"] as const).map((key) => (
            <label key={key} className="text-xs app-text-muted">
              {RATE_LABELS[key]}
              <input
                key={`${key}-${billing.fees[key] ?? ""}`}
                type="number"
                min={0}
                defaultValue={billing.fees[key] ?? ""}
                placeholder="not set"
                onBlur={(event) => setFee(key, event.target.value)}
                className="app-input mt-1 block w-36 rounded-lg border px-2.5 py-1.5 text-sm outline-none"
              />
            </label>
          ))}
        </div>

        <p className="mt-2 text-xs app-text-muted">Totals in the requests are calculated with these values.</p>
      </div>

      <h2 className="text-sm font-bold app-text-primary">Waiting approval ({pending.length})</h2>

      <div className="space-y-3">
        {pending.map((request) => (
          <RequestCard key={request.id} request={request} fees={billing.fees}>
            <button type="button" onClick={() => decide(request, true)} style={PRIMARY} className="rounded-lg border px-3 py-1.5 text-xs font-semibold">
              Confirm still at company · Approve
            </button>
            <button type="button" onClick={() => setRejecting(request)} className={BUTTON} style={{ color: "#b91c1c" }}>
              Reject
            </button>
          </RequestCard>
        ))}

        {pending.length === 0 && (
          <p className="rounded-xl border px-4 py-6 text-center text-sm app-border app-text-muted">Nothing waiting for approval.</p>
        )}
      </div>

      {others.length > 0 && (
        <>
          <h2 className="text-sm font-bold app-text-primary">History</h2>
          <div className="space-y-3">
            {others.map((request) => (
              <RequestCard key={request.id} request={request} fees={billing.fees} />
            ))}
          </div>
        </>
      )}

      <h2 className="text-sm font-bold app-text-primary">Hires from consultoras</h2>

      <HiresTable
        hires={hires}
        billing={billing}
        action={(hire) => {
          const state = hireBillingState(hire, billing);

          if (state.kind === "not_billable") {
            return (
              <button
                type="button"
                className={BUTTON}
                onClick={() =>
                  updateBilling((current) => {
                    const notBillable = { ...current.notBillable };

                    delete notBillable[hire.candidate.id];

                    return { ...current, notBillable };
                  })
                }
              >
                Undo
              </button>
            );
          }

          if (state.kind === "in_request" && state.request.status !== "rejected") {
            return null;
          }

          return (
            <button
              type="button"
              className={BUTTON}
              style={{ color: "#b91c1c" }}
              onClick={() =>
                updateBilling((current) => ({
                  ...current,
                  notBillable: {
                    ...current.notBillable,
                    [hire.candidate.id]: { at: new Date().toISOString().slice(0, 10), by: user },
                  },
                }))
              }
            >
              Left the company
            </button>
          );
        }}
      />

      {rejecting && (
        <DialogFrame
          title={`Reject · ${monthLabel(rejecting.month, rejecting.year)}`}
          subtitle="The consultora sees the reason and can send a new request."
          confirmLabel="Reject request"
          onClose={() => {
            setRejecting(null);
            setReason("");
          }}
          onConfirm={() => {
            decide(rejecting, false, reason.trim());
            setRejecting(null);
            setReason("");
          }}
        >
          <FieldLabel>Reason (optional)</FieldLabel>
          <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            className={`${FIELD_CLASS} min-h-[80px] resize-y`}
          />
        </DialogFrame>
      )}
    </div>
  );
}
