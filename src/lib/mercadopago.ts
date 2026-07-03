// Cliente mínimo de la API REST de Mercado Pago (Checkout Pro).
// Sin SDK: usa fetch. Lee MP_ACCESS_TOKEN del entorno.

const MP_BASE = "https://api.mercadopago.com";

export function mpConfigured(): boolean {
  return !!process.env.MP_ACCESS_TOKEN;
}

function token(): string {
  const t = process.env.MP_ACCESS_TOKEN;
  if (!t) throw new Error("MP_ACCESS_TOKEN no configurado");
  return t;
}

export type MpPayment = {
  id: number;
  status: string; // "approved" | "pending" | "rejected" | ...
  transaction_amount: number;
  external_reference: string | null;
};

/** Crea una preferencia de Checkout Pro y devuelve el link de pago (init_point). */
export async function createPreference(input: {
  title: string;
  amount: number;
  externalReference: string;
  notificationUrl: string;
  successUrl: string;
  failureUrl: string;
}): Promise<{ id: string; init_point: string }> {
  const res = await fetch(`${MP_BASE}/checkout/preferences`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
    body: JSON.stringify({
      items: [
        {
          title: input.title,
          quantity: 1,
          unit_price: input.amount,
          currency_id: "ARS",
        },
      ],
      external_reference: input.externalReference,
      notification_url: input.notificationUrl,
      back_urls: {
        success: input.successUrl,
        failure: input.failureUrl,
        pending: input.successUrl,
      },
      auto_return: "approved",
    }),
  });

  if (!res.ok) {
    throw new Error(`MP preference error ${res.status}: ${await res.text()}`);
  }
  const data = (await res.json()) as { id: string; init_point: string };
  return { id: data.id, init_point: data.init_point };
}

/** Consulta autoritativa de un pago (no confiamos en el body del webhook). */
export async function getPayment(id: string): Promise<MpPayment> {
  const res = await fetch(`${MP_BASE}/v1/payments/${id}`, {
    headers: { Authorization: `Bearer ${token()}` },
  });
  if (!res.ok) {
    throw new Error(`MP payment error ${res.status}`);
  }
  return (await res.json()) as MpPayment;
}
