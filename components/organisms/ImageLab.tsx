
import React, { useState, useRef } from 'react';
import { useCosmicStore } from '../../store/useCosmicStore';
import { Button } from '../atoms/Button';
import { Input } from '../atoms/Input';
import { motion } from 'framer-motion';

export const ImageLab: React.FC = () => {
    const { editedImageUrl, setEditedImageUrl, isEditingImage, setIsEditingImage } = useCosmicStore();
    const [image, setImage] = useState<string | null>(null);
    const [prompt, setPrompt] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImage(reader.result as string);
                setEditedImageUrl(null); // Reset previous edit
            };
            reader.readAsDataURL(file);
        }
    };

    const handleGenerate = async () => {
        if (!image || !prompt) return;
        setIsEditingImage(true);
        setEditedImageUrl(null);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/edit-image', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    image,
                    prompt
                })
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.message || 'Editing failed');
            }

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            setEditedImageUrl(url);
        } catch (error: any) {
            console.error(error);
            alert(`Simulation failed: ${error.message}`);
        } finally {
            setIsEditingImage(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full min-h-[600px]">
            {/* Control Panel */}
            <div className="lg:col-span-5 flex flex-col gap-6">
                <div className="glass-panel p-6 rounded-xl flex-1 flex flex-col">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-8 h-8 rounded bg-electric/20 flex items-center justify-center text-electric">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h2 className="font-display font-bold text-xl text-white tracking-wide">IMAGE LAB</h2>
                    </div>

                    {/* Upload Area */}
                    <div 
                        onClick={() => fileInputRef.current?.click()}
                        className={`
                            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-300 mb-6 group relative overflow-hidden
                            ${image ? 'border-electric bg-electric/5' : 'border-void-700 hover:border-gray-500 hover:bg-void-800'}
                        `}
                    >
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleFileChange} 
                            accept="image/*" 
                            className="hidden" 
                        />
                        {image ? (
                            <div className="flex flex-col items-center">
                                <div className="w-full h-32 relative mb-2 overflow-hidden rounded border border-white/10">
                                    <img src={image} alt="Upload preview" className="w-full h-full object-cover" />
                                </div>
                                <span className="text-xs text-electric font-mono">SOURCE LOADED. CLICK TO REPLACE.</span>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-2 text-gray-500 group-hover:text-gray-300">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                </svg>
                                <span className="text-sm font-sans">Upload Source Imagery</span>
                                <span className="text-[10px] font-mono uppercase opacity-50">JPG, PNG, WEBP</span>
                            </div>
                        )}
                    </div>

                    {/* Controls */}
                    <div className="space-y-4 flex-1">
                        <Input 
                            label="Edit Prompt" 
                            value={prompt} 
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="e.g. Add a retro filter, Remove background person..."
                            maxLength={200}
                        />
                    </div>

                    <div className="mt-6">
                        <Button 
                            variant="plasma" 
                            className="w-full" 
                            disabled={!image || !prompt || isEditingImage} 
                            onClick={handleGenerate}
                            isLoading={isEditingImage}
                        >
                            {isEditingImage ? 'PROCESSING...' : 'EXECUTE EDIT'}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Viewport */}
            <div className="lg:col-span-7">
                <div className="glass-panel p-2 rounded-xl h-full min-h-[500px] flex items-center justify-center bg-void-950 relative overflow-hidden border border-white/5">
                    
                    {/* Background Grid */}
                    <div className="absolute inset-0 bg-grid-pattern opacity-20 pointer-events-none"></div>

                    {isEditingImage ? (
                        <div className="text-center z-10 space-y-4">
                            <div className="relative w-20 h-20 mx-auto">
                                <div className="absolute inset-0 border-4 border-void-800 rounded-full"></div>
                                <div className="absolute inset-0 border-4 border-electric border-t-transparent rounded-full animate-spin"></div>
                            </div>
                            <div>
                                <h3 className="text-white font-display font-bold text-xl animate-pulse">PROCESSING</h3>
                                <p className="text-electric text-xs font-mono mt-1">Gemini 2.5 Flash Image Active</p>
                            </div>
                        </div>
                    ) : editedImageUrl ? (
                         <div className="relative w-full h-full flex items-center justify-center bg-black rounded-lg overflow-hidden group">
                            <img 
                                src={editedImageUrl} 
                                alt="Edited Result" 
                                className="max-w-full max-h-full shadow-2xl object-contain"
                            />
                            <div className="absolute top-4 right-4 px-3 py-1 bg-black/50 backdrop-blur text-[10px] font-mono text-white border border-white/10 rounded">
                                EDITED OUTPUT
                            </div>
                            <a 
                                href={editedImageUrl} 
                                download="cosmic-edit.png"
                                className="absolute bottom-4 right-4 p-2 bg-electric text-void-950 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Download"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                            </a>
                         </div>
                    ) : image ? (
                        <div className="relative w-full h-full flex items-center justify-center">
                            <img src={image} alt="Original" className="max-w-full max-h-full opacity-50 blur-[2px] scale-95 transition-all duration-700 object-contain" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="px-6 py-3 bg-void-900/80 backdrop-blur border border-white/10 rounded-lg text-sm text-gray-400 font-mono">
                                    AWAITING COMMAND
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center opacity-30">
                            <div className="text-6xl mb-4 font-thin text-gray-600">∅</div>
                            <p className="font-mono text-sm tracking-widest uppercase">No Visual Data</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
