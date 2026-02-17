import React, { useRef, useState, useEffect, useCallback } from 'react';
import { CalendarEvent, DayEntry, EventCategory, CanvasRectangle } from '../types';
import { MONTHS, MOOD_ICONS, CATEGORY_ICONS, YEAR } from '../constants';
import { formatDateISO, isValidDay, isDateInRange, generateId } from '../utils';
import { Tag, ZoomIn, ZoomOut, Maximize, Hand, MousePointer2, Square, Plus } from 'lucide-react';

interface YearCanvasProps {
  daysData: Record<string, DayEntry>;
  eventsData: CalendarEvent[];
  rectangles: CanvasRectangle[];
  onDayClick: (dateStr: string) => void;
  onRangeSelect?: (start: string, end: string) => void;
  onEventClick: (event: CalendarEvent) => void;
  onAddEventClick: (dateStr: string) => void;
  onAddRectangle: (rect: CanvasRectangle) => void;
  onUpdateRectangle: (rect: CanvasRectangle) => void;
  onDeleteRectangle: (id: string) => void;
}

// --- Dimensions Constants (Vector Layout) ---
const CELL_WIDTH = 78;
const CELL_HEIGHT = 120;
const MONTH_LABEL_WIDTH = 120;
const HEADER_HEIGHT = 50;
const TOTAL_WIDTH = MONTH_LABEL_WIDTH + (31 * CELL_WIDTH);
const TOTAL_HEIGHT = HEADER_HEIGHT + (12 * CELL_HEIGHT);

type InteractionMode = 'pan' | 'select' | 'rectangle';

