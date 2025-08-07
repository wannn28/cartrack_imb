# Google Directions API Integration

## Overview
Fitur ini mengintegrasikan Google Directions API untuk membuat rute yang mengikuti jalan raya seperti Gojek dan Cartrack, bukan hanya garis lurus antara titik-titik koordinat.

## Fitur Utama

### 1. Rute yang Mengikuti Jalan Raya
- Menggunakan Google Directions API untuk mendapatkan rute yang mengikuti jalan raya
- Rute akan mengikuti jalan yang sebenarnya, bukan garis lurus
- Mendukung multiple waypoints untuk rute yang kompleks

### 2. Informasi Jarak dan Durasi
- Menampilkan jarak total rute dalam kilometer
- Menampilkan estimasi durasi perjalanan
- Informasi ditampilkan di UI untuk setiap kendaraan

### 3. Fallback System
- Jika Google Directions API gagal, sistem akan menggunakan rute langsung (direct path)
- Memastikan aplikasi tetap berfungsi meskipun ada masalah dengan API

## Implementasi

### Service Layer (`src/services/directions.ts`)
```typescript
// Service untuk menghandle Google Directions API
class DirectionsService {
  async getDirections(origin, destination, waypoints?)
  async getOptimizedDirections(waypoints)
  async getRouteForPoints(points)
}
```

### Type Definitions
```typescript
interface RoutePath {
  path: Array<{ lat: number; lng: number }>;
  distance: number; // dalam meter
  duration: number; // dalam detik
}
```

### Component Updates
- `AllVehiclesMap.tsx`: Menggunakan Google Directions API untuk setiap kendaraan
- `GoogleMaps.tsx`: Menampilkan rute dari Google Directions API
- `types/google-maps.d.ts`: Menambahkan type untuk RoutePath

## Dependencies

### Package yang Diperlukan
```bash
npm install @mapbox/polyline
```

### Environment Variables
```env
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

## Cara Kerja

1. **Data Collection**: Mengumpulkan semua location logs untuk setiap kendaraan
2. **Route Processing**: Untuk setiap kendaraan:
   - Mengurutkan location logs berdasarkan timestamp
   - Mengkonversi ke format MapLocation
   - Memanggil Google Directions API dengan semua waypoints
3. **Route Display**: 
   - Jika API berhasil, menggunakan rute dari Google Directions
   - Jika gagal, menggunakan rute langsung sebagai fallback
4. **UI Updates**: Menampilkan informasi jarak dan durasi

## Error Handling

### API Errors
- Jika Google Directions API gagal, sistem akan menggunakan direct path
- Error akan di-log ke console untuk debugging
- UI akan tetap menampilkan rute meskipun ada error

### Network Issues
- Timeout handling untuk request API
- Retry mechanism (bisa ditambahkan di masa depan)
- Graceful degradation ke direct path

## Performance Considerations

### API Limits
- Google Directions API memiliki limit request per hari
- Implementasi caching bisa ditambahkan untuk menghemat API calls
- Batching requests untuk multiple vehicles

### Optimization
- Hanya memanggil API untuk kendaraan yang memiliki 2+ location points
- Menggunakan waypoints untuk mengurangi jumlah API calls
- Lazy loading untuk rute yang tidak terlihat

## Future Enhancements

### Planned Features
1. **Route Optimization**: Menggunakan optimize=true parameter untuk rute yang lebih efisien
2. **Caching**: Menyimpan hasil API calls untuk mengurangi request
3. **Real-time Updates**: Update rute secara real-time saat ada data baru
4. **Traffic Information**: Menampilkan informasi lalu lintas
5. **Alternative Routes**: Menampilkan beberapa alternatif rute

### Advanced Features
1. **Route History**: Menyimpan history rute untuk analisis
2. **Route Comparison**: Membandingkan rute antar waktu
3. **Custom Waypoints**: Menambahkan waypoint manual
4. **Route Sharing**: Berbagi rute dengan pengguna lain

## Troubleshooting

### Common Issues

1. **API Key Issues**
   - Pastikan API key valid dan memiliki akses ke Directions API
   - Cek billing dan quota di Google Cloud Console

2. **CORS Issues**
   - Google Directions API harus diakses dari domain yang diizinkan
   - Tambahkan domain ke Google Cloud Console

3. **Rate Limiting**
   - Monitor jumlah request per hari
   - Implementasi caching jika diperlukan

### Debug Information
- Semua API calls di-log ke console
- Error messages ditampilkan di UI
- Network tab browser untuk melihat request/response

## Testing

### Manual Testing
1. Buka halaman All Vehicles Map
2. Pastikan ada data location logs
3. Cek console untuk log API calls
4. Verifikasi rute mengikuti jalan raya
5. Cek informasi jarak dan durasi

### Automated Testing
- Unit tests untuk DirectionsService
- Integration tests untuk API calls
- E2E tests untuk UI flow

## Security Considerations

### API Key Security
- Jangan expose API key di client-side code
- Gunakan environment variables
- Implementasi rate limiting di server-side

### Data Privacy
- Location data harus di-handle dengan aman
- Implementasi data retention policies
- Compliance dengan GDPR/CCPA jika diperlukan
