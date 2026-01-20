'use client';

import { useState, use } from 'react'; // use is needed for next.js 15+ param handling
import Link from 'next/link';
import { Plus, Trash2, Save, ArrowLeft } from 'lucide-react';

import QuestionImportModal from '@/app/components/QuestionImportModal';

export default function ManageQuestionsPage({ params }) {
    // In Next.js 15+, params is a promise
    const unwrappedParams = use(params);
    const examId = unwrappedParams.id;

    const [questions, setQuestions] = useState([]);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [newQuestion, setNewQuestion] = useState({
        text: '',
        options: [
            { text: '', isCorrect: false },
            { text: '', isCorrect: false },
            { text: '', isCorrect: false },
            { text: '', isCorrect: false }
        ],
        correctOptionIndex: 0 // 0 to 3
    });

    const handleImport = (importedQuestions) => {
        setQuestions([...questions, ...importedQuestions]);
    };

    // ... existing handlers ...
    const handleOptionChange = (index, value) => {
        const updatedOptions = [...newQuestion.options];
        updatedOptions[index].text = value;
        setNewQuestion({ ...newQuestion, options: updatedOptions });
    };

    const setCorrectOption = (index) => {
        const updatedOptions = newQuestion.options.map((opt, i) => ({
            ...opt,
            isCorrect: i === index
        }));
        setNewQuestion({ ...newQuestion, options: updatedOptions, correctOptionIndex: index });
    };

    const addQuestion = () => {
        if (!newQuestion.text || newQuestion.options.some(o => !o.text)) {
            alert('Please fill all fields');
            return;
        }

        setQuestions([...questions, { ...newQuestion }]);

        // Reset form
        setNewQuestion({
            text: '',
            options: [
                { text: '', isCorrect: true }, // Default 1st correct for new form
                { text: '', isCorrect: false },
                { text: '', isCorrect: false },
                { text: '', isCorrect: false }
            ],
            correctOptionIndex: 0
        });
    };

    const removeQuestion = (index) => {
        setQuestions(questions.filter((_, i) => i !== index));
    };

    const saveAll = async () => {
        try {
            const res = await fetch(`/api/admin/exams/${examId}/questions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ questions }),
            });

            if (res.ok) {
                alert('Questions saved successfully!');
                // Redirect or show success
            } else {
                alert('Failed to save');
            }
        } catch (e) {
            console.error(e);
            alert('Error saving questions');
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 text-white p-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <Link href="/admin/dashboard" className="text-slate-400 hover:text-white flex items-center">
                        <ArrowLeft className="h-4 w-4 mr-2" /> Back
                    </Link>
                    <div className="flex gap-4">
                        <button
                            onClick={() => setIsImportModalOpen(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2"
                        >
                            Import Questions
                        </button>
                        <button
                            onClick={saveAll}
                            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2"
                        >
                            <Save className="h-5 w-5" /> Save Question Bank
                        </button>
                    </div>
                </div>

                <h1 className="text-3xl font-bold mb-8">Manage Questions</h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                    {/* Left: Add Question Form */}
                    <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 h-fit sticky top-8">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <Plus className="h-5 w-5 text-blue-500" /> Add New Question
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Question Text</label>
                                <textarea
                                    className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-white focus:outline-none focus:border-blue-500"
                                    rows={3}
                                    placeholder="Enter question here..."
                                    value={newQuestion.text}
                                    onChange={(e) => setNewQuestion({ ...newQuestion, text: e.target.value })}
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="block text-sm text-slate-400">Options (Select correct answer)</label>
                                {newQuestion.options.map((opt, idx) => (
                                    <div key={idx} className="flex items-center gap-3">
                                        <input
                                            type="radio"
                                            name="correctOption"
                                            checked={idx === newQuestion.correctOptionIndex}
                                            onChange={() => setCorrectOption(idx)}
                                            className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-500"
                                        />
                                        <input
                                            type="text"
                                            className={`w-full bg-slate-900 border ${idx === newQuestion.correctOptionIndex ? 'border-green-500/50' : 'border-slate-700'} rounded p-2 text-white text-sm`}
                                            placeholder={`Option ${idx + 1}`}
                                            value={opt.text}
                                            onChange={(e) => handleOptionChange(idx, e.target.value)}
                                        />
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={addQuestion}
                                className="w-full mt-4 bg-blue-600 hover:bg-blue-700 py-2 rounded-lg font-semibold transition-colors"
                            >
                                Add to Bank
                            </button>
                        </div>
                    </div>

                    {/* Right: List of Added Questions */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold mb-4">Added Questions ({questions.length})</h2>
                        {questions.length === 0 && (
                            <p className="text-slate-500 italic">No questions added yet.</p>
                        )}
                        {questions.map((q, idx) => (
                            <div key={idx} className="bg-slate-800 p-4 rounded-xl border border-slate-700 relative group">
                                <button
                                    onClick={() => removeQuestion(idx)}
                                    className="absolute top-4 right-4 text-slate-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Trash2 className="h-5 w-5" />
                                </button>
                                <p className="font-semibold mb-3 pr-8">Q{idx + 1}: {q.text}</p>
                                <ul className="space-y-1 text-sm text-slate-400">
                                    {q.options.map((opt, i) => (
                                        <li key={i} className={opt.isCorrect ? 'text-green-400 font-medium flex items-center gap-2' : ''}>
                                            {opt.isCorrect && <span className="w-2 h-2 rounded-full bg-green-500"></span>}
                                            {opt.text}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>

                </div>
            </div>

            <QuestionImportModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onImport={handleImport}
            />
        </div>
    );
}
