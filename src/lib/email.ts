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

// ─── Turnos / reservas ────────────────────────────────────────────────────────

type BookingEmailOpts = {
  to: string;
  customerName: string;
  clubName: string;
  venueName: string;
  courtName: string;
  dateLabel: string;   // "lunes 10 de junio"
  timeLabel: string;   // "20:00 – 21:30"
  price?: number | null;
};

export async function sendBookingConfirmationEmail(opts: BookingEmailOpts) {
  if (!process.env.RESEND_API_KEY || !opts.to) return;
  try {
    await getResend().emails.send({
      from: FROM,
      to: opts.to,
      subject: `✅ Reserva confirmada — ${opts.courtName} · ${opts.dateLabel}`,
      html: buildBookingHtml({
        ...opts,
        heading: "¡Reserva confirmada!",
        intro: `Hola ${opts.customerName}, tu turno quedó reservado. Te esperamos 🎾`,
      }),
    });
  } catch (err) {
    console.error("[email] sendBookingConfirmationEmail failed:", err);
  }
}

export async function sendBookingReminderEmail(opts: BookingEmailOpts) {
  if (!process.env.RESEND_API_KEY || !opts.to) return;
  try {
    await getResend().emails.send({
      from: FROM,
      to: opts.to,
      subject: `⏰ Recordatorio: tu turno mañana — ${opts.timeLabel}`,
      html: buildBookingHtml({
        ...opts,
        heading: "Te recordamos tu turno",
        intro: `Hola ${opts.customerName}, mañana tenés tu turno reservado. ¡No te lo pierdas!`,
      }),
    });
  } catch (err) {
    console.error("[email] sendBookingReminderEmail failed:", err);
  }
}

