import type { Metadata } from 'next';
import './globals.css';
import SmoothScroll from '@/components/SmoothScroll';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { AuthProvider } from '@/context/AuthContext';
import AuthModal from '@/components/auth/AuthModal';
import { inter, montserrat, instrumentSerif } from '@/lib/fonts';

export const metadata: Metadata = {
    title: 'Akar Women Group',
    description: 'Empowering Women & Children through Education and Care',
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={`${inter.className} ${montserrat.variable} ${instrumentSerif.variable}`}>
                <AuthProvider>
                    <SmoothScroll>
                        <Header />
                        {children}
                        <Footer />
                        <AuthModal />
                    </SmoothScroll>
                </AuthProvider>
            </body>
        </html>
    );
}
