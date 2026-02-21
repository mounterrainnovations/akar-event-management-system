"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { useCallback, useEffect } from 'react';
import { Bold, Italic, Image as ImageIcon, Link as LinkIcon } from 'lucide-react';
import { toast } from "react-toastify";

interface RichTextEditorProps {
    content: string;
    onChange: (html: string) => void;
}

export function RichTextEditor({ content, onChange }: RichTextEditorProps) {
    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit,
            Image.configure({
                inline: true,
                allowBase64: true,
            }),
            Link.configure({
                openOnClick: false,
            })
        ],
        content,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'prose prose-sm sm:prose-base focus:outline-none min-h-[300px] max-h-[600px] overflow-y-auto p-4 border rounded-b-lg border-t-0 bg-background',
            },
            handleDrop: (view, event, slice, moved) => {
                if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0]) {
                    const file = event.dataTransfer.files[0];
                    const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY });
                    if (file.type.startsWith('image/')) {
                        uploadImage(file).then(url => {
                            if (coordinates && url) {
                                view.dispatch(view.state.tr.insert(coordinates.pos, view.state.schema.nodes.image.create({ src: url })));
                            }
                        });
                        return true;
                    }
                }
                return false;
            },
        }
    });

    // Effect to update content dynamically if it changes from props (like when selecting a different work to edit)
    useEffect(() => {
        if (editor && content !== editor.getHTML()) {
            editor.commands.setContent(content, { emitUpdate: false });
        }
    }, [content, editor])

    const uploadImage = async (file: File) => {
        const formData = new FormData();
        formData.append("file", file);
        try {
            const res = await fetch("/api/upload-media", { method: "POST", body: formData });
            const data = await res.json();
            if (data.url) return data.url;
            throw new Error(data.error);
        } catch (err) {
            toast.error("Failed to upload image");
            return null;
        }
    };

    const addImage = useCallback(() => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async () => {
            if (input.files?.length) {
                const file = input.files[0];
                const url = await uploadImage(file);
                if (url && editor) {
                    editor.chain().focus().setImage({ src: url }).run();
                }
            }
        };
        input.click();
    }, [editor]);

    const setLink = useCallback(() => {
        const previousUrl = editor?.getAttributes('link').href
        const url = window.prompt('URL', previousUrl)

        // cancelled
        if (url === null) {
            return
        }

        // empty
        if (url === '') {
            editor?.chain().focus().extendMarkRange('link').unsetLink().run()
            return
        }

        // update link
        editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
    }, [editor]);

    if (!editor) {
        return null;
    }

    return (
        <div className="w-full flex flex-col border rounded-lg overflow-hidden">
            <div className="flex flex-wrap items-center gap-1 p-2 bg-muted/50 border-b">
                <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={`p-2 rounded hover:bg-muted ${editor.isActive('bold') ? 'bg-muted shadow-sm' : ''}`}><Bold className="size-4" /></button>
                <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={`p-2 rounded hover:bg-muted ${editor.isActive('italic') ? 'bg-muted shadow-sm' : ''}`}><Italic className="size-4" /></button>
                <div className="w-px h-4 bg-border mx-1" />
                <button type="button" onClick={setLink} className={`p-2 rounded hover:bg-muted ${editor.isActive('link') ? 'bg-muted shadow-sm' : ''}`}><LinkIcon className="size-4" /></button>
                <button type="button" onClick={addImage} className="p-2 rounded hover:bg-muted"><ImageIcon className="size-4" /></button>
            </div>
            <EditorContent editor={editor} />
        </div>
    );
}
