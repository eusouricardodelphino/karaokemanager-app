import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formata um número de telefone enquanto o usuário digita: 9XXXX-XXXX ou XXXX-XXXX.
 * Aceita apenas dígitos; retorna o valor formatado com no máximo 9 dígitos.
 */
export function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 9);
  if (digits.length <= 4) return digits;
  if (digits.length <= 8) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

/** Extrai apenas os dígitos do valor (máx. 14 para CNPJ). */
export function cnpjDigits(value: string): string {
  return value.replace(/\D/g, "").slice(0, 14);
}

/**
 * Formata uma string como CNPJ enquanto o usuário digita: XX.XXX.XXX/XXXX-XX.
 * Aceita apenas dígitos; retorna o valor formatado com no máximo 14 dígitos.
 */
export function formatCnpj(value: string): string {
  const digits = cnpjDigits(value);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`;
}
