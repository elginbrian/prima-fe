**PRODUCT REQUIREMENT DOCUMENT**  
**Procurement Assistant Tools (D1-D4)**

| Status		: Draft for Business Validation Project	: Pertamina Camp 2026 \- Project 1 Target User	: Internal Procurement PT Pertamina Patra Niaga Regional Kalimantan |
| :---- |

1. **Executive Summary**  
   Proses procurement melibatkan berbagai dokumen, persyaratan, PIC, status pekerjaan, dan tenggat waktu yang perlu dipenuhi dalam aktivitas yang berbeda. Dalam pelaksanaannya, terdapat kebutuhan untuk membantu Procurement melakukan pemeriksaan dokumen, melihat status pekerjaan secara lebih cepat, mengelola tenggat, serta memantau masa berlaku jaminan.  
   Proyek ini mengusulkan kumpulan digital tools sederhana dan standalone yang berfokus pada kebutuhan operasional spesifik tanpa menggantikan proses maupun sistem procurement yang telah berjalan.  
   Solusi mencakup empat fungsi:

| Komponen | Implementasi Solusi | Fungsi |
| ----- | ----- | ----- |
| D1 \- Doc Digital Form & Validation | Document Review & Readiness Tool | Memeriksa kelengkapan, persyaratan, dan konsistensi dokumen |
| D2 \- Jaminan Expiry Alert System | Guarantee Expiry Alert | Memantau masa berlaku dan tindakan terkait jaminan |
| D3 \- Procurement Status Dashboard | Document & Item Tracker | Memberikan visibilitas status item secara cepat dalam satu tempat |
| D4 \- SLA Timer & Tracking per Fase | Deadline & SLA Reminder | Memantau tenggat dan memberikan peringatan sebelum/ketika terlambat |

   Keempat fungsi dihubungkan oleh konsep Next Action, yaitu tindakan operasional berikutnya yang perlu dilakukan oleh PIC berdasarkan kondisi suatu dokumen, jaminan, atau aktivitas.

   Solusi bersifat standalone. Tidak terdapat integrasi, sinkronisasi, atau penggantian fungsi terhadap sistem procurement existing. Nilai utama solusi terletak pada membantu pekerjaan operasional secara lebih cepat, jelas, dan terarah.

2. **Product Concept**

	**Konsep Utama:**  
Solusi terdiri dari empat lightweight tools dengan dua objek bisnis utama:

1. Dokumen

   Segala dokumen procurement yang perlu dibuat/diinput, diperiksa, diperbaiki, dipantau statusnya, atau diberi deadline. Contoh:

- PPL  
- dokumen pendukung  
- OE & BoQ  
- RKS  
- Rancangan Kontrak  
- Berita Acara   
- LHP  
- Form TKDN  
- dan dokumen lain sesuai kebutuhan proses  
2. Jaminan

   Data jaminan yang memiliki jenis, nilai, tanggal terbit, expiry date, PIC, dan kondisi tindak lanjut. Contoh:

- Jaminan pelaksanaan  
- Jaminan masa pemeliharaan  
- jenis lain sesuai hasil validasi

	**Cara Kerja Konseptual:**  
	Alur umum tools  
Input/Upload Dokumen atau Jaminan  
↓  
Review / Pencatatan  
↓  
Identifikasi kondisi atau kekurangan  
↓  
Next Action  
↓  
PIC melakukan tindakan  
↓  
Status diperbarui  
↓  
Deadline/Expiry dipantau bila relevan  
(Tools tidak menggantikan proses approval, tender, evaluasi, atau kontrak resmi)  
	**Posisi terhadap Sistem Existing:**  
Solusi baru berfungsi sebagai operational assistance layer, bukan sebagai pengganti atau integration layer. Tidak termasuk:

- API integration  
- sinkronisasi status  
- mengambil data otomatis dari SAPP/SmartGEP  
- menggantikan approval  
- menggantikan submission resmi  
3. **D1 \- Document Review & Readiness Tool**  
   **Tujuan**  
   Membantu Procurement melakukan pemeriksaan awal terhadap kesiapan dokumen sebelum dokumen diproses lebih lanjut. Tool tidak menentukan keputusan resmi procurement. Tool hanya membantu mengidentifikasi apakah terdapat bagian yang:  
- belum tersedia  
- belum sesuai requirement  
- tidak konsisten  
- atau membutuhkan tindakan lebih lanjut


  

  **Konsep UX**

  Konsep UX menyerupai document review tool, bukan form kosong yang hanya memaksa user mengisi field satu per satu.

- User Upload/Input Dokumen  
- Review otomatis berbasis aturan  
- Issues ditemukan  
- Highlight masalah  
- Next Action  
- User melakukan perbaikan  
- Re-review

	**Flow**

