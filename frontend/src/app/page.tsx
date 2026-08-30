"use client";

import React, { useState } from 'react';
import { FileUploader } from '@/components/FileUploader';
import { PdfTextEditor } from '@/components/PdfTextEditor';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeftRight, Edit3, Image, Presentation, Archive, Sparkles } from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'convert' | 'edit'>('convert');

  return (
    <main className="min-h-screen bg-white relative flex flex-col pt-12 items-center w-full pb-20">
      {/* Header */}
      <header className="w-full max-w-6xl px-6 flex items-center justify-between z-20 absolute top-8 left-1/2 -translate-x-1/2">
        <div className="flex items-center gap-2 font-bold text-lg tracking-tight text-gray-900">
          <svg className="w-5 h-5 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" x2="12" y1="15" y2="3" />
          </svg>
          <span>PDFify</span>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm font-semibold tracking-wide text-gray-600">
          <button 
            onClick={() => setActiveTab('convert')} 
            className={`transition-colors ${activeTab === 'convert' ? 'text-black font-bold' : 'hover:text-black'}`}
          >
            Converter
          </button>
          <button 
            onClick={() => setActiveTab('edit')} 
            className={`transition-colors ${activeTab === 'edit' ? 'text-indigo-600 font-bold' : 'hover:text-black'}`}
          >
            Text Editor
          </button>
        </nav>
      </header>

      {/* Dynamic ambient gradient background */}
      <div 
        className={`absolute top-0 left-0 w-full h-[500px] pointer-events-none transition-all duration-700 ${
          activeTab === 'convert'
            ? 'bg-gradient-to-b from-blue-400/30 via-cyan-200/15 to-transparent'
            : 'bg-gradient-to-b from-indigo-400/30 via-purple-200/15 to-transparent'
        }`} 
      />

      {/* Hero Section */}
      <div className="relative z-10 w-full max-w-4xl mx-auto text-center mt-28 md:mt-36 mb-10 px-4">
        {/* Mode Switcher Pill */}
        <div className="inline-flex items-center p-1.5 rounded-full bg-gray-100/90 backdrop-blur-md border border-gray-200/80 mb-8 shadow-inner">
          <button
            onClick={() => setActiveTab('convert')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs md:text-sm font-bold transition-all ${
              activeTab === 'convert'
                ? 'bg-white text-gray-900 shadow-md scale-[1.02]'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <ArrowLeftRight className="w-4 h-4 text-blue-500" />
            Convert to PDF
          </button>
          <button
            onClick={() => setActiveTab('edit')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs md:text-sm font-bold transition-all ${
              activeTab === 'edit'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20 scale-[1.02]'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Edit &amp; Replace Text
          </button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'convert' ? (
            <motion.div
              key="convert-hero"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <h1 className="text-4xl md:text-[3.5rem] leading-tight font-extrabold tracking-tight mb-5 text-gray-900">
                Convert anything to PDF.
                <br className="hidden md:inline"/> And never worry about formatting again.
              </h1>
              <p className="text-lg md:text-xl text-gray-500 font-medium mb-10 max-w-2xl mx-auto">
                Drop any Image, Presentation (PPTX), or ZIP archive. We merge everything into a clean, native PDF instantly.
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="edit-hero"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <h1 className="text-4xl md:text-[3.5rem] leading-tight font-extrabold tracking-tight mb-5 text-gray-900">
                Search, replace &amp; edit text in PDF.
                <br className="hidden md:inline"/> Preserving fonts, colors, and layouts.
              </h1>
              <p className="text-lg md:text-xl text-gray-500 font-medium mb-10 max-w-2xl mx-auto">
                Upload your PDF, define your find &amp; replace rules or redactions, and download your updated PDF with perfect styling.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dynamic Tool Container */}
        <AnimatePresence mode="wait">
          {activeTab === 'convert' ? (
            <motion.div
              key="tool-convert"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.25 }}
            >
              <FileUploader />
            </motion.div>
          ) : (
            <motion.div
              key="tool-edit"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.25 }}
            >
              <PdfTextEditor />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Feature Cards Grid */}
      <div className="relative z-10 w-full max-w-5xl mx-auto px-4 mt-12 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50/70 p-6 rounded-3xl backdrop-blur-md border border-blue-100/50">
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center mb-5 text-blue-500 shadow-sm">
            <Image className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-lg mb-1.5 text-gray-900">Images to PDF</h3>
          <p className="text-gray-600 font-medium text-xs leading-relaxed">Lossless conversion for JPG, PNG, and WEBP with natural ordering.</p>
        </div>
        
        <div className="bg-orange-50/70 p-6 rounded-3xl backdrop-blur-md border border-orange-100/50">
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center mb-5 text-orange-500 shadow-sm">
            <Presentation className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-lg mb-1.5 text-gray-900">Office Presentations</h3>
          <p className="text-gray-600 font-medium text-xs leading-relaxed">Convert PPTX documents directly into clean, vector-rendered PDFs.</p>
        </div>

        <div className="bg-purple-50/70 p-6 rounded-3xl backdrop-blur-md border border-purple-100/50">
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center mb-5 text-purple-500 shadow-sm">
            <Archive className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-lg mb-1.5 text-gray-900">ZIP Unpacking</h3>
          <p className="text-gray-600 font-medium text-xs leading-relaxed">Safely extract and merge multi-image archives into a single PDF document.</p>
        </div>

        <div className="bg-indigo-50/70 p-6 rounded-3xl backdrop-blur-md border border-indigo-100/50">
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center mb-5 text-indigo-600 shadow-sm">
            <Edit3 className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-lg mb-1.5 text-gray-900">Search &amp; Replace</h3>
          <p className="text-gray-600 font-medium text-xs leading-relaxed">Find and replace text or redact information while preserving original typography.</p>
        </div>
      </div>
    </main>
  );
}