const YearCanvas: React.FC<YearCanvasProps> = ({ 
  daysData, eventsData, rectangles, onDayClick, onRangeSelect, onEventClick, onAddEventClick, onAddRectangle, onUpdateRectangle, onDeleteRectangle
}) => {
  // --- Performance Optimization: Use Refs for Transform ---
  // We use refs instead of state for pan/zoom to avoid re-rendering the entire SVG tree on every mouse move.
  const transformRef = useRef({ x: 50, y: 50, scale: 0.8 });
  const canvasContentRef = useRef<HTMLDivElement>(null);
  
  // UI State (Only things that need to trigger re-renders)
  const [mode, setMode] = useState<InteractionMode>('pan');
  const [selectionRange, setSelectionRange] = useState<{ start: string, end: string } | null>(null);
  
  // Rectangle State
  const [selectedRectId, setSelectedRectId] = useState<string | null>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [currentRect, setCurrentRect] = useState<Partial<CanvasRectangle> | null>(null);

  // References
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Interaction Refs
  const isDragging = useRef(false);
  const isSelecting = useRef(false);
  const isDrawingRect = useRef(false);
  
  // For Rectangle Move/Resize
  const rectInteraction = useRef<{
    type: 'move' | 'resize';
    rectId: string;
    startMouse: { x: number, y: number };
    initialRect: CanvasRectangle;
    handle?: string;
  } | null>(null);

  const lastPos = useRef({ x: 0, y: 0 });
  const rectStartPos = useRef({ x: 0, y: 0 }); 
  const hasMoved = useRef(false); 
  const selectionStartRef = useRef<string | null>(null);

  // --- Constants ---
  const MIN_SCALE = 0.1;
  const MAX_SCALE = 4.0;
  const dayColumns = Array.from({ length: 31 }, (_, i) => i + 1);

  // --- Helper: Apply Transform Directly to DOM ---
  const updateCanvasTransform = () => {
    if (canvasContentRef.current) {
      const { x, y, scale } = transformRef.current;
      canvasContentRef.current.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`;
    }
  };

  // Initial Paint
  useEffect(() => {
    updateCanvasTransform();
  }, []);

  // --- Helper: Screen -> Canvas Coordinates ---
  const getCanvasCoordinates = (clientX: number, clientY: number) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    const { x, y, scale } = transformRef.current;
    
    // Calculate relative to the transformed origin
    const canvasX = (clientX - rect.left - x) / scale;
    const canvasY = (clientY - rect.top - y) / scale;
    return { x: canvasX, y: canvasY };
  };

  // --- Keyboard Shortcuts & Delete ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (editingTextId) return;

      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const key = e.key.toLowerCase();
      if (key === 'v') setMode('select');
      if (key === 'h') setMode('pan');
      if (key === 'r') setMode('rectangle');

      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedRectId) {
        onDeleteRectangle(selectedRectId);
        setSelectedRectId(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedRectId, editingTextId, onDeleteRectangle]);

  // --- Event Handlers (Global / Canvas) ---

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      const zoomSensitivity = 0.001;
      const delta = -e.deltaY * zoomSensitivity;
      const oldScale = transformRef.current.scale;
      const newScale = Math.min(Math.max(oldScale + delta, MIN_SCALE), MAX_SCALE);
      
      const rect = containerRef.current!.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      // Calculate zoom towards mouse pointer
      const scaleRatio = newScale / oldScale;
      const newX = mouseX - (mouseX - transformRef.current.x) * scaleRatio;
      const newY = mouseY - (mouseY - transformRef.current.y) * scaleRatio;

      transformRef.current = { x: newX, y: newY, scale: newScale };
    } else {
      transformRef.current.x -= e.deltaX;
      transformRef.current.y -= e.deltaY;
    }
    updateCanvasTransform();
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;

    // Clear selection if clicking empty space (and not interacting with rect)
    if (selectedRectId && !rectInteraction.current) {
        setSelectedRectId(null);
    }
    if (editingTextId) {
        setEditingTextId(null);
    }

    // 1. Rectangle Creation Mode
    if (mode === 'rectangle') {
        const coords = getCanvasCoordinates(e.clientX, e.clientY);
        isDrawingRect.current = true;
        rectStartPos.current = coords;
        setCurrentRect({ x: coords.x, y: coords.y, width: 0, height: 0, color: '#ef4444' });
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        return;
    }

    // 2. Pan Mode
    if (mode === 'pan' || mode === 'select') {
         // Note: Select start is handled in the cell handler, but we track dragging generally here
         isDragging.current = true;
         hasMoved.current = false;
         lastPos.current = { x: e.clientX, y: e.clientY };
         (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const coords = getCanvasCoordinates(e.clientX, e.clientY);

    // A. Rectangle Interaction
    if (rectInteraction.current) {
        const { type, initialRect, startMouse, handle } = rectInteraction.current;
        const scale = transformRef.current.scale;
        const deltaX = (e.clientX - startMouse.x) / scale;
        const deltaY = (e.clientY - startMouse.y) / scale;

        let newRect = { ...initialRect };

        if (type === 'move') {
            newRect.x = initialRect.x + deltaX;
            newRect.y = initialRect.y + deltaY;
        } else if (type === 'resize' && handle) {
            if (handle.includes('e')) newRect.width = initialRect.width + deltaX;
            if (handle.includes('s')) newRect.height = initialRect.height + deltaY;
            if (handle.includes('w')) {
                newRect.x = initialRect.x + deltaX;
                newRect.width = initialRect.width - deltaX;
            }
            if (handle.includes('n')) {
                newRect.y = initialRect.y + deltaY;
                newRect.height = initialRect.height - deltaY;
            }
        }
        onUpdateRectangle(newRect);
        return;
    }

    // B. Drawing New Rectangle
    if (isDrawingRect.current && currentRect) {
        const width = coords.x - rectStartPos.current.x;
        const height = coords.y - rectStartPos.current.y;
        setCurrentRect(prev => ({ ...prev, width, height }));
        return;
    }

    // C. Panning
    if (isDragging.current) {
        const deltaX = e.clientX - lastPos.current.x;
        const deltaY = e.clientY - lastPos.current.y;
        if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) hasMoved.current = true;
        
        // Only pan if NOT selecting
        if (!isSelecting.current) {
             transformRef.current.x += deltaX;
             transformRef.current.y += deltaY;
             updateCanvasTransform();
        }
        lastPos.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);

    // End Rect Interaction
    if (rectInteraction.current) {
        const r = rectangles.find(r => r.id === rectInteraction.current!.rectId);
        if (r && (r.width < 0 || r.height < 0)) {
            const normalized = {
                ...r,
                x: r.width < 0 ? r.x + r.width : r.x,
                y: r.height < 0 ? r.y + r.height : r.y,
                width: Math.abs(r.width),
                height: Math.abs(r.height)
            };
            onUpdateRectangle(normalized);
        }
        rectInteraction.current = null;
        return;
    }

    // End Drawing
    if (isDrawingRect.current && currentRect) {
        isDrawingRect.current = false;
        const finalX = currentRect.width! < 0 ? rectStartPos.current.x + currentRect.width! : rectStartPos.current.x;
        const finalY = currentRect.height! < 0 ? rectStartPos.current.y + currentRect.height! : rectStartPos.current.y;
        const finalW = Math.abs(currentRect.width!);
        const finalH = Math.abs(currentRect.height!);

        if (finalW > 10 && finalH > 10) {
            const newId = generateId();
            onAddRectangle({
                id: newId,
                x: finalX,
                y: finalY,
                width: finalW,
                height: finalH,
                color: '#ef4444'
            });
            if (mode === 'rectangle') {
                 setSelectedRectId(newId);
                 setMode('pan'); 
            }
        }
        setCurrentRect(null);
        return;
    }

    isDragging.current = false;
  };

  // --- Rectangle Specific Handlers ---

  const handleRectPointerDown = (e: React.PointerEvent, rect: CanvasRectangle, handle?: string) => {
    e.stopPropagation();
    e.preventDefault();
    (containerRef.current as HTMLElement).setPointerCapture(e.pointerId);

    setSelectedRectId(rect.id);
    rectInteraction.current = {
        type: handle ? 'resize' : 'move',
        rectId: rect.id,
        initialRect: { ...rect },
        startMouse: { x: e.clientX, y: e.clientY },
        handle
    };
  };

  const handleRectDoubleClick = (e: React.MouseEvent, rectId: string) => {
      e.stopPropagation();
      setEditingTextId(rectId);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>, rect: CanvasRectangle) => {
      onUpdateRectangle({ ...rect, text: e.target.value });
  };

  // --- Cell Interactions ---

  const handleCellPointerDown = (e: React.PointerEvent, dateStr: string) => {
    if (mode === 'rectangle' || rectInteraction.current) return;

    if (mode === 'select' || e.shiftKey) {
        e.stopPropagation();
        isSelecting.current = true;
        selectionStartRef.current = dateStr;
        setSelectionRange({ start: dateStr, end: dateStr });
    }
  };

  const handleCellPointerEnter = (dateStr: string) => {
    if (isSelecting.current && selectionStartRef.current) {
        const start = selectionStartRef.current < dateStr ? selectionStartRef.current : dateStr;
        const end = selectionStartRef.current < dateStr ? dateStr : selectionStartRef.current;
        setSelectionRange({ start, end });
    }
  };

  const handleGlobalPointerUp = () => {
      if (isSelecting.current && selectionStartRef.current && selectionRange) {
          isSelecting.current = false;
          if (selectionRange.start !== selectionRange.end && onRangeSelect) {
              onRangeSelect(selectionRange.start, selectionRange.end);
          } else {
              onDayClick(selectionRange.start);
          }
          setSelectionRange(null);
          selectionStartRef.current = null;
      }
  };

  useEffect(() => {
      window.addEventListener('pointerup', handleGlobalPointerUp);
      return () => window.removeEventListener('pointerup', handleGlobalPointerUp);
  }, [selectionRange]); 

  // --- Data Helpers ---
  const getEventsForCell = (dateStr: string) => eventsData.filter(evt => isDateInRange(dateStr, evt.startDate, evt.endDate));

  // --- Zoom Controls (Modified to work with Refs) ---
  const zoomIn = () => {
      transformRef.current.scale = Math.min(transformRef.current.scale + 0.2, MAX_SCALE);
      updateCanvasTransform();
  };
  const zoomOut = () => {
      transformRef.current.scale = Math.max(transformRef.current.scale - 0.2, MIN_SCALE);
      updateCanvasTransform();
  };
  const resetView = () => {
      transformRef.current = { x: 50, y: 50, scale: 0.8 };
      updateCanvasTransform();
  };

  return (
    <div 
        className={`flex-1 relative overflow-hidden bg-[#e5e5f7] h-full w-full select-none outline-none
        ${mode === 'pan' ? 'cursor-grab active:cursor-grabbing' : ''}
        ${mode === 'select' ? 'cursor-default' : ''}
        ${mode === 'rectangle' ? 'cursor-cell' : ''}
        `}
    >
      <div 
        ref={containerRef}
        className="w-full h-full touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <div 
           ref={canvasContentRef}
           className="origin-top-left will-change-transform"
        >
            <svg 
                width={TOTAL_WIDTH} 
                height={TOTAL_HEIGHT}
                className="bg-white shadow-2xl rounded-sm"
                viewBox={`0 0 ${TOTAL_WIDTH} ${TOTAL_HEIGHT}`}
            >
                {/* 1. Header Row (Day Numbers) */}
                <line x1={0} y1={HEADER_HEIGHT} x2={TOTAL_WIDTH} y2={HEADER_HEIGHT} stroke="#e2e8f0" strokeWidth="2" />
                <line x1={MONTH_LABEL_WIDTH} y1={0} x2={MONTH_LABEL_WIDTH} y2={TOTAL_HEIGHT} stroke="#e2e8f0" strokeWidth="2" />
                
                <text x={MONTH_LABEL_WIDTH / 2} y={HEADER_HEIGHT / 2 + 5} textAnchor="middle" className="text-sm font-bold fill-slate-400 font-sans tracking-widest">2026</text>

                {dayColumns.map((dayNum, i) => {
                    const x = MONTH_LABEL_WIDTH + (i * CELL_WIDTH);
                    return (
                        <g key={`header-${dayNum}`}>
                            <line x1={x} y1={0} x2={x} y2={TOTAL_HEIGHT} stroke="#f1f5f9" strokeWidth="1" />
                            <text x={x + CELL_WIDTH / 2} y={HEADER_HEIGHT / 2 + 5} textAnchor="middle" className="text-xs font-bold fill-slate-400 font-sans">{dayNum}</text>
                        </g>
                    );
                })}
                {/* Right border */}
                <line x1={TOTAL_WIDTH} y1={0} x2={TOTAL_WIDTH} y2={TOTAL_HEIGHT} stroke="#e2e8f0" strokeWidth="2" />

                {/* 2. Grid Content */}
                {MONTHS.map((monthName, monthIndex) => {
                    const rowY = HEADER_HEIGHT + (monthIndex * CELL_HEIGHT);
                    
                    return (
                        <g key={monthName}>
                            {/* Horizontal Line Bottom */}
                            <line x1={0} y1={rowY + CELL_HEIGHT} x2={TOTAL_WIDTH} y2={rowY + CELL_HEIGHT} stroke="#e2e8f0" strokeWidth="1" />
                            
                            {/* Month Label */}
                            <text 
                                x={MONTH_LABEL_WIDTH / 2} 
                                y={rowY + CELL_HEIGHT / 2} 
                                textAnchor="middle" 
                                dominantBaseline="middle"
                                className="text-xs font-bold fill-slate-700 font-sans uppercase tracking-wider"
                            >
                                {monthName}
                            </text>

                            {/* Days */}
                            {dayColumns.map((dayNum, dayIndex) => {
                                const colX = MONTH_LABEL_WIDTH + (dayIndex * CELL_WIDTH);
                                const isValid = isValidDay(monthIndex, dayNum);
                                const dateStr = isValid ? formatDateISO(monthIndex, dayNum) : `invalid-${monthIndex}-${dayNum}`;
                                
                                if (!isValid) {
                                    // Hatch pattern for invalid
                                    return (
                                        <rect 
                                            key={dateStr}
                                            x={colX} y={rowY} width={CELL_WIDTH} height={CELL_HEIGHT}
                                            fill="#f8fafc"
                                            className="pointer-events-none"
                                        />
                                    );
                                }

                                const date = new Date(YEAR, monthIndex, dayNum);
                                const dayOfWeek = date.getDay();
                                const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                                const dayName = date.toLocaleDateString('es-ES', { weekday: 'short' }).replace('.', '');
                                const formattedDayName = dayName.charAt(0).toUpperCase() + dayName.slice(1);
                                
                                const entry = daysData[dateStr];
                                const cellEvents = getEventsForCell(dateStr);
                                cellEvents.sort((a, b) => a.startDate.localeCompare(b.startDate));
                                
                                const isInSelection = selectionRange && isDateInRange(dateStr, selectionRange.start, selectionRange.end);

                                // Background Color
                                let bgFill = isWeekend ? '#f8fafc' : '#ffffff';
                                if (isInSelection) bgFill = '#dbeafe'; // blue-100

                                return (
                                    <g 
                                        key={dateStr}
                                        onPointerDown={(e) => handleCellPointerDown(e, dateStr)}
                                        onPointerEnter={() => handleCellPointerEnter(dateStr)}
                                        onClick={(e) => {
                                             if (!isSelecting.current && !selectionRange && !hasMoved.current && mode !== 'rectangle' && !rectInteraction.current && !editingTextId) {
                                                onDayClick(dateStr);
                                             }
                                        }}
                                        className={`group ${mode === 'select' ? 'cursor-default' : 'cursor-pointer'}`}
                                    >
                                        <rect 
                                            x={colX} y={rowY} width={CELL_WIDTH} height={CELL_HEIGHT} 
                                            fill={bgFill}
                                            stroke={isInSelection ? '#3b82f6' : 'none'}
                                            strokeWidth={isInSelection ? 2 : 0}
                                        />
                                        
                                        {/* Date Text (Vector) - Moved to top left */}
                                        <text x={colX + 5} y={rowY + 15} className={`text-xs font-bold font-sans ${isWeekend ? 'fill-slate-500' : 'fill-slate-800'}`}>
                                            {dayNum}
                                        </text>
                                        <text x={colX + 5} y={rowY + 26} className="text-[8px] font-semibold fill-slate-400 font-sans uppercase">
                                            {formattedDayName}
                                        </text>
                                        
                                        {/* Mood Icon (via ForeignObject for Lucide) */}
                                        {entry?.mood && (
                                            <foreignObject x={colX + CELL_WIDTH - 24} y={rowY + 4} width={20} height={20} className="pointer-events-none">
                                                <div className="flex justify-center items-center h-full">
                                                    {MOOD_ICONS[entry.mood]}
                                                </div>
                                            </foreignObject>
                                        )}

                                        {/* Events Content (HTML for wrapping and chips) */}
                                        <foreignObject x={colX} y={rowY + 32} width={CELL_WIDTH} height={CELL_HEIGHT - 32} className="pointer-events-none">
                                            <div className="w-full h-full p-1 flex flex-col gap-1 overflow-hidden pointer-events-auto">
                                                {cellEvents.slice(0, 4).map((evt) => {
                                                    const isStart = evt.startDate === dateStr;
                                                    const isEnd = evt.endDate === dateStr;
                                                    const icon = CATEGORY_ICONS[evt.category as EventCategory] || <Tag size={10} />;
                                                    
                                                    return (
                                                        <div
                                                            key={evt.id}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (!hasMoved.current && mode !== 'rectangle' && !rectInteraction.current) {
                                                                    onEventClick(evt);
                                                                }
                                                            }}
                                                            className={`
                                                                h-[18px] text-[10px] flex items-center px-1.5 text-white shadow-sm hover:brightness-110 transition-all cursor-pointer
                                                                ${isStart ? 'rounded-l-md ml-0 pl-1.5' : '-ml-2 rounded-l-none pl-3'} 
                                                                ${isEnd ? 'rounded-r-md mr-0' : '-mr-2 rounded-r-none'}
                                                            `}
                                                            style={{ backgroundColor: evt.color }}
                                                        >
                                                            {(isStart || dayNum === 1) && (
                                                                <span className="flex items-center gap-1 whitespace-nowrap overflow-hidden">
                                                                {isStart && <span className="opacity-80">{icon}</span>}
                                                                <span className="font-semibold truncate">{evt.title}</span>
                                                                </span>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                                {cellEvents.length > 4 && <div className="text-[9px] text-gray-400 font-medium text-right pr-2">+{cellEvents.length - 4}</div>}
                                                
                                                {/* Hover "+" Card (HTML overlay inside ForeignObject) */}
                                                <div className="mt-auto pb-1 px-1">
                                                    <div 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onAddEventClick(dateStr);
                                                        }}
                                                        className="
                                                            flex items-center justify-center p-1 rounded-md
                                                            bg-blue-50 border border-blue-200 text-blue-500
                                                            opacity-0 group-hover:opacity-100 transition-all duration-200 
                                                            cursor-pointer hover:bg-blue-100 hover:shadow-sm
                                                        "
                                                    >
                                                        <Plus size={16} />
                                                    </div>
                                                </div>
                                            </div>
                                        </foreignObject>
                                    </g>
                                );
                            })}
                        </g>
                    );
                })}

                {/* 3. User Drawn Rectangles Layer */}
                {rectangles.map(rect => {
                    const isSelected = selectedRectId === rect.id;
                    const isEditing = editingTextId === rect.id;
                    
                    return (
                        <g 
                            key={rect.id}
                            onPointerDown={(e) => handleRectPointerDown(e, rect)}
                            onDoubleClick={(e) => handleRectDoubleClick(e, rect.id)}
                            className="group"
                            style={{ cursor: isEditing ? 'text' : 'move' }}
                        >
                            <rect 
                                x={rect.x} y={rect.y} width={rect.width} height={rect.height}
                                fill={rect.color + "15"}
                                stroke={rect.color}
                                strokeWidth={isSelected ? 3 : 2}
                                className="transition-all"
                            />
                            
                            {/* Text Content */}
                            <foreignObject x={rect.x} y={rect.y} width={rect.width} height={rect.height}>
                                {isEditing ? (
                                    <textarea 
                                        autoFocus
                                        className="w-full h-full bg-transparent resize-none outline-none p-2 text-sm font-bold text-slate-800 leading-snug text-center"
                                        style={{ color: rect.color === '#ef4444' ? '#7f1d1d' : 'inherit' }}
                                        value={rect.text || ''}
                                        onChange={(e) => handleTextChange(e, rect)}
                                        onBlur={() => setEditingTextId(null)}
                                        onPointerDown={(e) => e.stopPropagation()} 
                                    />
                                ) : (
                                    <div className="w-full h-full p-2 text-sm font-bold leading-snug whitespace-pre-wrap break-words flex items-center justify-center text-center pointer-events-none"
                                        style={{ color: rect.color === '#ef4444' ? '#7f1d1d' : 'inherit' }}>
                                        {rect.text}
                                    </div>
                                )}
                            </foreignObject>

                             {/* Resize Handles */}
                             {isSelected && !isEditing && (
                                <g>
                                    {['nw', 'ne', 'sw', 'se'].map(handle => {
                                        let cx = 0, cy = 0;
                                        if (handle.includes('w')) cx = rect.x; else cx = rect.x + rect.width;
                                        if (handle.includes('n')) cy = rect.y; else cy = rect.y + rect.height;
                                        
                                        return (
                                            <rect
                                                key={handle}
                                                x={cx - 4} y={cy - 4} width={8} height={8}
                                                fill="white" stroke="#3b82f6" strokeWidth={1}
                                                style={{ cursor: `${handle}-resize` }}
                                                onPointerDown={(e) => handleRectPointerDown(e, rect, handle)}
                                            />
                                        );
                                    })}
                                    
                                    {/* Delete Button (ForeignObject to float outside) */}
                                    <foreignObject x={rect.x + rect.width - 60} y={rect.y - 30} width={60} height={25} className="overflow-visible">
                                         <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDeleteRectangle(rect.id);
                                            }}
                                            className="w-full h-full bg-white text-red-500 rounded-md shadow-md border border-gray-200 text-xs font-bold hover:bg-red-50 flex items-center justify-center"
                                        >
                                            Borrar
                                        </button>
                                    </foreignObject>
                                </g>
                             )}
                        </g>
                    );
                })}

                {/* Drawing Rectangle Preview */}
                {currentRect && (
                     <rect 
                        x={Math.min(rectStartPos.current.x, rectStartPos.current.x + (currentRect.width || 0))}
                        y={Math.min(rectStartPos.current.y, rectStartPos.current.y + (currentRect.height || 0))}
                        width={Math.abs(currentRect.width || 0)}
                        height={Math.abs(currentRect.height || 0)}
                        fill="#ef444415"
                        stroke="#ef4444"
                        strokeWidth={2}
                        strokeDasharray="4"
                        className="pointer-events-none"
                     />
                )}

            </svg>
        </div>
      </div>

      {/* Bottom Right Controls */}
      <div className="absolute bottom-6 right-6 flex flex-col gap-4 z-50">
        <div className="bg-white p-1 rounded-lg shadow-xl border border-gray-200 flex flex-col">
            <button onClick={() => setMode('pan')} className={`p-2 rounded-md transition-colors ${mode === 'pan' ? 'bg-slate-900 text-white' : 'text-gray-500 hover:bg-gray-100'}`} title="Pan Mode (H)"><Hand size={20} /></button>
            <button onClick={() => setMode('select')} className={`p-2 rounded-md transition-colors ${mode === 'select' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`} title="Select Mode (V)"><MousePointer2 size={20} /></button>
            <button onClick={() => setMode('rectangle')} className={`p-2 rounded-md transition-colors ${mode === 'rectangle' ? 'bg-red-500 text-white' : 'text-gray-500 hover:bg-gray-100'}`} title="Rectangle Tool (R)"><Square size={20} /></button>
        </div>
        <div className="bg-white p-1 rounded-lg shadow-xl border border-gray-200 flex flex-col">
            <button onClick={zoomIn} className="p-2 hover:bg-gray-100 rounded-md text-gray-600" title="Zoom In"><ZoomIn size={20} /></button>
            <button onClick={zoomOut} className="p-2 hover:bg-gray-100 rounded-md text-gray-600" title="Zoom Out"><ZoomOut size={20} /></button>
            <hr className="border-gray-200 my-1" />
            <button onClick={resetView} className="p-2 hover:bg-gray-100 rounded-md text-gray-600" title="Reset View"><Maximize size={20} /></button>
        </div>
      </div>

      <div className="absolute bottom-6 left-6 bg-white/90 backdrop-blur px-4 py-2 rounded-full shadow-lg border border-gray-200 text-xs text-slate-500 pointer-events-none z-50 flex items-center gap-2">
        {mode === 'pan' && (<><Hand size={14} /> <span>Pan Mode • <strong>R</strong> for Rectangles • <strong>V</strong> for Select</span></>)}
        {mode === 'select' && (<><MousePointer2 size={14} className="text-blue-600" /> <span className="text-blue-700 font-medium">Selection Mode</span></>)}
        {mode === 'rectangle' && (<><Square size={14} className="text-red-500" /> <span className="text-red-600 font-medium">Draw Mode</span></>)}
        {selectedRectId && <span className="ml-2 pl-2 border-l border-gray-300">Selected Rectangle (Press Del to remove)</span>}
      </div>
    </div>
  );
};

export default YearCanvas;