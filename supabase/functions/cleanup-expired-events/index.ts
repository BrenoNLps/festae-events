import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

Deno.serve(async () => {
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const cutoff = sevenDaysAgo.toISOString().split('T')[0]

  const { data: eventos, error } = await supabase
    .from('evento')
    .select('id, id_organizador, imagem_url')
    .lt('data_fim', cutoff)
    .not('imagem_url', 'is', null)

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  let cleaned = 0
  for (const evento of eventos ?? []) {
    const folder = `${evento.id_organizador}/${evento.id}`
    const { data: files } = await supabase.storage.from('event-covers').list(folder)

    if (files?.length) {
      const paths = files.map((f: { name: string }) => `${folder}/${f.name}`)
      await supabase.storage.from('event-covers').remove(paths)
    }

    await supabase.from('evento').update({ imagem_url: null }).eq('id', evento.id)
    cleaned++
  }

  return new Response(JSON.stringify({ cleaned }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
