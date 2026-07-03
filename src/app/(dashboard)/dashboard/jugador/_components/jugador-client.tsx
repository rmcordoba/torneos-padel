"use client";

import { useState } from "react";
import Link from "next/link";
import { RegisterModal } from "./register-modal";
import { CheckCircle2, Clock, XCircle, AlertCircle, Trophy, Calendar, Users } from "lucide-react";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pendiente",
  APPROVED: "Aprobada",
  REJECTED: "Rechazada",
  CANCELLED: "Cancelada",
  WAITLISTED: "En espera",
};

const STATUS_COLOR: Record<string, string> = {
  PENDING: "#fbbf24",
  APPROVED: "#a3e635",
  REJECTED: "#f87171",
  CANCELLED: "#6b7280",
  WAITLISTED: "#60a5fa",
};

const STATUS_ICON: Record<string, React.ReactNode> = {
  PENDING: <Clock size={12} />,
  APPROVED: <CheckCircle2 size={12} />,
  REJECTED: <XCircle size={12} />,
  CANCELLED: <XCircle size={12} />,
  WAITLISTED: <AlertCircle size={12} />,
};

type OpenCategory = {
  id: string;
  categoryName: string;
  spotsLeft: number;
  totalSpots: number;
  registered: number;
  price: string | null;
};

type OpenTournament = {
  id: string;
  name: string;
  organizerName: string;
  startDate: string;
  endDate: string;
  categories: OpenCategory[];
};

type MyRegistration = {
  id: string;
  status: string;
  createdAt: string;
  tournamentName: string;
  categoryName: string;
  startDate: string;
  partnerName: string | null;
};

interface Props {
  openTournaments: OpenTournament[];
  myRegistrations: MyRegistration[];
  hasProfile: boolean;
  userName: string;
}

