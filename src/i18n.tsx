import { createContext, useContext, useState, type ReactNode } from 'react'

const en = {
  nav_app: 'Open the app', nav_how: 'How it works', nav_proof: 'Proof', nav_verify: 'Verify a receipt', nav_android: 'Android',
  hero_kicker: 'Cleaner, scanner and vault in one tap',
  hero_title: 'Your phone is cluttered. Clearwarden shows you what to throw out, and proves it did.',
  hero_sub: 'Sweep junk folders, catch disguised files, lock private photos behind your fingerprint, and test your connection. Every run leaves a receipt on Solana, so nobody has to take a cleaner app on faith again.',
  hero_cta: 'Run a checkup', hero_cta2: 'See what a receipt looks like',
  ring_idle: 'Tap to check', ring_run: 'Checking', ring_done: 'Done',
  how_title: 'Three buttons. One ring above them.',
  how_sub: 'Tap the ring and Clean, Scan and Boost run back to back. Or open any of them on its own.',
  clean: 'Clean', scan: 'Scan', boost: 'Boost',
  clean_d: 'Clears this app’s caches and walks any folder you pick for temp files, leftovers and old installers.',
  scan_d: 'Hashes every file you hand it, checks known-bad lists, and flags programs dressed up as photos or PDFs.',
  boost_d: 'Reads memory, storage, battery and network, then tells you what is actually slowing the device down.',
  adv_title: 'Advanced tools',
  t_sweep: 'Folder sweep', t_sweep_d: 'Junk, WhatsApp media, APK installers, files over 50 MB. You review, then delete.',
  t_dupes: 'Duplicate photos', t_dupes_d: 'Finds near-identical pictures, even resized or recompressed copies.',
  t_speed: 'Speed test', t_speed_d: 'Ping, jitter, download and upload against Cloudflare’s edge.',
  t_url: 'Link check', t_url_d: 'Asks a malware-filtering DNS resolver whether a domain is on a threat list.',
  t_vault: 'Vault', t_vault_d: 'AES-256 encrypted files behind a PIN, password or pattern, plus Face ID or fingerprint.',
  t_usage: 'Data usage', t_usage_d: 'What this session downloaded, broken down by host.',
  t_native: 'Device-level tools', t_native_d: 'Call blocking, app hiding, DNS filter, game mode, root status. Android app only.',
  proof_title: 'Cleaner apps have a trust problem.',
  proof_sub: 'Most of them show a big number, play an animation, and ask you to believe it. Clearwarden writes a fingerprint of each run to Solana devnet. You can check it later, and so can anyone you send it to.',
  proof_1: 'What goes on chain', proof_1d: 'A SHA-256 digest of the result and a short count. Never file names, paths or contents.',
  proof_2: 'Who signs it', proof_2d: 'A throwaway devnet key made in your browser. It holds no real money.',
  proof_3: 'How to check it', proof_3d: 'Paste the transaction signature on the Verify page, or open it in Solana Explorer.',
  honest_title: 'What a website can and cannot do',
  honest_sub: 'Browsers keep pages away from your system on purpose. We would rather say that plainly than fake a progress bar.',
  honest_web: 'Works in the browser', honest_apk: 'Needs the Android app',
  inst_title: 'Put it on your home screen', inst_sub: 'Two ways in. The web app installs in one tap. The APK takes three, because Android asks you to allow it first.',
  pwa_title: 'Web app', pwa_d: 'Installs from this page. No file to download, no permission screen, updates itself.',
  pwa_btn: 'Install app', pwa_done: 'Installed on this device',
  pwa_ios: 'On iPhone or iPad: tap Share, then Add to Home Screen.',
  pwa_manual: 'Your browser did not offer an install prompt. Open its menu and choose Install app or Add to Home screen. Chrome and Edge show the prompt.',
  apk_title: 'Android APK', apk_d: 'Signed with the Clearwarden release key. Asks for one permission: internet.',
  apk_s1: 'Tap Download APK.', apk_s2: 'Open the file. If Android asks, allow your browser to install apps.', apk_s3: 'Tap Install.',
  apk_cert: 'Signing certificate SHA-256', apk_sum: 'File SHA-256',
  apk_old: 'Installed the earlier debug build? Uninstall it first. It was signed with a different key, so Android will not update over it.',
  faq_title: 'Questions people ask',
  f1q: 'Does it catch every virus?', f1a: 'No scanner does, and anyone claiming 100% is selling something. Clearwarden checks hashes against known samples and looks for the tricks malware uses to get opened: fake extensions, hidden programs, macro documents, scripted PDFs.',
  f2q: 'Can a website clear my other apps’ caches?', f2a: 'No. A page can only clear its own storage. For other folders, you pick the folder and approve each deletion. Clearing other apps’ caches needs the Android app and system permission.',
  f3q: 'Where does the vault keep my files?', f3a: 'In your browser’s storage, encrypted with a key made from your secret. Lose the secret and the files are gone. There is no reset link, by design.',
  f4q: 'Why Solana?', f4a: 'A receipt you can check without trusting us. Devnet fees are free, so it costs you nothing.',
  footer: 'Built for people who are tired of cleaner apps that lie.',
  back: 'Back', run: 'Run', running: 'Running', pick_folder: 'Pick a folder', pick_files: 'Choose files', delete_sel: 'Delete selected',
  anchor: 'Save receipt on Solana', anchoring: 'Writing to devnet', anchored: 'Receipt saved', view_tx: 'View on Explorer',
  wallet: 'Devnet wallet', fund: 'Get devnet SOL', funding: 'Requesting',
  no_folder_api: 'This browser cannot open folders. Use Chrome or Edge on desktop, or the Android app. You can still pick files below.',
  verdict_clean: 'Clean', verdict_suspicious: 'Suspicious', verdict_malicious: 'Threat',
  eicar: 'Try a harmless test virus (EICAR)',
  verify_title: 'Verify a receipt', verify_sub: 'Paste a transaction signature. We read it straight from Solana devnet.', verify_btn: 'Look it up', not_found: 'No transaction found with that signature on devnet.',
  receipts: 'Your receipts', none_yet: 'No receipts yet. Run any tool and save its result.',
  vault_new: 'Create your vault', vault_open: 'Unlock vault', vault_secret: 'Secret', vault_lock: 'Lock', vault_add: 'Add files', vault_bio: 'Add Face ID / fingerprint', vault_wipe: 'Erase vault',
  kind_pin: 'PIN', kind_password: 'Password', kind_pattern: 'Pattern',
  lang: 'Bahasa Indonesia',
}
type Dict = typeof en

