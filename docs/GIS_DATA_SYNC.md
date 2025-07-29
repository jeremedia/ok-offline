# GIS Data Synchronization

## Overview
The OK-OFFLINE project uses official Burning Man GIS data from the [burningmantech/innovate-GIS-data](https://github.com/burningmantech/innovate-GIS-data) repository. This data is integrated as a git submodule to ensure we always have the latest updates.

## Setup
The GIS data is configured as a git submodule located at:
```
public/data/gis-submodule/
```

Each year's GIS data is then symlinked to the appropriate year directory:
```
public/data/2025/gis -> ../gis-submodule/2025/GeoJSON
```

## Available GIS Files (2025)
- `city_blocks.geojson` - City block boundaries
- `cpns.geojson` - Civic Playa Network (reference points)
- `plazas.geojson` - Plaza boundaries
- `street_lines.geojson` - Street centerlines
- `street_outlines.geojson` - Street boundaries
- `toilets.geojson` - Toilet/restroom locations (45 locations)
- `trash_fence.geojson` - Perimeter fence

## Updating GIS Data

To get the latest GIS data updates:

```bash
# Update the submodule to latest commit
cd public/data/gis-submodule
git pull origin master

# Go back to main project
cd ../../..
git add public/data/gis-submodule
git commit -m "Update GIS data submodule to latest"
```

## Initial Setup (for new clones)

When cloning the repository for the first time:

```bash
# Clone with submodules
git clone --recurse-submodules https://github.com/jeremedia/ok-offline.git

# Or if already cloned without submodules
git submodule update --init --recursive
```

## Notes
- The official GIS repository is maintained by Burning Man and updates throughout the year
- New data files may be added (e.g., toilets.geojson was added on July 28, 2025)
- Always check for new files when updating the submodule
- The symlink structure allows easy year-based data organization