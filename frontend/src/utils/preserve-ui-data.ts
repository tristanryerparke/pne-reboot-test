/**
 * Merges new data from backend with existing UI data.
 * Preserves all properties starting with underscore (_) from the existing data.
 *
 * @param existingData - Current data in the store (may contain UI properties like _expanded, _selectedType)
 * @param newData - New data from backend (contains updated values but no UI properties)
 * @returns Merged object with UI properties preserved
 */
export function preserveUIData<T extends Record<string, any>>(
  existingData: T | undefined,
  newData: T
): T {
  if (!existingData) {
    return newData;
  }

  // Extract all UI properties (those starting with _) from existing data
  const uiProps: Record<string, any> = {};
  Object.keys(existingData).forEach((key) => {
    if (key.startsWith("_")) {
      uiProps[key] = existingData[key];
    }
  });

  // Merge: new data + preserved UI properties
  return {
    ...newData,
    ...uiProps,
  };
}
