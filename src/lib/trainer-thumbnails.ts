import anishaThumb from "@/assets/images/001-1_Anisha-1-e1590837044475.jpg";
import atulanThumb from "@/assets/images/002-Atulan-Image-1.jpg";
import mrigakshiThumb from "@/assets/images/007-Mrigakshi-Image-2.jpg";
import pranjaliThumb from "@/assets/images/008-Pranjali-Image-1.jpg";
import pushyankThumb from "@/assets/images/009-Pushyank-Nahar-1.jpeg";
import reshmaThumb from "@/assets/images/010-Reshma-Image-3.jpg";
import richardThumb from "@/assets/images/011-Richard-Image-3.jpg";
import rohanThumb from "@/assets/images/012-Rohan-Image-3.jpg";
import saniyaThumb from "@/assets/images/013-Saniya-Image-1.jpg";
import shrutiKulkarniThumb from "@/assets/images/Shruti-Kulkarni.jpeg";
import vivaranThumb from "@/assets/images/015-Vivaran-Image-4.jpg";
import anmolThumb from "@/assets/images/Anmol.jpeg";
import bretThumb from "@/assets/images/Bret.jpeg";
import raunakThumb from "@/assets/images/Raunak.jpeg";
import simonelleThumb from "@/assets/images/Simonelle.jpeg";
import simranThumb from "@/assets/images/Simran.jpeg";
import sovenaThumb from "@/assets/images/Sovena.jpeg";
import veenaThumb from "@/assets/images/Veena.jpeg";

const TRAINER_THUMBNAILS: Array<[string, string]> = [
  ["shruti kulkarni", shrutiKulkarniThumb],
  ["simonelle", simonelleThumb],
  ["pushyank", pushyankThumb],
  ["mrigakshi", mrigakshiThumb],
  ["pranjali", pranjaliThumb],
  ["richard", richardThumb],
  ["reshma", reshmaThumb],
  ["anisha", anishaThumb],
  ["atulan", atulanThumb],
  ["rohan", rohanThumb],
  ["saniya", saniyaThumb],
  ["vivaran", vivaranThumb],
  ["anmol", anmolThumb],
  ["raunak", raunakThumb],
  ["simran", simranThumb],
  ["sovena", sovenaThumb],
  ["veena", veenaThumb],
  ["bret", bretThumb],
];

function normalizeTrainerName(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function trainerImageForName(name?: string | null): string | null {
  const normalized = normalizeTrainerName(name ?? "");
  if (!normalized) return null;
  return (
    TRAINER_THUMBNAILS.find(
      ([trainerName]) => normalized.includes(trainerName) || trainerName.includes(normalized),
    )?.[1] ?? null
  );
}
