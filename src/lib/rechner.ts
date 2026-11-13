// Förderrechner (Arbeitgebersicht): stellt die Sozialabgaben-Ersparnis des Arbeitgebers
// dem Arbeitgeberzuschuss gegenüber. Bewusst vereinfachte Beispielrechnung – alle
// Jahreswerte kommen aus src/data/rechenwerte.json.
import werte from '../data/rechenwerte.json';

export interface Eingabe {
  mitarbeitende: number;
  gehalt: number; // Ø Bruttogehalt pro Monat
  umwandlung: number; // Ø Entgeltumwandlung pro Monat
  zuschussProzent: number; // Arbeitgeberzuschuss in % der Umwandlung
}

export interface Ergebnis {
  ersparnisMonat: number;
  zuschussMonat: number;
  saldoMonat: number;
  ersparnisJahr: number;
  zuschussJahr: number;
  saldoJahr: number;
  kostenneutralBisProzent: number;
  ersparnisQuote: number; // Ersparnis in % der Umwandlung
}

/** Höchstbetrag der sozialabgabenfreien Entgeltumwandlung pro Monat (4 % der BBG RV). */
export const maxUmwandlung = Math.round(werte.bbgRvMonat * werte.svFreiAnteilBbg);

// Ersparnis in einem Versicherungszweig: nur der Teil der Umwandlung zählt, der das
// beitragspflichtige Entgelt unter der jeweiligen Bemessungsgrenze tatsächlich senkt.
function ersparnisJeZweig(gehalt: number, umwandlung: number, grenze: number, satz: number) {
  const vorher = Math.min(gehalt, grenze);
  const nachher = Math.min(Math.max(gehalt - umwandlung, 0), grenze);
  return (vorher - nachher) * satz;
}

export function berechne(e: Eingabe): Ergebnis {
  const umwandlung = Math.min(e.umwandlung, maxUmwandlung);
  const proKopf =
    ersparnisJeZweig(e.gehalt, umwandlung, werte.bbgRvMonat, werte.agSatzRvAv) +
    ersparnisJeZweig(e.gehalt, umwandlung, werte.bbgKvMonat, werte.agSatzKvPv);

  const ersparnisMonat = proKopf * e.mitarbeitende;
  const zuschussMonat = umwandlung * (e.zuschussProzent / 100) * e.mitarbeitende;
  const saldoMonat = ersparnisMonat - zuschussMonat;
  const ersparnisQuote = umwandlung > 0 ? (proKopf / umwandlung) * 100 : 0;

  return {
    ersparnisMonat,
    zuschussMonat,
    saldoMonat,
    ersparnisJahr: ersparnisMonat * 12,
    zuschussJahr: zuschussMonat * 12,
    saldoJahr: saldoMonat * 12,
    kostenneutralBisProzent: Math.floor(ersparnisQuote),
    ersparnisQuote,
  };
}
