from fastapi import APIRouter, HTTPException

from app.large_data.base import CachedDataModel
from app.schema_base import CamelBaseModel

router = APIRouter()


class LargeDataUpload(CamelBaseModel):
    """Generic upload payload for any large data type"""

    type: str  # Discriminator: "CachedImage", "CachedDataFrame", etc.
    filename: str
    data: dict  # Type-specific data (e.g., {"img_base64": "..."})


@router.post("/upload_large_data")
async def upload_large_data(upload: LargeDataUpload):
    """
    Universal endpoint for uploading large data of any registered cached type.

    Uses server.TYPES to look up the cached type class.
    Each class's deserialize_full() method parses its specific format.
    """
    from app.server import TYPES

    try:
        # Look up the cached type in TYPES dictionary
        if upload.type not in TYPES:
            raise HTTPException(status_code=400, detail=f"Unknown type: {upload.type}")

        type_info = TYPES[upload.type]

        # Verify it's a cached type
        if type_info.get("kind") != "cached":
            raise HTTPException(
                status_code=400,
                detail=f"Type {upload.type} is not a cached type. "
                f"Kind: {type_info.get('kind')}",
            )

        # Get the class from the type info
        # Check for referenced_datamodel first (for third-party types like PIL.Image.Image)
        if "referenced_datamodel" in type_info:
            cached_data_class = type_info["referenced_datamodel"]
        else:
            cached_data_class = type_info["_class"]

        # Verify it's a CachedDataModel subclass
        if not issubclass(cached_data_class, CachedDataModel):
            raise HTTPException(
                status_code=500,
                detail=f"Type {upload.type} class is not a CachedDataModel subclass",
            )

        # Prepare full data dict for deserialization
        full_data = {
            "type": upload.type,
            "filename": upload.filename,
            **upload.data,
        }

        # Deserialize using the class-specific method
        instance = cached_data_class.deserialize_full(full_data)

        # Return serialized dict with all computed fields included
        return instance.model_dump()

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to process {upload.type}: {str(e)}"
        )