const id: Dict = {
  nav_app: 'Buka aplikasi', nav_how: 'Cara kerja', nav_proof: 'Bukti', nav_verify: 'Cek tanda terima', nav_android: 'Android',
  hero_kicker: 'Pembersih, pemindai, dan brankas dalam satu ketukan',
  hero_title: 'HP kamu penuh. Clearwarden menunjukkan apa yang bisa dibuang, lalu membuktikan pekerjaannya.',
  hero_sub: 'Bersihkan folder sampah, tangkap file yang menyamar, kunci foto pribadi dengan sidik jari, dan uji koneksi. Setiap proses meninggalkan tanda terima di Solana, jadi kamu tidak perlu lagi sekadar percaya pada aplikasi pembersih.',
  hero_cta: 'Mulai pemeriksaan', hero_cta2: 'Lihat contoh tanda terima',
  ring_idle: 'Ketuk untuk cek', ring_run: 'Memeriksa', ring_done: 'Selesai',
  how_title: 'Tiga tombol. Satu lingkaran di atasnya.',
  how_sub: 'Ketuk lingkaran, maka Bersihkan, Pindai, dan Percepat berjalan berurutan. Atau buka satu per satu.',
  clean: 'Bersihkan', scan: 'Pindai', boost: 'Percepat',
  clean_d: 'Menghapus cache aplikasi ini dan menelusuri folder pilihanmu untuk file sementara, sisa, dan installer lama.',
  scan_d: 'Menghitung hash setiap file, mencocokkan daftar berbahaya, dan menandai program yang menyamar jadi foto atau PDF.',
  boost_d: 'Membaca memori, penyimpanan, baterai, dan jaringan, lalu menunjukkan apa yang benar-benar membuat perangkat lambat.',
  adv_title: 'Alat lanjutan',
  t_sweep: 'Sapu folder', t_sweep_d: 'Sampah, media WhatsApp, installer APK, file di atas 50 MB. Kamu periksa dulu, baru hapus.',
  t_dupes: 'Foto kembar', t_dupes_d: 'Menemukan foto yang nyaris sama, termasuk salinan yang diperkecil atau dikompres ulang.',
  t_speed: 'Tes kecepatan', t_speed_d: 'Ping, jitter, unduh, dan unggah ke server Cloudflare terdekat.',
  t_url: 'Cek tautan', t_url_d: 'Menanyakan ke DNS penyaring malware apakah sebuah domain masuk daftar ancaman.',
  t_vault: 'Brankas', t_vault_d: 'File terenkripsi AES-256 dengan PIN, kata sandi, atau pola, ditambah Face ID atau sidik jari.',
  t_usage: 'Pemakaian data', t_usage_d: 'Berapa yang diunduh sesi ini, dirinci per host.',
  t_native: 'Alat tingkat perangkat', t_native_d: 'Blokir panggilan, sembunyikan aplikasi, filter DNS, mode game, status root. Hanya di aplikasi Android.',
  proof_title: 'Aplikasi pembersih punya masalah kepercayaan.',
  proof_sub: 'Kebanyakan menampilkan angka besar, memutar animasi, lalu minta kamu percaya. Clearwarden menulis sidik hasil setiap proses ke Solana devnet. Kamu bisa mengeceknya nanti, begitu juga orang yang kamu kirimi.',
  proof_1: 'Apa yang masuk ke chain', proof_1d: 'Digest SHA-256 dari hasil dan hitungan singkat. Tidak pernah nama file, lokasi, atau isi.',
  proof_2: 'Siapa yang menandatangani', proof_2d: 'Kunci devnet sekali pakai yang dibuat di browsermu. Tidak berisi uang sungguhan.',
  proof_3: 'Cara mengecek', proof_3d: 'Tempel signature transaksi di halaman Cek, atau buka di Solana Explorer.',
  honest_title: 'Apa yang bisa dan tidak bisa dilakukan website',
  honest_sub: 'Browser sengaja menjauhkan halaman web dari sistem. Kami lebih memilih mengatakannya terus terang daripada memalsukan progress bar.',
  honest_web: 'Jalan di browser', honest_apk: 'Butuh aplikasi Android',
  inst_title: 'Pasang di layar utama', inst_sub: 'Ada dua cara. Web app terpasang dengan satu ketukan. APK butuh tiga, karena Android minta izin dulu.',
  pwa_title: 'Web app', pwa_d: 'Dipasang langsung dari halaman ini. Tanpa file unduhan, tanpa layar izin, dan memperbarui diri sendiri.',
  pwa_btn: 'Pasang aplikasi', pwa_done: 'Sudah terpasang di perangkat ini',
  pwa_ios: 'Di iPhone atau iPad: ketuk Bagikan, lalu Tambah ke Layar Utama.',
  pwa_manual: 'Browser ini tidak menampilkan tawaran pasang. Buka menunya, lalu pilih Instal aplikasi atau Tambahkan ke layar utama. Chrome dan Edge menampilkan tawaran itu.',
  apk_title: 'APK Android', apk_d: 'Ditandatangani dengan kunci release Clearwarden. Hanya minta satu izin: internet.',
  apk_s1: 'Ketuk Download APK.', apk_s2: 'Buka file-nya. Kalau Android bertanya, izinkan browser memasang aplikasi.', apk_s3: 'Ketuk Instal.',
  apk_cert: 'SHA-256 sertifikat penanda tangan', apk_sum: 'SHA-256 file',
  apk_old: 'Pernah memasang versi debug sebelumnya? Hapus dulu. Versi itu ditandatangani dengan kunci lain, jadi Android tidak bisa memperbaruinya.',
  faq_title: 'Pertanyaan yang sering muncul',
  f1q: 'Apakah semua virus pasti tertangkap?', f1a: 'Tidak ada pemindai yang bisa, dan siapa pun yang mengklaim 100% sedang berjualan. Clearwarden mencocokkan hash dengan sampel yang dikenal dan mencari trik yang dipakai malware supaya dibuka: ekstensi palsu, program tersembunyi, dokumen bermakro, PDF berskrip.',
  f2q: 'Bisakah website menghapus cache aplikasi lain?', f2a: 'Tidak. Halaman web hanya bisa menghapus penyimpanannya sendiri. Untuk folder lain, kamu memilih foldernya dan menyetujui setiap penghapusan. Menghapus cache aplikasi lain butuh aplikasi Android dan izin sistem.',
  f3q: 'Di mana brankas menyimpan file saya?', f3a: 'Di penyimpanan browser, dienkripsi dengan kunci dari rahasiamu. Kalau rahasianya hilang, filenya ikut hilang. Memang tidak ada tautan reset.',
  f4q: 'Kenapa Solana?', f4a: 'Tanda terima yang bisa dicek tanpa harus percaya pada kami. Biaya devnet gratis.',
  footer: 'Dibuat untuk orang yang lelah dengan aplikasi pembersih yang berbohong.',
  back: 'Kembali', run: 'Jalankan', running: 'Berjalan', pick_folder: 'Pilih folder', pick_files: 'Pilih file', delete_sel: 'Hapus yang dipilih',
  anchor: 'Simpan tanda terima di Solana', anchoring: 'Menulis ke devnet', anchored: 'Tanda terima tersimpan', view_tx: 'Lihat di Explorer',
  wallet: 'Dompet devnet', fund: 'Minta SOL devnet', funding: 'Meminta',
  no_folder_api: 'Browser ini tidak bisa membuka folder. Pakai Chrome atau Edge di desktop, atau aplikasi Android. Kamu tetap bisa memilih file di bawah.',
  verdict_clean: 'Aman', verdict_suspicious: 'Mencurigakan', verdict_malicious: 'Ancaman',
  eicar: 'Coba virus uji yang tidak berbahaya (EICAR)',
  verify_title: 'Cek tanda terima', verify_sub: 'Tempel signature transaksi. Kami membacanya langsung dari Solana devnet.', verify_btn: 'Cari', not_found: 'Tidak ada transaksi dengan signature itu di devnet.',
  receipts: 'Tanda terimamu', none_yet: 'Belum ada. Jalankan alat apa saja lalu simpan hasilnya.',
  vault_new: 'Buat brankas', vault_open: 'Buka brankas', vault_secret: 'Rahasia', vault_lock: 'Kunci', vault_add: 'Tambah file', vault_bio: 'Tambah Face ID / sidik jari', vault_wipe: 'Hapus brankas',
  kind_pin: 'PIN', kind_password: 'Kata sandi', kind_pattern: 'Pola',
  lang: 'English',
}

export type Key = keyof Dict
const dicts = { en, id }
type Lang = keyof typeof dicts
const Ctx = createContext<{ lang: Lang; t: (k: Key) => string; toggle: () => void }>({ lang: 'en', t: (k) => en[k], toggle: () => {} })

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => {
    try { return (localStorage.getItem('cw.lang') as Lang) || 'en' } catch { return 'en' }
  })
  const toggle = () => {
    const next: Lang = lang === 'en' ? 'id' : 'en'
    setLang(next)
    document.documentElement.lang = next
    try { localStorage.setItem('cw.lang', next) } catch { /* private mode */ }
  }
  return <Ctx.Provider value={{ lang, t: (k) => dicts[lang][k], toggle }}>{children}</Ctx.Provider>
}
export const useT = () => useContext(Ctx)
