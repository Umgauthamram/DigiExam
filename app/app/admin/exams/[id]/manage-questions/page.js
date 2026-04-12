'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Save, ArrowLeft, Upload, Edit2, Check, X, AlertTriangle } from 'lucide-react';
import QuestionImportModal from '@/app/components/QuestionImportModal';
import { toast } from 'sonner';

export default function ManageQuestionsPage({ params }) {
    const unwrappedParams = use(params);
    const examId = unwrappedParams.id;

    const [questions, setQuestions] = useState([]);
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null); // ID of question currently being edited
    const [isReadOnly, setIsReadOnly] = useState(false);
    const [isLegacyMock, setIsLegacyMock] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const router = useRouter();

    const handleGoToControlPanel = async () => {
        setIsAnalyzing(true);
        try {
            // Keep iterating until all are analyzed or error
            let keepGoing = true;
            let safetyLimit = 20; // Max 100 questions (20 * 5) per session to prevent infinite loops

            while (keepGoing && safetyLimit > 0) {
                const res = await fetch(`/api/admin/exams/${examId}/analyze`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ limit: 5 })
                });

                if (!res.ok) {
                    console.error("AI Analysis failed");
                    break;
                }

                const data = await res.json();

                if (data.remaining === 0 || data.processed === 0) {
                    keepGoing = false;
                }
                safetyLimit--;
            }

            if (safetyLimit === 0) {
                toast.warning("Analysis partial due to size limits. Proceeding...");
            } else {
                toast.success("AI Analysis Complete!");
            }

            router.push(`/admin/exams/${examId}/control`);

        } catch (e) {
            console.error("Analysis Error", e);
            toast.error("Analysis failed, proceeding to Start");
            router.push(`/admin/exams/${examId}/control`);
        }
    };


    // New Question Form State
    const [newQuestion, setNewQuestion] = useState({
        text: '',
        options: [
            { text: '', isCorrect: true },
            { text: '', isCorrect: false },
            { text: '', isCorrect: false },
            { text: '', isCorrect: false }
        ],
        correctOptionIndex: 0
    });

    // Fetch Questions
    const fetchQuestions = async () => {
        try {
            const res = await fetch(`/api/admin/exams/${examId}/questions`);
            if (res.ok) {
                const data = await res.json();
                setQuestions(data.questions);
            }
        } catch (e) { toast.error('Failed to load questions'); }
    };

    // Fetch Questions & Status
    useEffect(() => {
        // Legacy Check
        if (typeof examId === 'string' && !examId.match(/^[0-9a-fA-F]{24}$/)) {
            setIsLegacyMock(true);
            toast.warning('Legacy Mock Exam Detected: Changes will not stick!');
        }

        const fetchData = async () => {
            // 1. Fetch Status
            try {
                const statusRes = await fetch(`/api/admin/exams/${examId}/status`);
                if (statusRes.ok) {
                    const statusData = await statusRes.json();
                    if (statusData.status === 'ended') {
                        setIsReadOnly(true);
                    }
                }
            } catch (e) { console.error("Status fetch failed"); }

            // 2. Fetch Questions
            fetchQuestions();
        };

        if (examId) fetchData();
    }, [examId]);

    // Import Handler
    const handleImport = async (importedQuestions) => {
        // Save imported questions immediately to DB
        try {
            const res = await fetch(`/api/admin/exams/${examId}/questions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ questions: importedQuestions }),
            });
            if (res.ok) {
                fetchQuestions(); // Refresh list
                toast.success(`Imported ${importedQuestions.length} questions successfully!`);
            } else {
                toast.error('Import failed');
            }
        } catch (e) { toast.error('Import failed - Network Error'); }
    };

    // Add Single Question
    const addQuestion = async () => {
        if (!newQuestion.text || newQuestion.options.some(o => !o.text)) {
            toast.error('Please fill all fields');
            return;
        }
        try {
            const res = await fetch(`/api/admin/exams/${examId}/questions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ questions: [newQuestion] }),
            });
            if (res.ok) {
                fetchQuestions();
                setNewQuestion({
                    text: '',
                    options: [{ text: '', isCorrect: true }, { text: '', isCorrect: false }, { text: '', isCorrect: false }, { text: '', isCorrect: false }],
                    correctOptionIndex: 0
                });
                toast.success('Question added successfully');
            } else {
                toast.error('Failed to add question');
            }
        } catch (e) { toast.error('Add failed'); }
    };

    // Delete Logic
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteTargetIds, setDeleteTargetIds] = useState([]);

    const toggleSelect = (id) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedIds(newSet);
    };

    const deleteQuestions = (idsToDelete = []) => {
        const targetIds = idsToDelete.length > 0 ? idsToDelete : Array.from(selectedIds);
        if (targetIds.length === 0) {
            toast.error("No questions selected");
            return;
        }
        setDeleteTargetIds(targetIds);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        try {
            const res = await fetch(`/api/admin/exams/${examId}/questions`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ questionIds: deleteTargetIds }),
            });
            if (res.ok) {
                fetchQuestions();
                setSelectedIds(new Set()); // Clear selection if any
                toast.success('Questions deleted');
            } else {
                toast.error('Delete failed');
            }
        } catch (e) { toast.error('Delete failed'); } finally {
            setShowDeleteModal(false);
            setDeleteTargetIds([]);
        }
    };

    // Edit Logic (Inline)
    const startEditing = (q) => {
        setEditingId(q._id);
    };

    const updateQuestion = async (q) => {
        // Optimistic UI update or wait for API? Wait for API.
        try {
            const res = await fetch(`/api/admin/exams/${examId}/questions`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    questionId: q._id,
                    text: q.text,
                    options: q.options,
                    correctOptionIndex: q.correctOptionIndex
                }),
            });
            if (res.ok) {
                setEditingId(null);
                fetchQuestions();
                toast.success('Question updated');
            } else {
                toast.error('Update failed');
            }
        } catch (e) { toast.error('Update failed'); }
    };

    // Handlers for edit form fields
    const handleEditChange = (qId, field, value, optIndex = null) => {
        setQuestions(questions.map(q => {
            if (q._id !== qId) return q;

            if (field === 'text') return { ...q, text: value };
            if (field === 'option') {
                const newOpts = [...q.options];
                newOpts[optIndex].text = value;
                return { ...q, options: newOpts };
            }
            if (field === 'correct') {
                // Reset all isCorrect, set index
                const newOpts = q.options.map((o, i) => ({ ...o, isCorrect: i === optIndex }));
                return { ...q, options: newOpts, correctOptionIndex: optIndex };
            }
            return q;
        }));
    };

    // Modification in Render
    // Add banner
    // Disable inputs
    // Hide buttons

    return (
        <div className="min-h-screen bg-black text-white p-8 relative overflow-hidden">
            {/* Ambient Background Effects */}
            <div className="fixed top-0 left-0 w-[500px] h-[500px] bg-purple-900/10 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-purple-900/10 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="max-w-6xl mx-auto relative z-10">
                <div className="flex justify-between items-center mb-8">
                    <Link href="/admin/dashboard" className="inline-flex items-center text-slate-400 hover:text-white transition-colors group">
                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center mr-3 group-hover:bg-purple-500/20 transition-all border border-white/5 group-hover:border-purple-500/50">
                            <ArrowLeft className="h-4 w-4 group-hover:text-purple-400" />
                        </div>
                        <span className="font-medium">Back to Dashboard</span>
                    </Link>
                    {!isReadOnly && (
                        <div className="flex gap-4 items-center">
                            <button
                                onClick={handleGoToControlPanel}
                                disabled={isAnalyzing}
                                className="bg-white/5 hover:bg-white/10 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all border border-white/10 backdrop-blur-sm disabled:opacity-50 disabled:cursor-wait"
                            >
                                {isAnalyzing ? 'AI Analyzing...' : 'Start'}
                            </button>
                            <button
                                onClick={() => setIsImportModalOpen(true)}
                                className="bg-white/5 hover:bg-white/10 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all border border-white/10 backdrop-blur-sm"
                            >
                                <Upload className="h-4 w-4" /> Import Questions
                            </button>
                            {selectedIds.size > 0 && (
                                <button
                                    onClick={() => deleteQuestions()}
                                    className="bg-red-100 hover:scale-105 text-red-700  px-6 py-3 rounded-xl font-bold flex items-center gap-2 backdrop-blur-sm transition-all"
                                >
                                    <Trash2 className="h-4 w-4" /> Delete ({selectedIds.size})
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Analysis Modal */}
                {isAnalyzing && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
                        <div className="bg-slate-900 border border-purple-500/30 p-8 rounded-3xl max-w-md w-full text-center shadow-2xl relative overflow-hidden">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(168,85,247,0.1),transparent_50%)] pointer-events-none"></div>

                            <div className="w-20 h-20 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-purple-500/20">
                                <div className="h-10 w-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                            </div>

                            <h2 className="text-2xl font-bold text-white mb-2">Analyzing Questions</h2>
                            <p className="text-purple-300 font-medium mb-1">
                                AI is processing the question bank...
                            </p>
                            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                                Generating explanations for questions and options.
                                <br />
                                <span className="font-mono text-xs opacity-70">Batch processing to ensure quality.</span>
                            </p>
                        </div>
                    </div>
                )}

                {/* Read Only Banner */}
                {isReadOnly && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-xl mb-6 flex items-center gap-3 backdrop-blur-sm">
                        <AlertTriangle className="h-6 w-6" />
                        <div>
                            <h3 className="font-bold text-lg">Exam Ended - Read Only</h3>
                            <p className="text-sm opacity-90">This exam session has ended. Questions cannot be edited or added anymore.</p>
                        </div>
                    </div>
                )}

                {isLegacyMock && (
                    <div className="bg-amber-500/10 border border-amber-500/50 text-amber-500 p-4 rounded-xl mb-6 flex items-start gap-3 backdrop-blur-sm">
                        <AlertTriangle className="h-6 w-6 flex-shrink-0" />
                        <div>
                            <h3 className="font-bold text-lg">Legacy Mock Exam Detected</h3>
                            <p className="text-sm opacity-90">
                                This exam was created with an old version of the system.
                                Questions added here <strong>will not be saved permanently</strong> and may cause errors.
                                <br />
                                <span className="underline">Please go back and create a new exam to fix this.</span>
                            </p>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Add Question Form - Gradient Box */}
                    <div className={`lg:col-span-1 h-fit sticky top-8 transition-all duration-300 ${isReadOnly ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
                        <div className="bg-gradient-to-br from-black via-black to-purple-900/50 p-6 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden group">
                            {/* Gradient Overlay requested by user: "gradient from left to right" */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/5 to-purple-500/10 pointer-events-none"></div>

                            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 relative z-10">
                                Add New Question
                            </h2>

                            <div className="space-y-4 relative z-10">
                                <textarea
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white placeholder-slate-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:outline-none transition-all resize-none font-medium"
                                    rows={4}
                                    placeholder="Enter question here..."
                                    value={newQuestion.text}
                                    onChange={(e) => setNewQuestion({ ...newQuestion, text: e.target.value })}
                                    disabled={isReadOnly}
                                />
                                <div className="space-y-3">
                                    {newQuestion.options.map((opt, idx) => (
                                        <div
                                            key={idx}
                                            className={`flex items-center gap-3 p-3 rounded-xl transition-all border ${idx === newQuestion.correctOptionIndex ? 'bg-black border-purple-500 ring-1 ring-purple-500/50' : 'bg-black border-white/10 hover:border-white/20'}`}
                                        >
                                            <button
                                                onClick={() => {
                                                    if (isReadOnly) return;
                                                    const opts = newQuestion.options.map((o, i) => ({ ...o, isCorrect: i === idx }));
                                                    setNewQuestion({ ...newQuestion, options: opts, correctOptionIndex: idx });
                                                }}
                                                disabled={isReadOnly}
                                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${idx === newQuestion.correctOptionIndex ? 'border-purple-500 bg-purple-500/20' : 'border-slate-600 hover:border-slate-500'}`}
                                            >
                                                {idx === newQuestion.correctOptionIndex && <div className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-in zoom-in" />}
                                            </button>
                                            <input
                                                value={opt.text}
                                                onChange={(e) => {
                                                    const opts = [...newQuestion.options];
                                                    opts[idx].text = e.target.value;
                                                    setNewQuestion({ ...newQuestion, options: opts });
                                                }}
                                                className="w-full bg-transparent border-none focus:ring-0 text-sm text-slate-200 placeholder-slate-600 font-medium p-0"
                                                placeholder={`Option ${idx + 1}`}
                                                disabled={isReadOnly}
                                            />
                                        </div>
                                    ))}
                                </div>
                                <button
                                    onClick={addQuestion}
                                    disabled={isReadOnly}
                                    className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-bold disabled:cursor-not-allowed shadow-lg shadow-purple-900/20 active:scale-[0.98] transition-all border border-purple-500/50"
                                >
                                    Add Question
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Question List */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="flex justify-between items-center mb-2 px-1">
                            <h2 className="text-xl font-bold text-slate-200">Question Bank <span className="text-purple-400">({questions.length})</span></h2>
                            {!isReadOnly && (
                                <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer hover:text-white transition-colors">
                                    <input
                                        type="checkbox"
                                        onChange={(e) => {
                                            if (e.target.checked) setSelectedIds(new Set(questions.map(q => q._id)));
                                            else setSelectedIds(new Set());
                                        }}
                                        checked={questions.length > 0 && selectedIds.size === questions.length}
                                        className="rounded border-slate-600 bg-slate-800 accent-purple-500"
                                    /> Select All
                                </label>
                            )}
                        </div>

                        {questions.length === 0 && (
                            <div className="text-center p-12 bg-slate-900/50 rounded-3xl border border-white/5 border-dashed">
                                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Plus className="h-8 w-8 text-slate-600" />
                                </div>
                                <p className="text-slate-500 text-lg">Question bank is empty.</p>
                                <p className="text-slate-600 text-sm mt-1">Add a question manually or import from file.</p>
                            </div>
                        )}

                        <div className="space-y-4">
                            {questions.map((q, idx) => (
                                <div key={q._id} className={`bg-slate-900/80 backdrop-blur-sm p-6 rounded-2xl border transition-all hover:border-purple-500/30 group ${selectedIds.has(q._id) ? 'border-purple-500 bg-purple-900/10' : 'border-white/5'}`}>
                                    {editingId === q._id ? (
                                        // Edit Mode - Styled
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Editing Question {idx + 1}</span>
                                                <div className="flex gap-2">
                                                    <button onClick={() => updateQuestion(q)} className="p-2 bg-purple-500/10 text-purple-400 rounded-lg hover:bg-purple-500/20 transition-colors"><Check className="h-4 w-4" /></button>
                                                    <button onClick={() => { setEditingId(null); fetchQuestions(); }} className="p-2 bg-white/5 text-slate-400 rounded-lg hover:bg-white/10 hover:text-white transition-colors"><X className="h-4 w-4" /></button>
                                                </div>
                                            </div>
                                            <textarea
                                                value={q.text}
                                                onChange={(e) => handleEditChange(q._id, 'text', e.target.value)}
                                                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-sm focus:border-purple-500 focus:outline-none transition-all"
                                                rows={2}
                                            />
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {q.options.map((opt, i) => (
                                                    <div key={i} className={`flex items-center gap-2 p-3 rounded-lg border transition-all ${i === (q.correctOptionIndex !== undefined ? q.correctOptionIndex : q.options.findIndex(o => o.isCorrect)) ? 'bg-black border-purple-500' : 'bg-black border-white/10'}`}>
                                                        <button
                                                            onClick={() => handleEditChange(q._id, 'correct', null, i)}
                                                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${i === (q.correctOptionIndex !== undefined ? q.correctOptionIndex : q.options.findIndex(o => o.isCorrect)) ? 'border-purple-500 bg-purple-500/20' : 'border-slate-600'}`}
                                                        >
                                                            {i === (q.correctOptionIndex !== undefined ? q.correctOptionIndex : q.options.findIndex(o => o.isCorrect)) && <div className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-in zoom-in" />}
                                                        </button>
                                                        <input
                                                            value={opt.text}
                                                            onChange={(e) => handleEditChange(q._id, 'option', e.target.value, i)}
                                                            className="bg-transparent border-none focus:outline-none text-sm w-full text-slate-300 p-0"
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        // View Mode - Styled
                                        <div className="flex gap-4">
                                            {!isReadOnly && (
                                                <div className="pt-1">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedIds.has(q._id)}
                                                        onChange={() => toggleSelect(q._id)}
                                                        className="h-5 w-5 accent-purple-600 bg-slate-800 border-slate-600 rounded cursor-pointer"
                                                    />
                                                </div>
                                            )}
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start mb-3">
                                                    <p className="font-medium text-lg text-slate-200 leading-snug">
                                                        <span className="text-slate-500 text-sm font-mono mr-3">Q{idx + 1}</span>
                                                        {q.text}
                                                    </p>
                                                    {!isReadOnly && (
                                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button onClick={() => startEditing(q)} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"><Edit2 className="h-4 w-4" /></button>
                                                            <button onClick={() => deleteQuestions([q._id])} className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"><Trash2 className="h-4 w-4" /></button>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                                    {q.options.map((opt, i) => (
                                                        <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border ${opt.isCorrect ? 'bg-green-950/30 text-green-400 border-green-500/30 font-medium' : 'bg-black/20 border-white/5 text-slate-400'}`}>
                                                            {opt.isCorrect ? <Check className="h-4 w-4 flex-shrink-0 text-green-400" /> : <div className="w-4 h-4 rounded-full border border-slate-600 flex-shrink-0"></div>}
                                                            <span className="truncate">{opt.text}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Delete Confirmation Modal */}
                {showDeleteModal && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                        <div className="bg-slate-900  p-8 rounded-3xl max-w-sm w-full text-center shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(239,68,68,0.1),transparent_60%)] pointer-events-none"></div>

                            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Trash2 className="h-8 w-8 text-red-500" />
                            </div>

                            <h2 className="text-xl font-bold text-white mb-2">Delete Questions?</h2>
                            <p className="text-slate-400 text-sm mb-8 leading-relaxed">
                                Are you sure you want to delete <span className="text-white font-bold">{deleteTargetIds.length}</span> question{deleteTargetIds.length > 1 ? 's' : ''}?
                                <br />
                                <span className="text-red-400/70 text-xs">This action cannot be undone.</span>
                            </p>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    className="flex-1 py-3 rounded-xl font-bold bg-white/5 hover:bg-white/10 text-white border border-white/5 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="flex-1 py-3 rounded-xl font-bold bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/20 transition-all hover:scale-[1.02]"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <QuestionImportModal
                    isOpen={isImportModalOpen}
                    onClose={() => setIsImportModalOpen(false)}
                    onImport={handleImport}
                    existingQuestions={questions}
                />

            </div>
        </div>
    );
}
