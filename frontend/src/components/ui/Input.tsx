import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  error?: string;
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

const baseStyles = `
  w-full bg-bg-elevated border border-white/10 rounded-lg
  text-white placeholder-text-muted text-sm
  transition-all duration-200
  focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20
  hover:border-white/20
  disabled:opacity-50 disabled:cursor-not-allowed
`;

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ icon, error, className = '', ...props }, ref) => {
    return (
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          className={`
            ${baseStyles}
            ${icon ? 'pl-9' : 'px-3'} py-2
            ${error ? 'border-danger/50 focus:border-danger focus:ring-danger/20' : ''}
            ${className}
          `}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-xs text-danger">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ error, className = '', ...props }, ref) => {
    return (
      <div>
        <textarea
          ref={ref}
          className={`
            ${baseStyles}
            px-3 py-2 resize-none
            ${error ? 'border-danger/50 focus:border-danger focus:ring-danger/20' : ''}
            ${className}
          `}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-xs text-danger">{error}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
