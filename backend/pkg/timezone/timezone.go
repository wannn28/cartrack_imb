package timezone

import (
	"fmt"
	"time"
)

// JakartaLocation adalah variabel global yang menyimpan objek time.Location untuk Asia/Jakarta.
// Variabel ini harus diinisialisasi sekali saat startup aplikasi.
var JakartaLocation *time.Location

// InitTimezone menginisialisasi variabel global JakartaLocation.
// Fungsi ini harus dipanggil sekali di awal program (misalnya di main).
func InitTimezone() error {
	loc, err := time.LoadLocation("Asia/Jakarta")
	if err != nil {
		return fmt.Errorf("gagal memuat lokasi Asia/Jakarta: %w", err)
	}
	JakartaLocation = loc
	return nil
}
