import React, { useState, useEffect, useCallback } from 'react';
import { 
  X, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Download, 
  ChevronLeft, 
  ChevronRight, 
  Maximize2, 
  Minimize2,
  Calendar,
  Building2,
  Receipt
} from 'lucide-react';

export const ImageViewerModal = ({ 
  isOpen, 
  onClose, 
  images = [], 
  initialIndex = 0,
  title = 'Visor de Imagen'
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      resetTransform();
    }
  }, [isOpen, initialIndex]);

  const resetTransform = () => {
    setScale(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  };

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.3, 4));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.3, 0.5));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);

  const handlePrev = useCallback(() => {
    if (images.length > 1) {
      setCurrentIndex(prev => (prev > 0 ? prev - 1 : images.length - 1));
      resetTransform();
    }
  }, [images.length]);

  const handleNext = useCallback(() => {
    if (images.length > 1) {
      setCurrentIndex(prev => (prev < images.length - 1 ? prev + 1 : 0));
      resetTransform();
    }
  }, [images.length]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === '+' || e.key === '=') handleZoomIn();
      if (e.key === '-') handleZoomOut();
      if (e.key === 'r' || e.key === 'R') handleRotate();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handlePrev, handleNext, onClose]);

  if (!isOpen || !images || images.length === 0) return null;

  const currentImage = images[currentIndex] || {};
  const imageUrl = typeof currentImage === 'string' ? currentImage : (currentImage.url || currentImage.fotoUrl || '');

  // Descargar imagen actual
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `imagen_obra_${currentImage.numero || currentIndex + 1}.jpg`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  // Manejo de arrastre (Pan) cuando hay zoom
  const handleMouseDown = (e) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  return (
    <div 
      className="fixed inset-0 z-50 flex flex-col bg-slate-950/90 backdrop-blur-md select-none animate-fadeIn"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Barra Superior con Controles */}
      <div className="flex items-center justify-between p-3 sm:p-4 bg-slate-900/80 border-b border-slate-800 text-white z-10">
        <div className="flex items-center gap-3">
          <div className="text-xs sm:text-sm font-bold truncate max-w-[200px] sm:max-w-md">
            {currentImage.proveedor ? (
              <span className="flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-emerald-400" />
                Albarán: {currentImage.proveedor} {currentImage.numero ? `(#${currentImage.numero})` : ''}
              </span>
            ) : currentImage.caption ? (
              <span>{currentImage.caption}</span>
            ) : (
              <span>{title} {images.length > 1 ? `(${currentIndex + 1} de ${images.length})` : ''}</span>
            )}
          </div>
          {currentImage.fecha && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md">
              <Calendar className="w-3 h-3" />
              {currentImage.fecha}
            </span>
          )}
        </div>

        {/* Botones de Acción */}
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={handleZoomIn}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors"
            title="Acercar (+)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors"
            title="Alejar (-)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleRotate}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors"
            title="Girar 90° (R)"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          <button
            onClick={resetTransform}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors text-xs font-bold"
            title="Restablecer tamaño"
          >
            1:1
          </button>
          <button
            onClick={handleDownload}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors"
            title="Descargar imagen"
          >
            <Download className="w-4 h-4" />
          </button>
          <div className="h-6 w-px bg-slate-800 mx-1"></div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-red-500/20 hover:bg-red-500 text-red-300 hover:text-white transition-colors"
            title="Cerrar (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Área Central de Visualización */}
      <div 
        className="flex-1 flex items-center justify-center p-4 overflow-hidden relative"
        onMouseDown={handleMouseDown}
        style={{ cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
      >
        {/* Botón Anterior */}
        {images.length > 1 && (
          <button
            onClick={(e) => { e.stopPropagation(); handlePrev(); }}
            className="absolute left-4 z-20 p-3 rounded-full bg-slate-900/80 hover:bg-brand-600 text-white shadow-xl backdrop-blur-sm transition-all active:scale-95"
            title="Foto anterior"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* Imagen con transformaciones */}
        <div
          className="transition-transform duration-100 ease-out max-h-full max-w-full flex items-center justify-center"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`
          }}
        >
          <img
            src={imageUrl}
            alt={currentImage.caption || 'Foto de obra'}
            className="max-h-[82vh] max-w-[90vw] object-contain rounded-lg shadow-2xl pointer-events-none"
            draggable={false}
          />
        </div>

        {/* Botón Siguiente */}
        {images.length > 1 && (
          <button
            onClick={(e) => { e.stopPropagation(); handleNext(); }}
            className="absolute right-4 z-20 p-3 rounded-full bg-slate-900/80 hover:bg-brand-600 text-white shadow-xl backdrop-blur-sm transition-all active:scale-95"
            title="Foto siguiente"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Pie con metadatos y miniaturas */}
      {images.length > 1 && (
        <div className="p-3 bg-slate-900/80 border-t border-slate-800 flex items-center justify-center gap-2 overflow-x-auto">
          {images.map((img, idx) => {
            const thumbUrl = typeof img === 'string' ? img : (img.url || img.fotoUrl);
            const isSelected = idx === currentIndex;
            return (
              <button
                key={idx}
                onClick={() => { setCurrentIndex(idx); resetTransform(); }}
                className={`w-12 h-12 rounded-lg overflow-hidden shrink-0 border-2 transition-all ${
                  isSelected ? 'border-brand-500 scale-105 shadow-md' : 'border-slate-700 opacity-50 hover:opacity-100'
                }`}
              >
                <img src={thumbUrl} alt="" className="w-full h-full object-cover" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
