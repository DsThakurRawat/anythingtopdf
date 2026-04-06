import React from 'react';
import { FileUploader } from '@/components/FileUploader';

export default function Home() {
  return (
    <main className="min-h-screen bg-white relative flex flex-col pt-12 items-center w-full">
      {/* Header matching the screenshot style */}
      <header className="w-full max-w-6xl px-6 flex items-center justify-between z-20 absolute top-8 left-1/2 -translate-x-1/2">
        <div className="flex items-center gap-2 font-bold text-lg tracking-tight">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" x2="12" y1="15" y2="3" />
          </svg>
          PDFify
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm font-semibold tracking-wide">
          <a href="#" className="hover:text-black/70">Images</a>
          <a href="#" className="hover:text-black/70">Office</a>
          <a href="#" className="hover:text-black/70">ZIP Archives</a>
          <a href="#" className="hover:text-black/70">Contact</a>
        </nav>
      </header>

      {/* The large subtle blue/cyan gradient background blob matching the screenshot */}
      <div className="absolute top-0 left-0 w-full h-[450px] bg-gradient-to-b from-blue-400/40 via-cyan-200/20 to-transparent pointer-events-none" />

      {/* Hero Section */}
      <div className="relative z-10 w-full max-w-4xl mx-auto text-center mt-32 md:mt-40 mb-12 px-4">
        <h1 className="text-4xl md:text-[3.5rem] leading-tight font-extrabold tracking-tight mb-6 text-black">
          Convert anything to PDF.
          <br className="hidden md:inline"/> And never worry about formatting again.
        </h1>
        <p className="text-lg md:text-xl text-gray-500 font-medium mb-12 max-w-2xl mx-auto">
          Drop any Image, Presentation (PPTX), or ZIP file. We merge everything into a clean, native PDF instantly.
        </p>

        {/* The File Uploader Component replaces the "Email input" from the screenshot design */}
        <FileUploader />
      </div>

      {/* Feature Cards matching the subtle pastels from screenshot 2 */}
      <div className="relative z-10 w-full max-w-5xl mx-auto px-4 mt-8 flex flex-col md:flex-row items-stretch justify-center gap-4">
        <div className="flex-1 bg-blue-50/70 p-8 rounded-3xl backdrop-blur-md">
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center mb-6 text-blue-500 shadow-sm">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          </div>
          <h3 className="font-bold text-xl mb-2 text-black">Images</h3>
          <p className="text-gray-600 font-medium text-sm">Lossless conversion for JPG, PNG, and WEBP. High quality output.</p>
        </div>
        
        <div className="flex-1 bg-orange-50/70 p-8 rounded-3xl backdrop-blur-md">
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center mb-6 text-orange-500 shadow-sm">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          </div>
          <h3 className="font-bold text-xl mb-2 text-black">Office</h3>
          <p className="text-gray-600 font-medium text-sm">Support for presentations (PPTX) with perfect layout retention.</p>
        </div>

        <div className="flex-1 bg-purple-50/70 p-8 rounded-3xl backdrop-blur-md">
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center mb-6 text-purple-500 shadow-sm">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
          </div>
          <h3 className="font-bold text-xl mb-2 text-black">ZIP Archives</h3>
          <p className="text-gray-600 font-medium text-sm">Drop a ZIP file and we'll extract and merge all content into a single PDF instantly.</p>
        </div>
      </div>

    </main>
  );
}