export function JugadorClient({ openTournaments, myRegistrations, hasProfile, userName }: Props) {
  const [registering, setRegistering] = useState<{
    categoryId: string;
    categoryName: string;
    tournamentName: string;
    spotsLeft: number;
  } | null>(null);

  const firstName = userName.split(" ")[0] || "Jugador";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28, maxWidth: 900 }}>

      {/* Welcome */}
      <div>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: "var(--text-primary)", fontFamily: "var(--font-space), sans-serif" }}>
          ¡Hola, {firstName}! 👋
        </h1>
        <p style={{ margin: "6px 0 0", fontSize: 14, color: "var(--text-dimmer)" }}>
          Bienvenido a tu panel de jugador
        </p>
      </div>

      {/* Profile incomplete banner */}
      {!hasProfile && (
        <div style={{
          padding: "14px 18px", borderRadius: 12,
          background: "rgba(251,191,36,0.1)",
          border: "1px solid rgba(251,191,36,0.3)",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <AlertCircle size={18} color="#fbbf24" />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#fbbf24" }}>Perfil incompleto</div>
              <div style={{ fontSize: 12, color: "var(--text-dimmer)" }}>Completá tu perfil para poder inscribirte en torneos</div>
            </div>
          </div>
          <Link
            href="/dashboard/perfil"
            style={{
              padding: "7px 16px", borderRadius: 7, fontSize: 12, fontWeight: 700,
              background: "#fbbf24", color: "#000", textDecoration: "none", flexShrink: 0,
            }}
          >
            Completar perfil
          </Link>
        </div>
      )}

      {/* My registrations */}
      <section>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-space), sans-serif" }}>Mis inscripciones</span>
          {myRegistrations.length > 0 && (
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--accent)", background: "var(--accent-15)", padding: "2px 8px", borderRadius: 20 }}>
              {myRegistrations.length}
            </span>
          )}
        </div>

        {myRegistrations.length === 0 ? (
          <div style={{
            padding: "36px 20px", borderRadius: 12, textAlign: "center",
            background: "var(--bg-surface)", border: "1px solid var(--border-default)",
          }}>
            <div style={{ fontSize: 32, marginBottom: 10, opacity: 0.3 }}>🎾</div>
            <div style={{ fontSize: 14, color: "var(--text-dimmer)" }}>Todavía no te inscribiste en ningún torneo</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {myRegistrations.map((reg) => {
              const color = STATUS_COLOR[reg.status] ?? "#6b7280";
              return (
                <div
                  key={reg.id}
                  style={{
                    padding: "14px 18px", borderRadius: 12,
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border-default)",
                    display: "flex", alignItems: "center", gap: 14,
                  }}
                >
                  <div style={{
                    width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                    background: `${color}18`, border: `1px solid ${color}40`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 18,
                  }}>
                    🏆
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                      <span style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", fontFamily: "var(--font-space), sans-serif" }}>
                        {reg.tournamentName}
                      </span>
                      <span style={{
                        display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600,
                        color, background: `${color}18`, padding: "2px 8px", borderRadius: 20, flexShrink: 0,
                      }}>
                        {STATUS_ICON[reg.status]}
                        {STATUS_LABEL[reg.status] ?? reg.status}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-dimmer)", display: "flex", gap: 12 }}>
                      <span>{reg.categoryName}</span>
                      {reg.partnerName && <span>· Compañero/a: {reg.partnerName}</span>}
                      <span style={{ color: "var(--text-faint)" }}>
                        · {reg.startDate}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Open tournaments */}
      <section>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-space), sans-serif" }}>Torneos con inscripciones abiertas</span>
          {openTournaments.length > 0 && (
            <span style={{ fontSize: 11, fontWeight: 700, color: "#60a5fa", background: "rgba(96,165,250,0.12)", padding: "2px 8px", borderRadius: 20 }}>
              {openTournaments.length}
            </span>
          )}
        </div>

        {openTournaments.length === 0 ? (
          <div style={{
            padding: "36px 20px", borderRadius: 12, textAlign: "center",
            background: "var(--bg-surface)", border: "1px solid var(--border-default)",
          }}>
            <div style={{ fontSize: 32, marginBottom: 10, opacity: 0.3 }}>📅</div>
            <div style={{ fontSize: 14, color: "var(--text-dimmer)" }}>No hay torneos con inscripciones abiertas en este momento</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {openTournaments.map((t) => (
              <div
                key={t.id}
                style={{
                  borderRadius: 14, overflow: "hidden",
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-default)",
                }}
              >
                {/* Tournament header */}
                <div style={{
                  padding: "16px 20px 14px",
                  borderBottom: "1px solid var(--border-subtle)",
                  display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12,
                }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                      <Trophy size={14} color="var(--accent)" />
                      <span style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)", fontFamily: "var(--font-space), sans-serif" }}>
                        {t.name}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: 14, fontSize: 12, color: "var(--text-dimmer)" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <Users size={11} /> {t.organizerName}
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <Calendar size={11} />
                        {t.startDate} – {t.endDate}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Categories */}
                <div style={{ padding: "12px 20px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
                  {t.categories.map((cat) => {
                    const pct = Math.round((cat.registered / cat.totalSpots) * 100);
                    const barColor = pct >= 90 ? "#f87171" : pct >= 60 ? "#fbbf24" : "#a3e635";
                    const alreadyFull = cat.spotsLeft <= 0;

                    return (
                      <div
                        key={cat.id}
                        style={{
                          padding: "12px 16px", borderRadius: 10,
                          background: "var(--bg-elevated)",
                          border: "1px solid var(--border-default)",
                          display: "flex", alignItems: "center", gap: 16,
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                            <span style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)" }}>
                              {cat.categoryName}
                            </span>
                            {cat.price && (
                              <span style={{ fontSize: 11, color: "var(--accent)", fontWeight: 700 }}>
                                ${cat.price}
                              </span>
                            )}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ flex: 1, height: 4, borderRadius: 2, background: "var(--bg-base)", overflow: "hidden" }}>
                              <div style={{ width: `${pct}%`, height: "100%", background: barColor, borderRadius: 2, transition: "width 0.3s" }} />
                            </div>
                            <span style={{ fontSize: 11, color: "var(--text-dimmer)", flexShrink: 0 }}>
                              {cat.registered}/{cat.totalSpots}
                            </span>
                          </div>
                        </div>

                        <button
                          disabled={!hasProfile || alreadyFull}
                          onClick={() => setRegistering({
                            categoryId: cat.id,
                            categoryName: cat.categoryName,
                            tournamentName: t.name,
                            spotsLeft: cat.spotsLeft,
                          })}
                          style={{
                            flexShrink: 0,
                            padding: "7px 16px", borderRadius: 7, fontSize: 12, fontWeight: 700,
                            background: alreadyFull ? "transparent" : hasProfile ? "var(--accent)" : "var(--bg-base)",
                            color: alreadyFull ? "var(--text-faint)" : hasProfile ? "#000" : "var(--text-dimmer)",
                            border: alreadyFull ? "1px solid var(--border-default)" : "none",
                            cursor: (!hasProfile || alreadyFull) ? "not-allowed" : "pointer",
                            opacity: (!hasProfile || alreadyFull) ? 0.6 : 1,
                          }}
                          title={!hasProfile ? "Completá tu perfil primero" : alreadyFull ? "Categoría completa" : "Inscribirme"}
                        >
                          {alreadyFull ? "Completo" : "Inscribirme"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Registration modal */}
      {registering && (
        <RegisterModal
          categoryId={registering.categoryId}
          categoryName={registering.categoryName}
          tournamentName={registering.tournamentName}
          spotsLeft={registering.spotsLeft}
          onClose={() => setRegistering(null)}
        />
      )}
    </div>
  );
}
