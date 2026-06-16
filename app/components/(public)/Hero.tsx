'use client'
import React from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Parallax, Pagination, Navigation, Autoplay } from 'swiper/modules'
import 'swiper/swiper-bundle.css'
import './Hero.css'

const slides = [
    {
        desktop: '/images/hero/banner1/desktop.png',
        tablet:  '/images/hero/banner1/tablet.png',
        mobile:  '/images/hero/banner1/mobile.png',
        texto: 'A plataforma de eventos que conecta pessoas e cria experiências inesquecíveis.',
    },
    {
        desktop: '/images/hero/banner2/desktop.png',
        tablet:  '/images/hero/banner2/tablet.png',
        mobile:  '/images/hero/banner2/mobile.png',
        texto: 'É se conectar com eventos incríveis e criar memórias inesquecíveis.',
    },
    {
        desktop: '/images/hero/banner3/desktop.png',
        tablet:  '/images/hero/banner3/tablet.png',
        mobile:  '/images/hero/banner3/mobile.png',
        texto: 'Descubra, participe e compartilhe momentos únicos com a Festaê!',
    },
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
                {slides.map((item, index) => (
                    <SwiperSlide key={index}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <picture className="absolute inset-0 w-full h-full">
                            <source media="(min-width: 1024px)" srcSet={item.desktop} />
                            <source media="(min-width: 768px)"  srcSet={item.tablet} />
                            <img src={item.mobile} alt="Banner" className="w-full h-full object-cover" />
                        </picture>
                        <div className="title" data-swiper-parallax="-300">Festaê</div>
                        <div className="subtitle" data-swiper-parallax="-200">{item.texto}</div>
                    </SwiperSlide>
                ))}
            </Swiper>
        </>
    )
}