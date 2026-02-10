import { useEffect, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, Check, Maximize2, Stamp, Palette, Edit } from "lucide-react";
import { RegenerateOptionsDialog } from "./RegenerateOptionsDialog";
import { WatermarkOptionsDialog } from "./WatermarkOptionsDialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import ImageLightbox from "./ImageLightbox";
import { getOptimizedImageUrl } from "@/lib/imageOptimization";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, rectSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
interface Photo {
  id: string;
  url: string;
  is_edited: boolean;
  is_processing?: boolean;
  original_url: string | null;
  display_order: number;
  has_watermark?: boolean;
  edit_type?: string | null;
  interior_background_url?: string | null;
}
interface PhotoGalleryProps {
  photos: Photo[];
  onUpdate: () => void;
  selectedPhotos: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  onRegenerateReflection?: (photoId: string) => void;
  onAdjustPosition?: (photoId: string) => void;
  onRemoveWatermark?: (photoId: string) => void;
  onAdjustWatermark?: (photoId: string) => void;
  onChangeInteriorColor?: (photoId: string) => void;
}
interface SortablePhotoCardProps {
  photo: Photo;
  index: number;
  onDelete: (photoId: string) => void;
  onImageClick: (url: string) => void;
  isSelected: boolean;
  onSelect: (photoId: string, selected: boolean) => void;
  onRegenerate?: (photoId: string) => void;
  onWatermarkOptions?: (photoId: string) => void;
}
const SortablePhotoCard = ({
  photo,
  index,
  onDelete,
  onImageClick,
  isSelected,
  onSelect,
  onRegenerate,
  onWatermarkOptions
}: SortablePhotoCardProps) => {
  // Track which URL has been fully loaded - overlay shows until current URL matches
  const [loadedUrl, setLoadedUrl] = useState<string | null>(null);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: photo.id
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || "transform 200ms ease",
    opacity: isDragging ? 0.8 : 1,
    cursor: isDragging ? "grabbing" : "default"
  };

  // Show overlay if processing OR if the loaded URL doesn't match current URL
  const showOverlay = photo.is_processing || loadedUrl !== photo.url;
  return <Card ref={setNodeRef} style={style} className={`bg-gradient-card border-border/50 overflow-hidden group shadow-card hover:shadow-intense hover:-translate-y-2 transition-all duration-500 animate-fade-in-up ${isSelected ? 'ring-2 ring-primary' : ''}`} {...attributes}>
      <div className="relative aspect-video bg-secondary">
        {showOverlay && <div className="absolute inset-0 bg-background/90 z-20 flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-lg text-foreground font-medium">
              {photo.is_processing ? "Bild Behandlas" : "Laddar..."}
            </p>
          </div>}
        <div className={`absolute bottom-2 left-2 z-10 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} onClick={e => e.stopPropagation()} onPointerDown={e => {
        // Prevent iOS focus-scroll on touch
        if (e.pointerType === "touch") {
          e.preventDefault();
        }
        e.stopPropagation();
      }}>
          <Checkbox checked={isSelected} onCheckedChange={checked => onSelect(photo.id, checked === true)} className="bg-background/80 border-2" />
        </div>
        <div 
          {...listeners}
          className="w-full h-full cursor-grab active:cursor-grabbing"
          onClick={() => !isMobile && onImageClick(photo.url)}
        >
          <img 
            src={getOptimizedImageUrl(photo.url, {
              width: 600,
              height: 338,
              quality: 75
            })} 
            alt="Bilfoto" 
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 pointer-events-none" 
            loading="lazy" 
            decoding="async" 
            onLoad={() => setLoadedUrl(photo.url)} 
            onError={e => {
              const el = e.currentTarget as HTMLImageElement;
              setLoadedUrl(photo.url);
              if (photo.original_url && el.src !== photo.original_url) {
                el.src = photo.original_url;
                return;
              }
              if (el.src.endsWith('.png')) el.src = el.src.replace('.png', '.webp');
              else if (el.src.endsWith('.webp')) el.src = el.src.replace('.webp', '.png');
            }} 
          />
        </div>
        <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-20 transition-opacity duration-500 pointer-events-none" />
        
        {/* Badges */}
        <div className="absolute top-2 right-2 flex flex-col gap-1">
          {photo.edit_type === 'interior' ? <Badge className="bg-blue-500/50 backdrop-blur-sm border border-blue-500/30 text-white shadow-lg animate-scale-in">
              <Palette className="w-3 h-3 mr-1" />
              Interiör
            </Badge> : photo.is_edited && <Badge className="bg-green-500/50 backdrop-blur-sm border border-green-500/30 text-white shadow-lg animate-scale-in">
              <Check className="w-3 h-3 mr-1" />
              Redigerad
            </Badge>}
          {photo.has_watermark && <Badge className="bg-purple-500/50 backdrop-blur-sm border border-purple-500/30 text-white shadow-lg animate-scale-in">
              <Stamp className="w-3 h-3 mr-1" />
              Vattenmärke
            </Badge>}
        </div>
        
        {/* Action buttons */}
        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-300 flex gap-2">
          {photo.has_watermark && onWatermarkOptions && <Button size="icon" variant="secondary" onClick={() => onWatermarkOptions(photo.id)} className="h-12 w-12 sm:h-8 sm:w-8 hover:scale-110 transition-transform duration-300" title="Vattenmärkesalternativ">
              <Stamp className="w-6 h-6 sm:w-4 sm:h-4" />
            </Button>}
          {photo.is_edited && onRegenerate && <Button size="icon" variant="secondary" onClick={() => onRegenerate(photo.id)} className="h-12 w-12 sm:h-8 sm:w-8 hover:scale-110 transition-transform duration-300" title="Redigera bilden">
              <Edit className="w-6 h-6 sm:w-4 sm:h-4" />
            </Button>}
          <Button size="icon" variant="secondary" onClick={() => onImageClick(photo.url)} className="h-12 w-12 sm:h-8 sm:w-8 hover:scale-110 transition-transform duration-300">
            <Maximize2 className="w-6 h-6 sm:w-4 sm:h-4" />
          </Button>
          <Button size="icon" variant="destructive" onClick={() => onDelete(photo.id)} className="h-12 w-12 sm:h-8 sm:w-8 hover:scale-110 transition-transform duration-300">
            <Trash2 className="w-6 h-6 sm:w-4 sm:h-4" />
          </Button>
        </div>
      </div>
    </Card>;
};
const PhotoGalleryDraggable = ({
  photos,
  onUpdate,
  selectedPhotos,
  onSelectionChange,
  onRegenerateReflection,
  onAdjustPosition,
  onRemoveWatermark,
  onAdjustWatermark,
  onChangeInteriorColor
}: PhotoGalleryProps) => {
  const {
    toast
  } = useToast();
  const [items, setItems] = useState(photos);

  // Sync internal state when photos prop changes (after upload/edit/watermark)
  // Smart comparison to prevent re-renders when only display_order changes from drag-drop
  useEffect(() => {
    const currentIds = items.map(i => `${i.id}-${i.url}-${i.is_processing}`).join(',');
    const newIds = photos.map(p => `${p.id}-${p.url}-${p.is_processing}`).join(',');
    
    if (currentIds !== newIds) {
      setItems(photos);
    }
  }, [photos, items]);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [regenerateOptionsPhoto, setRegenerateOptionsPhoto] = useState<Photo | null>(null);
  const [watermarkOptionsId, setWatermarkOptionsId] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, {
    activationConstraint: {
      distance: 8
    }
  }), useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates
  }));
  const handleDelete = async (photoId: string) => {
    try {
      const {
        error
      } = await supabase.from("photos").delete().eq("id", photoId);
      if (error) throw error;
      
      // Clear deleted photo from selection
      if (selectedPhotos.includes(photoId)) {
        onSelectionChange(selectedPhotos.filter(id => id !== photoId));
      }
      
      onUpdate();
    } catch (error: any) {
      toast({
        title: "Fel vid radering av foto",
        description: error.message,
        variant: "destructive"
      });
    }
  };
  const handleDragEnd = async (event: DragEndEvent) => {
    const {
      active,
      over
    } = event;
    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex(item => item.id === active.id);
      const newIndex = items.findIndex(item => item.id === over.id);
      const newItems = arrayMove(items, oldIndex, newIndex);
      setItems(newItems);
      try {
        const updates = newItems.map((item, index) => ({
          id: item.id,
          display_order: index
        }));
        await Promise.all(
          updates.map(update => 
            supabase.from("photos").update({
              display_order: update.display_order
            }).eq("id", update.id)
          )
        );
      } catch (error: any) {
        toast({
          title: "Fel vid uppdatering av ordning",
          description: error.message,
          variant: "destructive"
        });
        setItems(photos);
      }
    }
  };
  if (photos.length === 0) {
    return <Card className="bg-gradient-card border-border/50 p-12 text-center animate-fade-in">
        <p className="text-muted-foreground">Inga foton uppladdade än</p>
      </Card>;
  }
  return <>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map(p => p.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((photo, index) => <SortablePhotoCard key={photo.id} photo={photo} index={index} onDelete={handleDelete} onImageClick={() => setLightboxIndex(index)} isSelected={selectedPhotos.includes(photo.id)} onSelect={(photoId, selected) => {
            if (selected) {
              onSelectionChange([...selectedPhotos, photoId]);
            } else {
              onSelectionChange(selectedPhotos.filter(id => id !== photoId));
            }
          }} onRegenerate={photoId => {
            const photo = items.find(p => p.id === photoId);
            if (photo) {
              // If interior with background image - go directly to position editor
              if (photo.edit_type === 'interior' && photo.interior_background_url && onAdjustPosition) {
                onAdjustPosition(photoId);
              } else {
                setRegenerateOptionsPhoto(photo);
              }
            }
          }} onWatermarkOptions={photoId => setWatermarkOptionsId(photoId)} />)}
          </div>
        </SortableContext>
      </DndContext>
      {lightboxIndex !== null && <ImageLightbox images={items.map(p => p.url)} currentIndex={lightboxIndex} isOpen={lightboxIndex !== null} onClose={() => setLightboxIndex(null)} onNavigate={setLightboxIndex} />}
      <RegenerateOptionsDialog open={!!regenerateOptionsPhoto} onOpenChange={open => !open && setRegenerateOptionsPhoto(null)} editType={regenerateOptionsPhoto?.edit_type} onRegenerateReflection={() => {
      if (regenerateOptionsPhoto && onRegenerateReflection) {
        onRegenerateReflection(regenerateOptionsPhoto.id);
      }
    }} onAdjustPosition={() => {
      if (regenerateOptionsPhoto && onAdjustPosition) {
        onAdjustPosition(regenerateOptionsPhoto.id);
      }
    }} onChangeInteriorColor={() => {
      if (regenerateOptionsPhoto && onChangeInteriorColor) {
        onChangeInteriorColor(regenerateOptionsPhoto.id);
      }
    }} />
      <WatermarkOptionsDialog open={!!watermarkOptionsId} onOpenChange={open => !open && setWatermarkOptionsId(null)} onRemoveWatermark={() => {
      if (watermarkOptionsId && onRemoveWatermark) {
        onRemoveWatermark(watermarkOptionsId);
      }
    }} onAdjustPosition={() => {
      if (watermarkOptionsId && onAdjustWatermark) {
        onAdjustWatermark(watermarkOptionsId);
      }
    }} />
    </>;
};
export default PhotoGalleryDraggable;