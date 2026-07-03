import { NextResponse } from "next/server";
import { getPayment } from "@/lib/mercadopago";
import { applyPayment } from "@/modules/billing/payments";
import { logError } from "@/lib/logger";

export const dynamic = "force-dynamic";

/**
 * Webhook de Mercado Pago (Checkout Pro).
 * MP notifica un pago; consultamos el pago contra su API (autoritativo), y si
 * está aprobado extendemos la suscripción vía applyPayment (idempotente por
 * mpPaymentId). /api/* está excluido del middleware → endpoint público.
 *
 * Configurar en MP la notification_url: {NEXT_PUBLIC_APP_URL}/api/webhooks/mercadopago
 * (necesita una URL pública: deploy o túnel tipo ngrok; localhost no recibe).
 *
 * TODO(seguridad): validar header `x-signature` con MP_WEBHOOK_SECRET. Hoy la
 * autenticidad se garantiza re-consultando el pago con nuestro access token.
 */
async function handlePayment(paymentId: string | null) {
  if (!paymentId) return NextResponse.json({ ok: true, skipped: "sin id" });

  try {
    const payment = await getPayment(paymentId);
    if (payment.status !== "approved") {
      return NextResponse.json({ ok: true, status: payment.status });
    }

    const ref = payment.external_reference ?? "";
    const [organizerId, planId, monthsStr] = ref.split(":");
    if (!organizerId || !planId) {
      return NextResponse.json({ ok: true, skipped: "external_reference inválido" });
    }
    const months = Math.max(1, parseInt(monthsStr || "1", 10) || 1);

    const result = await applyPayment({
      organizerId,
      planId,
      months,
      amount: payment.transaction_amount,
      method: "mercadopago",
      mpPaymentId: String(payment.id),
    });

    return NextResponse.json({ ok: true, applied: result.applied });
  } catch (e) {
    logError("mp-webhook", e, { paymentId });
    // 200 para no disparar reintentos infinitos ante datos no accionables; los
    // fallos quedan logueados. (Si se quisiera reintento, devolver 500 acá.)
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}

function extractFromQuery(url: URL): { paymentId: string | null; topic: string | null } {
  const paymentId = url.searchParams.get("data.id") || url.searchParams.get("id");
  const topic = url.searchParams.get("type") || url.searchParams.get("topic");
  return { paymentId, topic };
}

export async function POST(req: Request) {
  const url = new URL(req.url);
  let { paymentId } = extractFromQuery(url);
  const { topic } = extractFromQuery(url);

  const body = await req.json().catch(() => null);
  if (body?.data?.id) paymentId = String(body.data.id);

  const kind = body?.type ?? topic;
  // Solo nos interesan notificaciones de pago.
  if (kind && kind !== "payment" && !paymentId) {
    return NextResponse.json({ ok: true, ignored: kind });
  }
  return handlePayment(paymentId);
}

export async function GET(req: Request) {
  // MP a veces valida la URL o notifica por GET con query params.
  const url = new URL(req.url);
  const { paymentId, topic } = extractFromQuery(url);
  if (paymentId || topic === "payment") return handlePayment(paymentId);
  return NextResponse.json({ ok: true });
}
