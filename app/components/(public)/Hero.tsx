'use client'
import React from 'react'
import Image from 'next/image'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Parallax, Pagination, Navigation, Autoplay } from 'swiper/modules'
import 'swiper/swiper-bundle.css'
import './Hero.css'

const slides=[
    {image: '/images/hero/banner1.png',texto: 'A plataforma de eventos que conecta pessoas e cria experiências inesquecíveis.'},
    {image: '/images/hero/banner2.png',texto: 'É se conectar com eventos incríveis e criar memórias inesquecíveis.'},
    {image: '/images/hero/banner3.png',texto: 'Descubra, participe e compartilhe momentos únicos com a Festaê!'}    
]
export default function Hero() {
    return (
        <>
            <Swiper
                style={{'--swiper-navigation-color': '#fff','--swiper-pagination-color': '#fff',} as React.CSSProperties}
                speed={600}
                parallax={true}
                pagination={{ clickable: true }}
                navigation={true}
                autoplay={{ delay: 4000, disableOnInteraction: false }}
                modules={[Parallax, Pagination, Navigation, Autoplay]}
                className="mySwiper"
            >
                {slides.map((item,index) =>(
                    <SwiperSlide key={index}>
                        <Image src={item.image} className="absolute inset-0 w-full h-full object-cover" width={800} height={600}  alt="Banner"/>
                        <div className="title" data-swiper-parallax="-300">Festaê</div>
                        <div className="subtitle" data-swiper-parallax="-200">{item.texto}</div>
                    </SwiperSlide>
                ))}
            </Swiper>
        </>
    )
}