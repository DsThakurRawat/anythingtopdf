"use client";

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { File, CheckCircle, XCircle, Loader2, ArrowUpCircle } from 'lucide-react';
import axios from 'axios';

export const FileUploader: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setSelectedFile(acceptedFiles[0]);
      setStatus('idle');
      setDownloadUrl(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    noClick: selectedFile !== null, // Prevent opening file dialog if we already have a file
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'application/vnd.ms-powerpoint': ['.ppt'],
      'application/zip': ['.zip', '.x-zip-compressed']
    }
  });

  const handleUpload = async () => {
    if (!selectedFile) return;

    setStatus('uploading');
    const formData = new FormData();
    formData.append('files', selectedFile);

    try {
      const response = await axios.post('http://localhost:8000/api/convert', formData, {
        responseType: 'blob',
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      setDownloadUrl(url);
      setStatus('success');
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Conversion failed. Please try again.');
      setStatus('error');
    }
  };

  const removeFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(null);
    setStatus('idle');
    setDownloadUrl(null);
  };

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col items-center">
      
      {!selectedFile && (
        <div 
          {...getRootProps()} 
          className={`relative w-full max-w-md mx-auto flex items-center justify-between p-2 pl-6 rounded-full bg-white transition-all duration-300 transform ${
            isDragActive ? 'shadow-lg scale-[1.02] border-blue-200' : 'shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-transparent hover:shadow-[0_8px_30px_rgb(0,0,0,0.1)]'
          } cursor-pointer`}
        >
          <input {...getInputProps()} />
          
          <div className="flex items-center text-gray-400 font-medium tracking-wide">
            {isDragActive ? 'Drop file here...' : 'Upload an Image, PPTX, or ZIP'}
          </div>

          <div className="bg-black text-white hover:bg-gray-800 rounded-full px-6 py-3 font-semibold text-sm transition-colors flex items-center gap-2">
             <ArrowUpCircle className="w-4 h-4" /> Browse
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        {selectedFile && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="w-full max-w-md mx-auto bg-white rounded-2xl p-4 flex flex-col gap-4 shadow-[0_12px_40px_rgb(0,0,0,0.08)] border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="bg-blue-50 p-2.5 rounded-xl flex-shrink-0">
                  <File className="w-6 h-6 text-blue-500" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-gray-900 font-semibold truncate text-sm">{selectedFile.name}</span>
                  <span className="text-gray-400 text-xs font-medium">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
              </div>
              
              {status === 'idle' && (
                <button 
                  onClick={removeFile}
                  className="text-gray-400 hover:text-gray-600 text-sm px-2 font-medium"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="w-full">
              {status === 'idle' && (
                <motion.button 
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleUpload}
                  className="w-full bg-black text-white rounded-xl py-3 font-bold shadow-md hover:shadow-lg transition-all"
                >
                  Convert to PDF
                </motion.button>
              )}
              {status === 'uploading' && (
                <div className="w-full flex items-center justify-center gap-2 text-blue-600 font-medium bg-blue-50 py-3 rounded-xl">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Converting Document...
                </div>
              )}
              {status === 'success' && (
                <div className="w-full flex items-center justify-between gap-4">
                  <span className="flex items-center gap-1.5 text-emerald-600 text-sm font-semibold">
                    <CheckCircle className="w-4 h-4" /> Success
                  </span>
                  <a 
                    href={downloadUrl!} 
                    download={`${selectedFile.name.split('.')[0]}.pdf`}
                    className="flex-1 text-center bg-emerald-50 text-emerald-700 hover:bg-emerald-100 py-3 rounded-xl font-bold transition-all"
                  >
                    Download PDF
                  </a>
                </div>
              )}
              {status === 'error' && (
                <div className="w-full flex items-center gap-2 text-red-600 font-medium bg-red-50 p-3 rounded-xl text-sm">
                  <XCircle className="w-4 h-4 flex-shrink-0" /> {errorMessage}
                  <button onClick={removeFile} className="ml-auto underline decoration-red-300">Retry</button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
