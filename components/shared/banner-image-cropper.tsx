"use client";

import Cropper, { type Area } from "react-easy-crop";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

/** Matches the mobile My Programs banner (width:height = 2:1). */
export const BANNER_CROP_ASPECT = 2;
const BANNER_OUTPUT_WIDTH = 1600;
const BANNER_OUTPUT_HEIGHT = 800;

type BannerImageCropperProps = {
  files: File[];
  open: boolean;
  isUploading?: boolean;
  onClose: () => void;
  onComplete: (croppedFiles: File[]) => void;
};

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", () => reject(new Error("Failed to load image for cropping.")));
    image.src = src;
  });

const toSafeFileName = (fileName: string) => {
  const base = fileName.replace(/\.[^/.]+$/, "").trim() || "homepage-banner";
  return `${base}-banner.jpg`;
};

export async function getCroppedBannerFile(imageSrc: string, pixelCrop: Area, originalName: string) {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement("canvas");
  canvas.width = BANNER_OUTPUT_WIDTH;
  canvas.height = BANNER_OUTPUT_HEIGHT;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Could not crop this image.");
  }

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    BANNER_OUTPUT_WIDTH,
    BANNER_OUTPUT_HEIGHT
  );

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (nextBlob) => {
        if (!nextBlob) {
          reject(new Error("Could not crop this image."));
          return;
        }
        resolve(nextBlob);
      },
      "image/jpeg",
      0.92
    );
  });

  return new File([blob], toSafeFileName(originalName), { type: "image/jpeg" });
}

export function BannerImageCropper({
  files,
  open,
  isUploading = false,
  onClose,
  onComplete,
}: BannerImageCropperProps) {
  const [index, setIndex] = useState(0);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [croppedFiles, setCroppedFiles] = useState<File[]>([]);
  const [isCropping, setIsCropping] = useState(false);

  const currentFile = files[index] || null;
  const previewUrl = useMemo(
    () => (currentFile ? URL.createObjectURL(currentFile) : ""),
    [currentFile]
  );

  useEffect(() => {
    if (!previewUrl) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  useEffect(() => {
    if (!open) return;
    setIndex(0);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setCroppedFiles([]);
    setIsCropping(false);
  }, [open, files]);

  const resetCropForNextImage = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
  };

  const handleApply = async () => {
    if (!currentFile || !previewUrl || !croppedAreaPixels || isCropping || isUploading) {
      return;
    }

    setIsCropping(true);
    try {
      const croppedFile = await getCroppedBannerFile(previewUrl, croppedAreaPixels, currentFile.name);
      const nextCroppedFiles = [...croppedFiles, croppedFile];

      if (index + 1 < files.length) {
        setCroppedFiles(nextCroppedFiles);
        setIndex((current) => current + 1);
        resetCropForNextImage();
        return;
      }

      onComplete(nextCroppedFiles);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not crop this image.");
    } finally {
      setIsCropping(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !isCropping && !isUploading) {
          onClose();
        }
      }}
    >
      <DialogContent className="w-[calc(100vw-2rem)] p-0 sm:max-w-3xl">
        <DialogHeader className="px-6 pb-2 pt-6">
          <DialogTitle className="pr-8 text-2xl font-semibold text-slate-100">
            Crop to app banner
          </DialogTitle>
          <p className="pr-8 text-sm text-slate-300">
            Drag and zoom to match the My Programs banner on phones. The frame is 2:1, same as the app.
            {files.length > 1 ? ` Photo ${index + 1} of ${files.length}.` : ""}
          </p>
        </DialogHeader>

        <div className="space-y-4 px-6 pb-6">
          <div className="relative h-[280px] overflow-hidden rounded-xl bg-black sm:h-[360px]">
            {previewUrl ? (
              <Cropper
                image={previewUrl}
                crop={crop}
                zoom={zoom}
                rotation={0}
                aspect={BANNER_CROP_ASPECT}
                minZoom={1}
                maxZoom={3}
                roundCropAreaPixels
                showGrid
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_, pixels) => setCroppedAreaPixels(pixels)}
                classes={{}}
                restrictPosition
                zoomWithScroll
                style={{
                  cropAreaStyle: {
                    border: "2px solid #89C9E6",
                    boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.55)",
                  },
                }}
              />
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="banner-zoom">Zoom</Label>
            <input
              id="banner-zoom"
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(event) => setZoom(Number(event.target.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-full bg-white/20 accent-[#72B4E6]"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isCropping || isUploading}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void handleApply()} disabled={isCropping || isUploading || !croppedAreaPixels}>
              {isUploading
                ? "Uploading..."
                : isCropping
                  ? "Cropping..."
                  : index + 1 < files.length
                    ? "Crop & next"
                    : "Crop & upload"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
