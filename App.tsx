
import React, { useState, useRef } from 'react';
import { 
  Upload, 
  Image as ImageIcon, 
  Settings2, 
  Sparkles, 
  Plus,
  Zap,
  CheckCircle2,
  RefreshCw,
  Download,
  Scissors,
  Type,
  Layout,
  ChevronRight,
  RotateCcw
} from 'lucide-react';
import { ExtractedFrame, ThumbnailSettings, AppState, TextPosition } from './types.ts';
import { extractFrameFromVideo, formatTime } from './utils.ts';
import { generateThumbnail, editGeneratedThumbnail } from './geminiService.ts';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    videoFile: null,
    videoUrl: null,
    frames: [],
    selectedFrameIds: [],
    generatedThumbnail: null,
    isProcessing: false,
    isGenerating: false,
    statusMessage: '',
  });

  const [settings, setSettings] = useState<ThumbnailSettings>({
    characterCount: 2,
    additionalPrompt: '',
    style: 'cinematic',
    mainText: 'SEASON 2',
    subText: 'OFFICIAL',
    textPosition: 'bottom-left'
  });

  const [editPrompt, setEditPrompt] = useState('');
  const [manualTime, setManualTime] = useState<string>('00:00');
  const videoRef = useRef<HTMLVideoElement>(null);

  const resetApp = () => {
    if (state.videoUrl) {
      URL.revokeObjectURL(state.videoUrl);
    }
    setState({
      videoFile: null,
      videoUrl: null,
      frames: [],
      selectedFrameIds: [],
      generatedThumbnail: null,
      isProcessing: false,
      isGenerating: false,
      statusMessage: 'App Reset Successfully',
    });
    setSettings({
      characterCount: 2,
      additionalPrompt: '',
      style: 'cinematic',
      mainText: 'SEASON 2',
      subText: 'OFFICIAL',
      textPosition: 'bottom-left'
    });
    setEditPrompt('');
    setManualTime('00:00');
    
    setTimeout(() => {
      setState(prev => ({ ...prev, statusMessage: '' }));
    }, 2000);
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setState(prev => ({ 
        ...prev, 
        videoFile: file, 
        videoUrl: url, 
        frames: [], 
        selectedFrameIds: [],
        generatedThumbnail: null,
        statusMessage: 'Video Loaded'
      }));
    }
  };

  const autoExtractFrames = async () => {
    if (!videoRef.current || !state.videoUrl) return;
    setState(prev => ({ ...prev, isProcessing: true, statusMessage: 'Finding epic character moments...' }));
    
    const video = videoRef.current;
    const duration = video.duration;
    const interval = duration / 10;
    const newFrames: ExtractedFrame[] = [];

    for (let i = 1; i <= 8; i++) {
      const time = i * interval;
      const dataUrl = await extractFrameFromVideo(video, time);
      newFrames.push({
        id: Math.random().toString(36).substr(2, 9),
        timestamp: time,
        dataUrl,
      });
    }

    setState(prev => ({ 
      ...prev, 
      frames: [...prev.frames, ...newFrames], 
      isProcessing: false, 
      statusMessage: 'Moments captured!' 
    }));
  };

  const extractManualFrame = async () => {
    if (!videoRef.current || !state.videoUrl) return;
    
    const parts = manualTime.split(':');
    let time = 0;
    if (parts.length === 2) {
      time = parseInt(parts[0]) * 60 + parseInt(parts[1]);
    } else {
      time = parseInt(parts[0]);
    }
    
    if (isNaN(time) || time > videoRef.current.duration) {
      alert("Please enter a valid time within video duration");
      return;
    }

    setState(prev => ({ ...prev, isProcessing: true, statusMessage: `Capturing at ${manualTime}...` }));
    const dataUrl = await extractFrameFromVideo(videoRef.current, time);
    const newFrame: ExtractedFrame = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: time,
      dataUrl,
    };

    setState(prev => ({ 
      ...prev, 
      frames: [...prev.frames, newFrame], 
      isProcessing: false,
      statusMessage: 'Frame captured successfully!'
    }));
  };

  const toggleFrameSelection = (id: string) => {
    setState(prev => {
      const isSelected = prev.selectedFrameIds.includes(id);
      if (isSelected) {
        return { ...prev, selectedFrameIds: prev.selectedFrameIds.filter(fId => fId !== id) };
      } else {
        return { ...prev, selectedFrameIds: [...prev.selectedFrameIds, id] };
      }
    });
  };

  const handleGenerate = async () => {
    if (state.selectedFrameIds.length === 0) {
      alert("Select the character frames you want in your thumbnail!");
      return;
    }

    setState(prev => ({ ...prev, isGenerating: true, statusMessage: 'AI is hand-crafting your thumbnail...' }));
    
    const selectedFramesData = state.frames
      .filter(f => state.selectedFrameIds.includes(f.id))
      .map(f => f.dataUrl);

    try {
      const result = await generateThumbnail(selectedFramesData, settings);
      if (result) {
        setState(prev => ({ ...prev, generatedThumbnail: result, isGenerating: false, statusMessage: 'Masterpiece Ready!' }));
      }
    } catch (error) {
      alert("Generation failed. Check your connection or API key.");
      setState(prev => ({ ...prev, isGenerating: false, statusMessage: 'Error occurred.' }));
    }
  };

  const handleEdit = async () => {
    if (!state.generatedThumbnail || !editPrompt) return;
    setState(prev => ({ ...prev, isGenerating: true, statusMessage: 'Applying magic edits...' }));
    
    try {
      const result = await editGeneratedThumbnail(state.generatedThumbnail, editPrompt);
      if (result) {
        setState(prev => ({ ...prev, generatedThumbnail: result, isGenerating: false, statusMessage: 'Changes applied!' }));
        setEditPrompt('');
      }
    } catch (error) {
      setState(prev => ({ ...prev, isGenerating: false }));
    }
  };

  return (
    <div className="min-h-screen pb-20 overflow-x-hidden bg-[#0a0f1d]">
      <header className="sticky top-0 z-50 glass border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Zap className="text-white w-6 h-6" fill="currentColor" />
          </div>
          <h1 className="text-xl font-black tracking-tighter uppercase italic bg-gradient-to-r from-white via-indigo-200 to-slate-500 bg-clip-text text-transparent">
            NANO THUMBNAIL <span className="text-indigo-500">PRO</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-4">
          {(state.videoUrl || state.generatedThumbnail) && (
            <button 
              onClick={resetApp}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 hover:bg-red-500/10 hover:text-red-400 rounded-xl text-slate-400 text-xs font-bold border border-white/5 transition-all active:scale-95"
            >
              <RotateCcw size={16} />
              START NEW
            </button>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 pt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-6">
          {!state.videoUrl ? (
            <div className="h-[450px] border-2 border-dashed border-slate-800 rounded-[2rem] flex flex-col items-center justify-center bg-slate-900/40 hover:bg-slate-900/60 transition-all cursor-pointer group relative overflow-hidden">
              <input type="file" accept="video/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleVideoUpload} />
              <div className="p-8 bg-indigo-500/10 rounded-full group-hover:scale-110 transition-transform mb-6 ring-1 ring-indigo-500/20">
                <Upload className="w-12 h-12 text-indigo-400" />
              </div>
              <h3 className="text-xl font-bold text-white">Upload Your Video</h3>
              <p className="text-slate-500 text-sm mt-2 max-w-xs text-center">We'll help you extract the perfect character poses for your thumbnail.</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="relative rounded-[2rem] overflow-hidden glass aspect-video shadow-2xl ring-1 ring-white/10">
                <video ref={videoRef} src={state.videoUrl} controls className="w-full h-full object-cover" />
              </div>

              <div className="glass p-8 rounded-[2rem] border border-white/5 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <Scissors size={20} className="text-indigo-400" /> Capture Frames
                    </h3>
                    <p className="text-sm text-slate-400 mt-1">Select the characters/scenes for your thumbnail</p>
                  </div>
                  <button 
                    onClick={autoExtractFrames}
                    disabled={state.isProcessing}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-bold transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/20 active:scale-95"
                  >
                    <RefreshCw size={16} className={state.isProcessing ? 'animate-spin' : ''} />
                    Auto Extract
                  </button>
                </div>

                <div className="flex gap-4 items-end bg-slate-900/50 p-4 rounded-2xl border border-white/5">
                  <div className="flex-1 space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Manual Capture (MM:SS)</label>
                    <input 
                      type="text" 
                      value={manualTime}
                      onChange={(e) => setManualTime(e.target.value)}
                      placeholder="e.g. 05:30"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <button 
                    onClick={extractManualFrame}
                    className="p-3.5 bg-slate-800 hover:bg-indigo-600 rounded-xl transition-all group active:scale-90"
                  >
                    <Plus size={20} className="group-hover:text-white text-slate-400" />
                  </button>
                </div>

                {state.frames.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                    {state.frames.map((frame) => (
                      <div 
                        key={frame.id}
                        onClick={() => toggleFrameSelection(frame.id)}
                        className={`group relative rounded-2xl overflow-hidden cursor-pointer border-2 transition-all duration-300 ${
                          state.selectedFrameIds.includes(frame.id) 
                          ? 'border-indigo-500 scale-[0.98] ring-4 ring-indigo-500/20' 
                          : 'border-transparent hover:border-slate-600'
                        }`}
                      >
                        <img src={frame.dataUrl} className="w-full aspect-video object-cover" alt="Frame" />
                        <div className="absolute top-3 right-3">
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                             state.selectedFrameIds.includes(frame.id) ? 'bg-indigo-500 border-indigo-500' : 'bg-black/60 border-white/30 backdrop-blur-md'
                          }`}>
                            {state.selectedFrameIds.includes(frame.id) && <CheckCircle2 size={14} className="text-white"/>}
                          </div>
                        </div>
                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-2 text-[11px] font-mono text-white/90">
                          {formatTime(frame.timestamp)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-5 space-y-6">
          <div className="glass p-8 rounded-[2rem] border border-white/5 space-y-6 shadow-xl">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Settings2 size={20} className="text-indigo-400" /> AI Designer
            </h3>
            
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Main Character Count</label>
                <div className="grid grid-cols-3 gap-3">
                  {[1, 2, 3].map(num => (
                    <button
                      key={num}
                      onClick={() => setSettings(s => ({ ...s, characterCount: num }))}
                      className={`py-3 rounded-xl border-2 font-bold text-sm transition-all ${
                        settings.characterCount === num 
                        ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-[0_0_15px_rgba(79,70,229,0.3)]' 
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      {num === 3 ? '3+' : num} {num === 1 ? 'HERO' : 'HEROES'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-white/5">
                <div className="space-y-3">
                   <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest">
                    <Type size={14} /> Thumbnail Text
                   </div>
                   <input 
                    type="text" 
                    value={settings.mainText}
                    onChange={(e) => setSettings(s => ({ ...s, mainText: e.target.value.toUpperCase() }))}
                    placeholder="MAIN TITLE (e.g. HINDI)"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                   />
                   <input 
                    type="text" 
                    value={settings.subText}
                    onChange={(e) => setSettings(s => ({ ...s, subText: e.target.value.toUpperCase() }))}
                    placeholder="SUBTITLE (e.g. #06 SEASON 2)"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                   />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest">
                    <Layout size={14} /> Text Position
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {(['top-left', 'top-right', 'center', 'bottom-left', 'bottom-right'] as TextPosition[]).map(pos => (
                      <button
                        key={pos}
                        onClick={() => setSettings(s => ({ ...s, textPosition: pos }))}
                        className={`aspect-square rounded-lg border-2 flex items-center justify-center transition-all ${
                          settings.textPosition === pos ? 'bg-indigo-500 border-indigo-400' : 'bg-slate-950 border-slate-800 hover:border-slate-600'
                        }`}
                        title={pos.replace('-', ' ')}
                      >
                        <div className="w-1.5 h-1.5 bg-white rounded-full" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-white/5">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Vibe & Style</label>
                <textarea 
                  value={settings.additionalPrompt}
                  onChange={(e) => setSettings(s => ({ ...s, additionalPrompt: e.target.value }))}
                  placeholder="e.g. Add red lightning and epic fire effects..."
                  className="w-full h-24 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              <button 
                onClick={handleGenerate}
                disabled={state.isGenerating || state.selectedFrameIds.length === 0}
                className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:from-slate-800 disabled:to-slate-800 disabled:cursor-not-allowed rounded-2xl flex items-center justify-center gap-2 font-black text-white shadow-xl shadow-indigo-500/20 transition-all active:scale-95 group overflow-hidden relative"
              >
                {state.isGenerating ? (
                  <>
                    <RefreshCw size={22} className="animate-spin" />
                    CRAFTING MASTERPIECE...
                  </>
                ) : (
                  <>
                    <Sparkles size={22} className="group-hover:animate-pulse" />
                    GENERATE EPIC THUMBNAIL
                  </>
                )}
                <div className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity" />
              </button>
            </div>
          </div>

          {state.generatedThumbnail ? (
            <div className="glass p-8 rounded-[2rem] border border-white/10 space-y-6 animate-in zoom-in-95 duration-500 shadow-2xl ring-2 ring-indigo-500/20">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold italic tracking-tight">AI RESULT</h3>
                <a 
                  href={state.generatedThumbnail} 
                  download="nano-thumbnail-pro.png"
                  className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 rounded-xl text-indigo-400 text-sm font-bold border border-white/5 transition-colors"
                >
                  <Download size={18}/>
                  DOWNLOAD
                </a>
              </div>
              <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl group relative bg-black aspect-video flex items-center justify-center">
                <img src={state.generatedThumbnail} alt="Generated" className="w-full h-full object-contain" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-[10px] text-white/50 tracking-widest font-bold">GEMINI 2.5 FLASH IMAGE ENGINE</p>
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest">
                  <RefreshCw size={14} /> Magic Refiner
                </div>
                <div className="relative">
                  <input 
                    type="text" 
                    value={editPrompt}
                    onChange={(e) => setEditPrompt(e.target.value)}
                    placeholder="e.g. 'Add more lightning', 'Make text yellow'..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-4 pr-14 py-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button 
                    onClick={handleEdit}
                    disabled={state.isGenerating || !editPrompt}
                    className="absolute right-2 top-2 bottom-2 px-4 bg-indigo-600 rounded-lg hover:bg-indigo-500 disabled:bg-slate-800 transition-all text-white active:scale-90"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            </div>
          ) : (
             <div className="h-[350px] glass rounded-[2rem] border-2 border-dashed border-slate-800 flex flex-col items-center justify-center text-slate-500 space-y-4">
               <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center border border-white/5">
                <ImageIcon size={32} className="opacity-20" />
               </div>
               <p className="font-bold tracking-widest text-xs">AWAITING GENERATION</p>
             </div>
          )}
        </div>
      </main>

      {state.statusMessage && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 glass px-8 py-4 rounded-full flex items-center gap-4 border border-indigo-500/30 shadow-[0_0_50px_rgba(79,70,229,0.2)] animate-in slide-in-from-bottom-8 duration-300">
          {state.isGenerating || state.isProcessing ? (
            <RefreshCw size={18} className="text-indigo-400 animate-spin" />
          ) : (
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          )}
          <span className="text-sm font-black text-white tracking-wide uppercase italic">{state.statusMessage}</span>
        </div>
      )}
    </div>
  );
};

export default App;
