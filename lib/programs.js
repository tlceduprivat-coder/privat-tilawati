// Master Data Program & Tarif Privat Tilawati
// Sumber: Ketentuan Administrasi Infaq Fiisabilillah

export const PROGRAMS = [
  // Offline
  { id: 'offline-mandiri', nama: 'Kelas Mandiri (Offline)', kategori: 'Offline', tarif: 85000, durasi: '1 Jam', kapasitas: '1 orang', desc: 'Privat 1 santri di rumah' },
  { id: 'offline-mentoring', nama: 'Kelas Mentoring (Offline)', kategori: 'Offline', tarif: 150000, durasi: '1 Jam', kapasitas: '2-4 orang', desc: 'Kelompok kecil 2-4 santri' },
  { id: 'offline-talim', nama: "Kelas Ta'lim (Offline)", kategori: 'Offline', tarif: 200000, durasi: '1 Jam', kapasitas: '7-10 orang', desc: 'Kelas Ta\'lim 7-10 santri' },
  { id: 'offline-madrosah', nama: 'Kelas Madrosah (Offline)', kategori: 'Offline', tarif: 0, durasi: 'Disesuaikan', kapasitas: 'Disesuaikan', desc: 'Tarif disesuaikan dengan kesanggupan' },
  { id: 'offline-guru', nama: 'Kelas Guru/Instansi (Offline)', kategori: 'Offline', tarif: 250000, durasi: '2 Jam', kapasitas: '7-10 orang', desc: 'Untuk guru atau instansi' },
  { id: 'tilawati-office', nama: 'Tilawati Goes To Office', kategori: 'Corporate', tarif: 250000, durasi: '2 Jam', kapasitas: '7-10 orang', desc: 'Ustadz datang ke kantor Anda' },
  { id: 'reguler-tempat', nama: 'Kelas Reguler (Di Tempat Kami)', kategori: 'Offline', tarif: 150000, durasi: '1 Jam', kapasitas: '2-4 orang', desc: 'Belajar di lokasi Privat Tilawati' },
  // Online
  { id: 'online-mandiri', nama: 'Kelas Mandiri (Online)', kategori: 'Online', tarif: 50000, durasi: '45 Menit', kapasitas: '1 orang', desc: 'Privat 1 santri via Zoom/Meet' },
  { id: 'online-mentoring', nama: 'Kelas Mentoring (Online)', kategori: 'Online', tarif: 75000, durasi: '1 Jam', kapasitas: '2-3 orang', desc: 'Kelompok 2-3 santri via Zoom/Meet' },
  // Munaqosyah
  { id: 'munaqosyah-1-4', nama: 'Munaqosyah Jilid 1-4 (Online)', kategori: 'Munaqosyah', tarif: 35000, durasi: 'Sekali test', kapasitas: '-', desc: 'Munaqosyah Jilid 1-4 + sertifikat digital' },
  { id: 'munaqosyah-5-offline', nama: 'Munaqosyah Jilid 5 (Offline)', kategori: 'Munaqosyah', tarif: 100000, durasi: 'Sekali test', kapasitas: '-', desc: 'Munaqosyah Jilid 5 offline + sertifikat' },
  { id: 'munaqosyah-5-online', nama: 'Munaqosyah Jilid 5 (Online)', kategori: 'Munaqosyah', tarif: 75000, durasi: 'Sekali test', kapasitas: '-', desc: 'Munaqosyah Jilid 5 online + sertifikat' },
];

export const PROGRAM_NAMES = PROGRAMS.map(p => p.nama);

export const getProgramByName = (nama) => PROGRAMS.find(p => p.nama === nama);

export const formatRupiah = (n) => 'Rp ' + (Number(n) || 0).toLocaleString('id-ID');
