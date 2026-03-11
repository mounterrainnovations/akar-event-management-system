"use client";

import { useState } from "react";
import { type PastEventItem } from "@/lib/past-events/service";
import { Plus, Trash, PencilSimple, X, Image as ImageIcon } from "@phosphor-icons/react";
import { createPastEventAction, updatePastEventAction, deletePastEventAction } from "@/app/admin/past-events.actions";

export function PastEventsSectionManager({ pastEvents }: { pastEvents: PastEventItem[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<PastEventItem | null>(null);

  const openCreateModal = () => {
    setEditingEvent(null);
    setIsModalOpen(true);
  };

  const openEditModal = (event: PastEventItem) => {
    setEditingEvent(event);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingEvent(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Past Events</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">Manage past events shown in the carousel on event pages.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
        >
          <Plus className="size-4" weight="bold" />
          Add Past Event
        </button>
      </div>

      {pastEvents.length === 0 ? (
        <div className="flex min-h-[220px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-border/60 p-8 text-center">
          <ImageIcon className="size-12 text-muted-foreground/40" />
          <p className="mt-3 text-sm text-muted-foreground">No past events added yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pastEvents.map((event) => (
            <div key={event.id} className="group relative overflow-hidden rounded-xl border bg-card shadow-sm flex flex-col">
              {event.imageUrl ? (
                <div className="aspect-video w-full overflow-hidden bg-muted">
                  <img src={event.imageUrl} alt={event.title || "Past event"} className="h-full w-full object-cover" />
                </div>
              ) : (
                <div className="flex aspect-video w-full items-center justify-center bg-muted">
                  <ImageIcon className="size-8 text-muted-foreground/40" />
                </div>
              )}
              <div className="p-4 flex-1 flex flex-col">
                {event.title && (
                  <h3 className="text-lg font-semibold mb-2">{event.title}</h3>
                )}
                {event.description && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{event.description}</p>
                )}
                <div className="mt-auto flex justify-between gap-2 border-t pt-4">
                  <button
                    onClick={() => openEditModal(event)}
                    className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                  >
                    <PencilSimple /> Edit
                  </button>
                  <form action={deletePastEventAction}>
                    <input type="hidden" name="id" value={event.id} />
                    <button
                      type="submit"
                      className="flex items-center gap-1 text-sm text-red-600 hover:text-red-800"
                    >
                      <Trash /> Delete
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closeModal}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-card p-6 shadow-2xl">
            <button
              type="button"
              onClick={closeModal}
              className="absolute right-4 top-4 rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="size-5" />
            </button>

            <h3 className="text-lg font-semibold text-foreground mb-4">
              {editingEvent ? "Edit Past Event" : "Add Past Event"}
            </h3>

            <form
              action={editingEvent ? updatePastEventAction : createPastEventAction}
              className="space-y-4"
            >
              {editingEvent && (
                <input type="hidden" name="id" value={editingEvent.id} />
              )}

              <div className="space-y-1">
                <label htmlFor="title" className="text-sm font-medium text-foreground">
                  Title (Optional)
                </label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  defaultValue={editingEvent?.title || ""}
                  placeholder="e.g. Summer Workshop 2024"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="description" className="text-sm font-medium text-foreground">
                  Description (Optional)
                </label>
                <textarea
                  id="description"
                  name="description"
                  defaultValue={editingEvent?.description || ""}
                  placeholder="e.g. A memorable event with amazing speakers..."
                  rows={4}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="imageFile" className="text-sm font-medium text-foreground">
                  Image {editingEvent ? "(Optional - leave empty to keep current)" : "(Required)"}
                </label>
                <input
                  id="imageFile"
                  name="imageFile"
                  type="file"
                  accept=".png,.jpg,.jpeg"
                  required={!editingEvent}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-lg bg-foreground py-2.5 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
              >
                {editingEvent ? "Update Past Event" : "Create Past Event"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
