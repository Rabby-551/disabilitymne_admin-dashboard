"use client";

import { ArrowDown, ArrowUp, Eye, EyeOff, Plus, Trash2, Upload } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { PageTitle } from "@/components/shared/page-title";
import { TableSkeleton } from "@/components/shared/table-skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  deleteAdminHomeBanner,
  getAdminHomeBanners,
  getErrorMessage,
  reorderAdminHomeBanners,
  updateAdminHomeBanner,
  uploadAdminHomeBanners,
  type HomeBanner,
} from "@/lib/api";

const MAX_HOME_BANNERS = 20;
const ACCEPTED_IMAGE_TYPES = "image/jpeg,image/png,image/webp,image/gif";

export default function HomepageBannersPage() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [deleteTarget, setDeleteTarget] = useState<HomeBanner | null>(null);

  const bannersQuery = useQuery({
    queryKey: ["admin-home-banners"],
    queryFn: getAdminHomeBanners,
  });

  const banners = useMemo(() => bannersQuery.data || [], [bannersQuery.data]);

  const invalidateBanners = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-home-banners"] });
  };

  const uploadMutation = useMutation({
    mutationFn: uploadAdminHomeBanners,
    onSuccess: (uploaded) => {
      toast.success(uploaded.length === 1 ? "Homepage photo uploaded." : `${uploaded.length} homepage photos uploaded.`);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      invalidateBanners();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const reorderMutation = useMutation({
    mutationFn: reorderAdminHomeBanners,
    onSuccess: (nextBanners) => {
      queryClient.setQueryData(["admin-home-banners"], nextBanners);
    },
    onError: (error) => toast.error(getErrorMessage(error, "Failed to reorder photos.")),
  });

  const visibilityMutation = useMutation({
    mutationFn: ({ bannerId, isActive }: { bannerId: string; isActive: boolean }) =>
      updateAdminHomeBanner(bannerId, { isActive }),
    onSuccess: (_, variables) => {
      toast.success(variables.isActive ? "Photo is now visible in the app." : "Photo hidden from the app.");
      invalidateBanners();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAdminHomeBanner,
    onSuccess: () => {
      toast.success("Homepage photo deleted.");
      setDeleteTarget(null);
      invalidateBanners();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const onSelectFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const selected = Array.from(files).filter((file) => file.type.startsWith("image/"));
    if (selected.length === 0) {
      toast.error("Please choose image files only.");
      return;
    }

    const remainingSlots = MAX_HOME_BANNERS - banners.length;
    if (remainingSlots <= 0) {
      toast.error(`You can upload a maximum of ${MAX_HOME_BANNERS} homepage photos.`);
      return;
    }

    if (selected.length > remainingSlots) {
      toast.error(`You can add ${remainingSlots} more photo${remainingSlots === 1 ? "" : "s"}.`);
      return;
    }

    uploadMutation.mutate(selected);
  };

  const moveBanner = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= banners.length) return;

    const nextOrder = [...banners];
    const [moved] = nextOrder.splice(index, 1);
    nextOrder.splice(nextIndex, 0, moved);
    queryClient.setQueryData(["admin-home-banners"], nextOrder);
    reorderMutation.mutate(nextOrder.map((banner) => banner.id));
  };

  const remainingSlots = Math.max(0, MAX_HOME_BANNERS - banners.length);
  const isBusy =
    uploadMutation.isPending ||
    reorderMutation.isPending ||
    visibilityMutation.isPending ||
    deleteMutation.isPending;

  return (
    <div className="space-y-5">
      <PageTitle
        title="Homepage Banners"
        breadcrumb="Dashboard  >  Homepage Banners"
        action={
          <Button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isBusy || remainingSlots <= 0}
          >
            <Plus className="size-4" />
            Upload photos
          </Button>
        }
      />

      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm text-slate-200">
                These photos appear under <span className="font-semibold">My Programs</span> on the app homepage.
              </p>
              <p className="mt-1 text-sm text-slate-400">
                One photo shows as a single image. Two or more photos become a swipeable slider in the app.
              </p>
            </div>
            <Badge variant="blue">{banners.length} / {MAX_HOME_BANNERS} photos</Badge>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_IMAGE_TYPES}
            multiple
            className="hidden"
            onChange={(event) => {
              onSelectFiles(event.target.files);
              event.target.value = "";
            }}
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isBusy || remainingSlots <= 0}
            className="flex w-full flex-col items-center justify-center rounded-xl border border-dashed border-blue-300/40 bg-white/5 px-6 py-10 text-center transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Upload className="mb-3 size-8 text-slate-200" />
            <p className="text-sm font-medium text-white">
              {uploadMutation.isPending ? "Uploading photos..." : "Click to upload homepage photos"}
            </p>
            <p className="mt-1 text-xs text-slate-400">JPG, PNG, or WebP. Multiple files are allowed.</p>
          </button>
        </CardContent>
      </Card>

      {bannersQuery.isLoading ? <TableSkeleton rows={4} /> : null}

      {!bannersQuery.isLoading && banners.length === 0 ? (
        <EmptyState
          title="No homepage photos yet"
          description="Upload one or more photos and they will appear under My Programs on the app homepage."
        />
      ) : null}

      {banners.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {banners.map((banner, index) => (
            <Card key={banner.id} className="overflow-hidden">
              <div className="relative aspect-[2/1] bg-black/30">
                {banner.imageUrl ? (
                  <img
                    src={banner.imageUrl}
                    alt={`Homepage banner ${index + 1}`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-slate-400">
                    Image unavailable
                  </div>
                )}
                <div className="absolute left-3 top-3">
                  <Badge variant={banner.isActive ? "green" : "neutral"}>
                    {banner.isActive ? "Visible in app" : "Hidden"}
                  </Badge>
                </div>
              </div>
              <CardContent className="flex flex-wrap items-center justify-between gap-2 p-4">
                <p className="text-sm font-medium text-slate-200">Photo {index + 1}</p>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    disabled={index === 0 || isBusy}
                    onClick={() => moveBanner(index, -1)}
                    aria-label="Move photo up"
                  >
                    <ArrowUp className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    disabled={index === banners.length - 1 || isBusy}
                    onClick={() => moveBanner(index, 1)}
                    aria-label="Move photo down"
                  >
                    <ArrowDown className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    disabled={isBusy}
                    onClick={() =>
                      visibilityMutation.mutate({
                        bannerId: banner.id,
                        isActive: !banner.isActive,
                      })
                    }
                    aria-label={banner.isActive ? "Hide photo" : "Show photo"}
                  >
                    {banner.isActive ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    disabled={isBusy}
                    onClick={() => setDeleteTarget(banner)}
                    aria-label="Delete photo"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTarget) return;
          deleteMutation.mutate(deleteTarget.id);
        }}
        title="Delete this homepage photo?"
        description="This photo will be removed from the app homepage and cannot be undone."
        confirmText="Delete"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
