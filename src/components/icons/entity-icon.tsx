import { createElement, type ComponentType } from "react";
import { ArchiveIcon } from "@phosphor-icons/react/dist/ssr/Archive";
import { ArmchairIcon } from "@phosphor-icons/react/dist/ssr/Armchair";
import { BabyIcon } from "@phosphor-icons/react/dist/ssr/Baby";
import { BasketIcon } from "@phosphor-icons/react/dist/ssr/Basket";
import { BathtubIcon } from "@phosphor-icons/react/dist/ssr/Bathtub";
import { BedIcon } from "@phosphor-icons/react/dist/ssr/Bed";
import { BooksIcon } from "@phosphor-icons/react/dist/ssr/Books";
import { BowlFoodIcon } from "@phosphor-icons/react/dist/ssr/BowlFood";
import { BriefcaseIcon } from "@phosphor-icons/react/dist/ssr/Briefcase";
import { CircuitryIcon } from "@phosphor-icons/react/dist/ssr/Circuitry";
import { CoatHangerIcon } from "@phosphor-icons/react/dist/ssr/CoatHanger";
import { CookingPotIcon } from "@phosphor-icons/react/dist/ssr/CookingPot";
import { CubeIcon } from "@phosphor-icons/react/dist/ssr/Cube";
import { DeskIcon } from "@phosphor-icons/react/dist/ssr/Desk";
import { DoorOpenIcon } from "@phosphor-icons/react/dist/ssr/DoorOpen";
import { DresserIcon } from "@phosphor-icons/react/dist/ssr/Dresser";
import { FileTextIcon } from "@phosphor-icons/react/dist/ssr/FileText";
import { GarageIcon } from "@phosphor-icons/react/dist/ssr/Garage";
import { HammerIcon } from "@phosphor-icons/react/dist/ssr/Hammer";
import { HouseIcon } from "@phosphor-icons/react/dist/ssr/House";
import { PackageIcon } from "@phosphor-icons/react/dist/ssr/Package";
import { PillIcon } from "@phosphor-icons/react/dist/ssr/Pill";
import { QuestionIcon } from "@phosphor-icons/react/dist/ssr/Question";
import { SquaresFourIcon } from "@phosphor-icons/react/dist/ssr/SquaresFour";
import { TrayIcon } from "@phosphor-icons/react/dist/ssr/Tray";
import { TreeIcon } from "@phosphor-icons/react/dist/ssr/Tree";
import { WarehouseIcon } from "@phosphor-icons/react/dist/ssr/Warehouse";
import {
  normalizeEntityIconKey,
  type EntityIconGroup,
} from "@/lib/icons/entity-icon-validation";
import type { EntityIconKey } from "@/lib/icons/entity-icon-definitions";

type IconWeight = "thin" | "light" | "regular" | "bold" | "fill" | "duotone";

type PhosphorIcon = ComponentType<{
  "aria-hidden"?: boolean | "true";
  className?: string;
  size?: number;
  weight?: IconWeight;
}>;

type EntityIconProps = {
  className?: string;
  group?: EntityIconGroup;
  iconKey?: string | null;
  size?: number;
  weight?: IconWeight;
};

const iconComponents: Record<EntityIconKey, PhosphorIcon> = {
  balcony: TreeIcon,
  basement: WarehouseIcon,
  bathroom: BathtubIcon,
  bedroom: BedIcon,
  books: BooksIcon,
  box: BasketIcon,
  "child-room": BabyIcon,
  clothing: CoatHangerIcon,
  cube: CubeIcon,
  documents: FileTextIcon,
  drawer: DresserIcon,
  dresser: DresserIcon,
  electronics: CircuitryIcon,
  food: BowlFoodIcon,
  garage: GarageIcon,
  generic: SquaresFourIcon,
  hallway: DoorOpenIcon,
  kitchen: CookingPotIcon,
  "living-room": ArmchairIcon,
  medicine: PillIcon,
  office: DeskIcon,
  other: QuestionIcon,
  package: PackageIcon,
  position: TrayIcon,
  room: HouseIcon,
  shelf: ArchiveIcon,
  "spare-parts": CubeIcon,
  storage: ArchiveIcon,
  tools: HammerIcon,
  wardrobe: BriefcaseIcon,
};

export function getEntityIconComponent(
  iconKey: string | null | undefined,
  group: EntityIconGroup = "generic",
) {
  const normalizedKey = normalizeEntityIconKey(iconKey, group);

  return iconComponents[normalizedKey];
}

export function EntityIcon({
  className,
  group = "generic",
  iconKey,
  size = 20,
  weight = "regular",
}: EntityIconProps) {
  const Icon = getEntityIconComponent(iconKey, group);

  return createElement(Icon, {
    "aria-hidden": "true",
    className,
    size,
    weight,
  });
}