function buildBookingHtml(opts: BookingEmailOpts & { heading: string; intro: string }) {
  const priceRow = opts.price != null
    ? `<p style="margin:0;font-size:13px;color:#e2e8f0"><strong style="color:#f1f5f9">Precio:</strong> $${opts.price.toLocaleString("es-AR")} <span style="color:#64748b">(se paga en el club)</span></p>`
    : "";
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f1117;font-family:'Segoe UI',sans-serif;color:#e2e8f0">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f1117;padding:40px 20px">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#1a1f2e;border-radius:16px;overflow:hidden;border:1px solid #2d3748">
        <tr><td style="background:#a3e63518;border-bottom:3px solid #a3e635;padding:28px 32px;text-align:center">
          <p style="margin:0;font-size:13px;font-weight:600;color:#a3e635;letter-spacing:0.08em;text-transform:uppercase">${opts.clubName}</p>
          <h1 style="margin:10px 0 0;font-size:20px;font-weight:700;color:#f1f5f9">${opts.heading}</h1>
        </td></tr>
        <tr><td style="padding:28px 32px">
          <p style="margin:0 0 20px;font-size:14px;color:#94a3b8;line-height:1.6">${opts.intro}</p>
          <div style="background:#0f1117;border-radius:10px;padding:16px 20px;margin-bottom:24px">
            <p style="margin:0 0 8px;font-size:11px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.06em">Tu turno</p>
            <p style="margin:0 0 4px;font-size:13px;color:#e2e8f0"><strong style="color:#f1f5f9">Cancha:</strong> ${opts.courtName} · ${opts.venueName}</p>
            <p style="margin:0 0 4px;font-size:13px;color:#e2e8f0"><strong style="color:#f1f5f9">Día:</strong> ${opts.dateLabel}</p>
            <p style="margin:0 0 4px;font-size:13px;color:#e2e8f0"><strong style="color:#f1f5f9">Horario:</strong> ${opts.timeLabel}</p>
            ${priceRow}
          </div>
          <p style="margin:0;font-size:12px;color:#475569;text-align:center">Este es un mensaje automático. No respondas este email.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ─── Suscripción / facturación (dunning) ──────────────────────────────────────

export type SubscriptionEmailVariant = "trial_ending" | "grace" | "read_only" | "payment_ok";

type SubscriptionEmailOpts = {
  to: string[];
  organizerName: string;
  variant: SubscriptionEmailVariant;
  days?: number; // días restantes (trial) o de gracia
  periodEndLabel?: string; // para payment_ok
  billingUrl: string;
};

const SUBSCRIPTION_COPY: Record<SubscriptionEmailVariant, { subject: string; heading: string; color: string; body: (o: SubscriptionEmailOpts) => string; cta: string }> = {
  trial_ending: {
    subject: "Tu prueba gratis está por terminar",
    heading: "Tu prueba está por terminar",
    color: "#38bdf8",
    body: (o) => `Te queda${(o.days ?? 0) === 1 ? "" : "n"} <strong style="color:#f1f5f9">${Math.max(o.days ?? 0, 0)} día${(o.days ?? 0) === 1 ? "" : "s"}</strong> de prueba en ${o.organizerName}. Activá un plan para no perder el acceso al panel.`,
    cta: "Ver planes y pagar",
  },
  grace: {
    subject: "Tu suscripción venció — regularizá el pago",
    heading: "Tu suscripción venció",
    color: "#fb923c",
    body: (o) => `La suscripción de ${o.organizerName} venció. Tenés <strong style="color:#f1f5f9">${Math.max(o.days ?? 0, 0)} día${(o.days ?? 0) === 1 ? "" : "s"}</strong> de gracia antes de pasar a modo solo lectura. Renová para evitar interrupciones.`,
    cta: "Renovar ahora",
  },
  read_only: {
    subject: "Tu panel está en modo solo lectura",
    heading: "Modo solo lectura activado",
    color: "#ef4444",
    body: (o) => `La suscripción de ${o.organizerName} sigue impaga, por lo que el panel quedó en <strong style="color:#f1f5f9">modo solo lectura</strong>: tu sitio público sigue online, pero no podés crear torneos ni cargar resultados hasta renovar.`,
    cta: "Renovar suscripción",
  },
  payment_ok: {
    subject: "✅ Pago recibido — suscripción renovada",
    heading: "¡Pago recibido!",
    color: "#a3e635",
    body: (o) => `Acreditamos tu pago y renovamos la suscripción de ${o.organizerName}${o.periodEndLabel ? ` hasta <strong style="color:#f1f5f9">${o.periodEndLabel}</strong>` : ""}. ¡Gracias!`,
    cta: "Ver facturación",
  },
};

export async function sendSubscriptionEmail(opts: SubscriptionEmailOpts) {
  if (!process.env.RESEND_API_KEY) return;
  const to = opts.to.filter(Boolean);
  if (to.length === 0) return;

  const copy = SUBSCRIPTION_COPY[opts.variant];
  try {
    await getResend().emails.send({
      from: FROM,
      to,
      subject: `${copy.subject} — ${opts.organizerName}`,
      html: `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f1117;font-family:'Segoe UI',sans-serif;color:#e2e8f0">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f1117;padding:40px 20px"><tr><td align="center">
    <table width="520" cellpadding="0" cellspacing="0" style="background:#1a1f2e;border-radius:16px;overflow:hidden;border:1px solid #2d3748">
      <tr><td style="background:${copy.color}18;border-bottom:3px solid ${copy.color};padding:28px 32px;text-align:center">
        <p style="margin:0;font-size:13px;font-weight:600;color:${copy.color};letter-spacing:0.08em;text-transform:uppercase">${APP_NAME}</p>
        <h1 style="margin:10px 0 0;font-size:20px;font-weight:700;color:#f1f5f9">${copy.heading}</h1>
      </td></tr>
      <tr><td style="padding:28px 32px">
        <p style="margin:0 0 24px;font-size:14px;color:#94a3b8;line-height:1.6">${copy.body(opts)}</p>
        <div style="text-align:center;margin-bottom:24px">
          <a href="${opts.billingUrl}" style="display:inline-block;background:${copy.color};color:#0a0f0a;font-weight:700;font-size:14px;padding:12px 28px;border-radius:10px;text-decoration:none">${copy.cta}</a>
        </div>
        <p style="margin:0;font-size:12px;color:#475569;text-align:center">Este es un mensaje automático. No respondas este email.</p>
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`,
    });
  } catch (err) {
    console.error("[email] sendSubscriptionEmail failed:", err);
  }
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
