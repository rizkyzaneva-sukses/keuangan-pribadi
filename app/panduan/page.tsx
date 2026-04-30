import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { AppShell } from "@/components/AppShell";

export default async function PanduanPage() {
  const { userId, email } = await requireUser();
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { nama: true, email: true },
  });

  return (
    <AppShell user={user || { email }} active="/panduan">
      <div className="page-header mb-5">
        <h2>Buku Panduan</h2>
        <p>Panduan lengkap penggunaan aplikasi — dibaca sekali, paham selamanya.</p>
      </div>

      <div className="space-y-6">
        {/* Peta Halaman */}
        <div className="card">
          <div className="section-title">🗺️ Peta Halaman & Navigasi</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 text-[0.8rem]">
            <div className="flex gap-3 items-start"><span className="font-mono text-[var(--accent-gold)] w-24">/dashboard</span><span className="text-[var(--text-secondary)]">Ringkasan semua modul</span></div>
            <div className="flex gap-3 items-start"><span className="font-mono text-[var(--accent-gold)] w-24">/kas</span><span className="text-[var(--text-secondary)]">Kas harian (pemasukan & pengeluaran)</span></div>
            <div className="flex gap-3 items-start"><span className="font-mono text-[var(--accent-gold)] w-24">/investasi</span><span className="text-[var(--text-secondary)]">Portofolio & transaksi investasi bisnis</span></div>
            <div className="flex gap-3 items-start"><span className="font-mono text-[var(--accent-gold)] w-24">/teman</span><span className="text-[var(--text-secondary)]">Investasi ke teman/partner (deviden)</span></div>
            <div className="flex gap-3 items-start"><span className="font-mono text-[var(--accent-gold)] w-24">/murobahah</span><span className="text-[var(--text-secondary)]">Pembiayaan murobahah (imbal hasil)</span></div>
            <div className="flex gap-3 items-start"><span className="font-mono text-[var(--accent-gold)] w-24">/templates</span><span className="text-[var(--text-secondary)]">Template alokasi profit (SETUP AWAL)</span></div>
            <div className="flex gap-3 items-start"><span className="font-mono text-[var(--accent-gold)] w-24">/wallet</span><span className="text-[var(--text-secondary)]">Wallet pos alokasi & penarikan</span></div>
            <div className="flex gap-3 items-start"><span className="font-mono text-[var(--accent-gold)] w-24">/zakat</span><span className="text-[var(--text-secondary)]">Kewajiban zakat</span></div>
          </div>
        </div>

        {/* Workflow Setup Awal */}
        <div className="card border-l-4 border-l-[var(--accent-gold)]">
          <div className="section-title">⚡ Workflow Setup Awal (Wajib Sebelum Pakai)</div>
          <p className="text-[0.75rem] text-[var(--text-muted)] mb-3">Ikuti urutan ini saat pertama kali menggunakan aplikasi. Jika template belum ada, fitur alokasi otomatis tidak akan berjalan.</p>
          <div className="flex flex-col md:flex-row gap-2 md:gap-4 items-center justify-center text-[0.8rem]">
            <div className="bg-[var(--bg-elevated)] p-3 rounded-md border border-[var(--bg-border)] text-center w-full md:w-auto">
              <span className="block font-semibold text-[var(--text-primary)]">1. Buat Template</span>
              <span className="text-[0.7rem] text-[var(--text-muted)]">di /templates</span>
            </div>
            <div className="text-[var(--text-muted)] rotate-90 md:rotate-0">→</div>
            <div className="bg-[var(--bg-elevated)] p-3 rounded-md border border-[var(--bg-border)] text-center w-full md:w-auto">
              <span className="block font-semibold text-[var(--text-primary)]">2. Tambah Pos</span>
              <span className="text-[0.7rem] text-[var(--text-muted)]">Cth: Tabungan 40%</span>
            </div>
            <div className="text-[var(--text-muted)] rotate-90 md:rotate-0">→</div>
            <div className="bg-[var(--bg-elevated)] p-3 rounded-md border border-[var(--bg-border)] text-center w-full md:w-auto">
              <span className="block font-semibold text-[var(--text-primary)]">3. Tambah Investasi</span>
              <span className="text-[0.7rem] text-[var(--text-muted)]">di /investasi</span>
            </div>
            <div className="text-[var(--text-muted)] rotate-90 md:rotate-0">→</div>
            <div className="bg-[var(--bg-elevated)] p-3 rounded-md border border-[var(--accent-green)] text-center w-full md:w-auto relative overflow-hidden">
              <div className="absolute inset-0 bg-[var(--accent-green)]/10"></div>
              <span className="relative z-10 block font-semibold text-[var(--accent-green)]">✅ Siap Catat</span>
            </div>
          </div>
        </div>

        {/* Detail Halaman */}
        <div className="space-y-4">
          <div className="section-title text-lg border-b border-[var(--bg-border)] pb-2 mb-4">📄 Detail & Fungsi Halaman</div>
          
          <details className="card group cursor-pointer">
            <summary className="font-semibold text-[0.9rem] flex justify-between items-center outline-none list-none">
              <span>📈 Portofolio Investasi (/investasi)</span>
              <span className="text-[var(--text-muted)] group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <div className="mt-3 pt-3 border-t border-[var(--bg-border)] text-[0.8rem] text-[var(--text-secondary)] space-y-3 cursor-text">
              <p>Mengelola semua investasi bisnis beserta transaksi masuk/keluarnya.</p>
              
              <div className="font-medium text-[var(--text-primary)]">Kategori Transaksi Penting:</div>
              <div className="overflow-x-auto rounded border border-[var(--bg-border)]">
                <table className="data-table w-full text-left">
                  <thead>
                    <tr><th>Kategori</th><th>Arah</th><th>Keterangan</th></tr>
                  </thead>
                  <tbody>
                    <tr><td><span className="font-mono text-[0.7rem]">IN_DIVIDEND</span></td><td><span className="badge-green">IN</span></td><td>Deviden/profit rutin diterima</td></tr>
                    <tr><td><span className="font-mono text-[0.7rem]">IN_CAPITAL_RETURN_PLUS_PROFIT</span></td><td><span className="badge-green">IN</span></td><td>Pengembalian modal + profit</td></tr>
                    <tr><td><span className="font-mono text-[0.7rem]">OUT_BUSINESS_CAPITAL</span></td><td><span className="badge-red">OUT</span></td><td>Modal bisnis yang dikeluarkan</td></tr>
                  </tbody>
                </table>
              </div>
              <div className="bg-[var(--bg-elevated)] p-2 rounded text-[0.75rem] border border-[var(--accent-gold)]/30">
                <strong className="text-[var(--accent-gold)]">INFO PENTING:</strong> Alokasi otomatis ke wallet hanya terjadi saat transaksi <span className="text-[var(--accent-green)]">IN</span> dengan kategori di atas yang memiliki <span className="font-semibold text-[var(--text-primary)]">Profit &gt; 0</span>. Modal (Principal) tidak dialokasikan.
              </div>
            </div>
          </details>

          <details className="card group cursor-pointer">
            <summary className="font-semibold text-[0.9rem] flex justify-between items-center outline-none list-none">
              <span>🗂️ Template Alokasi (/templates) & Wallet Pos (/wallet)</span>
              <span className="text-[var(--text-muted)] group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <div className="mt-3 pt-3 border-t border-[var(--bg-border)] text-[0.8rem] text-[var(--text-secondary)] space-y-3 cursor-text">
              <p>Template mendefinisikan bagaimana profit investasi dibagi ke pos-pos wallet secara otomatis.</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Total persentase pos dalam satu template <strong>harus 100%</strong>.</li>
                <li>Template <strong>DEFAULT</strong> akan otomatis digunakan untuk investasi yang tidak punya template spesifik.</li>
                <li>Setiap investasi bisa di-assign template yang berbeda saat pembuatan.</li>
                <li>Card template punya tombol <strong>Edit</strong> untuk mengubah nama, catatan, pos, dan persentase.</li>
              </ul>

              <div className="font-medium text-[var(--text-primary)] mt-3">⚙ Override % per Investasi</div>
              <p>
                Satu template bisa digunakan oleh banyak investasi, namun <strong>persentase tiap pos bisa berbeda-beda</strong> per investasi
                — tanpa perlu membuat template baru. Contoh: Template &quot;ZV 1&quot; punya pos <em>I = 15%</em>.
                Di bisnis A, partner ada &quot;F&quot; dan &quot;I&quot; keduanya sehingga &quot;I&quot; di-override ke 10%.
                Di bisnis B, hanya &quot;I&quot; yang ada sehingga tetap 15%.
              </p>
              <div className="font-medium text-[var(--text-primary)]">Cara mengatur Override:</div>
              <ol className="list-decimal pl-5 space-y-1">
                <li>Buka halaman <code>/investasi</code></li>
                <li>Di card investasi yang ingin diubah, klik tombol kecil <strong>⚙ Atur Override %</strong> (di samping nama template)</li>
                <li>Centang <strong>Aktifkan override khusus investasi ini</strong></li>
                <li>Ubah angka % sesuai kebutuhan — total tetap harus <strong>100%</strong></li>
                <li>Klik <strong>Simpan</strong></li>
              </ol>
              <div className="bg-[var(--bg-elevated)] p-2 rounded text-[0.75rem] border border-[var(--accent-gold)]/30">
                <strong className="text-[var(--accent-gold)]">INFO:</strong>{" "}
                Jika override aktif, tombol kecil di card investasi berubah menjadi <strong>⚙ Override Aktif</strong> berwarna biru sebagai tanda pengingat.
                Override hanya mempengaruhi alokasi profit investasi tersebut — investasi lain yang pakai template yang sama tidak terpengaruh.
              </div>
              <div className="bg-[var(--bg-elevated)] p-2 rounded text-[0.75rem] border border-[var(--bg-border)]">
                <strong className="text-[var(--text-primary)]">Reset ke default:</strong>{" "}
                Buka panel override, hilangkan centang, klik Simpan — semua override dihapus dan kembali ke persentase template.
              </div>

              <p className="mt-2">Di halaman <strong>/wallet</strong>, Anda bisa melihat saldo tiap pos dan mencatat penarikan. Penarikan akan mengurangi saldo pos tersebut.</p>
            </div>
          </details>

          <details className="card group cursor-pointer">
            <summary className="font-semibold text-[0.9rem] flex justify-between items-center outline-none list-none">
              <span>☪️ Zakat (/zakat)</span>
              <span className="text-[var(--text-muted)] group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <div className="mt-3 pt-3 border-t border-[var(--bg-border)] text-[0.8rem] text-[var(--text-secondary)] space-y-3 cursor-text">
              <p>Kewajiban zakat (2.5%) <strong>muncul secara otomatis</strong> ketika Anda:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Mencatat penerimaan <strong>Deviden</strong> di halaman <code>/teman</code></li>
                <li>Mencatat penerimaan <strong>Imbal Hasil</strong> di halaman <code>/murobahah</code></li>
              </ul>

              <div className="font-medium text-[var(--text-primary)]">3 Status Zakat:</div>
              <div className="overflow-x-auto rounded border border-[var(--bg-border)]">
                <table className="data-table w-full text-left">
                  <thead><tr><th>Status</th><th>Arti</th><th>Tindakan</th></tr></thead>
                  <tbody>
                    <tr>
                      <td><span className="badge-red">BELUM</span></td>
                      <td>Belum ada pembayaran sama sekali</td>
                      <td>Klik tombol <strong>Bayar</strong></td>
                    </tr>
                    <tr>
                      <td><span className="badge-yellow">CICILAN</span></td>
                      <td>Sudah dibayar sebagian, masih ada sisa</td>
                      <td>Klik tombol <strong>Bayar Lagi</strong> untuk cicilan berikutnya</td>
                    </tr>
                    <tr>
                      <td><span className="badge-green">LUNAS</span></td>
                      <td>Total pembayaran sudah memenuhi kewajiban</td>
                      <td>—</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="font-medium text-[var(--text-primary)]">Cara Bayar Cicilan:</div>
              <ol className="list-decimal pl-5 space-y-1">
                <li>Klik tombol <strong>Bayar</strong> (atau <strong>Bayar Lagi</strong> jika sudah pernah cicil)</li>
                <li>Isi jumlah yang ingin dibayarkan — tidak harus penuh</li>
                <li>Klik <strong>Lunas</strong> untuk mengisi otomatis sisa kewajiban</li>
                <li>Isi tanggal bayar dan keterangan (opsional, mis. <em>"Warga 40 org @ Rp75.000"</em>)</li>
                <li>Klik <strong>Simpan</strong></li>
              </ol>

              <div className="bg-[var(--bg-elevated)] p-2 rounded text-[0.75rem] border border-[var(--accent-gold)]/30">
                <strong className="text-[var(--accent-gold)]">TIP:</strong> Klik ikon <strong>📋 Nx</strong> di sebelah tombol Bayar untuk melihat riwayat semua cicilan yang sudah dibayar beserta progress bar-nya.
              </div>

              <div className="bg-[var(--bg-elevated)] p-2 rounded text-[0.75rem] border border-[var(--bg-border)]">
                <strong className="text-[var(--text-primary)]">Kolom tabel:</strong>{" "}
                <span className="text-[var(--text-muted)]">Kewajiban = total zakat yang harus dibayar · Terbayar = sudah masuk · Sisa = yang masih kurang.</span>
              </div>
            </div>
          </details>

          <details className="card group cursor-pointer">
            <summary className="font-semibold text-[0.9rem] flex justify-between items-center outline-none list-none">
              <span>💰 Kas Harian (/kas)</span>
              <span className="text-[var(--text-muted)] group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <div className="mt-3 pt-3 border-t border-[var(--bg-border)] text-[0.8rem] text-[var(--text-secondary)] space-y-3 cursor-text">
              <p>Mencatat pemasukan dan pengeluaran harian dari aktivitas sehari-hari (bukan investasi).</p>
              <p>Kas harian <strong>terpisah sepenuhnya</strong> dari saldo investasi dan wallet pos alokasi. Gunakan ini untuk mencatat gaji bulanan, belanja makan, bayar tagihan listrik, dsb.</p>
            </div>
          </details>
        </div>

        {/* FAQ */}
        <div className="card bg-[var(--bg-elevated)] border-[var(--bg-border)]">
          <div className="section-title">❓ FAQ (Pertanyaan Umum)</div>
          <div className="space-y-3 mt-3 text-[0.8rem]">
            <div>
              <div className="font-semibold text-[var(--text-primary)]">Q: Kenapa saldo wallet pos tidak bertambah setelah input transaksi investasi?</div>
              <div className="text-[var(--text-secondary)] mt-0.5">A: Pastikan: (1) Arahnya IN, (2) Kategorinya IN_DIVIDEND/IN_CAPITAL_RETURN_PLUS_PROFIT, (3) Nilai Profit lebih dari 0, dan (4) Ada template yang aktif.</div>
            </div>
            <div>
              <div className="font-semibold text-[var(--text-primary)]">Q: Apa bedanya /investasi dan /teman?</div>
              <div className="text-[var(--text-secondary)] mt-0.5">A: <code>/investasi</code> untuk bisnis dengan transaksi masuk/keluar modal dan alokasi profit yang kompleks. <code>/teman</code> lebih simpel, hanya catat modal dipinjamkan dan deviden yang diterima.</div>
            </div>
            <div>
              <div className="font-semibold text-[var(--text-primary)]">Q: Kenapa ada kolom Principal dan Profit terpisah saat tambah transaksi?</div>
              <div className="text-[var(--text-secondary)] mt-0.5">A: Karena alokasi otomatis ke wallet pos <strong>hanya diambil dari Profit</strong>. Ini penting agar uang modal Anda (Principal) tidak ikut terbagi-bagi seolah-olah itu keuntungan.</div>
            </div>
            <div>
              <div className="font-semibold text-[var(--text-primary)]">Q: Angka "Total Saldo Wallet" di Dashboard diambil dari mana?</div>
              <div className="text-[var(--text-secondary)] mt-0.5">A: Angka ini didapat dengan menjumlahkan seluruh saldo saat ini dari semua Pos Alokasi (Wallet Pos) milik Anda. Saldo di masing-masing pos sendiri berasal dari pembagian keuntungan (profit) investasi yang sudah masuk, dikurangi dengan penarikan yang sudah Anda lakukan.</div>
            </div>
          </div>
        </div>
        
      </div>
    </AppShell>
  );
}
