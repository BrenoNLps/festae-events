"use client";

import Navbar from "../components/(public)/Navbar";
import Hero from "../components/(public)/Hero";
import SearchBar from "../components/(public)/SearchBar";
import Footer from "../components/(public)/Footer";
import Eventos from "../components/(public)/Section";

export default function Home() {
  return (
    <div className="w-full">
      <Navbar />

      <div className="w-[80%] min-h-screen mx-auto">
        <SearchBar />
        <main className="w-full">
          <Hero />
          <Eventos />
        </main>
      </div>

      <Footer/>
      
    </div>
  );
}