import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  LayoutDashboard,
  Settings,
  MoreVertical,
  Calendar,
  ExternalLink,
  BarChart2,
  MessageSquare,
  Grab,
  Youtube
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// --- Types & Constants ---

const COLUMNS = [
  { id: 'idea', title: 'Idea', color: 'bg-blue-500' },
  { id: 'kit', title: 'Kit generado', color: 'bg-indigo-500' },
  { id: 'production', title: 'Producción', color: 'bg-yellow-500' },
  { id: 'post-production', title: 'Postproducción', color: 'bg-orange-500' },
  { id: 'scheduled', title: 'Programado', color: 'bg-purple-500' },
  { id: 'published', title: 'Publicado', color: 'bg-green-500' },
  { id: 'analytics', title: 'Analítica inicial', color: 'bg-cyan-500' },
  { id: 'completed', title: 'Completado', color: 'bg-emerald-500' },
];

const INITIAL_DATA = [
  {
    id: 'vid-1',
    columnId: 'idea',
    title: 'Cómo usar Claude 3.7 para programar',
    scheduledDate: '2025-03-01',
    status: 'Borrador',
    notes: 'Enfoque en las nuevas capacidades de razonamiento.',
    youtubeLink: '',
    metrics: { ctr: 0, retention: 0 }
  },
  {
    id: 'vid-2',
    columnId: 'production',
    title: 'Setup de productividad 2025',
    scheduledDate: '2025-02-28',
    status: 'Grabando',
    notes: 'Incluir el nuevo monitor y la silla ergonómica.',
    youtubeLink: '',
    metrics: { ctr: 0, retention: 0 }
  }
];

// --- Components ---

const getStatusStyles = (status) => {
  switch (status) {
    case 'En curso':
    case 'Grabando':
      return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    case 'Revisión':
      return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
    case 'Bloqueado':
    case 'Error':
      return 'bg-red-500/10 text-red-400 border-red-500/20 group-hover:animate-shake';
    case 'Completado':
    case 'Publicado':
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    default:
      return 'bg-white/5 text-white/50 border-white/10';
  }
};