- Pilih jenis dokumen  
- Isi metadata minimum  
- Upload/input dokumen  
- Automated review  
- Hasil review   
- Generate Draft  
- User memeriksa dan mengedit hasilnya  
- Finalize

	**Jenis Pemeriksaan**

1. Completeness Check: Memeriksa apakah item wajib sudah tersedia.

   Contoh: Pakta Integritas belum tersedia.

2. Requirement Check: Memeriksa apakah item sesuai dengan persyaratan yang digunakan pada proses/tender terkait.

   Contoh: SKT harus masih aktif; KBUP harus sesuai.

3. Conditional Requirement: Requirement hanya aktif jika kondisi tertentu terpenuhi.

   Contoh: HSSE Plan diperlukan untuk kategori risiko tertentu.

4. Basic Consistency Check: Memeriksa konsistensi data yang muncul lebih dari sekali.

   Contoh: Nilai pada Surat Penawaran ≠ nilai pada BoQ.

5. Validity Check: Jika suatu dokumen memiliki masa berlaku, tool dapat memeriksa apakah tanggal tersebut masih relevan.

	**Output D1**  
	Status utama: **Ready Needs Attention Not Ready**

| Issue Type | Contoh |
| ----- | ----- |
| Missing | Pakta Integritas belum diunggah |
| Invalid | Dokumen sudah kedaluwarsa |
| Inconsistent | Total Surat Penawaran ≠ BoQ |
| Conditional  | HSSE Plan diperlukan berdasarkan kondisi paket |
| Review Needed | Requirement belum dapat ditentukan otomatis |

	**Next Action D1**  
Next Action harus konkret. Tool memberikan guidance, bukan mengambil keputusan atas nama Procurement.	

- Contoh 1:

  *Issue: Form TKDN belum lengkap*

  *Next Action: Lengkapi nilai TKDN dan unggah dokumen pendukung.*

- Contoh 2:

  *Issue: Nilai pada OE dan dokumen referensi tidak konsisten*

  *Next Action: Periksa kembali nilai yang digunakan sebelum dokumen diproses lebih lanjut.*

	**Batasan D1**  
D1 MVP tidak menentukan kelulusan tender, tidak menggantikan evaluasi Procurement, tidak menggantikan reviewer, tidak menentukan bahwa suatu dokumen pasti memenuhi Dokumen Tender,, atau memahami seluruh isi dokumen secara bebas tanpa rule/reference. D1 menggunakan rule-based/structured checking sebagai pendekatan utama.

**AI-Assisted Draft Document Generation**  
Sebagai pengembangan dari fitur Next Action, D1 menyediakan opsi AI-Assisted Draft Document Generation untuk membantu Procurement dalam mempersiapkan atau memperbaiki dokumen yang memiliki issue berdasarkan hasil pemeriksaan. Fitur ini digunakan ketika tindakan yang diperlukan tidak hanya berupa perbaikan informasi, tetapi juga membutuhkan pembuatan atau revisi draft dokumen.

Setelah D1 melakukan pemeriksaan dan menemukan issue, sistem akan memberikan Next Action yang sesuai. Apabila issue tersebut dapat ditindaklanjuti melalui pembuatan atau perbaikan dokumen, sistem dapat menyediakan opsi Generate Draft with AI. AI kemudian menghasilkan draft berdasarkan data procurement, dokumen yang tersedia, template, serta referensi yang relevan dengan dokumen tersebut.

Draft yang dihasilkan AI tidak langsung dianggap sebagai dokumen resmi. User tetap memiliki kewenangan untuk memeriksa, mengubah, dan melakukan review terhadap draft sebelum digunakan dalam proses procurement. Dengan demikian, AI berfungsi sebagai assistant untuk mempercepat penyusunan dokumen, bukan sebagai pengganti Procurement, reviewer, maupun pihak yang memiliki kewenangan dalam proses approval.

**Alur Fitur:**   
Document Review → Issue Identified → Next Action → Generate Draft with AI → AI-generated Draft → User Review & Edit → Approved by User → Draft Ready for Further Process

**Prinsip Penggunaan AI**  
AI-Assisted Draft Document Generation menggunakan informasi yang tersedia pada procurement sebagai dasar pembuatan draft. Informasi tersebut dapat berasal dari:

* Data procurement;  
* Dokumen yang telah diunggah;  
* Hasil pemeriksaan D1;  
* Template dokumen;  
* Dokumen atau referensi yang telah ditentukan.

  Apabila informasi yang diperlukan untuk menghasilkan dokumen belum tersedia, sistem tidak secara otomatis mengasumsikan atau membuat informasi tersebut. User akan diarahkan untuk melengkapi informasi yang diperlukan terlebih dahulu. 


  **Batasan AI** 

  AI hanya menghasilkan draft dan tidak menentukan apakah dokumen telah memenuhi seluruh persyaratan procurement secara resmi. Hasil pemeriksaan D1 tetap menjadi early assistance bagi Procurement, sedangkan keputusan akhir mengenai kelayakan, compliance, approval, maupun penggunaan dokumen tetap berada pada user atau pihak yang memiliki kewenangan sesuai proses procurement.


  

