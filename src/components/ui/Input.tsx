import type { InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes, ReactNode } from 'react';
import { useId } from 'react';

const baseField =
  'w-full rounded-xl border border-navy-200 bg-white px-4 py-2.5 text-sm text-navy-800 placeholder:text-navy-300 transition-colors focus:border-navy-400 focus:outline-none focus:ring-2 focus:ring-navy-200';

interface LabelProps {
  children: ReactNode;
  htmlFor?: string;
}

export function Label({ children, htmlFor }: LabelProps) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-navy-700">
      {children}
    </label>
  );
}

interface FieldErrorProps {
  message?: string;
}

export function FieldError({ message }: FieldErrorProps) {
  if (!message) return null;
  return <p className="mt-1.5 text-xs font-medium text-red-500">{message}</p>;
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = '', ...props }: InputProps) {
  const id = useId();
  return (
    <div>
      {label && <Label htmlFor={props.id ?? id}>{label}</Label>}
      <input
        id={props.id ?? id}
        className={`${baseField} ${error ? 'border-red-400 focus:border-red-400 focus:ring-red-100' : ''} ${className}`}
        {...props}
      />
      <FieldError message={error} />
    </div>
  );
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({ label, error, className = '', ...props }: TextareaProps) {
  const id = useId();
  return (
    <div>
      {label && <Label htmlFor={props.id ?? id}>{label}</Label>}
      <textarea
        id={props.id ?? id}
        className={`${baseField} min-h-[96px] resize-y ${error ? 'border-red-400' : ''} ${className}`}
        {...props}
      />
      <FieldError message={error} />
    </div>
  );
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export function Select({ label, error, options, className = '', ...props }: SelectProps) {
  const id = useId();
  return (
    <div>
      {label && <Label htmlFor={props.id ?? id}>{label}</Label>}
      <select
        id={props.id ?? id}
        className={`${baseField} ${error ? 'border-red-400' : ''} ${className}`}
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <FieldError message={error} />
    </div>
  );
}
