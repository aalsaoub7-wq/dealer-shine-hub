import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, Check, Download, GripVertical, Maximize2, RefreshCw } from "lucide-react";
import { RegenerateOptionsDialog } from "./RegenerateOptionsDialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import ImageLightbox from "./ImageLightbox";
import { getOptimizedImageUrl } from "@/lib/imageOptimization";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Photo {
  id: string;
  url: string;
  is_edited: boolean;
  is_processing?: boolean;
  original_url: string | null;
  display_order: number;
}

interface PhotoGalleryProps {
  photos: Photo[];
  onUpdate: () => void;
  selectedPhotos: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  onRegenerateReflection?: (photoId: string) => void;
  onAdjustPosition?: (photoId: string) => void;
}

interface SortablePhotoCardProps {
  photo: Photo;
  index: number;
  onDelete: (photoId: string) => void;
  onImageClick: (url: string) => void;
  isSelected: boolean;
  onSelect: (photoId: string, selected: boolean) => void;
  onRegenerate?: (photoId: string) => void;
}

const SortablePhotoCard = ({
  photo,
  index,
  onDelete,
  onImageClick,
  isSelected,
  onSelect,
  onRegenerate,
}: SortablePhotoCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: photo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || "transform 200ms ease",
    opacity: isDragging ? 0.8 : 1,
    cursor: isDragging ? "grabbing" : "default",
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`bg-gradient-card border-border/50 overflow-hidden group shadow-card hover:shadow-intense hover:-translate-y-2 transition-all duration-500 animate-fade-in-up ${isSelected ? 'ring-2 ring-primary' : ''}`}
      {...attributes}
    >
      <div className="relative aspect-video bg-secondary">
        {photo.is_processing && (
          <div className="absolute inset-0 bg-background/90 z-20 flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-lg text-foreground font-medium">Bild Behandlas</p>
          </div>
        )}
        <div
          className="absolute top-2 left-2 z-10 cursor-grab active:cursor-grabbing p-2 bg-background/80 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
          {...listeners}
        >
          <GripVertical className="w-4 h-4 text-foreground" />
        </div>
        <div 
          className={`absolute bottom-2 left-2 z-10 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
          onClick={(e) => e.stopPropagation()}
        >
          <Checkbox 
            checked={isSelected}
            onCheckedChange={(checked) => onSelect(photo.id, checked === true)}
            className="bg-background/80 border-2 h-6 w-6 sm:h-8 sm:w-8"
          />
        </div>
        <img
          src={getOptimizedImageUrl(photo.url, { width: 600, height: 338, quality: 75 })}
          alt="Bilfoto"
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 cursor-pointer"
          loading="lazy"
          decoding="async"
          onClick={() => onImageClick(photo.url)}
          onError={(e) => {
            const el = e.currentTarget as HTMLImageElement;
            if (photo.original_url && el.src !== photo.original_url) {
              el.src = photo.original_url;
              return;
            }
            if (el.src.endsWith('.png')) el.src = el.src.replace('.png', '.webp');
            else if (el.src.endsWith('.webp')) el.src = el.src.replace('.webp', '.png');
          }}
        />
        <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-20 transition-opacity duration-500" />
        {photo.is_edited && (
          <Badge className="absolute top-2 right-2 bg-green-500/50 backdrop-blur-sm border border-green-500/30 text-white shadow-lg animate-scale-in">
            <Check className="w-3 h-3 mr-1" />
            Redigerad
          </Badge>
        )}
        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-300 flex gap-2">
          {photo.is_edited && onRegenerate && (
            <Button
              size="icon"
              variant="secondary"
              onClick={() => onRegenerate(photo.id)}
              className="h-12 w-12 sm:h-8 sm:w-8 hover:scale-110 transition-transform duration-300"
              title="Regenerera med ny bakgrund"
            >
              <RefreshCw className="w-6 h-6 sm:w-4 sm:h-4" />
            </Button>
          )}
          <Button
            size="icon"
            variant="secondary"
            onClick={() => onImageClick(photo.url)}
            className="h-12 w-12 sm:h-8 sm:w-8 hover:scale-110 transition-transform duration-300"
          >
            <Maximize2 className="w-6 h-6 sm:w-4 sm:h-4" />
          </Button>
          <Button
            size="icon"
            variant="destructive"
            onClick={() => onDelete(photo.id)}
            className="h-12 w-12 sm:h-8 sm:w-8 hover:scale-110 transition-transform duration-300"
          >
            <Trash2 className="w-6 h-6 sm:w-4 sm:h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};

const PhotoGalleryDraggable = ({ photos, onUpdate, selectedPhotos, onSelectionChange, onRegenerateReflection, onAdjustPosition }: PhotoGalleryProps) => {
  const { toast } = useToast();
  const [items, setItems] = useState(photos);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [regenerateOptionsId, setRegenerateOptionsId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDelete = async (photoId: string) => {
    try {
      const { error } = await supabase.from("photos").delete().eq("id", photoId);
      if (error) throw error;
      toast({ title: "Foto raderat" });
      onUpdate();
    } catch (error: any) {
      toast({
        title: "Fel vid radering av foto",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);

      const newItems = arrayMove(items, oldIndex, newIndex);
      setItems(newItems);

      try {
        const updates = newItems.map((item, index) => ({
          id: item.id,
          display_order: index,
        }));

        for (const update of updates) {
          await supabase
            .from("photos")
            .update({ display_order: update.display_order })
            .eq("id", update.id);
        }

        toast({ title: "Ordning uppdaterad" });
        onUpdate();
      } catch (error: any) {
        toast({
          title: "Fel vid uppdatering av ordning",
          description: error.message,
          variant: "destructive",
        });
        setItems(photos);
      }
    }
  };

  if (photos.length === 0) {
    return (
      <Card className="bg-gradient-card border-border/50 p-12 text-center animate-fade-in">
        <p className="text-muted-foreground">Inga foton uppladdade än</p>
      </Card>
    );
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={items.map((p) => p.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((photo, index) => (
              <SortablePhotoCard
                key={photo.id}
                photo={photo}
                index={index}
                onDelete={handleDelete}
                onImageClick={setLightboxUrl}
                isSelected={selectedPhotos.includes(photo.id)}
                onSelect={(photoId, selected) => {
                  if (selected) {
                    onSelectionChange([...selectedPhotos, photoId]);
                  } else {
                    onSelectionChange(selectedPhotos.filter(id => id !== photoId));
                  }
                }}
                onRegenerate={(photoId) => setRegenerateOptionsId(photoId)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      {lightboxUrl && (
        <ImageLightbox
          imageUrl={lightboxUrl}
          isOpen={!!lightboxUrl}
          onClose={() => setLightboxUrl(null)}
        />
      )}
      <RegenerateOptionsDialog
        open={!!regenerateOptionsId}
        onOpenChange={(open) => !open && setRegenerateOptionsId(null)}
        onRegenerateReflection={() => {
          if (regenerateOptionsId && onRegenerateReflection) {
            onRegenerateReflection(regenerateOptionsId);
          }
        }}
        onAdjustPosition={() => {
          if (regenerateOptionsId && onAdjustPosition) {
            onAdjustPosition(regenerateOptionsId);
          }
        }}
      />
    </>
  );
};

export default PhotoGalleryDraggable;
