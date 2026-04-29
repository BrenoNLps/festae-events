import Navbar from "@/app/components/(protected)/Navbar";
import Sidebar from "@/app/components/(protected)/Sidebar";


export default function ProtectedLayout({children,}: {children: React.ReactNode}) {
    return (
        <div className="w-full h-screen flex flex-col">
            <Navbar />
            <div className="flex flex-1 overflow-hidden">
                <Sidebar />
                <main className="flex-1 overflow-y-auto p-8">
                    {children}
                </main>
            </div>
        </div>
    )
}