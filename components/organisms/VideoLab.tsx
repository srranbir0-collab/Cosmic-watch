import React, { useState, useRef } from 'react';
import { useCosmicStore } from '../../store/useCosmicStore';
import { Button } from '../atoms/Button';
import { Input } from '../atoms/Input';
import { motion, AnimatePresence } from 'framer-motion';

export const VideoLab: React.FC = () => {
    const { videoUrl, setVideoUrl, generatingVideo, setGeneratingVideo } = useCosmicStore();
    const [image, setImage] = useState<string | null>(null);
    const [prompt, setPrompt] = useState('');
    const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleGenerate = async () => {
        if (!image) return;
        setGeneratingVideo(true);
        setVideoUrl(null);

        try {
            const response = await fetch('/api/animate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    image,
                    prompt,
                    aspectRatio
                })
            });

            if (!response.ok) throw new Error('Generation failed');

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            setVideoUrl(url);
        } catch (error) {
            console.error(error);
            alert("Simulation failed. Check console for telemetry.");
        } finally {
            setGeneratingVideo(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full min-h-[600px]">
            {/* Control Panel */}
            <div className="lg:col-span-5 flex flex-col gap-6">
                <div className="glass-panel p-6 rounded-xl flex-1 flex flex-col">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-8 h-8 rounded bg-gravity/20 flex items-center justify-center text-gravity">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h2 className="font-display font-bold text-xl text-white tracking-wide">VIDEO LAB</h2>
                    </div>

                    {/* Upload Area */}
                    <div 
                        onClick={() => fileInputRef.current?.click()}
                        className={`
                            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-300 mb-6 group
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
                                <span className="text-xs text-electric font-mono">IMAGE LOADED. CLICK TO REPLACE.</span>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-2 text-gray-500 group-hover:text-gray-300">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                </svg>
                                <span className="text-sm font-sans">Upload Source Imagery</span>
                                <span className="text-[10px] font-mono uppercase opacity-50">Supports JPG, PNG, WEBP</span>
                            </div>
                        )}
                    </div>

                    {/* Controls */}
                    <div className="space-y-4 flex-1">
                        <Input 
                            label="Simulation Prompt" 
                            value={prompt} 
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="e.g. Cinematic pan, asteroid impact..."
                            maxLength={200}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <button 
                                onClick={() => setAspectRatio('16:9')}
                                className={`p-3 rounded border text-sm font-mono transition-all ${aspectRatio === '16:9' ? 'bg-electric/20 border-electric text-electric' : 'bg-void-900 border-void-700 text-gray-500'}`}
                            >
                                16:9 LANDSCAPE
                            </button>
                            <button 
                                onClick={() => setAspectRatio('9:16')}
                                className={`p-3 rounded border text-sm font-mono transition-all ${aspectRatio === '9:16' ? 'bg-electric/20 border-electric text-electric' : 'bg-void-900 border-void-700 text-gray-500'}`}
                            >
                                9:16 PORTRAIT
                            </button>
                        </div>
                    </div>

                    <div className="mt-6">
                        <Button 
                            variant="plasma" 
                            className="w-full" 
                            disabled={!image || generatingVideo} 
                            onClick={handleGenerate}
                            isLoading={generatingVideo}
                        >
                            {generatingVideo ? 'INITIALIZING VEO...' : 'GENERATE SIMULATION'}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Viewport */}
            <div className="lg:col-span-7">
                <div className="glass-panel p-2 rounded-xl h-full min-h-[500px] flex items-center justify-center bg-void-950 relative overflow-hidden border border-white/5">
                    
                    {/* Background Grid */}
                    <div className="absolute inset-0 bg-grid-pattern opacity-20 pointer-events-none"></div>

                    {generatingVideo ? (
                        <div className="text-center z-10 space-y-4">
                            <div className="relative w-20 h-20 mx-auto">
                                <div className="absolute inset-0 border-4 border-void-800 rounded-full"></div>
                                <div className="absolute inset-0 border-4 border-gravity border-t-transparent rounded-full animate-spin"></div>
                            </div>
                            <div>
                                <h3 className="text-white font-display font-bold text-xl animate-pulse">RENDERING</h3>
                                <p className="text-gravity text-xs font-mono mt-1">Veo-3.1 Model Active</p>
                            </div>
                        </div>
                    ) : videoUrl ? (
                         <div className="relative w-full h-full flex items-center justify-center bg-black rounded-lg overflow-hidden group">
                            <video 
                                src={videoUrl} 
                                controls 
                                autoPlay 
                                loop 
                                className="max-w-full max-h-full shadow-2xl"
                            />
                            <div className="absolute top-4 right-4 px-3 py-1 bg-black/50 backdrop-blur text-[10px] font-mono text-white border border-white/10 rounded">
                                VEO-3.1 GENERATION
                            </div>
                         </div>
                    ) : image ? (
                        <div className="relative w-full h-full flex items-center justify-center">
                            <img src={image} alt="Preview" className="max-w-full max-h-full opacity-50 blur-[2px] scale-95 transition-all duration-700" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="px-6 py-3 bg-void-900/80 backdrop-blur border border-white/10 rounded-lg text-sm text-gray-400 font-mono">
                                    AWAITING EXECUTION
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