/**
 * Merges new data from backend with existing UI data.
 * Preserves all properties starting with underscore (_) from the existing data,
 * UNLESS those properties are explicitly provided in newData (which takes precedence).
 *
 * @param existingData - Current data in the store (may contain UI properties like _expanded, _selectedType)
 * @param newData - New data from backend (contains updated values but no UI properties)
 * @returns Merged object with UI properties preserved, but newData takes precedence
 */
export function preserveUIData<T extends Record<string, any>>(
  existingData: T | undefined,
  newData: T,
): T {
  if (!existingData) {
    return newData;
  }

  // Extract UI properties (those starting with _) from existing data
  // but only if they're NOT present in newData
  const uiProps: Record<string, any> = {};
  Object.keys(existingData).forEach((key) => {
    if (key.startsWith("_") && !(key in newData)) {
      uiProps[key] = existingData[key];
    }
  });

  // Merge: UI properties first, then new data (so new data takes precedence)
  return {
    ...uiProps,
    ...newData,
  };
}
