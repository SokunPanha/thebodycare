"use client";

import { useActionState, useState } from "react";

import type { EditState } from "../../actions";

type Values = {
  title: string;
  excerpt: string;
  category_id: string;
  key_points: string[];
  body_md: string;
  when_to_seek_care: string;
  seo_title: string | null;
  seo_description: string | null;
};

const initial: EditState = { error: null };
const input =
  "mt-1 block w-full rounded-sm border border-line-strong bg-surface px-3 py-2 text-base";
const mono = "font-mono text-sm leading-(--leading-ui)";

function Field({
  name,
  label,
  hint,
  errors,
  children,
}: {
  name: string;
  label: string;
  hint?: React.ReactNode;
  errors?: string[];
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={name} className="text-sm font-semibold">
        {label}
      </label>
      {hint && <p className="text-xs text-ink-muted">{hint}</p>}
      {children}
      {errors?.map((error) => (
        <p key={error} id={`${name}-error`} className="mt-1 text-sm font-semibold">
          {error}
        </p>
      ))}
    </div>
  );
}

/** Counts characters against a limit, live — the 70-char title cap is a hard design limit. */
function useCounter(initialValue: string | null) {
  const [value, setValue] = useState(initialValue ?? "");
  return {
    value,
    length: value.length,
    onChange: (e: { target: { value: string } }) => setValue(e.target.value),
  };
}

export function PostEditForm({
  values,
  categories,
  action,
}: {
  values: Values;
  categories: { id: string; name: string }[];
  action: (previous: EditState, formData: FormData) => Promise<EditState>;
}) {
  const [state, formAction, pending] = useActionState(action, initial);
  const errors = state.fieldErrors ?? {};
  const title = useCounter(values.title);
  const seoTitle = useCounter(values.seo_title);
  const seoDescription = useCounter(values.seo_description);

  return (
    <form action={formAction} className="max-w-(--measure) space-y-6">
      <Field name="title" label="Headline" hint={`${title.length}/70`} errors={errors.title}>
        <input
          id="title"
          name="title"
          value={title.value}
          onChange={title.onChange}
          className={input}
        />
      </Field>

      <Field name="excerpt" label="Standfirst" errors={errors.excerpt}>
        <textarea
          id="excerpt"
          name="excerpt"
          rows={3}
          defaultValue={values.excerpt}
          className={input}
        />
      </Field>

      <Field name="category_id" label="Category" errors={errors.category_id}>
        <select
          id="category_id"
          name="category_id"
          defaultValue={values.category_id}
          className={input}
        >
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </Field>

      <Field
        name="key_points"
        label="Key points"
        hint="One per line, 3 to 5."
        errors={errors.key_points}
      >
        <textarea
          id="key_points"
          name="key_points"
          rows={5}
          defaultValue={values.key_points.join("\n")}
          className={input}
        />
      </Field>

      <Field
        name="body_md"
        label="Body"
        hint="Markdown. Use ## for section headings."
        errors={errors.body_md}
      >
        <textarea
          id="body_md"
          name="body_md"
          rows={24}
          defaultValue={values.body_md}
          className={`${input} ${mono}`}
        />
      </Field>

      <Field
        name="when_to_seek_care"
        label="When to seek care"
        hint="Specific thresholds — durations, changes, combinations. Markdown list allowed."
        errors={errors.when_to_seek_care}
      >
        <textarea
          id="when_to_seek_care"
          name="when_to_seek_care"
          rows={8}
          defaultValue={values.when_to_seek_care}
          className={`${input} ${mono}`}
        />
      </Field>

      <Field
        name="seo_title"
        label="SEO title"
        hint={`${seoTitle.length}/60 · optional`}
        errors={errors.seo_title}
      >
        <input
          id="seo_title"
          name="seo_title"
          value={seoTitle.value}
          onChange={seoTitle.onChange}
          className={input}
        />
      </Field>

      <Field
        name="seo_description"
        label="SEO description"
        hint={`${seoDescription.length}/155 · optional`}
        errors={errors.seo_description}
      >
        <textarea
          id="seo_description"
          name="seo_description"
          rows={2}
          value={seoDescription.value}
          onChange={seoDescription.onChange}
          className={input}
        />
      </Field>

      {state.error && (
        <p role="alert" className="font-semibold">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-primary px-4 py-2 font-semibold text-on-primary hover:bg-primary-hover disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
