import { MercadoPagoConfig, Preference } from 'mercadopago';
import { NextRequest } from 'next/server';
import { createClient } from '@/app/lib/supabase/server';
import { getEventById } from '@/app/lib/services/database/eventService';

const mpClient = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const { eventoId } = await req.json();

  const { data: evento } = await getEventById(Number(eventoId));
  if (!evento) {
    return Response.json({ error: 'Evento não encontrado' }, { status: 404 });
  }

  const host = req.headers.get('host')!;
  const protocol = host.startsWith('localhost') ? 'http' : 'https';
  const baseUrl = `${protocol}://${host}`;

  try {
    const preference = new Preference(mpClient);
    const result = await preference.create({
      body: {
        items: [
          {
            id: String(evento.id),
            title: evento.nome,
            quantity: 1,
            unit_price: evento.valor,
            currency_id: 'BRL',
          },
        ],
        back_urls: {
          success: `${baseUrl}/pagamento/resultado`,
          failure: `${baseUrl}/pagamento/resultado`,
          pending: `${baseUrl}/pagamento/resultado`,
        },
        auto_return: 'approved',
        external_reference: String(eventoId),
      },
    });

    return Response.json({ init_point: result.init_point });
  } catch (err) {
    console.error('[MP] Erro ao criar preferência:', JSON.stringify(err, null, 2));
    const message = err instanceof Error ? err.message : JSON.stringify(err);
    return Response.json({ error: message }, { status: 500 });
  }
}
