import {
  deleteSectionMediaAction,
  toggleSectionMediaAction,
  uploadSectionMediaAction,
} from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Eye, EyeSlash, Image, Trash } from "@phosphor-icons/react/dist/ssr";
import { type WebsiteSectionState } from "@/lib/media/website-media-service";

type MediaSectionManagerProps = {
  title: string;
  description: string;
  section: WebsiteSectionState;
};

export function MediaSectionManager({ title, description, section }: MediaSectionManagerProps) {
  const canUpload = section.totalCount < section.maxAllowed;
  const uploadRemaining = section.maxAllowed - section.totalCount;
  const minRuleMet = section.activeCount >= section.minRequired;

  return (
    <div className="space-y-4 rounded-xl border bg-card p-4">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <div className="grid gap-2 rounded-lg border bg-background p-3 text-sm md:grid-cols-3">
        <p>
          Total: <span className="font-semibold">{section.totalCount}</span> / {section.maxAllowed}
        </p>
        <p>
          Active: <span className="font-semibold">{section.activeCount}</span> (min {section.minRequired})
        </p>
        <p className={minRuleMet ? "text-emerald-600" : "text-amber-600"}>
          {minRuleMet ? "Minimum requirement met" : "Need more active images"}
        </p>
      </div>

      <form action={uploadSectionMediaAction} className="space-y-3 rounded-lg border p-4">
        <input type="hidden" name="section" value={section.section} />
        <label className="block text-sm font-medium" htmlFor={`mediaFiles-${section.section}`}>
          Upload images
        </label>
        <input
          id={`mediaFiles-${section.section}`}
          name="mediaFiles"
          type="file"
          accept="image/*"
          multiple
          required
          disabled={!canUpload}
          className="block w-full cursor-pointer rounded-md border bg-background p-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
        />
        <p className="text-xs text-muted-foreground">
          Select multiple images at once. Remaining slots: {Math.max(uploadRemaining, 0)}.
        </p>
        <Button type="submit" disabled={!canUpload}>
          Upload to {title}
        </Button>
      </form>

      {section.items.length === 0 ? (
        <div className="flex min-h-[220px] flex-col items-center justify-center rounded-lg border border-dashed bg-background/70 p-6 text-center">
          <Image className="size-12 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">No images uploaded for this section yet.</p>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {section.items.map((item) => (
            <li key={item.id} className="overflow-hidden rounded-lg border bg-background">
              <div className="aspect-video bg-black/5">
                <img src={item.previewUrl} alt={item.fileName} className="h-full w-full object-cover" />
              </div>
              <div className="space-y-2 p-3">
                <p className="truncate text-sm font-medium">{item.fileName}</p>
                <p className="text-xs text-muted-foreground">{item.isActive ? "Visible" : "Hidden"}</p>
                <div className="flex gap-2">
                  <form action={toggleSectionMediaAction} className="flex-1">
                    <input type="hidden" name="websiteMediaId" value={item.id} />
                    <Button type="submit" variant="outline" className="w-full">
                      {item.isActive ? <EyeSlash /> : <Eye />}
                      <span>{item.isActive ? "Hide" : "Show"}</span>
                    </Button>
                  </form>
                  <form action={deleteSectionMediaAction} className="flex-1">
                    <input type="hidden" name="websiteMediaId" value={item.id} />
                    <Button type="submit" variant="destructive" className="w-full">
                      <Trash />
                      <span>Delete</span>
                    </Button>
                  </form>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
