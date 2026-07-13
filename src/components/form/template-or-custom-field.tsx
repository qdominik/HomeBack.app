"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { CUSTOM_TEMPLATE_VALUE } from "@/lib/home/home-template-options";
import { normalizeTemplateValue } from "@/lib/templates/normalize-template-value";

type TemplateOrCustomFieldProps = {
  customLabel: string;
  defaultValue?: string | null;
  helpText?: string;
  inferredValue?: string | null;
  label: string;
  name: string;
  onChange?: (value: string) => void;
  templateOptions: readonly string[];
};

function findTemplateOption(value: string, options: readonly string[]) {
  const normalizedValue = normalizeTemplateValue(value);

  if (!normalizedValue) {
    return null;
  }

  return (
    options.find(
      (option) => normalizeTemplateValue(option) === normalizedValue,
    ) ?? null
  );
}

export function TemplateOrCustomField({
  customLabel,
  defaultValue,
  helpText,
  inferredValue,
  label,
  name,
  onChange,
  templateOptions,
}: TemplateOrCustomFieldProps) {
  const selectId = useId();
  const customInputId = useId();
  const templateFieldName = `${name}_template`;
  const customFieldName = `${name}_custom`;
  const options = useMemo(
    () =>
      templateOptions.includes(CUSTOM_TEMPLATE_VALUE)
        ? templateOptions
        : [...templateOptions, CUSTOM_TEMPLATE_VALUE],
    [templateOptions],
  );
  const trimmedDefaultValue = defaultValue?.trim() ?? "";
  const initialTemplateValue = findTemplateOption(trimmedDefaultValue, options);
  const initialHasDefaultValue = useRef(Boolean(trimmedDefaultValue));
  const [selectedValue, setSelectedValue] = useState(
    initialTemplateValue ?? CUSTOM_TEMPLATE_VALUE,
  );
  const [customValue, setCustomValue] = useState(
    trimmedDefaultValue && !initialTemplateValue ? trimmedDefaultValue : "",
  );
  const [userTouched, setUserTouched] = useState(Boolean(trimmedDefaultValue));
  const submittedValue =
    selectedValue === CUSTOM_TEMPLATE_VALUE
      ? customValue.trim() || CUSTOM_TEMPLATE_VALUE
      : selectedValue;

  useEffect(() => {
    if (userTouched || initialHasDefaultValue.current) {
      return;
    }

    const inferredTemplateValue = inferredValue
      ? findTemplateOption(inferredValue, options)
      : null;

    setSelectedValue(inferredTemplateValue ?? CUSTOM_TEMPLATE_VALUE);
    setCustomValue("");
  }, [inferredValue, options, userTouched]);

  useEffect(() => {
    onChange?.(submittedValue);
  }, [onChange, submittedValue]);

  return (
    <div className="space-y-2">
      <input name={name} type="hidden" value={submittedValue} />
      <label className="ui-label" htmlFor={selectId}>
        {label}
      </label>
      <select
        className="ui-control"
        id={selectId}
        name={templateFieldName}
        onChange={(event) => {
          setUserTouched(true);
          setSelectedValue(event.currentTarget.value);

          if (event.currentTarget.value !== CUSTOM_TEMPLATE_VALUE) {
            setCustomValue("");
          }
        }}
        value={selectedValue}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      {selectedValue === CUSTOM_TEMPLATE_VALUE ? (
        <label className="ui-label" htmlFor={customInputId}>
          {customLabel}
          <input
            className="ui-control mt-2"
            id={customInputId}
            name={customFieldName}
            onChange={(event) => {
              setUserTouched(true);
              setCustomValue(event.currentTarget.value);
            }}
            value={customValue}
          />
        </label>
      ) : null}
      {helpText ? <p className="ui-field-help">{helpText}</p> : null}
    </div>
  );
}