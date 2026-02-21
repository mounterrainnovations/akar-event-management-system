import React from "react";
import { instrumentSerif } from "@/lib/fonts";
import { fetchWorkById } from "@/lib/works";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { notFound } from "next/navigation";

export default async function WorkDetailPage(props: { params: Promise<{ id: string }> }) {
    const { id } = await props.params;

    let work;
    try {
        work = await fetchWorkById(id);
    } catch (err) {
        return notFound();
    }

    return (
        <main className="min-h-screen relative bg-white pb-32">
            <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.10]" style={{ backgroundImage: 'url("/event_bg.png")', backgroundSize: 'cover' }} />

            <article className="relative z-10 pt-[120px] max-w-4xl mx-auto px-4 md:px-12 lg:px-16">
                <div className="mb-10">
                    <Link href="/Work" className="inline-flex items-center gap-2 text-[#1a1a1a]/60 hover:text-[#1a1a1a] transition-colors font-medium text-sm mb-8">
                        <ArrowLeft size={16} />
                        Back to works
                    </Link>

                    <div className="flex items-center gap-4 mb-6">
                        <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-[#1a1a1a]/60 bg-[#1a1a1a]/5 px-3 py-1 rounded-full">
                            {work.category}
                        </span>
                        <span className="text-sm font-medium text-[#1a1a1a]/50">
                            {format(new Date(work.createdAt), "MMMM do, yyyy")}
                        </span>
                    </div>

                    <h1 className={`${instrumentSerif.className} text-4xl md:text-5xl lg:text-6xl text-[#1a1a1a] leading-[1.05] mb-6`}>
                        {work.title}
                    </h1>

                    <p className="text-lg font-medium text-[#1a1a1a]/80">
                        By {work.author}
                    </p>
                </div>

                {work.coverImageUrl && (
                    <div className="w-full aspect-video rounded-2xl overflow-hidden bg-neutral-100 mb-12 shadow-sm border border-[#1a1a1a]/5">
                        <img src={work.coverImageUrl} alt={work.title} className="w-full h-full object-cover" />
                    </div>
                )}

                {/* Content Body */}
                <div
                    className="prose prose-lg prose-neutral max-w-none text-[#1a1a1a]/80"
                    dangerouslySetInnerHTML={{ __html: work.content }}
                    style={{
                        // Add some basic styling here just in case Tailwind Prose isn't configured
                        lineHeight: "1.8",
                    }}
                />

                {/* Global Styles for the injected HTML content to make sure it looks beautiful and matches the minimal aesthetic */}
                <style dangerouslySetInnerHTML={{
                    __html: `
          .prose h1, .prose h2, .prose h3 {
             color: #1a1a1a;
             font-family: ${instrumentSerif.style.fontFamily};
             margin-top: 2rem;
             margin-bottom: 1rem;
             font-weight: normal;
             line-height: 1.2;
          }
          .prose h1 { font-size: 2.5rem; }
          .prose h2 { font-size: 2rem; }
          .prose h3 { font-size: 1.5rem; }
          .prose p { margin-bottom: 1.5rem; }
          .prose img { width: 100%; border-radius: 1rem; margin: 2rem 0; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); border: 1px solid rgba(0,0,0,0.05); }
          .prose ul, .prose ol { margin-left: 1.5rem; margin-bottom: 1.5rem; }
          .prose ul { list-style-type: disc; }
          .prose ol { list-style-type: decimal; }
          .prose li { margin-bottom: 0.5rem; }
          .prose blockquote { border-left: 4px solid #db2929; padding-left: 1rem; font-style: italic; color: #1a1a1a; margin-top: 1.5rem; margin-bottom: 1.5rem; background: rgba(0,0,0,0.02); padding: 1rem 1rem 1rem 1.5rem; border-radius: 0 0.5rem 0.5rem 0;}
          .prose a { color: #db2929; text-decoration: underline; text-underline-offset: 4px; }
          .prose strong { color: #1a1a1a; font-weight: 600; }
        `}} />
            </article>
        </main>
    );
}
