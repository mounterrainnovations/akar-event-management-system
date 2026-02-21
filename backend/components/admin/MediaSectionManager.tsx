"use client";

import { useRef, useState } from "react";
import {
  deleteSectionMediaAction,
  toggleSectionMediaAction,
  uploadSectionMediaAction,
} from "@/app/admin/actions";
import { Eye, EyeSlash, Trash, UploadSimple, X, Image } from "@phosphor-icons/react";
import { type WebsiteSectionState } from "@/lib/media/website-media-service";
import { toast } from "react-toastify";

const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ALLOWED_TYPES = ["image/png", "image/jpeg", "application/pdf"];

type MediaSectionManagerProps = {
  title: string;
  description: string;
  section: WebsiteSectionState;
};

export function MediaSectionManager({ title, description, section }: MediaSectionManagerProps) {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  const canUpload = section.totalCount < section.maxAllowed;

  function validateAndSetFiles(files: File[]) {
    const invalidFormat = files.filter((f) => !ALLOWED_TYPES.includes(f.type));
    if (invalidFormat.length > 0) {
      toast.error(
        `Invalid file type. Rejected: ${invalidFormat.map((f) => f.name).join(", ")}`,
      );
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const oversized = files.filter((f) => f.size > MAX_FILE_SIZE_BYTES);
    if (oversized.length > 0) {
      toast.error(
        `${oversized.length} file(s) exceed ${MAX_FILE_SIZE_MB} MB limit: ${oversized.map((f) => f.name).join(", ")}`,
      );
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setSelectedFiles(files);
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    validateAndSetFiles(files);
  }

  function handleDragEnter(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current += 1;
    if (dragCounter.current === 1) setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current === 0) setIsDragging(false);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current = 0;
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      validateAndSetFiles(files);
      // Sync with the file input for form submission
      const dt = new DataTransfer();
      files.forEach((f) => dt.items.add(f));
      if (fileInputRef.current) fileInputRef.current.files = dt.files;
    }
  }

  function closeModal() {
    setIsUploadOpen(false);
    setSelectedFiles([]);
    setIsDragging(false);
    dragCounter.current = 0;
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div className="space-y-5">
      {/* Header Row */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">{title}</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        </div>
        <button
          type="button"
          disabled={!canUpload}
          onClick={() => setIsUploadOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <UploadSimple className="size-4" weight="bold" />
          {section.section === "publications" ? "Upload PDF" : "Upload Image"}
        </button>
      </div>

      {section.section === "members" && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <p className="font-medium">Note: Please upload vertical images for team members.</p>
        </div>
      )}

      {/* Stats */}
      <div className="flex gap-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="text-lg font-semibold text-foreground">{section.totalCount}</span>
          Total Images
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="text-lg font-semibold text-emerald-600">{section.activeCount}</span>
          Active
        </div>
      </div>

      {/* Image Grid */}
      {section.items.length === 0 ? (
        <div className="flex min-h-[220px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-border/60 p-8 text-center">
          <Image className="size-12 text-muted-foreground/40" />
          <p className="mt-3 text-sm text-muted-foreground">No files uploaded yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {section.items.map((item) => (
            <div
              key={item.id}
              className="group relative aspect-square overflow-hidden rounded-xl bg-muted"
            >
              {item.mimeType === "application/pdf" ? (
                <div className={`flex h-full w-full items-center justify-center bg-muted-foreground/10 ${!item.isActive ? "opacity-50 grayscale" : ""}`}>
                  {item.thumbnailUrl ? (
                    <img
                      src={item.thumbnailUrl}
                      alt={item.title || item.fileName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center">
                      <span className="text-4xl text-red-500">PDF</span>
                      <span className="mt-2 px-2 truncate w-full text-center text-xs font-semibold">{item.title || item.fileName}</span>
                      {item.description && <span className="px-2 truncate w-full text-center text-[10px] text-muted-foreground">{item.description}</span>}
                    </div>
                  )}
                </div>
              ) : (
                <img
                  src={item.previewUrl}
                  alt={item.fileName}
                  className={`h-full w-full object-cover ${!item.isActive ? "opacity-50 grayscale" : ""}`}
                />
              )}

              {/* Hidden badge */}
              {!item.isActive && (
                <span className="absolute left-2 top-2 z-10 rounded-md bg-black/70 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white/80">
                  Hidden
                </span>
              )}

              {/* Single hover overlay: background + actions */}
              <div
                className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/40 opacity-0 will-change-[opacity] group-hover:opacity-100"
                style={{ transition: "opacity 120ms ease-out" }}
              >
                <div className="flex gap-2">
                  <form action={toggleSectionMediaAction}>
                    <input type="hidden" name="websiteMediaId" value={item.id} />
                    <input type="hidden" name="section" value={section.section} />
                    <button
                      type="submit"
                      className="flex size-10 items-center justify-center rounded-full bg-white text-foreground shadow-lg hover:bg-neutral-200"
                      title={item.isActive ? "Hide" : "Show"}
                    >
                      {item.isActive ? (
                        <EyeSlash className="size-5" weight="bold" />
                      ) : (
                        <Eye className="size-5" weight="bold" />
                      )}
                    </button>
                  </form>
                  <form action={deleteSectionMediaAction}>
                    <input type="hidden" name="websiteMediaId" value={item.id} />
                    <input type="hidden" name="section" value={section.section} />
                    <button
                      type="submit"
                      className="flex size-10 items-center justify-center rounded-full bg-red-500 text-white shadow-lg hover:bg-red-600"
                      title="Delete"
                    >
                      <Trash className="size-5" weight="bold" />
                    </button>
                  </form>
                </div>
                <span className="absolute bottom-2 rounded-md bg-black/60 px-2 py-0.5 text-[11px] font-medium text-white/90">
                  {item.fileSize < 1024 * 1024
                    ? `${(item.fileSize / 1024).toFixed(0)} KB`
                    : `${(item.fileSize / 1024 / 1024).toFixed(2)} MB`}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closeModal}
          />

          {/* Modal */}
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-card p-6 shadow-2xl">
            {/* Close */}
            <button
              type="button"
              onClick={closeModal}
              className="absolute right-4 top-4 rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="size-5" />
            </button>

            <h3 className="text-lg font-semibold text-foreground">Upload Images</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Max {MAX_FILE_SIZE_MB} MB per file. Remaining slots:{" "}
              {Math.max(section.maxAllowed - section.totalCount, 0)}.
            </p>

            <form
              action={uploadSectionMediaAction}
              className="mt-5 space-y-4"
            >
              <input type="hidden" name="section" value={section.section} />

              {/* Drop zone */}
              <div
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <label
                  htmlFor={`upload-${section.section}`}
                  className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors ${isDragging
                    ? "border-primary bg-primary/5"
                    : "border-border/60 hover:border-primary/50 hover:bg-muted/50"
                    }`}
                >
                  <UploadSimple className={`size-8 ${isDragging ? "text-primary" : "text-muted-foreground/50"}`} />
                  <p className="mt-2 text-sm font-medium text-foreground">
                    {isDragging ? "Drop your files here" : (section.section === "publications" ? "Click or drag & drop PDF" : "Click or drag & drop image")}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {section.section === "publications" ? "PDF only" : "PNG, JPG only"} — up to {MAX_FILE_SIZE_MB} MB
                  </p>
                </label>
              </div>
              <input
                ref={fileInputRef}
                id={`upload-${section.section}`}
                name="mediaFiles"
                type="file"
                accept={section.section === "publications" ? ".pdf" : ".png,.jpg,.jpeg"}
                multiple={section.section !== "members" && section.section !== "publications"}
                required
                onChange={handleFileChange}
                className="sr-only"
              />

              {/* Special inputs for Members section */}
              {(section.section === "members" || section.section === "publications") && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label htmlFor="member-name" className="text-sm font-medium text-foreground">
                      Name
                    </label>
                    <input
                      id="member-name"
                      name="title"
                      type="text"
                      placeholder={section.section === "publications" ? "e.g. The Future of AI" : "e.g. Jane Doe"}
                      required
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="member-designation" className="text-sm font-medium text-foreground">
                      {section.section === "publications" ? "Author" : "Designation"}
                    </label>
                    <input
                      id="member-designation"
                      name="description"
                      type="text"
                      placeholder={section.section === "publications" ? "e.g. John Smith" : "e.g. Creative Director"}
                      required
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  {section.section === "publications" && (
                    <div className="space-y-1">
                      <label htmlFor="publication-thumbnail" className="text-sm font-medium text-foreground">
                        Thumbnail Image (Optional)
                      </label>
                      <input
                        id="publication-thumbnail"
                        name="thumbnailFile"
                        type="file"
                        accept=".png,.jpg,.jpeg"
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90"
                      />
                    </div>
                  )}
                </div>
              )}

              {selectedFiles.length > 0 && (
                <div className="space-y-1">
                  {selectedFiles.map((file, i) => (
                    <p key={i} className="truncate text-sm text-muted-foreground">
                      {file.name}{" "}
                      <span className="text-xs">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                    </p>
                  ))}
                </div>
              )}

              <button
                type="submit"
                disabled={selectedFiles.length === 0}
                className="w-full rounded-lg bg-foreground py-2.5 text-sm font-medium text-background transition-colors hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Upload {selectedFiles.length > 0 ? `${selectedFiles.length} file(s)` : ""}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
