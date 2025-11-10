import SingleLineTextDisplay from "./single-line-text-display";

interface UserModelDisplayProps {
  inputData: any;
  path: (string | number)[];
}

export default function UserModelDisplay({ inputData }: UserModelDisplayProps) {
  const formatValue = () => {
    if (!inputData?.value || typeof inputData.value !== "object") {
      return inputData?.type || "Unknown";
    }

    const typeName = inputData.type || "Object";
    const fields = Object.entries(inputData.value)
      .map(([key, value]) => `${key}=${value}`)
      .join(", ");

    return `${typeName}(${fields})`;
  };

  return <SingleLineTextDisplay content={formatValue()} dimmed={!inputData?.value} />;
}
