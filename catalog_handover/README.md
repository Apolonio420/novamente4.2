# Novamente Catalog Handover Package

This package contains all the scraped product data and generated assets ready for import into the new Antigravity system.

## Directory Structure

```
catalog_handover/
├── catalog.json          # Structured product database (JSON format)
├── assets/
│   ├── mockups/          # Generated Mockups (Black & White, Flat Lay)
│   └── lifestyle/        # Generated Lifestyle Shots (Urban, Studio, Nature)
└── README.md             # This file
```

## Data Format (catalog.json)

The `catalog.json` file contains an array of product objects:

```json
[
  {
    "name": "Remera Crop De Mujer",
    "url": "https://...",
    "base_image": "https://...",
    "variants": [
      {
        "id": "123456",
        "price": 15000,
        "size": "S",
        "color": "Negro",
        "print_type": "1 ESTAMPA"
      }
    ]
  }
]
```

## Assets

- **Mockups**: High-quality "Ghost/Flat Lay" style mockups in Black and White.
- **Lifestyle**: Editorial shots in various settings (Urban, Studio, Nature).

Use these assets to populate the product gallery.
