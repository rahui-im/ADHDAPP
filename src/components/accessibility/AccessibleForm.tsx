import React, { forwardRef, InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from 'react';
import { buildAriaAttributes, AriaAttributes } from '../../utils/accessibility';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';

// Form Field Wrapper
interface FormFieldProps {
  label: string;
  id: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  id,
  error,
  hint,
  required,
  children,
}) => {
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;

  return (
    <div className="form-field mb-4">
      <label
        htmlFor={id}
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        {label}
        {required && (
          <span className="text-red-500 ml-1" aria-label="required">
            *
          </span>
        )}
      </label>
      {hint && (
        <p id={hintId} className="text-sm text-gray-500 mb-1">
          {hint}
        </p>
      )}
      {children}
      {error && (
        <p
          id={errorId}
          className="mt-1 text-sm text-red-600 flex items-center gap-1"
          role="alert"
        >
          <ExclamationCircleIcon className="h-4 w-4" aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
};

// Accessible Input
interface AccessibleInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  aria?: AriaAttributes;
}

export const AccessibleInput = forwardRef<HTMLInputElement, AccessibleInputProps>(
  ({ label, error, hint, required, id, aria, className = '', ...props }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const errorId = `${inputId}-error`;
    const hintId = `${inputId}-hint`;

    const ariaAttributes = buildAriaAttributes({
      ...aria,
      invalid: !!error,
      required,
      describedBy: [
        hint && hintId,
        error && errorId,
        aria?.describedBy,
      ].filter(Boolean).join(' ') || undefined,
    });

    const inputElement = (
      <input
        ref={ref}
        id={inputId}
        className={`
          block w-full rounded-md border-gray-300 shadow-sm
          focus:border-purple-500 focus:ring-purple-500
          disabled:bg-gray-100 disabled:cursor-not-allowed
          ${error ? 'border-red-500' : ''}
          ${className}
        `}
        required={required}
        {...ariaAttributes}
        {...props}
      />
    );

    if (label) {
      return (
        <FormField
          label={label}
          id={inputId}
          error={error}
          hint={hint}
          required={required}
        >
          {inputElement}
        </FormField>
      );
    }

    return inputElement;
  }
);

AccessibleInput.displayName = 'AccessibleInput';

// Accessible Textarea
interface AccessibleTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  aria?: AriaAttributes;
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
}

export const AccessibleTextarea = forwardRef<HTMLTextAreaElement, AccessibleTextareaProps>(
  ({ label, error, hint, required, id, aria, resize = 'vertical', className = '', ...props }, ref) => {
    const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;
    const errorId = `${textareaId}-error`;
    const hintId = `${textareaId}-hint`;

    const resizeClasses = {
      none: 'resize-none',
      vertical: 'resize-y',
      horizontal: 'resize-x',
      both: 'resize',
    };

    const ariaAttributes = buildAriaAttributes({
      ...aria,
      invalid: !!error,
      required,
      multiline: true,
      describedBy: [
        hint && hintId,
        error && errorId,
        aria?.describedBy,
      ].filter(Boolean).join(' ') || undefined,
    });

    const textareaElement = (
      <textarea
        ref={ref}
        id={textareaId}
        className={`
          block w-full rounded-md border-gray-300 shadow-sm
          focus:border-purple-500 focus:ring-purple-500
          disabled:bg-gray-100 disabled:cursor-not-allowed
          ${resizeClasses[resize]}
          ${error ? 'border-red-500' : ''}
          ${className}
        `}
        required={required}
        {...ariaAttributes}
        {...props}
      />
    );

    if (label) {
      return (
        <FormField
          label={label}
          id={textareaId}
          error={error}
          hint={hint}
          required={required}
        >
          {textareaElement}
        </FormField>
      );
    }

    return textareaElement;
  }
);

AccessibleTextarea.displayName = 'AccessibleTextarea';

// Accessible Select
interface AccessibleSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  placeholder?: string;
  aria?: AriaAttributes;
}

export const AccessibleSelect = forwardRef<HTMLSelectElement, AccessibleSelectProps>(
  ({ label, error, hint, required, id, options, placeholder, aria, className = '', ...props }, ref) => {
    const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;
    const errorId = `${selectId}-error`;
    const hintId = `${selectId}-hint`;

    const ariaAttributes = buildAriaAttributes({
      ...aria,
      invalid: !!error,
      required,
      describedBy: [
        hint && hintId,
        error && errorId,
        aria?.describedBy,
      ].filter(Boolean).join(' ') || undefined,
    });

    const selectElement = (
      <select
        ref={ref}
        id={selectId}
        className={`
          block w-full rounded-md border-gray-300 shadow-sm
          focus:border-purple-500 focus:ring-purple-500
          disabled:bg-gray-100 disabled:cursor-not-allowed
          ${error ? 'border-red-500' : ''}
          ${className}
        `}
        required={required}
        {...ariaAttributes}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>
    );

    if (label) {
      return (
        <FormField
          label={label}
          id={selectId}
          error={error}
          hint={hint}
          required={required}
        >
          {selectElement}
        </FormField>
      );
    }

    return selectElement;
  }
);

