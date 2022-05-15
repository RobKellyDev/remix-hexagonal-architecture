import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import classNames from "classnames";

interface FloatingLabelInputOptions {
  name: string;
  label: string;
  errorMessage?: string;
  type?: string;
  required?: boolean;
}

export type FloatingLabelInputImperativeHandle = {
  focus: () => void;
  clear: () => void;
};

export const FloatingLabelInput = forwardRef<
  FloatingLabelInputImperativeHandle,
  FloatingLabelInputOptions
>((props, ref) => {
  const { name, label, errorMessage, type = "text", required } = props;

  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState("");
  const isStickyLabel = value.length > 0;

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
    clear: () => setValue(""),
  }));

  return (
    <label className="group">
      <div className="relative">
        <input
          ref={inputRef}
          type={type}
          name={name}
          value={value}
          required={required}
          onChange={(e) => setValue(e.target.value)}
          className={classNames(
            "block w-full rounded-2xl border bg-transparent py-4 px-6",
            "border-2 border border-dark focus:border-primary",
            "text-base text-lighter transition-colors",
            {
              "border-danger": !!errorMessage,
            }
          )}
        />
        <span
          className={classNames(
            "absolute left-4 -translate-y-1/2 p-3 font-bold",
            "transition-all group-focus-within:top-0 group-focus-within:bg-darker group-focus-within:text-xs",
            {
              "top-1/2": !isStickyLabel,
              "top-0 bg-darker text-xs": isStickyLabel,
              "text-danger": !!errorMessage,
            }
          )}
        >
          {label}
        </span>
      </div>

      {errorMessage && (
        <span className="block px-4 pt-4 text-sm text-danger" role="alert">
          <span aria-hidden className="inline-block w-[2ch]">
            👉
          </span>{" "}
          {errorMessage}
        </span>
      )}
    </label>
  );
});
