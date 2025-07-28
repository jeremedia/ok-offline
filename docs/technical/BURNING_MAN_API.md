# Burning Man API Documentation

This document describes the data structures returned by the Burning Man Public API.

## API Endpoints

Base URL: `https://api.burningman.org/api/`

### Authentication
- Header: `X-API-Key: {your_api_key}`
- Request API key from: https://api.burningman.org/request

### Endpoints
- `GET /camp?year={year}` - Get all camps for a specific year
- `GET /art?year={year}` - Get all art installations for a specific year
- `GET /event?year={year}` - Get all events for a specific year

## Data Structures

### Camp Object

Example camp data structure:

```json
{
    "uid": "a1XVI000009sXeX2AU",
    "name": "42 Ramen",
    "year": 2025,
    "url": null,
    "contact_email": "aroundy3@gmail.com",
    "hometown": "Salt Lake City",
    "description": "We know the answer to the ultimate question. If you know it, come and tell us to claim your yummy prize.",
    "landmark": "Big red maze",
    "location": null,
    "location_string": null,
    "images": []
}
```

#### Camp Fields

- `uid` (string): Unique identifier for the camp
- `name` (string): Camp name
- `year` (number): Event year
- `url` (string|null): Camp website URL
- `contact_email` (string): Contact email address
- `hometown` (string): Camp's hometown/origin
- `description` (string): Camp description and activities
- `landmark` (string): Visual landmark to identify the camp
- `location` (object|null): Structured location data
  - `frontage` (string): Street frontage (e.g., "A", "B", "Center Camp Plaza")
  - `intersection` (string): Cross street (e.g., "3:00", "7:45")
  - `intersection_type` (string): Type of intersection ("&" or "@")
  - `dimensions` (string): Camp dimensions (e.g., "100 x 150")
  - `exact_location` (string): Detailed location description
- `location_string` (string|null): Human-readable location (e.g., "A & 3:00")
- `images` (array): Array of image URLs

### Example: Camp with Location

```json
{
    "uid": "a1XVI000001gQjt2AE",
    "name": "7 Sirens Cove",
    "year": 2024,
    "url": "http://www.7sirenscove.com",
    "contact_email": "starbuck@7sirenscove.com",
    "hometown": "Bay Area",
    "description": "A pirate bohemia since 2011 where merrymaking, mermaid lounging, dancing rhythms and mischief run aground. Beware, it is futile to resist the 7 Siren's call!",
    "landmark": "large pirate ship and trampoline in frontage",
    "location": {
        "frontage": "6:30",
        "intersection": "A",
        "intersection_type": "&",
        "dimensions": "150 x 200",
        "exact_location": "Corner - facing man & 2:00"
    },
    "location_string": "6:30 & A",
    "images": []
}
```

### Location Formats

Camps with location data typically include:
- Street addresses using clock positions (e.g., "3:00", "7:45")
- Frontage letters (A through L, with A being innermost)
- Special locations like "Center Camp Plaza" or portals

### Notes

- Not all camps have location data assigned
- The `uid` field is the most reliable identifier
- Years available: typically current year and previous years
- Data is cached locally using IndexedDB for offline access