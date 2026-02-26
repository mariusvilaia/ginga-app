
import React, { useState, useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut, RotateCw, ClipboardPaste } from 'lucide-react';
import { Modal, Button } from '../UIComponents';

interface ImageCropperProps {
    src: string;
    onCrop: (base64: string) => void;
    onCancel: () => void;
}

export const ImageCropper: React.FC<ImageCropperProps> = ({ src, onCrop, onCancel }) => {
    const [localSrc, setLocalSrc] = useState(src);
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    
    const imageRef = useRef<HTMLImageElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setLocalSrc(src);
    }, [src]);

    useEffect(() => {
        const handlePaste = (e: ClipboardEvent) => {
            const items = e.clipboardData?.items;
            if (!items) return;

            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                    const blob = items[i].getAsFile();
                    if (blob) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                            const result = event.target?.result as string;
                            setLocalSrc(result);
                            // Reset transformations
                            setZoom(1);
                            setRotation(0);
                            setPan({ x: 0, y: 0 });
                        };
                        reader.readAsDataURL(blob);
                        e.preventDefault();
                    }
                }
            }
        };

        window.addEventListener('paste', handlePaste);
        return () => window.removeEventListener('paste', handlePaste);
    }, []);

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        e.preventDefault();
        setPan({
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y
        });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleSave = () => {
        const canvas = document.createElement('canvas');
        const size = 400; // Output resolution
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        const img = imageRef.current;

        if (ctx && img) {
            // Fill background (transparency fallback)
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, size, size);
            
            const ratio = size / 250; // Canvas (400) vs Container (250)
            const centerX = size / 2;
            const centerY = size / 2;
            
            // Base dimensions (image scaled to fit container, then scaled to canvas)
            const baseW = img.width * ratio;
            const baseH = img.height * ratio;

            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.translate(pan.x * ratio, pan.y * ratio);
            ctx.scale(zoom, zoom);
            ctx.rotate((rotation * Math.PI) / 180);
            
            // Draw centered
            ctx.drawImage(img, -baseW / 2, -baseH / 2, baseW, baseH);
            ctx.restore();
            
            onCrop(canvas.toDataURL('image/jpeg', 0.9));
        }
    };

    return (
        <Modal isOpen={true} onClose={onCancel} title="Ajustează Imaginea">
            <div className="flex flex-col items-center gap-6">
                <div 
                    className="relative w-[250px] h-[250px] rounded-full overflow-hidden border-4 border-gray-100 shadow-inner bg-gray-50 cursor-move"
                    ref={containerRef}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                >
                    <img 
                        ref={imageRef}
                        src={localSrc}
                        draggable={false}
                        alt="Crop Preview"
                        style={{
                            transform: `translate(-50%, -50%) translate(${pan.x}px, ${pan.y}px) scale(${zoom}) rotate(${rotation}deg)`,
                            position: 'absolute',
                            left: '50%',
                            top: '50%',
                            maxWidth: 'none',
                            maxHeight: 'none',
                            minWidth: '100%',
                            minHeight: '100%',
                            objectFit: 'cover'
                        }}
                    />
                </div>
                
                <div className="w-full space-y-4 px-4">
                    {/* Zoom Control */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs text-gray-500 font-bold uppercase">
                            <span className="flex items-center gap-1"><ZoomOut size={14}/> Zoom</span>
                            <span className="flex items-center gap-1"><ZoomIn size={14}/></span>
                        </div>
                        <input 
                            type="range" 
                            min="0.1" 
                            max="3" 
                            step="0.01" 
                            value={zoom} 
                            onChange={(e) => setZoom(parseFloat(e.target.value))} 
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-gray-900"
                        />
                    </div>

                    {/* Rotation Control */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs text-gray-500 font-bold uppercase">
                            <span className="flex items-center gap-1"><RotateCw size={14}/> Rotire</span>
                            <span className="flex items-center gap-1">{rotation}°</span>
                        </div>
                        <input 
                            type="range" 
                            min="0" 
                            max="360" 
                            step="1" 
                            value={rotation} 
                            onChange={(e) => setRotation(parseFloat(e.target.value))} 
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-gray-900"
                        />
                    </div>
                    
                    <div className="text-center">
                        <span className="text-[10px] text-gray-400 font-medium flex items-center justify-center gap-1">
                            <ClipboardPaste size={12}/> Paste (Ctrl+V) pentru a înlocui poza
                        </span>
                    </div>
                </div>

                <div className="flex gap-3 w-full">
                    <Button variant="secondary" onClick={onCancel}>Anulează</Button>
                    <Button onClick={handleSave}>Salvează Poza</Button>
                </div>
            </div>
        </Modal>
    );
};
