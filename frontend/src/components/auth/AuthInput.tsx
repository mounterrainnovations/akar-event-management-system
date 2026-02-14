'use client';

import React from 'react';

interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
}

export function AuthInput({ label, id, ...props }: AuthInputProps) {
    return (
        <div className="flex flex-col gap-1.5">
            <label htmlFor={id} className="text-sm font-medium text-gray-700">
                {label}
            </label>
            <input
                id={id}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-900 focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none transition-all duration-200 text-sm"
                {...props}
            />
        </div>
    );
}