4. **D2 \- Guarantee Expiry Alert**  
   **Tujuan**  
   Membantu Procurement memantau masa berlaku jaminan dan melakukan tindakan sebelum jaminan kedaluwarsa. Jaminan memiliki jenis, nilai, masa berlaku, kondisi, waktu penyerahan, dan konsekuensi jika tidak diperpanjang tepat waktu.  
   **Data yang Dicatat**  
   Minimal mencakup: Jenis Jaminan, Nomor/Referensi, Nilai, Tanggal Terbit, Expiry Date, PIC, dan Status. Jenis jaminan prioritas MVP: Jaminan Pelaksanaan, Jaminan Masa Pemeliharaan (Jenis lainnya Need Validation).  
   **Status**  
- **Aktif**   
- **Mendekati Expiry**  
- **Expired**  
  **Next Action**  
  *Jaminan Pelaksanaan akan berakhir dalam 7 hari.*  
  *Next Action: Koordinasikan perpanjangan dengan pihak terkait.*  
    
5. **D3 \- Document & Item Tracker**  
   **Tujuan**  
   Memberikan visibilitas cepat terhadap status operasional dokumen, jaminan, dan aktivitas tertentu dalam satu tempat. D3 dimaksudkan sebagai dashboard procurement enterprise. D3 juga tidak membaca status dari SAPP secara otomatis.

	**Sumber Status**

1. Manual Update

   Status diinput oleh:

- PIC yang menangani item, atau  
- Admin yang ditunjuk.

  Setiap perubahan yang dicatat di tools langsung terlihat pada tracker.

2. Automatic Time Status

   Tools dapat menghitung status perhatian berdasarkan deadline/SLA yang telah ditetapkan.

   Contoh:

   *Status Aktual	: Dalam Proses*

   *Deadline	: 20 Agustus*

   *Time Status	: At Risk*

   

   Dengan demikian, real-time pada D3 berarti real-time visibility terhadap data yang diperbarui di dalam tools, bukan real-time synchronization dengan SAPP.

	**Jenis Status**

1. Business Status

   Menunjukkan kondisi aktual pekerjaan.

   Contoh:

- Draft  
- Diproses  
- Perlu Revisi  
- Selesai

  Business Status diperbarui secara manual.

2. Time Status

   Menunjukkan kondisi terhadap deadline/SLA.

   Contoh:

- On Track  
- At Risk  
- Overdue

  Time Status dapat dihitung otomatis berdasarkan deadline.


3. Time Status tidak otomatis mengubah Business Status.

   Contoh:

   *Business Status	\= Evaluasi*

   *Time Status		\= Overdue*

   bukan:

   *Business Status otomatis menjadi Selesai/Gagal.*

**Informasi yang Ditampilkan**

| Item | Informasi |
| ----- | ----- |
| Nama | Nama dokumen/jaminan |
| Jenis | Dokumen/Jaminan |
| Status | Draft / Diproses / Perlu Revisi / Selesai |
| PIC | Penanggung jawab |
| Last Update | Perubahan terakhir |
| Deadline  | Jika ada |
| Next Action | Jika tersedia |

	**Output**  
PIC dapat memperbarui status item yang menjadi tanggung jawabnya. Output berupa tracker sederhana dengan search, filter, business status, time status, PIC, last update, deadline, expiry indicator, next action.

6. **D4 \- Deadline Reminder Tool**  
   **Tujuan dan Cakupan**  
   Membantu PIC mengetahui apa yang harus selesai dan kapan, tanpa membangun SLA engine untuk seluruh lifecycle procurement. Deadline dapat ditempel pada: Dokumen, Aktivitas tertentu, atau Jaminan melalui expiry date.  
   Model: Deadline ditetapkan → Remaining Time dihitung → Warning → Overdue  
   **Output**

	*BA Pre-Tender | Deadline: 20 Aug | 2 hari tersisa*  
	***Expired** | 1 hari terlambat*  
	Warning diterima oleh PIC item terkait.  
	**Hubungan dengan D3**  
	D4 menghasilkan Time Status yang ditampilkan pada D3  
Contoh:

| BA Pre-Tender Business Status: Diproses Deadline: 20 Aug Time Status: At Risk |
| :---- |

Dengan demikian:  
D4 \= time logic  
D3 \= visibility

