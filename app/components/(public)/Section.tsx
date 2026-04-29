import Image from 'next/image'

const eventos = [
    { id: 1, nome: 'Rock in Rio', cidade: 'Rio de Janeiro', data: '10 maio', preco: 150, imagem: '/images/eventos/evento1.jpg' },
    { id: 2, nome: 'Festival de Jazz', cidade: 'São Paulo', data: '22 junho', preco: 0, imagem: '/images/eventos/evento2.jpg' },
    { id: 3, nome: 'Carnaval de Olinda', cidade: 'Olinda', data: '01 março', preco: 0, imagem: '/images/eventos/evento3.jpg' },
    { id: 4, nome: 'Lollapalooza', cidade: 'São Paulo', data: '05 abril', preco: 200, imagem: '/images/eventos/evento4.jpg' },
    { id: 5, nome: 'Festa Junina Cultural', cidade: 'Fortaleza', data: '15 junho', preco: 30, imagem: '/images/eventos/evento5.jpg' },
    { id: 6, nome: 'Festival Gastronômico', cidade: 'Curitiba', data: '18 agosto', preco: 0, imagem: '/images/eventos/evento6.jpg' },
]

export default function Eventos() {
    return (
        <section className="w-full py-14">
            <h2 className="text-2xl font-bold mb-6 text-black">Eventos</h2>

            <div className="grid grid-cols-3 gap-6">
                {eventos.map((evento) => (
                    <div key={evento.id} className="flex flex-col gap-2">
                        <Image src={evento.imagem} alt={evento.nome} className="w-full h-48 object-cover rounded-2xl bg-gray-200" width={400} height={300}/>
                        <h3 className="font-bold text-base">{evento.nome}</h3>
                        <p className="text-sm text-gray-500">{evento.cidade} - {evento.data}</p>
                        <div>
                            {evento.preco === 0 ? 
                                (<span className="text-sm border border-gray-300 rounded-full px-3 py-1">Grátis</span>) : 
                                (<span className="text-sm border border-gray-300 rounded-full px-3 py-1">R$ {evento.preco.toFixed(2)}</span>)
                            }
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex justify-end mt-6">
                <button className="bg-purple-600 text-white text-sm px-6 py-3 rounded-full hover:bg-purple-700 transition">
                Ver mais
                </button>
            </div>
        </section>
    )
}