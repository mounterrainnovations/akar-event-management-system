'use client';

import { ReactNode, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Lenis from 'lenis';

export default function SmoothScroll({ children }: { children: ReactNode }) {
    const lenisRef = useRef<Lenis | null>(null);
    const pathname = usePathname();

    useEffect(() => {
        const lenis = new Lenis();
        lenisRef.current = lenis;

        const originalScrollRestoration = window.history.scrollRestoration;
        window.history.scrollRestoration = 'manual';

        function raf(time: number) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }

        requestAnimationFrame(raf);

        return () => {
            window.history.scrollRestoration = originalScrollRestoration;
            lenis.destroy();
            lenisRef.current = null;
        };
    }, []);

    useEffect(() => {
        const lenis = lenisRef.current;
        if (lenis) {
            requestAnimationFrame(() => {
                lenis.scrollTo(0, { immediate: true, force: true });
            });
            return;
        }
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }, [pathname]);

    return <>{children}</>;
}
