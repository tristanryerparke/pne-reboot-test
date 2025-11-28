import OutputRenderer from "./output-renderer";
import OutputMenu from "./output-menu";
import { Resizable } from "re-resizable";
import { Grip } from "lucide-react";
import type {
  FrontendFieldDataWrapper,
  ImageData,
  BaseDataTypes,
} from "../../../types/types";

// Type guard for ImageData
function isImageData(value: BaseDataTypes | null): value is ImageData {
  return (
    value !== null &&
    typeof value === "object" &&
    "cache_ref" in value &&
    "thumb_base64" in value
  );
}

const CustomHandle = () => (
  <div className="bg-transparent rounded-sm h-full w-full p-0 flex items-center justify-center opacity-30 transition-opacity duration-200 hover:opacity-60">
    <Grip className="h-3 w-3 text-gray-500" />
  </div>
);

interface OutputDisplayProps {
  fieldData: FrontendFieldDataWrapper;
  path: (string | number)[];
}

export default function OutputDisplay({ fieldData, path }: OutputDisplayProps) {
  const fieldName = path[path.length - 1];

  // Check if this type has a preview area
  const hasPreview = "preview" in fieldData;

  // Check if image data has been uploaded (for conditional menu display)
  const hasImageData = hasPreview && isImageData(fieldData.value);

  // Show preview only if enabled
  const showPreview = fieldData._showPreview ?? false;

  // Show menu if has image data
  const shouldShowMenu = hasImageData;

  return (
    <div className="w-full">
      <div className="flex w-full gap-0.5 items-center justify-end">
        <div className="flex w-full items-center gap-1 h-8">
          <span className="shrink-0">{fieldName}</span>
          <span className="shrink-0">:</span>
          <div className="flex-1">
            <OutputRenderer outputData={fieldData} />
          </div>
        </div>
        {shouldShowMenu && <OutputMenu path={path} fieldData={fieldData} />}
      </div>
      {/* Expandable preview area for special types */}
      {hasPreview &&
        showPreview &&
        hasImageData &&
        isImageData(fieldData.value) && (
          <div className="pb-2">
            {fieldData.value.thumb_base64 && (
              <div className="flex flex-col gap-1">
                <Resizable
                  defaultSize={{
                    width: 280,
                    height: 280,
                  }}
                  minHeight={280}
                  minWidth={280}
                  maxHeight={600}
                  maxWidth={600}
                  lockAspectRatio={false}
                  enable={{
                    top: false,
                    right: false,
                    bottom: false,
                    left: false,
                    topRight: false,
                    bottomRight: true,
                    bottomLeft: false,
                    topLeft: false,
                  }}
                  handleComponent={{
                    bottomRight: <CustomHandle />,
                  }}
                  handleStyles={{
                    bottomRight: {
                      bottom: "0px",
                      right: "0px",
                      width: "16px",
                      height: "16px",
                    },
                  }}
                  className="nodrag rounded border border-input flex items-center justify-center bg-transparent"
                >
                  <img
                    src={`data:image/png;base64,${fieldData.value.thumb_base64}`}
                    alt="Output preview"
                    className="max-w-full max-h-full object-contain rounded"
                  />
                </Resizable>
                <div className="text-xs text-muted-foreground">
                  {fieldData.value.width} × {fieldData.value.height} (
                  {fieldData.value.mode})
                </div>
              </div>
            )}
          </div>
        )}
    </div>
  );
}
