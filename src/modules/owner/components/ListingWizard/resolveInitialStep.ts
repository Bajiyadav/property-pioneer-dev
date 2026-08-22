/**
 * Decides which wizard step a fresh mount opens on.
 *
 * Extracted from ListingWizard so the rule can be tested against the shipped
 * implementation. The previous test re-declared this logic inline, so it passed
 * whatever the component actually did.
 *
 * THE INVARIANT
 *
 * Only explicit navigation intent may skip Step 1 — the search params carried by
 * /list-property/wizard when the owner picked a city and locality on the home
 * page. A saved draft must NEVER move the step. A draft persists in
 * localStorage across sessions and across listings, so honouring it would mean
 * that once an owner had ever entered a city, every later listing would open on
 * Step 2 and silently inherit the previous property's location.
 *
 * The two are kept apart by input, not by convention: this function is only ever
 * given the URL-derived data, and never reads storage.
 */
export interface WizardEntryParams {
  propertyType?: "Residential" | "Commercial";
  intent?: "Rent" | "Sell" | "PG/Co-living";
  city?: string;
  locality?: string;
  prefilled?: boolean;
  step?: number;
}

export const FIRST_STEP = 1;
export const DETAILS_STEP = 2;

/** True when the caller supplied a complete location up front. */
export function hasPrefilledLocation(params?: WizardEntryParams): boolean {
  return Boolean(
    params?.prefilled || params?.step === DETAILS_STEP || (params?.city && params?.locality),
  );
}

/**
 * @param params URL search params only. Passing a stored draft here would
 *               reintroduce the cross-listing step leak described above.
 */
export function resolveInitialStep(params?: WizardEntryParams): number {
  return params?.step ?? (hasPrefilledLocation(params) ? DETAILS_STEP : FIRST_STEP);
}
