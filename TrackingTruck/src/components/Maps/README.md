# Google Maps Integration

This module provides Google Maps integration with routing functionality for the CarTrack application.

## Components

### GoogleMaps
A comprehensive Google Maps component with the following features:
- Interactive map display
- Custom markers with info windows
- Route calculation and display
- Click event handling
- Loading states and error handling

### MapsPage
A complete page demonstrating the GoogleMaps component with:
- Location management (add/remove locations)
- Route visualization
- Interactive map controls
- Location list management

## Setup

1. The Google Maps API key is configured in `src/config/environment.ts`
2. Dependencies are already installed in `package.json`:
   - `@googlemaps/js-api-loader`
   - `@types/google.maps`

## Usage

### Basic Map Display
```tsx
import GoogleMaps from './components/Maps/GoogleMaps';

<GoogleMaps
  center={{ lat: -6.200000, lng: 106.816666 }}
  zoom={13}
  height="400px"
  locations={[
    {
      lat: -6.200000,
      lng: 106.816666,
      title: 'Jakarta',
      address: 'Jakarta, Indonesia'
    }
  ]}
/>
```

### Map with Routing
```tsx
import GoogleMaps from './components/Maps/GoogleMaps';

const routeOptions = {
  origin: { lat: -6.200000, lng: 106.816666, title: 'Start' },
  destination: { lat: -6.175110, lng: 106.865036, title: 'End' },
  waypoints: [
    { lat: -6.208763, lng: 106.845599, title: 'Waypoint' }
  ],
  travelMode: google.maps.TravelMode.DRIVING
};

<GoogleMaps
  showRoute={true}
  routeOptions={routeOptions}
  height="500px"
/>
```

## API Configuration

Make sure to set your Google Maps API key in the environment:

```bash
VITE_GOOGLE_MAPS_API_KEY=your_api_key_here
```

Or it will fallback to the default key: `AIzaSyD7F5Hp142kNUwP2vr8dVsqGDZ6vrZ73Vs`

## Features

- **Interactive Maps**: Click to add locations, drag to move map
- **Route Planning**: Calculate routes between multiple points
- **Marker Management**: Add/remove custom markers with info windows
- **Real-time Updates**: Dynamic route calculation and display
- **Responsive Design**: Mobile-friendly interface
- **Error Handling**: Graceful handling of API errors

## Navigation

Access the Maps page through:
- URL: `/maps`
- Navigation: Header menu "Maps" link