AccessibleSelect.displayName = 'AccessibleSelect';

// Accessible Checkbox
interface AccessibleCheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
  aria?: AriaAttributes;
}

export const AccessibleCheckbox = forwardRef<HTMLInputElement, AccessibleCheckboxProps>(
  ({ label, error, hint, id, aria, className = '', ...props }, ref) => {
    const checkboxId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;
    const errorId = `${checkboxId}-error`;
    const hintId = `${checkboxId}-hint`;

    const ariaAttributes = buildAriaAttributes({
      ...aria,
      invalid: !!error,
      describedBy: [
        hint && hintId,
        error && errorId,
        aria?.describedBy,
      ].filter(Boolean).join(' ') || undefined,
    });

    return (
      <div className="form-field mb-4">
        <div className="flex items-start">
          <input
            ref={ref}
            type="checkbox"
            id={checkboxId}
            className={`
              h-4 w-4 rounded border-gray-300 text-purple-600
              focus:ring-purple-500 disabled:cursor-not-allowed
              ${error ? 'border-red-500' : ''}
              ${className}
            `}
            {...ariaAttributes}
            {...props}
          />
          <div className="ml-3">
            <label
              htmlFor={checkboxId}
              className="text-sm font-medium text-gray-700 cursor-pointer"
            >
              {label}
            </label>
            {hint && (
              <p id={hintId} className="text-sm text-gray-500">
                {hint}
              </p>
            )}
          </div>
        </div>
        {error && (
          <p
            id={errorId}
            className="mt-1 text-sm text-red-600 flex items-center gap-1"
            role="alert"
          >
            <ExclamationCircleIcon className="h-4 w-4" aria-hidden="true" />
            <span>{error}</span>
          </p>
        )}
      </div>
    );
  }
);

AccessibleCheckbox.displayName = 'AccessibleCheckbox';

// Accessible Radio Group
interface RadioOption {
  value: string;
  label: string;
  hint?: string;
  disabled?: boolean;
}

interface AccessibleRadioGroupProps {
  name: string;
  label: string;
  options: RadioOption[];
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  hint?: string;
  required?: boolean;
  aria?: AriaAttributes;
}

export const AccessibleRadioGroup: React.FC<AccessibleRadioGroupProps> = ({
  name,
  label,
  options,
  value,
  onChange,
  error,
  hint,
  required,
  aria,
}) => {
  const groupId = `radio-group-${Math.random().toString(36).substr(2, 9)}`;
  const errorId = `${groupId}-error`;
  const hintId = `${groupId}-hint`;

  const ariaAttributes = buildAriaAttributes({
    ...aria,
    invalid: !!error,
    required,
    describedBy: [
      hint && hintId,
      error && errorId,
      aria?.describedBy,
    ].filter(Boolean).join(' ') || undefined,
  });

  return (
    <fieldset className="form-field mb-4" {...ariaAttributes}>
      <legend className="text-sm font-medium text-gray-700 mb-2">
        {label}
        {required && (
          <span className="text-red-500 ml-1" aria-label="required">
            *
          </span>
        )}
      </legend>
      {hint && (
        <p id={hintId} className="text-sm text-gray-500 mb-2">
          {hint}
        </p>
      )}
      <div className="space-y-2" role="radiogroup" aria-required={required}>
        {options.map((option) => {
          const optionId = `${groupId}-${option.value}`;
          const optionHintId = `${optionId}-hint`;
          
          return (
            <div key={option.value} className="flex items-start">
              <input
                type="radio"
                id={optionId}
                name={name}
                value={option.value}
                checked={value === option.value}
                onChange={() => onChange?.(option.value)}
                disabled={option.disabled}
                className="h-4 w-4 border-gray-300 text-purple-600 focus:ring-purple-500 disabled:cursor-not-allowed"
                aria-describedby={option.hint ? optionHintId : undefined}
              />
              <div className="ml-3">
                <label
                  htmlFor={optionId}
                  className="text-sm font-medium text-gray-700 cursor-pointer"
                >
                  {option.label}
                </label>
                {option.hint && (
                  <p id={optionHintId} className="text-sm text-gray-500">
                    {option.hint}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {error && (
        <p
          id={errorId}
          className="mt-2 text-sm text-red-600 flex items-center gap-1"
          role="alert"
        >
          <ExclamationCircleIcon className="h-4 w-4" aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}
    </fieldset>
  );
};