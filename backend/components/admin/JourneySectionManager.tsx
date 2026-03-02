"use client";

import { useState } from "react";
import { type JourneyItem } from "@/lib/journey/service";
import { Plus, PencilSimple, Trash, X } from "@phosphor-icons/react";
import {
  createJourneyAction,
  deleteJourneyAction,
  updateJourneyAction,
} from "@/app/admin/journey.actions";

export function JourneySectionManager({ items }: { items: JourneyItem[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<JourneyItem | null>(null);

  const openCreateModal = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item: JourneyItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setEditingItem(null);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Journey Timeline</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Manage entries for the homepage timeline section.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
        >
          <Plus className="size-4" weight="bold" />
          Add Entry
        </button>
      </div>

      {items.length === 0 ? (
        <div className="flex min-h-[180px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-border/60 p-8 text-center">
          <p className="text-sm text-muted-foreground">No journey entries created yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="overflow-hidden rounded-xl border bg-card shadow-sm flex flex-col"
            >
              <div className="aspect-video w-full overflow-hidden bg-muted">
                <img src={item.poster} alt={item.title} className="h-full w-full object-cover" />
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {item.year}
                </p>
                <h3 className="mt-1 text-base font-semibold line-clamp-2">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{item.content}</p>

                <div className="mt-auto flex justify-end gap-4 border-t pt-4">
                  <button
                    onClick={() => openEditModal(item)}
                    className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                  >
                    <PencilSimple />
                    Edit
                  </button>
                  <form action={deleteJourneyAction}>
                    <input type="hidden" name="id" value={item.id} />
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1 text-sm text-red-600 hover:text-red-800"
                    >
                      <Trash />
                      Delete
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-card p-6 shadow-2xl">
            <button
              type="button"
              onClick={closeModal}
              className="absolute right-4 top-4 rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="size-5" />
            </button>

            <h3 className="mb-6 text-2xl font-semibold">
              {editingItem ? "Edit Journey Entry" : "Add Journey Entry"}
            </h3>

            <form
              action={editingItem ? updateJourneyAction : createJourneyAction}
              className="space-y-5"
            >
              {editingItem && <input type="hidden" name="id" value={editingItem.id} />}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Year</label>
                  <input
                    name="year"
                    type="number"
                    min={1}
                    required
                    defaultValue={editingItem?.year ?? 2026}
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">
                    Poster Image {editingItem ? "(Optional on edit)" : ""}
                  </label>
                  <input
                    type="file"
                    name="posterFile"
                    accept="image/*"
                    required={!editingItem}
                    className="w-full rounded-lg border px-3 py-1.5 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-1 file:text-xs file:font-medium file:text-primary-foreground hover:file:bg-primary/90"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Title</label>
                <input
                  name="title"
                  required
                  defaultValue={editingItem?.title}
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:border-primary focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Content</label>
                <textarea
                  name="content"
                  required
                  rows={6}
                  defaultValue={editingItem?.content}
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:border-primary focus:outline-none"
                />
              </div>

              <div className="flex justify-end border-t pt-4">
                <button
                  type="submit"
                  className="rounded-lg bg-foreground px-6 py-2.5 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
                >
                  {editingItem ? "Save Changes" : "Create Entry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