7. **Next Action / Guidance**  
   **Definisi**  
   Next Action adalah tindakan operasional berikutnya yang perlu dilakukan PIC terhadap suatu Dokumen atau Jaminan berdasarkan kondisi item tersebut. Ini bukan modul terpisah.  
   **Implementasi**  
* D1 (Diagnosis): "Pakta Integritas belum tersedia." → Next Action: Upload dokumen.  
* D2 (Condition): "Jaminan akan expiry dalam 7 hari." → Next Action: Koordinasikan perpanjangan.  
* D3 (Visibility): Menampilkan Next Action yang sudah tersedia.  
* D4 (Reminder): Mengingatkan PIC terhadap Next Action yang memiliki deadline.

8. **Document Flow**  
   Upload/Input Dokumen  
   ↓  
   D1 Review  
   ↓  
   Issue ditemukan? → (Ya) → Next Action muncul → User memperbaiki  
   ↓  
   (Tidak / sudah diperbaiki)  
   ↓  
   Dokumen dapat ditandai sesuai status di D3  
   ↓  
   (Jika ada deadline) D4 Reminder  
   ↓  
   D3 menampilkan time status

   Approval formal tetap berada pada proses/sistem resmi Pertamina.

   

9. **Guarantee Flow**  
   Input Guarantee  
   ↓  
   D2 mencatat Expiry  
   ↓  
   D3 menampilkan item  
   ↓  
   D4/Expiry Logic menghitung kondisi waktu  
   ↓  
   Warning/Overdue  
   ↓  
   Next Action  
     
10. **Role & Interaction**  
    Role tidak menggunakan RBAC kompleks. Prinsip sederhana yaitu setiap item memiliki satu PIC utama. PIC tersebut dapat memperbarui status item yang menjadi tanggung jawabnya.

| Role | Contoh Item | Reminder/Alert |
| ----- | ----- | ----- |
| Submitter | PPL | Ya |
| Konseptor | RKS/Rancangan Kontrak | Ya |
| Buyer | Tender/Catatan Kontrak | Ya |
| Evaluator | Ringkasan Evaluasi | Ya |
| Procurement/Pokja | Dokumen Pendukung/BA/LHP | Ya |
| Pejabat Berwenang | Item tertentu terkait approval | Sesuai Kebutuhan |
| Contract Administrator | Jaminan/BAPP/BASMP | Ya |

    Reviewer dan approver formal tetap menjalankan fungsi resminya pada proses/sistem Pertamina.

    

11. **Katalog Dokumen**

| Dokumen | Referensi Fase | PIC Umum |
| ----- | ----- | ----- |
| PPL | PPL | Submitter |
| OE & BoQ | Dokumen Pendukung | Procurement |
| Risk Assessment | Dokumen Pendukung | Procurement |
| Purchase Requisition | Dokumen Pendukung | Procurement |
| Pakta Integritas | Dokumen Pendukung | Procurement |
| Form TKDN | Dokumen Pendukung | Procurement |
| RKS | RKS & Kontrak | Konseptor |
| Rancangan Kontrak | RKS & Kontrak | Konseptor |
| Ringkasan Hasil Tender | Tender | Buyer |
| Ringkasan Hasil Evaluasi | Evaluasi | Evaluator |
| Berita Acara | Evaluasi/Negosiasi | Procurement |
| LHP | LHP | Procurement/Pokja |
| Catatan Kontrak/PO | Finalisasi | Buyer/CA |
| Data Jaminan | Pasca-Kontrak | Contract Administrator |
| BAPP/BASMP | Pasca-Kontrak | Procurement/CA |

    

12. **Proposed MVP**  
* D1: Upload/input dokumen, Pemilihan jenis dokumen, Rule-based completeness check, Conditional requirement sederhana, Basic consistency check, Issue highlighting, Next Action, Status hasil review, Auto-generate draft dokumen.  
* D2: Input data jaminan, Expiry date, Remaining time, Expiry alert, Next Action.  
* D3: Document/Item list, Status, PIC, Last update, Search/filter, Deadline/expiry indicator.  
* D4: Deadline per item, Remaining time, Warning, Overdue.  
* Shared: Basic role/PIC, Simple history, Next Action.

13. **Potential Enhancement**

	Tidak wajib dalam MVP

* Converter notulen → draft dokumen  
* Reminder berkala  
* Export report  
* Trend analysis   
* Escalation  
* Additional document types  
* Additional validation rules.

14. **Success Criteria MVP**  
    MVP dinilai berhasil apabila D1, D2, D3, dan D4 membantu PIC bekerja lebih cepat, mengidentifikasi dokumen dengan tepat, mengenali jaminan yang expiry, dan memantau pekerjaan tanpa mengambil alih proses resmi.  
    

