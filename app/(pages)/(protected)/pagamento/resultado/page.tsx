'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Clock, ArrowLeft } from 'lucide-react';
import { useCurrentUser } from '@/app/lib/hooks/useCurrentUser';
import { checkRegistration, createRegistration } from '@/app/lib/services/database/registrationService';

function ResultadoContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useCurrentUser();

  const status = searchParams.get('collection_status') || searchParams.get('status');
  const externalReference = searchParams.get('external_reference');

  const [done, setDone] = useState(false);
  const [inscriptionError, setInscriptionError] = useState(false);

  useEffect(() => {
    if (!user || !externalReference || done) return;
    if (status !== 'approved') { setDone(true); return; }

    const eventoId = Number(externalReference);
    if (!eventoId) { setDone(true); return; }

    checkRegistration(user.id, eventoId)
      .then(({ data }) => {
        if (data) return;
        return createRegistration({ id_usuario: user.id, id_evento: eventoId });
      })
      .then(() => setDone(true))
      .catch(() => { setInscriptionError(true); setDone(true); });
  }, [user, externalReference, status, done]);

  const isApproved = status === 'approved';
  const isPending = status === 'pending' || status === 'in_process';

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-4 text-center">
      {isApproved ? (
        <>
          <CheckCircle className="h-16 w-16 text-green-500" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pagamento confirmado!</h1>
            {inscriptionError ? (
              <p className="text-sm text-gray-500 mt-2">
                Pagamento aprovado, mas houve um erro ao criar sua inscrição. Entre em contato com o suporte.
              </p>
            ) : (
              <p className="text-sm text-gray-500 mt-2">Você está inscrito no evento.</p>
            )}
          </div>
        </>
      ) : isPending ? (
        <>
          <Clock className="h-16 w-16 text-yellow-500" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pagamento em análise</h1>
            <p className="text-sm text-gray-500 mt-2">
              Confirmaremos sua inscrição assim que o pagamento for aprovado.
            </p>
          </div>
        </>
      ) : (
        <>
          <XCircle className="h-16 w-16 text-red-400" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pagamento não realizado</h1>
            <p className="text-sm text-gray-500 mt-2">
              Tente novamente ou escolha outra forma de pagamento.
            </p>
          </div>
        </>
      )}

      <button
        onClick={() => router.push('/events')}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition mt-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para eventos
      </button>
    </div>
  );
}

export default function PagamentoResultado() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh] text-gray-400 text-sm">
        Processando...
      </div>
    }>
      <ResultadoContent />
    </Suspense>
  );
}
