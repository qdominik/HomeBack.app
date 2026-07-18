"use client";

import type { ReactNode } from "react";
import { PlusIcon } from "@phosphor-icons/react/Plus";
import { useId, useState } from "react";
import { RoomForm } from "@/components/home/room-form";
import { buttonClassName } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type CreateRoomPanelProps = {
  action: (formData: FormData) => Promise<void>;
  addLabel: string;
  children: ReactNode;
  submitLabel: string;
};

export function CreateRoomPanel({
  action,
  addLabel,
  children,
  submitLabel,
}: CreateRoomPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const formId = useId();
  const [actionLabel, entityLabel] = addLabel.split(/\s+/, 2);

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start xl:items-center xl:justify-end">
        {children}
        <button
          aria-controls={formId}
          aria-expanded={isOpen}
          className={buttonClassName({
            className:
              "w-full cursor-pointer whitespace-normal text-center leading-tight sm:flex sm:h-24 sm:min-w-32 sm:w-auto sm:flex-col sm:justify-center sm:px-5",
          })}
          onClick={() => setIsOpen((current) => !current)}
          type="button"
        >
          <span className="inline-flex flex-col items-center justify-center gap-1 sm:gap-0.5">
            <PlusIcon aria-hidden="true" size={20} weight="bold" />
            <span>{actionLabel}</span>
            <span>{entityLabel}</span>
          </span>
        </button>
      </div>
      {isOpen ? (
        <Card
          className="w-full p-5 xl:col-span-2 xl:justify-self-stretch"
          id={formId}
        >
          <RoomForm action={action} submitLabel={submitLabel} />
        </Card>
      ) : null}
    </>
  );
}
