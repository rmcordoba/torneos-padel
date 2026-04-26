import { Resend } from "resend";

const FROM = process.env.EMAIL_FROM ?? "PadelPro <noreply@padelpro.app>";
const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "PadelPro";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

// ─── Registro / inscripción ───────────────────────────────────────────────────

type RegistrationEmailOpts = {
  to: string[];
  tournamentName: string;
  categoryName: string;
  status: "approved" | "rejected" | "cancelled" | "waitlist_promoted";
};

const STATUS_COPY = {
  approved: {
    subject: "✅ Inscripción aprobada",
    heading: "¡Su inscripción fue aprobada!",
    body: "El organizador aprobó su inscripción. Están confirmados para participar.",
    color: "#10b981",
  },
  rejected: {
    subject: "❌ Inscripción rechazada",
    heading: "Su inscripción fue rechazada",
    body: "Lamentablemente el organizador no pudo aprobar su inscripción. Pueden contactarlo para más información.",
    color: "#ef4444",
  },
  cancelled: {
    subject: "🚫 Inscripción cancelada",
    heading: "Su inscripción fue cancelada",
    body: "El organizador canceló su inscripción. Si creen que es un error, contáctenlo directamente.",
    color: "#f97316",
  },
  waitlist_promoted: {
    subject: "🎉 Pasaron de la lista de espera",
    heading: "¡Pasaron de la lista de espera!",
    body: "Se liberó un cupo y su pareja fue promovida a inscripciones pendientes. Esperen la aprobación final del organizador.",
    color: "#a3e635",
  },
};

export async function sendRegistrationEmail(opts: RegistrationEmailOpts) {
  if (!process.env.RESEND_API_KEY) return;
  if (opts.to.length === 0) return;

  const copy = STATUS_COPY[opts.status];

  try {
    await getResend().emails.send({
      from: FROM,
      to: opts.to,
      subject: `${copy.subject} — ${opts.tournamentName} · ${opts.categoryName}`,
      html: buildRegistrationHtml({
        heading: copy.heading,
        body: copy.body,
        color: copy.color,
        tournamentName: opts.tournamentName,
        categoryName: opts.categoryName,
      }),
    });
  } catch (err) {
    console.error("[email] sendRegistrationEmail failed:", err);
  }
}

function buildRegistrationHtml(opts: {
  heading: string;
  body: string;
  color: string;
  tournamentName: string;
  categoryName: string;
}) {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f1117;font-family:'Segoe UI',sans-serif;color:#e2e8f0">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f1117;padding:40px 20px">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#1a1f2e;border-radius:16px;overflow:hidden;border:1px solid #2d3748">
        <tr><td style="background:${opts.color}18;border-bottom:3px solid ${opts.color};padding:28px 32px;text-align:center">
          <p style="margin:0;font-size:13px;font-weight:600;color:${opts.color};letter-spacing:0.08em;text-transform:uppercase">${APP_NAME}</p>
          <h1 style="margin:10px 0 0;font-size:20px;font-weight:700;color:#f1f5f9">${opts.heading}</h1>
        </td></tr>
        <tr><td style="padding:28px 32px">
          <p style="margin:0 0 20px;font-size:14px;color:#94a3b8;line-height:1.6">${opts.body}</p>
          <div style="background:#0f1117;border-radius:10px;padding:16px 20px;margin-bottom:24px">
            <p style="margin:0 0 8px;font-size:11px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.06em">Detalle</p>
            <p style="margin:0 0 4px;font-size:13px;color:#e2e8f0"><strong style="color:#f1f5f9">Torneo:</strong> ${opts.tournamentName}</p>
            <p style="margin:0;font-size:13px;color:#e2e8f0"><strong style="color:#f1f5f9">Categoría:</strong> ${opts.categoryName}</p>
          </div>
          <p style="margin:0;font-size:12px;color:#475569;text-align:center">Este es un mensaje automático. No respondas este email.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ─── Reset de contraseña ──────────────────────────────────────────────────────

type PasswordResetEmailOpts = {
  to: string;
  name: string;
  resetUrl: string;
};

export async function sendPasswordResetEmail(opts: PasswordResetEmailOpts) {
  if (!process.env.RESEND_API_KEY) return;

  try {
    await getResend().emails.send({
      from: FROM,
      to: opts.to,
      subject: `Recuperar contraseña — ${APP_NAME}`,
      html: buildPasswordResetHtml(opts),
    });
  } catch (err) {
    console.error("[email] sendPasswordResetEmail failed:", err);
  }
}

function buildPasswordResetHtml(opts: PasswordResetEmailOpts) {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f1117;font-family:'Segoe UI',sans-serif;color:#e2e8f0">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f1117;padding:40px 20px">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#1a1f2e;border-radius:16px;overflow:hidden;border:1px solid #2d3748">
        <tr><td style="background:#a3e63518;border-bottom:3px solid #a3e635;padding:28px 32px;text-align:center">
          <p style="margin:0;font-size:13px;font-weight:600;color:#a3e635;letter-spacing:0.08em;text-transform:uppercase">${APP_NAME}</p>
          <h1 style="margin:10px 0 0;font-size:20px;font-weight:700;color:#f1f5f9">Recuperar contraseña</h1>
        </td></tr>
        <tr><td style="padding:28px 32px">
          <p style="margin:0 0 20px;font-size:14px;color:#94a3b8;line-height:1.6">
            Hola <strong style="color:#f1f5f9">${opts.name}</strong>, recibimos una solicitud para restablecer tu contraseña. Hacé click en el botón para continuar.
          </p>
          <div style="text-align:center;margin-bottom:24px">
            <a href="${opts.resetUrl}" style="display:inline-block;background:#a3e635;color:#0a0f0a;font-weight:700;font-size:14px;padding:12px 28px;border-radius:10px;text-decoration:none">
              Restablecer contraseña
            </a>
          </div>
          <p style="margin:0 0 8px;font-size:12px;color:#475569;text-align:center">
            Este enlace expira en <strong>1 hora</strong>. Si no solicitaste este cambio, ignorá este email.
          </p>
          <p style="margin:0;font-size:11px;color:#334155;text-align:center;word-break:break-all">${opts.resetUrl}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
