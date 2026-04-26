import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getOrganizersByUser } from "@/modules/organizers/queries";
import { getOrganizerConfig, getCategoriesByOrganizer } from "@/modules/config/queries";
import { getVenuesWithCourts } from "@/modules/scheduling/queries";
import { OrganizerInfoForm } from "./_components/organizer-info-form";
import { SettingsForm } from "./_components/settings-form";
import { CategoriesManager } from "./_components/categories-manager";
import { CollaboratorsManager } from "./_components/collaborators-manager";
import { SedesManager } from "./_components/sedes-manager";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Configuración" };

const TABS = [
  { id: "organizacion",  label: "Organización"   },
  { id: "parametros",    label: "Parámetros"      },
  { id: "categorias",    label: "Categorías"      },
  { id: "colaboradores", label: "Colaboradores"   },
  { id: "sedes",         label: "Sedes / Canchas" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default async function ConfiguracionPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const activeTab: TabId = (TABS.find((t) => t.id === tab)?.id ?? "organizacion") as TabId;

  const session = await auth();
  if (!session?.user) redirect("/login");

  const memberships = await getOrganizersByUser(session.user.id);
  if (!memberships.length) redirect("/dashboard");

  const organizerId = memberships[0].organizerId;

  const [organizer, categories, venues] = await Promise.all([
    getOrganizerConfig(organizerId),
    getCategoriesByOrganizer(organizerId),
    getVenuesWithCourts(organizerId),
  ]);

  if (!organizer) redirect("/dashboard");

  const A = "#a3e635";

  return (
    <div style={{ maxWidth: 860, display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Header */}
      <div>
        <h1 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 22, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
          Configuración
        </h1>
        <p style={{ fontSize: 13, color: "var(--text-faint)" }}>
          Administrá los datos, reglas y accesos de tu organización
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 2, borderBottom: "1px solid var(--border-subtle)" }}>
        {TABS.map((t) => {
          const active = activeTab === t.id;
          return (
            <Link
              key={t.id}
              href={`/dashboard/configuracion?tab=${t.id}`}
              style={{
                padding: "10px 18px",
                fontSize: 13,
                fontWeight: active ? 700 : 500,
                color: active ? A : "var(--text-faint)",
                textDecoration: "none",
                borderBottom: `2px solid ${active ? A : "transparent"}`,
                marginBottom: -1,
                transition: "all .12s",
              }}
            >
              {t.label}
            </Link>
          );
        })}
      </div>

      {/* Tab content */}
      <div style={{
        background: "oklch(16% 0.012 250)",
        border: "1px solid var(--border-default)",
        borderRadius: 14,
        padding: "24px",
      }}>
        {activeTab === "organizacion" && (
          <div>
            <h2 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
              Datos del organizador
            </h2>
            <p style={{ fontSize: 12, color: "var(--text-faint)", marginBottom: 20 }}>
              Información pública de tu organización
            </p>
            <OrganizerInfoForm organizer={organizer} />
          </div>
        )}

        {activeTab === "parametros" && (
          <div>
            <h2 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
              Parámetros generales
            </h2>
            <p style={{ fontSize: 12, color: "var(--text-faint)", marginBottom: 20 }}>
              Estos valores se usan como default al crear nuevos torneos
            </p>
            <SettingsForm settings={organizer.settings} />
          </div>
        )}

        {activeTab === "categorias" && (
          <div>
            <h2 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
              Categorías
            </h2>
            <p style={{ fontSize: 12, color: "var(--text-faint)", marginBottom: 20 }}>
              Las categorías activas están disponibles al crear torneos
            </p>
            <CategoriesManager categories={categories} />
          </div>
        )}

        {activeTab === "colaboradores" && (
          <div>
            <h2 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
              Colaboradores
            </h2>
            <p style={{ fontSize: 12, color: "var(--text-faint)", marginBottom: 20 }}>
              Invitá usuarios para ayudarte a gestionar torneos
            </p>
            <CollaboratorsManager members={organizer.members} currentUserId={session.user.id} />
          </div>
        )}

        {activeTab === "sedes" && (
          <div>
            <h2 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
              Sedes y Canchas
            </h2>
            <p style={{ fontSize: 12, color: "var(--text-faint)", marginBottom: 20 }}>
              Gestioná las sedes donde se juegan los torneos y sus canchas
            </p>
            <SedesManager venues={venues} />
          </div>
        )}
      </div>
    </div>
  );
}
