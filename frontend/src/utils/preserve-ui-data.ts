/**
 * Recursively merges new data from backend with existing UI data.
 * Preserves all properties starting with underscore (_) from the existing data,
 * UNLESS those properties are explicitly provided in newData (which takes precedence).
 * For nested objects, recursively merges to preserve UI data at all levels.
 *
 * @param existingData - Current data in the store (may contain UI properties like _expanded, _selectedType)
 * @param newData - New data from backend (contains updated values but no UI properties)
 * @returns Merged object with UI properties preserved at all levels, but newData takes precedence
 */
export function preserveUIData<T extends Record<string, any>>(
  existingData: T | undefined,
  newData: T,
): T {
  if (!existingData) {
    return newData;
  }

  // Start with all existing data to preserve properties not in the update
  const merged: Record<string, any> = { ...existingData };

  Object.keys(newData).forEach((key) => {
    const newValue = newData[key];
    const existingValue = existingData[key];

    // If both values are plain objects, recursively merge them
    if (
      newValue &&
      typeof newValue === "object" &&
      !Array.isArray(newValue) &&
      existingValue &&
      typeof existingValue === "object" &&
      !Array.isArray(existingValue)
    ) {
      merged[key] = preserveUIData(existingValue, newValue);
    } else {
      // Otherwise, use the new value
      merged[key] = newValue;
    }
  });

  return merged as T;
}
