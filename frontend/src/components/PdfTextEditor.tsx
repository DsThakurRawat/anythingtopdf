"use client";

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Search, 
  Replace, 
  Plus, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Download, 
  CaseSensitive,
  ArrowUpCircle,
  Sparkles
} from 'lucide-react';
import axios from 'axios';

interface ReplacementRule {
  id: string;
  find: string;
  replace: string;
  matchCase: boolean;
}

export const PdfTextEditor: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [rules, setRules] = useState<ReplacementRule[]>([
    { id: '1', find: '', replace: '', matchCase: false }
  ]);
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [stats, setStats] = useState<{ total: number; pages: number[] } | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setSelectedFile(acceptedFiles[0]);
      setStatus('idle');
      setDownloadUrl(null);
      setStats(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    noClick: selectedFile !== null,
    accept: {
      'application/pdf': ['.pdf']
    }
  });

  const addRule = () => {
    setRules((prev) => [
      ...prev,
      { id: Date.now().toString(), find: '', replace: '', matchCase: false }
    ]);
  };

  const removeRule = (id: string) => {
    if (rules.length <= 1) return;
    setRules((prev) => prev.filter((r) => r.id !== id));
  };

  const updateRule = (id: string, field: keyof ReplacementRule, value: any) => {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  const handleProcess = async () => {
    if (!selectedFile) return;

    const validRules = rules.filter((r) => r.find.trim() !== '');
    if (validRules.length === 0) {
      setErrorMessage('Please enter at least one text search term to find.');
      setStatus('error');
      return;
    }

    setStatus('processing');
    setErrorMessage('');

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append(
      'rules',
      JSON.stringify(
        validRules.map((r) => ({
          find: r.find,
          replace: r.replace,
          match_case: r.matchCase
        }))
      )
    );

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL 
        ? `${process.env.NEXT_PUBLIC_API_URL}/pdf/replace-text`
        : 'http://localhost:8000/api/pdf/replace-text';

      const response = await axios.post(apiUrl, formData, {
        responseType: 'blob',
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // Extract stats from headers if available
      const totalReplacements = parseInt(
        response.headers['x-total-replacements'] || '0',
        10
      );
      const pagesModifiedRaw = response.headers['x-pages-modified'] || '[]';
      let pagesModified: number[] = [];
      try {
        pagesModified = JSON.parse(pagesModifiedRaw);
      } catch {
        pagesModified = [];
      }

      setStats({
        total: isNaN(totalReplacements) ? 0 : totalReplacements,
        pages: Array.isArray(pagesModified) ? pagesModified : []
      });

      const url = window.URL.createObjectURL(
        new Blob([response.data], { type: 'application/pdf' })
      );
      setDownloadUrl(url);
      setStatus('success');
    } catch (err: any) {
      console.error(err);
      let msg = 'Failed to replace text in PDF. Please verify your file and search terms.';
      if (err.response && err.response.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const json = JSON.parse(text);
          if (json.error) msg = json.error;
        } catch {
          // ignore
        }
      } else if (err.message) {
        msg = err.message;
      }
      setErrorMessage(msg);
      setStatus('error');
    }
  };

  const removeFile = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedFile(null);
    setStatus('idle');
    setDownloadUrl(null);
    setStats(null);
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center">
      {/* File Upload / Dropzone */}
      {!selectedFile && (
        <div
          {...getRootProps()}
          className={`relative w-full max-w-md mx-auto flex items-center justify-between p-2 pl-6 rounded-full bg-white transition-all duration-300 transform ${
            isDragActive
              ? 'shadow-lg scale-[1.02] border-indigo-300'
              : 'shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-transparent hover:shadow-[0_8px_30px_rgb(0,0,0,0.1)]'
          } cursor-pointer`}
        >
          <input {...getInputProps()} />

          <div className="flex items-center text-gray-400 font-medium tracking-wide text-sm truncate pr-2">
            {isDragActive ? 'Drop PDF here...' : 'Upload a PDF to edit & replace text'}
          </div>

          <div className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6 py-3 font-semibold text-sm transition-colors flex items-center gap-2 flex-shrink-0">
            <ArrowUpCircle className="w-4 h-4" /> Browse PDF
          </div>
        </div>
      )}

      {/* Main Editing Card */}
      <AnimatePresence mode="wait">
        {selectedFile && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 280, damping: 24 }}
            className="w-full bg-white rounded-3xl p-6 sm:p-8 flex flex-col gap-6 shadow-[0_16px_50px_rgb(0,0,0,0.08)] border border-gray-100"
          >
            {/* Header / Active File Info */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3.5 overflow-hidden">
                <div className="bg-indigo-50 p-3 rounded-2xl flex-shrink-0 text-indigo-600">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-gray-900 font-bold truncate text-base">
                    {selectedFile.name}
                  </span>
                  <span className="text-gray-400 text-xs font-medium">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • PDF Document
                  </span>
                </div>
              </div>

              {status !== 'processing' && (
                <button
                  onClick={removeFile}
                  className="text-gray-400 hover:text-red-500 text-sm px-3 py-1.5 rounded-xl hover:bg-red-50 font-medium transition-colors"
                >
                  Change File
                </button>
              )}
            </div>

            {/* Rules Builder */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                  Find & Replace Rules
                </label>
                <span className="text-xs text-gray-400">
                  Leave &quot;Replace With&quot; empty to erase/redact text
                </span>
              </div>

              <div className="flex flex-col gap-3">
                {rules.map((rule, idx) => (
                  <motion.div
                    key={rule.id}
                    layout
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-3 bg-gray-50/80 rounded-2xl border border-gray-100/80 focus-within:border-indigo-200 focus-within:bg-white transition-all"
                  >
                    {/* Find Input */}
                    <div className="flex-1 relative flex items-center">
                      <Search className="w-4 h-4 text-gray-400 absolute left-3.5 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Find text..."
                        value={rule.find}
                        onChange={(e) => updateRule(rule.id, 'find', e.target.value)}
                        disabled={status === 'processing'}
                        className="w-full pl-9 pr-3 py-2 text-sm bg-transparent border-0 outline-none placeholder-gray-400 text-gray-800 font-medium"
                      />
                    </div>

                    <div className="hidden sm:block text-gray-300">→</div>

                    {/* Replace Input */}
                    <div className="flex-1 relative flex items-center">
                      <Replace className="w-4 h-4 text-gray-400 absolute left-3.5 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Replace with..."
                        value={rule.replace}
                        onChange={(e) => updateRule(rule.id, 'replace', e.target.value)}
                        disabled={status === 'processing'}
                        className="w-full pl-9 pr-3 py-2 text-sm bg-transparent border-0 outline-none placeholder-gray-400 text-gray-800 font-medium"
                      />
                    </div>

                    {/* Options: Match Case & Delete Rule */}
                    <div className="flex items-center gap-1 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => updateRule(rule.id, 'matchCase', !rule.matchCase)}
                        title={rule.matchCase ? 'Match Case (Active)' : 'Match Case (Inactive)'}
                        className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all ${
                          rule.matchCase
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'bg-white text-gray-500 hover:text-gray-800 border border-gray-200'
                        }`}
                      >
                        <CaseSensitive className="w-4 h-4" />
                      </button>

                      {rules.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeRule(rule.id)}
                          title="Remove rule"
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Add Rule Button */}
              <button
                type="button"
                onClick={addRule}
                disabled={status === 'processing'}
                className="self-start mt-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Add Another Replacement
              </button>
            </div>

            {/* Action Buttons & Status Feedback */}
            <div className="w-full pt-2 border-t border-gray-100 flex flex-col gap-3">
              {status === 'idle' && (
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleProcess}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl py-3.5 font-bold shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" /> Replace Text &amp; Export PDF
                </motion.button>
              )}

              {status === 'processing' && (
                <div className="w-full flex items-center justify-center gap-3 text-indigo-600 font-semibold bg-indigo-50/80 py-4 rounded-2xl">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Scanning &amp; Replacing Text in PDF...
                </div>
              )}

              {status === 'success' && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col gap-3"
                >
                  <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="bg-emerald-500 text-white p-1 rounded-full">
                        <CheckCircle className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-emerald-950 font-bold text-sm">
                          Text Replaced Successfully!
                        </span>
                        <span className="text-emerald-700 text-xs font-medium">
                          {stats && stats.total > 0
                            ? `Found & replaced ${stats.total} occurrence${stats.total === 1 ? '' : 's'}${
                                stats.pages.length > 0
                                  ? ` across page${stats.pages.length === 1 ? '' : 's'} ${stats.pages.join(', ')}`
                                  : ''
                              }`
                            : 'Document processed cleanly'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <a
                      href={downloadUrl!}
                      download={`edited_${selectedFile.name}`}
                      className="flex-1 text-center bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-2xl font-bold shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" /> Download Edited PDF
                    </a>
                    <button
                      onClick={() => setStatus('idle')}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-5 py-3.5 rounded-2xl font-semibold text-sm transition-all"
                    >
                      Edit Again
                    </button>
                  </div>
                </motion.div>
              )}

              {status === 'error' && (
                <div className="w-full flex items-start gap-3 text-red-700 bg-red-50/90 border border-red-100 p-4 rounded-2xl text-sm">
                  <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div className="flex flex-col flex-1">
                    <span className="font-semibold text-red-900">Conversion Notice</span>
                    <span className="text-red-700 text-xs mt-0.5">{errorMessage}</span>
                  </div>
                  <button
                    onClick={() => setStatus('idle')}
                    className="text-xs font-bold text-red-800 hover:underline ml-2 flex-shrink-0"
                  >
                    Dismiss
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
