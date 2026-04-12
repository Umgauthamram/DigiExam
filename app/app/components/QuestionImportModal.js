'use client';

import { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertTriangle, X, Plus, Loader2, ArrowRight } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function QuestionImportModal({ isOpen, onClose, onImport, existingQuestions = [] }) {
    const [activeTab, setActiveTab] = useState('excel'); // 'excel' or 'text'
    const [parsedQuestions, setParsedQuestions] = useState([]);
    const [duplicateCount, setDuplicateCount] = useState(0);
    const [error, setError] = useState('');
    const [textInput, setTextInput] = useState('');
    const [isImporting, setIsImporting] = useState(false);

    if (!isOpen) return null;

    // Helper for deduplication
    const filterDuplicates = (questions) => {
        const existingSet = new Set(existingQuestions.map(q => q.text.toLowerCase().trim()));
        const unique = [];
        let dups = 0;

        questions.forEach(q => {
            if (q.text && !existingSet.has(q.text.toLowerCase().trim())) {
                unique.push(q);
                // unique in this batch too?
                existingSet.add(q.text.toLowerCase().trim());
            } else {
                dups++;
            }
        });

        setDuplicateCount(dups);
        return unique;
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsImporting(true);
        setError('');
        setDuplicateCount(0);

        try {
            // Excel/CSV Handling (Client-side)
            if (file.name.endsWith('.xlsx') || file.name.endsWith('.csv')) {
                const data = await file.arrayBuffer();
                const workbook = XLSX.read(data);
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(sheet);

                // Simple mapping logic
                const questions = jsonData.map(row => ({
                    text: row.Question || row.text || row.question,
                    options: [
                        { text: row.OptionA || row['Option A'] || 'Option 1', isCorrect: row.Answer === 'A' || row.Answer === 'Option A' },
                        { text: row.OptionB || row['Option B'] || 'Option 2', isCorrect: row.Answer === 'B' || row.Answer === 'Option B' },
                        { text: row.OptionC || row['Option C'] || 'Option 3', isCorrect: row.Answer === 'C' || row.Answer === 'Option C' },
                        { text: row.OptionD || row['Option D'] || 'Option 4', isCorrect: row.Answer === 'D' || row.Answer === 'Option D' },
                    ],
                    correctOptionIndex: 0
                }));

                // Fix correctOptionIndex
                questions.forEach(q => {
                    const correctIdx = q.options.findIndex(o => o.isCorrect);
                    q.correctOptionIndex = correctIdx !== -1 ? correctIdx : 0;
                    q.options.forEach((o, i) => o.isCorrect = i === q.correctOptionIndex);
                });

                const uniqueQuestions = filterDuplicates(questions);
                setParsedQuestions(uniqueQuestions);
                setIsImporting(false);
            }
            // PDF/DOCX Handling (Server-side API)
            else if (file.name.endsWith('.pdf') || file.name.endsWith('.docx')) {
                const formData = new FormData();
                formData.append('file', file);

                const res = await fetch('/api/admin/exams/parse-file', {
                    method: 'POST',
                    body: formData
                });

                if (!res.ok) throw new Error('Failed to parse document');

                const data = await res.json();

                if (data.text) {
                    setTextInput(data.text);
                    setActiveTab('text');
                    // deduplication happens in parseText() when user clicks Analyze
                } else {
                    setError('No text content found in document.');
                }
                setIsImporting(false);
            } else {
                setError('Unsupported file format. Please upload .xlsx, .csv, .pdf, or .docx');
                setIsImporting(false);
            }
        } catch (err) {
            console.error(err);
            setError('Failed to process file. ' + (err.message || ''));
            setIsImporting(false);
        }
    };

    const parseText = () => {
        if (!textInput.trim()) return;
        setDuplicateCount(0);

        // Heuristic Parser
        // Expects: 1. Question? \n a) Opt1 \n b) Opt2 ... \n Answer: c
        const lines = textInput.split('\n').map(l => l.trim()).filter(l => l);
        const questions = [];
        let currentQ = null;

        const qPattern = /^\d+[\.)]\s+(.*)/;
        const optPattern = /^([a-dA-D])[\.)]\s+(.*)/;
        const ansPattern = /^(?:Answer|Ans|Correct Answer|Correct)[:\s-]+\s*([a-dA-D])/i;

        lines.forEach(line => {
            const qMatch = line.match(qPattern);
            const optMatch = line.match(optPattern);
            const ansMatch = line.match(ansPattern);

            if (qMatch) {
                if (currentQ) questions.push(currentQ);
                currentQ = {
                    text: qMatch[1],
                    options: [],
                    correctOptionIndex: 0 // Default to 0, update if Answer found
                };
            } else if (optMatch && currentQ) {
                currentQ.options.push({
                    text: optMatch[2],
                    isCorrect: false
                });
            } else if (ansMatch && currentQ) {
                // Found "Answer: c"
                const correctLabel = ansMatch[1].toLowerCase(); // 'c'
                const correctIndex = correctLabel.charCodeAt(0) - 97; // 'a' code is 97

                if (correctIndex >= 0 && correctIndex < 4) {
                    currentQ.correctOptionIndex = correctIndex;
                }
            }
        });
        if (currentQ) questions.push(currentQ);

        // Normalize options (pad to 4 if needed) and mark correct one
        questions.forEach(q => {
            while (q.options.length < 4) {
                q.options.push({ text: 'Option ' + (q.options.length + 1), isCorrect: false });
            }
            // Apply strict correctness based on index
            q.options.forEach((o, i) => {
                o.isCorrect = i === q.correctOptionIndex;
            });
        });

        const uniqueQuestions = filterDuplicates(questions);
        setParsedQuestions(uniqueQuestions);
    };

    const handleFinalImport = async () => {
        setIsImporting(true);
        try {
            await onImport(parsedQuestions);
            // Wait a bit to show success animation if needed, or just close
            setTimeout(() => {
                setParsedQuestions([]);
                setTextInput('');
                setIsImporting(false);
                onClose();
            }, 500);
        } catch (e) {
            setIsImporting(false);
            console.error("Import failed", e);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300">
            {/* Ambient background glow for modal */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-900/10 rounded-full blur-[100px]"></div>
            </div>

            <div className="bg-slate-900/90 backdrop-blur-xl rounded-3xl w-full max-w-2xl border border-white/10 shadow-2xl flex flex-col max-h-[90vh] relative overflow-hidden ring-1 ring-white/5">
                {/* Header Gradient Line */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-75"></div>

                <div className="flex justify-between items-center p-6 pb-2">
                    <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                        <Upload className="h-6 w-6 text-purple-400" />
                        Import Questions
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white hover:bg-white/10 p-2 rounded-full transition-all">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="px-6 pt-4 pb-0 flex gap-4">
                    <button
                        onClick={() => setActiveTab('excel')}
                        className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all border ${activeTab === 'excel'
                            ? 'bg-purple-600/20 border-purple-500/50 text-purple-300 shadow-[0_0_20px_rgba(168,85,247,0.15)]'
                            : 'bg-black/20 border-white/5 text-slate-500 hover:bg-white/5 hover:text-slate-300'}`}
                    >
                        <div className={`p-1 rounded-full ${activeTab === 'excel' ? 'bg-purple-500 text-white' : 'bg-slate-700'}`}>
                            <Upload className="h-3 w-3" />
                        </div>
                        Upload Excel/CSV
                    </button>
                    <button
                        onClick={() => setActiveTab('text')}
                        className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all border ${activeTab === 'text'
                            ? 'bg-blue-600/20 border-blue-500/50 text-blue-300 shadow-[0_0_20px_rgba(59,130,246,0.15)]'
                            : 'bg-black/20 border-white/5 text-slate-500 hover:bg-white/5 hover:text-slate-300'}`}
                    >
                        <div className={`p-1 rounded-full ${activeTab === 'text' ? 'bg-blue-500 text-white' : 'bg-slate-700'}`}>
                            <FileText className="h-3 w-3" />
                        </div>
                        Paste Text (PDF/Doc)
                    </button>
                </div>

                <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-6 text-sm flex items-start gap-3">
                            <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </div>
                    )}

                    {activeTab === 'excel' && (
                        <div className="h-full flex flex-col justify-center">
                            <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-slate-700 rounded-2xl cursor-pointer bg-black/20 hover:bg-black/40 hover:border-purple-500/50 transition-all group relative overflow-hidden">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6 relative z-10">
                                    <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 group-hover:bg-purple-900/20 group-hover:text-purple-400">
                                        <Upload className="w-8 h-8 text-slate-400 group-hover:text-purple-400 transition-colors" />
                                    </div>
                                    <p className="mb-2 text-sm text-slate-300 font-medium">Click to upload or drag and drop</p>
                                    <p className="text-xs text-slate-500">Excel (.xlsx), CSV, PDF, or Word (.docx)</p>
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                                <input type="file" accept=".xlsx, .csv, .pdf, .docx" onChange={handleFileUpload} className="hidden" />
                            </label>

                            <div className="mt-4 p-4 bg-blue-900/10 border border-blue-500/20 rounded-xl">
                                <p className="text-xs text-blue-300 font-mono">
                                    <strong className="text-blue-200">Required Columns:</strong> Question, Option A, Option B, Option C, Option D, Answer
                                </p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'text' && (
                        <div className="h-full flex flex-col">
                            <div className="relative flex-1 group">
                                <textarea
                                    className="w-full h-full bg-black/30 border border-white/10 rounded-xl p-5 text-slate-200 font-mono text-sm focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all min-h-[240px] resize-none"
                                    placeholder={`Paste text here like:
1. What is the color of the sky?
a) Red
b) Blue
c) Green
d) Yellow

Answer: b

2. Next question...`}
                                    value={textInput}
                                    onChange={(e) => setTextInput(e.target.value)}
                                ></textarea>
                                <div className="absolute bottom-4 right-4 pointer-events-none text-xs text-slate-500 bg-black/50 px-2 py-1 rounded backdrop-blur-sm border border-white/5">
                                    Markdown Supported
                                </div>
                            </div>

                            <button
                                onClick={parseText}
                                className="mt-4 w-full bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 text-white py-3 rounded-xl font-bold border border-white/5 flex items-center justify-center gap-2 group transition-all"
                            >
                                <ArrowRight className="h-4 w-4 text-blue-400 group-hover:translate-x-1 transition-transform" />
                                Analyze Text
                            </button>
                        </div>
                    )}

                    {parsedQuestions.length > 0 && (
                        <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-green-400 font-bold flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                                        <CheckCircle className="h-4 w-4" />
                                    </div>
                                    Ready to Import: <span className="text-white">{parsedQuestions.length} Questions</span>
                                </h3>
                                <div className="flex gap-4 items-center">
                                    {duplicateCount > 0 && (
                                        <span className="text-xs text-yellow-500 font-medium bg-yellow-500/10 px-2 py-1 rounded-lg border border-yellow-500/20">
                                            {duplicateCount} duplicates ignored
                                        </span>
                                    )}
                                    <button onClick={() => setParsedQuestions([])} className="text-xs text-slate-500 hover:text-red-400 underline">Clear</button>
                                </div>
                            </div>

                            <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-2 bg-black/20 p-2 rounded-xl border border-white/5">
                                {parsedQuestions.map((q, i) => (
                                    <div key={i} className="bg-slate-800/50 p-3 rounded-lg border border-white/5 text-sm hover:border-purple-500/30 transition-colors flex gap-3">
                                        <span className="font-mono text-purple-400 font-bold text-xs pt-0.5">Q{i + 1}</span>
                                        <span className="text-slate-300 line-clamp-1">{q.text}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-white/5 flex justify-end gap-3 bg-black/20">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 rounded-xl font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleFinalImport}
                        disabled={parsedQuestions.length === 0 || isImporting}
                        className="px-8 py-3 rounded-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white disabled:opacity-50 disabled:cursor-not-allowed disabled:grayscale shadow-lg shadow-purple-900/20 transition-all flex items-center gap-2"
                    >
                        {isImporting ? (
                            <>
                                <Loader2 className="h-5 w-5 animate-spin" />
                                Adding...
                            </>
                        ) : (
                            <>
                                <Plus className="h-5 w-5" />
                                Add Questions
                            </>
                        )}
                    </button>
                </div>

            </div>
        </div>
    );
}
