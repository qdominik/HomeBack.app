"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { CUSTOM_TEMPLATE_VALUE } from "@/lib/home/home-template-options";
import {
  findTemplateOption,
  shouldApplyInferredTemplate,
} from "@/lib/templates/normalize-template-value";

type TemplateOrCustomFieldProps = {
  customLabel: string;
  customOption?: string;
  defaultValue?: string | null;
  helpText?: string;
  inferredValue?: string | null;
  label: string;
  name: string;
  onChange?: (value: string) => void;
  templateOptions: readonly string[];
};

export function TemplateOrCustomField({
  customLabel,
  customOption = CUSTOM_TEMPLATE_VALUE,
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
      templateOptions.includes(customOption)
        ? templateOptions
        : [...templateOptions, customOption],
    [customOption, templateOptions],
  );
  const trimmedDefaultValue = defaultValue?.trim() ?? "";
  const initialTemplateValue = findTemplateOption(trimmedDefaultValue, options);
  const initialHasDefaultValue = useRef(Boolean(trimmedDefaultValue));
  const [selectedValue, setSelectedValue] = useState(
    initialTemplateValue ?? customOption,
  );
  const [customValue, setCustomValue] = useState(
    trimmedDefaultValue && !initialTemplateValue ? trimmedDefaultValue : "",
  );
  const [userTouched, setUserTouched] = useState(Boolean(trimmedDefaultValue));
  const submittedValue =
    selectedValue === customOption
      ? customValue.trim() || customOption
      : selectedValue;

  useEffect(() => {
    if (
      !shouldApplyInferredTemplate(
        userTouched,
        initialHasDefaultValue.current,
      )
    ) {
      return;
    }

    const inferredTemplateValue = inferredValue
      ? findTemplateOption(inferredValue, options)
      : null;

    setSelectedValue(inferredTemplateValue ?? customOption);
    setCustomValue("");
  }, [customOption, inferredValue, options, userTouched]);

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
          const nextValue = event.currentTarget.value;
          setUserTouched(true);
          setSelectedValue(nextValue);

          if (nextValue !== customOption) {
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
      {selectedValue === customOption ? (
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
