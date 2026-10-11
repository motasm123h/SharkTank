import type { CountryCode, CurrencyCode, Locale } from "@/domain";

/** ISO 3166-1 alpha-2 codes. Names are never hard-coded: Intl.DisplayNames localizes them. */
export const COUNTRY_CODES: readonly CountryCode[] = (
  "AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR " +
  "BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ " +
  "EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW " +
  "GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY " +
  "KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV " +
  "MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY " +
  "QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG " +
  "TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW"
).split(" ");

/**
 * Local currency per country, used to pre-fill the budget currency. The user can
 * always change it (e.g. many Syrian businesses budget in USD). Unlisted → USD.
 */
const LOCAL_CURRENCY: Partial<Record<CountryCode, CurrencyCode>> = {
  AE: "AED",
  AR: "ARS",
  AU: "AUD",
  BD: "BDT",
  BH: "BHD",
  BR: "BRL",
  CA: "CAD",
  CH: "CHF",
  CN: "CNY",
  CO: "COP",
  DZ: "DZD",
  EG: "EGP",
  ET: "ETB",
  GB: "GBP",
  GH: "GHS",
  ID: "IDR",
  IL: "ILS",
  IN: "INR",
  IQ: "IQD",
  IR: "IRR",
  JO: "JOD",
  JP: "JPY",
  KE: "KES",
  KR: "KRW",
  KW: "KWD",
  LB: "LBP",
  LK: "LKR",
  LY: "LYD",
  MA: "MAD",
  MX: "MXN",
  MY: "MYR",
  NG: "NGN",
  NP: "NPR",
  NZ: "NZD",
  OM: "OMR",
  PH: "PHP",
  PK: "PKR",
  PL: "PLN",
  PS: "ILS",
  QA: "QAR",
  RU: "RUB",
  SA: "SAR",
  SD: "SDG",
  SE: "SEK",
  SG: "SGD",
  SY: "SYP",
  TH: "THB",
  TN: "TND",
  TR: "TRY",
  TW: "TWD",
  TZ: "TZS",
  UA: "UAH",
  UG: "UGX",
  US: "USD",
  VN: "VND",
  YE: "YER",
  ZA: "ZAR",
  // Eurozone
  AT: "EUR",
  BE: "EUR",
  CY: "EUR",
  DE: "EUR",
  EE: "EUR",
  ES: "EUR",
  FI: "EUR",
  FR: "EUR",
  GR: "EUR",
  HR: "EUR",
  IE: "EUR",
  IT: "EUR",
  LT: "EUR",
  LU: "EUR",
  LV: "EUR",
  MT: "EUR",
  NL: "EUR",
  PT: "EUR",
  SI: "EUR",
  SK: "EUR",
};

export function defaultCurrencyFor(country: CountryCode | undefined): CurrencyCode {
  return (country && LOCAL_CURRENCY[country]) || "USD";
}

export type Option = { value: string; label: string };

/** Countries sorted by their name in `locale`. */
export function countryOptions(locale: Locale): Option[] {
  const names = new Intl.DisplayNames([locale], { type: "region" });
  const collator = new Intl.Collator(locale);
  return COUNTRY_CODES.map((code) => ({ value: code, label: names.of(code) ?? code }))
    .filter((o) => o.label !== o.value)
    .sort((a, b) => collator.compare(a.label, b.label));
}

/** Codes Intl lists that nobody budgets in: accounting units and retired currencies. */
const NOT_SPENDABLE = new Set(["XDR", "XSU", "XUA", "CUC", "HRK", "SLL", "ZWL"]);

/** Common currencies first, then the rest by code. */
export function currencyOptions(locale: Locale): Option[] {
  const names = new Intl.DisplayNames([locale], { type: "currency" });
  const common = ["USD", "EUR", ...new Set(Object.values(LOCAL_CURRENCY))].filter(
    (c, i, all) => all.indexOf(c) === i,
  ) as string[];
  const all = Intl.supportedValuesOf("currency").filter((c) => !NOT_SPENDABLE.has(c));
  const ordered = [...common, ...all.filter((c) => !common.includes(c))];
  return ordered.map((code) => ({ value: code, label: `${code} · ${names.of(code) ?? code}` }));
}
