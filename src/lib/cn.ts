import { twMerge, type ClassNameValue } from 'tailwind-merge';

/** Joins class names; when two classes set the same property, the later one wins. */
export function cn(...classes: ClassNameValue[]) {
  return twMerge(classes);
}
