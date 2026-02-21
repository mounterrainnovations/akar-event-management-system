"use client";

import { useState } from "react";
import { type WorkItem } from "@/lib/works/service";
import { Plus, Eye, EyeSlash, Trash, PencilSimple, X, Image as ImageIcon } from "@phosphor-icons/react";
import { createWorkAction, updateWorkAction, deleteWorkAction } from "@/app/admin/works.actions";
import { RichTextEditor } from "./RichTextEditor";

export function WorkSectionManager({ works }: { works: WorkItem[] }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingWork, setEditingWork] = useState<WorkItem | null>(null);
    const [editorContent, setEditorContent] = useState("");

    const openCreateModal = () => {
        setEditingWork(null);
        setEditorContent("");
        setIsModalOpen(true);
    };

    const openEditModal = (work: WorkItem) => {
        setEditingWork(work);
        setEditorContent(work.content);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingWork(null);
        setEditorContent("");
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold text-foreground">Work Section</h2>
                    <p className="mt-0.5 text-sm text-muted-foreground">Manage upcoming, past, and general articles.</p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="inline-flex items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
                >
                    <Plus className="size-4" weight="bold" />
                    Create New
                </button>
            </div>

            {works.length === 0 ? (
                <div className="flex min-h-[220px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-border/60 p-8 text-center">
                    <p className="mt-3 text-sm text-muted-foreground">No posts created yet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {works.map((work) => (
                        <div key={work.id} className="group relative overflow-hidden rounded-xl border bg-card shadow-sm flex flex-col">
                            {work.coverImageUrl ? (
                                <div className="aspect-video w-full overflow-hidden bg-muted">
                                    <img src={work.coverImageUrl} alt={work.title} className="h-full w-full object-cover" />
                                </div>
                            ) : (
                                <div className="flex aspect-video w-full items-center justify-center bg-muted">
                                    <span className="text-muted-foreground">No cover image</span>
                                </div>
                            )}
                            {!work.isPublished && (
                                <span className="absolute left-2 top-2 z-10 rounded-md bg-black/70 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white/80">
                                    Draft
                                </span>
                            )}
                            <span className="absolute right-2 top-2 z-10 rounded-md bg-white/90 shadow px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-black">
                                {work.category}
                            </span>
                            <div className="p-4 flex-1 flex flex-col">
                                <h3 className="text-lg font-semibold truncate">{work.title}</h3>
                                <p className="text-sm text-muted-foreground mb-4">By {work.author}</p>
                                <div className="mt-auto flex justify-between gap-2 border-t pt-4">
                                    <button onClick={() => openEditModal(work)} className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800">
                                        <PencilSimple /> Edit
                                    </button>
                                    <div className="flex gap-2">
                                        <form action={updateWorkAction}>
                                            <input type="hidden" name="id" value={work.id} />
                                            <input type="hidden" name="isPublished" value={work.isPublished ? "false" : "true"} />
                                            <button type="submit" className="flex items-center gap-1 text-sm text-neutral-600 hover:text-neutral-800">
                                                {work.isPublished ? <EyeSlash /> : <Eye />} {work.isPublished ? "Hide" : "Publish"}
                                            </button>
                                        </form>
                                        <form action={deleteWorkAction}>
                                            <input type="hidden" name="id" value={work.id} />
                                            <button type="submit" className="flex items-center gap-1 text-sm text-red-600 hover:text-red-800">
                                                <Trash /> Delete
                                            </button>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="relative z-10 w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-card p-6 shadow-2xl flex flex-col">
                        <button
                            type="button"
                            onClick={closeModal}
                            className="absolute right-4 top-4 rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        >
                            <X className="size-5" />
                        </button>
                        <h3 className="text-2xl font-semibold mb-6">{editingWork ? "Edit Post" : "Create New Post"}</h3>
                        <form action={editingWork ? updateWorkAction : createWorkAction} className="space-y-5 flex-1 flex flex-col">
                            {editingWork && <input type="hidden" name="id" value={editingWork.id} />}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">Title</label>
                                    <input name="title" required defaultValue={editingWork?.title} className="w-full rounded-lg border px-3 py-2 text-sm focus:border-primary focus:outline-none" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">Author</label>
                                    <input name="author" required defaultValue={editingWork?.author} className="w-full rounded-lg border px-3 py-2 text-sm focus:border-primary focus:outline-none" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">Category</label>
                                    <select name="category" required defaultValue={editingWork?.category || "article"} className="w-full rounded-lg border px-3 py-2 text-sm focus:border-primary focus:outline-none">
                                        <option value="article">Article</option>
                                        <option value="upcoming">Upcoming</option>
                                        <option value="past">Past</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">Cover Image (Optional)</label>
                                    <input type="file" name="coverFile" accept="image/*" className="w-full rounded-lg border px-3 py-1.5 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-1 file:text-xs file:font-medium file:text-primary-foreground hover:file:bg-primary/90" />
                                </div>
                            </div>

                            <div className="space-y-1 flex-1 flex flex-col relative">
                                <label className="text-sm font-medium">Content</label>
                                <input type="hidden" name="content" value={editorContent} />
                                <RichTextEditor content={editorContent} onChange={setEditorContent} />
                            </div>

                            <div className="flex items-center gap-4 pt-4 border-t">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" name="isPublished" value="true" defaultChecked={editingWork ? editingWork.isPublished : true} className="rounded border-gray-300 text-primary focus:ring-primary size-4" />
                                    <span className="text-sm font-medium">Publish immediately</span>
                                </label>
                                <button type="submit" className="ml-auto rounded-lg bg-foreground px-6 py-2.5 text-sm font-medium text-background hover:bg-foreground/90 transition-colors">
                                    {editingWork ? "Save Changes" : "Create Post"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
