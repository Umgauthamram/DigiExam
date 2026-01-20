'use client';

import { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertTriangle, X } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function QuestionImportModal({ isOpen, onClose, onImport }) {
    const [activeTab, setActiveTab] = useState('excel'); // 'excel' or 'text'
    const [parsedQuestions, setParsedQuestions] = useState([]);
    const [error, setError] = useState('');
    const [textInput, setTextInput] = useState('');

    if (!isOpen) return null;

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
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
                // Default to first option if no answer specified (for safety)
                correctOptionIndex: 0
            }));

            // Fix correctOptionIndex based on parsing
            questions.forEach(q => {
                const correctIdx = q.options.findIndex(o => o.isCorrect);
                q.correctOptionIndex = correctIdx !== -1 ? correctIdx : 0;
                // Ensure structure for parent component
                q.options.forEach((o, i) => o.isCorrect = i === q.correctOptionIndex);
            });

            setParsedQuestions(questions);
            setError('');
        } catch (err) {
            console.error(err);
            setError('Failed to parse Excel file. Ensure columns: Question, Option A, Option B, Option C, Option D, Answer');
        }
    };

    const parseText = () => {
        if (!textInput.trim()) return;

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

        setParsedQuestions(questions);
    };

    const handleFinalImport = () => {
        onImport(parsedQuestions);
        setParsedQuestions([]);
        setTextInput('');
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-2xl w-full max-w-2xl border border-slate-700 flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center p-6 border-b border-slate-700">
                    <h2 className="text-xl font-bold text-white">Import Questions</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="h-6 w-6" /></button>
                </div>

                <div className="p-6 flex gap-4 border-b border-slate-700">
                    <button
                        onClick={() => setActiveTab('excel')}
                        className={`flex-1 py-2 rounded-lg font-bold flex items-center justify-center gap-2 ${activeTab === 'excel' ? 'bg-green-600 text-white' : 'bg-slate-700 text-slate-400'}`}
                    >
                        <Upload className="h-4 w-4" /> Upload Excel/CSV
                    </button>
                    <button
                        onClick={() => setActiveTab('text')}
                        className={`flex-1 py-2 rounded-lg font-bold flex items-center justify-center gap-2 ${activeTab === 'text' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400'}`}
                    >
                        <FileText className="h-4 w-4" /> Paste Text (PDF/Doc)
                    </button>
                </div>

                <div className="p-6 flex-1 overflow-y-auto">
                    {error && <div className="bg-red-500/10 text-red-400 p-3 rounded-lg mb-4 text-sm flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> {error}</div>}

                    {activeTab === 'excel' && (
                        <div className="text-center py-8 border-2 border-dashed border-slate-600 rounded-xl bg-slate-800/50">
                            <Upload className="h-10 w-10 text-slate-500 mx-auto mb-4" />
                            <p className="text-slate-400 mb-4">Drag and drop file or click to upload</p>
                            <input type="file" accept=".xlsx, .csv" onChange={handleFileUpload} className="text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-500 file:text-white hover:file:bg-blue-600 cursor-pointer" />
                            <p className="text-xs text-slate-600 mt-4">Required Cols: Question, Option A, Option B, Option C, Option D, Answer</p>
                        </div>
                    )}

                    {activeTab === 'text' && (
                        <div className="h-full flex flex-col">
                            <textarea
                                className="w-full flex-1 bg-slate-900 border border-slate-700 rounded-lg p-4 text-slate-300 font-mono text-sm focus:outline-none focus:border-blue-500 min-h-[200px]"
                                placeholder={`Paste text here like:
1. What is the color of the sky?
a) Red
b) Blue
c) Green
d) Yellow

2. Next question...`}
                                value={textInput}
                                onChange={(e) => setTextInput(e.target.value)}
                            ></textarea>
                            <button onClick={parseText} className="mt-4 w-full bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg font-bold">
                                Analyze Text
                            </button>
                        </div>
                    )}

                    {parsedQuestions.length > 0 && (
                        <div className="mt-8">
                            <h3 className="text-green-400 font-bold mb-4 flex items-center gap-2"><CheckCircle className="h-4 w-4" /> Ready to Import: {parsedQuestions.length} Questions</h3>
                            <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                                {parsedQuestions.map((q, i) => (
                                    <div key={i} className="bg-slate-700/50 p-3 rounded border border-slate-600 text-sm">
                                        <span className="font-bold text-slate-300">Q{i + 1}:</span> {q.text}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-slate-700 flex justify-end gap-3">
                    <button onClick={onClose} className="px-6 py-2 rounded-lg font-bold text-slate-400 hover:text-white">Cancel</button>
                    <button
                        onClick={handleFinalImport}
                        disabled={parsedQuestions.length === 0}
                        className="px-6 py-2 rounded-lg font-bold bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Import All
                    </button>
                </div>

            </div>
        </div>
    );
}