const VideoCard = ({ video, isOverlay, index = 0, onEdit }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: video.id,
    data: {
      type: 'Video',
      video,
    }
  });

  const style = {
    transition,
    transform: CSS.Translate.toString(transform),
  };

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="glass p-4 rounded-xl mb-3 border-2 border-primary/50 opacity-30 h-[140px]"
      />
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        animationDelay: `${index * 75}ms`
      }}
      {...attributes}
      {...listeners}
      onClick={() => onEdit(video)}
      className={`glass relative p-4 rounded-xl mb-3 border border-white/5 hover:border-white/10 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10 hover:bg-white/[0.02] transition-all duration-300 ease-out cursor-grab active:cursor-grabbing active:scale-[0.98] group overflow-hidden ${isOverlay ? 'shadow-2xl shadow-black/50 border-primary/30 ring-1 ring-primary/20 scale-[1.02] rotate-1 z-50' : 'animate-fade-in-up opacity-0'}`}
    >
      <div className="absolute inset-0 glass-shine" />
      <div className="flex justify-between items-start mb-2 relative z-10">
        <h3 className="font-medium text-sm line-clamp-2 leading-tight group-hover:text-primary transition-colors duration-300">
          {video.title}
        </h3>
        <button className="text-muted-foreground hover:text-foreground p-1 rounded-md transition-colors">
          <MoreVertical size={14} />
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mt-3">
        {video.scheduledDate && (
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground bg-white/5 px-2 py-1 rounded-full border border-white/5">
            <Calendar size={10} />
            {video.scheduledDate}
          </div>
        )}
        {video.youtubeLink && (
          <div className="flex items-center gap-1 text-[10px] text-primary bg-primary/10 px-2 py-1 rounded-full border border-primary/20">
            <Youtube size={10} />
            Link
          </div>
        )}
      </div>

      <div className="flex justify-between items-center mt-4 pt-3 border-t border-white/5">
        <div className="flex gap-3">
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <BarChart2 size={10} />
            {video.metrics.ctr}%
          </div>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <MessageSquare size={10} />
            Note
          </div>
        </div>
        <div className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${getStatusStyles(video.status)} transition-colors duration-300 relative z-10`}>
          {video.status}
        </div>
      </div>
    </div>
  );
};

const Column = ({ column, videos, onEdit, onAdd }) => {
  const {
    setNodeRef,
    isOver
  } = useSortable({
    id: column.id,
    data: {
      type: 'Column',
      column,
    }
  });

  return (
    <div
      ref={setNodeRef}
      className={`kanban-column flex flex-col h-full rounded-2xl transition-all duration-300 ease-in-out ${isOver ? 'bg-white/5 ring-1 ring-white/10' : ''}`}
    >
      <div className="flex items-center justify-between p-4 mb-2 group cursor-default">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${column.color} shadow-sm group-hover:scale-125 transition-transform duration-300`} />
          <h2 className="font-semibold text-sm tracking-tight text-white/90 group-hover:text-white transition-colors duration-300">{column.title}</h2>
          <span className="ml-2 bg-white/5 text-muted-foreground text-[10px] py-0.5 px-2 rounded-full border border-white/5 group-hover:border-white/20 transition-colors duration-300">
            {videos.length}
          </span>
        </div>
        <button
          onClick={() => onAdd(column.id)}
          className="text-muted-foreground hover:text-primary transition-all duration-300 hover:bg-primary/10 hover:scale-110 active:scale-95 p-1 rounded-md"
        >
          <Plus size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 custom-scrollbar">
        <SortableContext items={videos.map(v => v.id)} strategy={verticalListSortingStrategy}>
          {videos.map((video, idx) => (
            <VideoCard key={video.id} video={video} index={idx} onEdit={onEdit} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
};

const DEFAULT_VIDEO = {
  title: '',
  scheduledDate: '',
  status: 'Pendiente',
  notes: '',
  youtubeLink: '',
  metrics: { ctr: 0, retention: 0 }
};

const VideoModal = ({ isOpen, video, onClose, onSave, onDelete }) => {
  const [formData, setFormData] = useState(() => ({
    ...DEFAULT_VIDEO,
    ...video
  }));

  useEffect(() => {
    if (video) {
      setFormData({
        ...DEFAULT_VIDEO,
        ...video
      });
    }
  }, [video]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="glass w-full max-w-2xl rounded-3xl overflow-hidden border border-white/10 shadow-2xl relative z-10"
      >
        <div className="p-6 sm:p-8">
          <div className="flex justify-between items-start mb-8">
            <h2 className="text-2xl font-bold font-['Outfit'] bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
              {video?.id ? 'Editar Video' : 'Nuevo Video'}
            </h2>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground hover:rotate-90 transition-transform duration-300 p-2 -mr-2 -mt-2">
              <Plus className="rotate-45" size={24} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-bold uppercase text-muted-foreground mb-1.5 block">Título del Video</label>
                <input
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-primary/50 transition-colors"
                  placeholder="Ej: Review de iPhone 16 Pro"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold uppercase text-muted-foreground mb-1.5 block">Fecha Programada</label>
                  <input
                    type="date"
                    value={formData.scheduledDate}
                    onChange={e => setFormData({ ...formData, scheduledDate: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-primary/50 transition-colors text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase text-muted-foreground mb-1.5 block">Estado</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-primary/50 transition-colors text-xs appearance-none"
                  >
                    <option value="Pendiente">Pendiente</option>
                    <option value="En curso">En curso</option>
                    <option value="Revisión">Revisión</option>
                    <option value="Bloqueado">Bloqueado</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase text-muted-foreground mb-1.5 block">YouTube Link</label>
                <div className="relative">
                  <Youtube className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                  <input
                    value={formData.youtubeLink}
                    onChange={e => setFormData({ ...formData, youtubeLink: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 outline-none focus:border-primary/50 transition-colors text-xs"
                    placeholder="https://youtube.com/watch?v=..."
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-bold uppercase text-muted-foreground mb-1.5 block">Notas de Producción</label>
                <textarea
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-primary/50 transition-colors h-[100px] resize-none text-sm"
                  placeholder="Detalles del guión, recursos necesarios..."
                />
              </div>

              <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                <label className="text-[11px] font-bold uppercase text-muted-foreground mb-3 block">Métricas de Analytics</label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] text-muted-foreground block mb-1">CTR (%)</span>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.metrics.ctr}
                      onChange={e => setFormData({ ...formData, metrics: { ...formData.metrics, ctr: parseFloat(e.target.value) } })}
                      className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 outline-none focus:border-primary/50 transition-colors text-sm"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block mb-1">Retención (%)</span>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.metrics.retention}
                      onChange={e => setFormData({ ...formData, metrics: { ...formData.metrics, retention: parseFloat(e.target.value) } })}
                      className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 outline-none focus:border-primary/50 transition-colors text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-between items-center gap-4">
            {video?.id ? (
              <button
                onClick={() => onDelete(video.id)}
                className="px-6 py-3 rounded-xl border border-destructive/30 text-destructive text-sm font-medium hover:bg-destructive/10 transition-colors"
              >
                Eliminar
              </button>
            ) : <div />}

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-6 py-3 rounded-xl text-muted-foreground text-sm font-medium hover:text-foreground transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => onSave(formData)}
                className="px-8 py-3 rounded-xl bg-gradient-to-r from-primary to-rose-600 text-primary-foreground text-sm font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 hover:scale-[1.02] active:scale-[0.98] active:translate-y-0 transition-all duration-300"
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [videos, setVideos] = useState(() => {
    const saved = localStorage.getItem('yt-kanban-videos');
    return saved ? JSON.parse(saved) : INITIAL_DATA;
  });

  const [activeVideo, setActiveVideo] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    localStorage.setItem('yt-kanban-videos', JSON.stringify(videos));
  }, [videos]);

  const onDragStart = (event) => {
    if (event.active.data.current?.type === 'Video') {
      setActiveVideo(event.active.data.current.video);
    }
  };

  const onDragOver = (event) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveAVideo = active.data.current?.type === 'Video';
    const isOverAVideo = over.data.current?.type === 'Video';

    if (!isActiveAVideo) return;

    // Dropping a Video over another Video
    if (isActiveAVideo && isOverAVideo) {
      setVideos((videos) => {
        const activeIndex = videos.findIndex((v) => v.id === activeId);
        const overIndex = videos.findIndex((v) => v.id === overId);

        if (videos[activeIndex].columnId !== videos[overIndex].columnId) {
          videos[activeIndex].columnId = videos[overIndex].columnId;
          return arrayMove(videos, activeIndex, overIndex - 1);
        }

        return arrayMove(videos, activeIndex, overIndex);
      });
    }

    // Dropping a Video over a Column
    const isOverAColumn = over.data.current?.type === 'Column';

    if (isActiveAVideo && isOverAColumn) {
      setVideos((videos) => {
        const activeIndex = videos.findIndex((v) => v.id === activeId);
        videos[activeIndex].columnId = overId;
        return arrayMove(videos, activeIndex, activeIndex);
      });
    }
  };

  const onDragEnd = (event) => {
    setActiveVideo(null);
  };

  const handleAddVideo = (columnId) => {
    setEditingVideo({ columnId });
    setIsModalOpen(true);
  };

  const handleEditVideo = (video) => {
    setEditingVideo(video);
    setIsModalOpen(true);
  };

  const handleSaveVideo = (videoData) => {
    if (videoData.id) {
      setVideos(prev => prev.map(v => v.id === videoData.id ? videoData : v));
    } else {
      const newVideo = {
        ...videoData,
        id: `vid-${Date.now()}`,
      };
      setVideos(prev => [...prev, newVideo]);
    }
    setIsModalOpen(false);
    setEditingVideo(null);
  };

  const handleDeleteVideo = (id) => {
    setVideos(prev => prev.filter(v => v.id !== id));
    setIsModalOpen(false);
    setEditingVideo(null);
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#050505]">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-4 border-b border-white/5 glass sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer">
            <LayoutDashboard className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">PipeTrack <span className="text-primary">Studio</span></h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">YouTube Production Pipeline</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-xl focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20 transition-all duration-300">
            <Search className="text-muted-foreground" size={16} />
            <input
              placeholder="Buscar videos..."
              className="bg-transparent border-none outline-none text-sm w-48 placeholder:text-muted-foreground/50 transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-white/5 hover:rotate-45 active:scale-95 transition-all duration-300 rounded-lg">
              <Settings size={20} />
            </button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-orange-500 p-[1px] cursor-pointer hover:shadow-lg hover:shadow-primary/20 transition-all duration-300 hover:scale-105 active:scale-95">
              <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden">
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="avatar" />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Kanban */}
      <main className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/5 via-transparent to-transparent">
        <div className="p-6 inline-flex gap-6 h-full min-w-full">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDragEnd={onDragEnd}
          >
            {COLUMNS.map(column => (
              <Column
                key={column.id}
                column={column}
                videos={videos.filter(v => v.columnId === column.id)}
                onEdit={handleEditVideo}
                onAdd={handleAddVideo}
              />
            ))}

            <DragOverlay dropAnimation={{
              sideEffects: defaultDropAnimationSideEffects({
                styles: {
                  active: {
                    opacity: '0.5',
                  },
                },
              }),
            }}>
              {activeVideo ? (
                <VideoCard video={activeVideo} isOverlay />
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
      </main>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <VideoModal
            isOpen={isModalOpen}
            video={editingVideo}
            onClose={() => {
              setIsModalOpen(false);
              setEditingVideo(null);
            }}
            onSave={handleSaveVideo}
            onDelete={handleDeleteVideo}
          />
        )}
      </AnimatePresence>

      {/* Background Decor */}
      <div className="fixed top-0 right-0 -z-10 w-[500px] h-[500px] bg-primary/10 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2 opacity-30" />
      <div className="fixed bottom-0 left-0 -z-10 w-[400px] h-[400px] bg-blue-500/10 blur-[100px] rounded-full -translate-x-1/2 translate-y-1/2 opacity-20" />
    </div>
  );
}
