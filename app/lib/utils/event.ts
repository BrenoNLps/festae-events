import { Address } from "../types";

export function formatPrice(valor: number): string {
  if (!valor || valor === 0) return "Gratuito";
  return `R$ ${valor.toFixed(2).replace(".", ",")}`;
}

export function formatLocation(endereco: Address): string {
  return [endereco?.cidade, endereco?.estado].filter(Boolean).join(", ");
}
