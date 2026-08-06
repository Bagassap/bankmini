import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface LaporanPdfRow {
  tanggal: string;
  jenis: "setor" | "tarik";
  keterangan: string;
  nasabah: string;
  jumlah: number;
}

export interface LaporanPdfInput {
  title: string;
  periodeLabel: string;
  dicetakLabel: string;
  rows: LaporanPdfRow[];
}

const COLOR_PENDAPATAN: [number, number, number] = [21, 128, 61];
const COLOR_PENDAPATAN_LIGHT: [number, number, number] = [240, 253, 244];
const COLOR_PENGELUARAN: [number, number, number] = [185, 28, 28];
const COLOR_PENGELUARAN_LIGHT: [number, number, number] = [254, 242, 242];
const COLOR_PRIMARY: [number, number, number] = [17, 32, 240];
const COLOR_PRIMARY_LIGHT: [number, number, number] = [238, 240, 254];
const COLOR_MUTED: [number, number, number] = [107, 114, 128];
const COLOR_INK: [number, number, number] = [31, 41, 55];
const COLOR_BORDER: [number, number, number] = [226, 232, 240];

function formatRupiah(value: number): string {
  const sign = value < 0 ? "-" : "";
  return `${sign}Rp ${Math.round(Math.abs(value)).toLocaleString("id-ID")}`;
}

function sanitizeForPdf(text: string): string {
  return text.replace(/ /g, " ");
}

const FONT = "Satoshi";

async function registerSatoshiFont(doc: jsPDF): Promise<void> {
  const { SATOSHI_REGULAR_BASE64, SATOSHI_BOLD_BASE64 } = await import("./pdfFonts");
  doc.addFileToVFS("Satoshi-Regular.ttf", SATOSHI_REGULAR_BASE64);
  doc.addFont("Satoshi-Regular.ttf", FONT, "normal");
  doc.addFileToVFS("Satoshi-Bold.ttf", SATOSHI_BOLD_BASE64);
  doc.addFont("Satoshi-Bold.ttf", FONT, "bold");
}

export async function downloadLaporanPdf(
  input: LaporanPdfInput,
  filename: string,
): Promise<void> {
  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  await registerSatoshiFont(doc);
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 40;
  const contentWidth = pageWidth - marginX * 2;

  function drawPageFooter(pageNumber: number, pageCount: number) {
    doc.setFont(FONT, "normal");
    doc.setFontSize(8);
    doc.setTextColor(...COLOR_MUTED);
    doc.text("Bank Mini NUSA – Laporan Keuangan", marginX, pageHeight - 20);
    doc.text(`Halaman ${pageNumber} / ${pageCount}`, pageWidth - marginX, pageHeight - 20, {
      align: "right",
    });
  }

  function ensureSpace(currentY: number, needed: number): number {
    if (currentY + needed > pageHeight - 44) {
      doc.addPage();
      return 40;
    }
    return currentY;
  }

  doc.setFont(FONT, "bold");
  doc.setFontSize(16);
  doc.setTextColor(...COLOR_PRIMARY);
  doc.text("Bank Mini NUSA", marginX, 40);

  doc.setFont(FONT, "normal");
  doc.setFontSize(10.5);
  doc.setTextColor(...COLOR_INK);
  doc.text(input.title, marginX, 57);

  doc.setFontSize(8.5);
  doc.setTextColor(...COLOR_MUTED);
  doc.text(`Periode: ${input.periodeLabel}`, pageWidth - marginX, 40, { align: "right" });
  doc.text(`Dicetak: ${input.dicetakLabel}`, pageWidth - marginX, 52, { align: "right" });

  doc.setDrawColor(...COLOR_BORDER);
  doc.setLineWidth(1);
  doc.line(marginX, 68, pageWidth - marginX, 68);

  const pendapatanRows = input.rows.filter((r) => r.jenis === "setor");
  const pengeluaranRows = input.rows.filter((r) => r.jenis === "tarik");
  const totalPendapatan = pendapatanRows.reduce((sum, r) => sum + r.jumlah, 0);
  const totalPengeluaran = pengeluaranRows.reduce((sum, r) => sum + r.jumlah, 0);
  const saldo = totalPendapatan - totalPengeluaran;

  function drawSection(
    heading: string,
    subtitle: string,
    color: [number, number, number],
    colorLight: [number, number, number],
    keteranganHeader: string,
    rows: LaporanPdfRow[],
    total: number,
    totalLabel: string,
    startY: number,
  ): number {
    let y = ensureSpace(startY, 74);

    doc.setFillColor(...color);
    doc.roundedRect(marginX, y, 92, 20, 4, 4, "F");
    doc.setFont(FONT, "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(255, 255, 255);
    doc.text(heading.toUpperCase(), marginX + 46, y + 13.5, { align: "center" });

    doc.setFont(FONT, "normal");
    doc.setFontSize(8);
    doc.setTextColor(...COLOR_MUTED);
    doc.text(subtitle, marginX + 100, y + 13.5);
    doc.setTextColor(...COLOR_INK);

    const body =
      rows.length > 0
        ? rows.map((r, i) => [
            String(i + 1),
            r.tanggal,
            sanitizeForPdf(r.keterangan || "-"),
            sanitizeForPdf(r.nasabah),
            formatRupiah(r.jumlah),
          ])
        : [["-", "-", "Tidak ada data pada periode ini", "-", "-"]];

    autoTable(doc, {
      startY: y + 30,
      head: [["No", "Tanggal", keteranganHeader, "Nasabah", "Jumlah (Rp)"]],
      body,
      theme: "grid",
      styles: {
        font: FONT,
        fontSize: 8,
        cellPadding: 5.5,
        valign: "middle",
        lineColor: COLOR_BORDER,
        lineWidth: 0.6,
        textColor: COLOR_INK,
      },
      headStyles: { fillColor: color, textColor: 255, fontStyle: "bold", fontSize: 8 },
      alternateRowStyles: { fillColor: colorLight },
      columnStyles: {
        0: { cellWidth: 26, halign: "center" },
        1: { cellWidth: 66 },
        3: { cellWidth: 90 },
        4: { cellWidth: 92, halign: "right", fontStyle: "bold" },
      },
      margin: { left: marginX, right: marginX },
    });

    const afterTableY = (doc as any).lastAutoTable.finalY as number;
    y = ensureSpace(afterTableY + 10, 30);

    const chipWidth = 200;
    const chipX = pageWidth - marginX - chipWidth;
    doc.setFillColor(...colorLight);
    doc.setDrawColor(...color);
    doc.setLineWidth(0.75);
    doc.roundedRect(chipX, y, chipWidth, 24, 4, 4, "FD");

    doc.setFont(FONT, "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(...color);
    doc.text(totalLabel, chipX + 10, y + 15.5);
    doc.text(formatRupiah(total), chipX + chipWidth - 10, y + 15.5, { align: "right" });
    doc.setTextColor(...COLOR_INK);

    return y + 24 + 26;
  }

  let cursorY = drawSection(
    "Pendapatan",
    "Rincian seluruh dana masuk (setoran) pada periode ini",
    COLOR_PENDAPATAN,
    COLOR_PENDAPATAN_LIGHT,
    "Sumber Pendapatan",
    pendapatanRows,
    totalPendapatan,
    "Total Pendapatan",
    76,
  );

  cursorY = drawSection(
    "Pengeluaran",
    "Rincian seluruh dana keluar (penarikan) pada periode ini",
    COLOR_PENGELUARAN,
    COLOR_PENGELUARAN_LIGHT,
    "Keterangan Pengeluaran",
    pengeluaranRows,
    totalPengeluaran,
    "Total Pengeluaran",
    cursorY,
  );

  const summaryHeight = 92;
  cursorY = ensureSpace(cursorY, summaryHeight + 10);

  doc.setFillColor(...COLOR_PRIMARY_LIGHT);
  doc.setDrawColor(...COLOR_PRIMARY);
  doc.setLineWidth(0.75);
  doc.roundedRect(marginX, cursorY, contentWidth, summaryHeight, 6, 6, "FD");

  doc.setFont(FONT, "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(...COLOR_PRIMARY);
  doc.text("RINGKASAN SALDO", marginX + 16, cursorY + 22);

  doc.setDrawColor(...COLOR_BORDER);
  doc.setLineWidth(0.5);
  doc.line(marginX + 16, cursorY + 30, pageWidth - marginX - 16, cursorY + 30);

  doc.setFont(FONT, "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...COLOR_PENDAPATAN);
  doc.text("Total Pendapatan", marginX + 16, cursorY + 48);
  doc.setFont(FONT, "bold");
  doc.text(formatRupiah(totalPendapatan), pageWidth - marginX - 16, cursorY + 48, {
    align: "right",
  });

  doc.setFont(FONT, "normal");
  doc.setTextColor(...COLOR_PENGELUARAN);
  doc.text("Total Pengeluaran", marginX + 16, cursorY + 64);
  doc.setFont(FONT, "bold");
  doc.text(formatRupiah(totalPengeluaran), pageWidth - marginX - 16, cursorY + 64, {
    align: "right",
  });

  doc.setDrawColor(...COLOR_PRIMARY);
  doc.setLineWidth(0.75);
  doc.line(marginX + 16, cursorY + 72, pageWidth - marginX - 16, cursorY + 72);

  const saldoColor = saldo >= 0 ? COLOR_PENDAPATAN : COLOR_PENGELUARAN;
  doc.setFont(FONT, "bold");
  doc.setFontSize(11.5);
  doc.setTextColor(...COLOR_PRIMARY);
  doc.text("Saldo Akhir (Pendapatan - Pengeluaran)", marginX + 16, cursorY + 86);
  doc.setTextColor(...saldoColor);
  doc.text(formatRupiah(saldo), pageWidth - marginX - 16, cursorY + 86, { align: "right" });

  const pageCount = doc.getNumberOfPages();
  for (let pageNumber = 1; pageNumber <= pageCount; pageNumber++) {
    doc.setPage(pageNumber);
    drawPageFooter(pageNumber, pageCount);
  }

  doc.save(filename);
}

export interface SimpananPdfRow {
  nama: string;
  simpananPokok: number;
  simpananWajib: number;
  jumlah: number;
}

export interface SimpananPdfInput {
  perTanggalLabel: string;
  tahun: number;
  rows: SimpananPdfRow[];
}

const NAMA_BANK = "BANK MINI NUSA";
const NAMA_SEKOLAH = "SMK MA'ARIF NU 01 LIMPUNG";
const MARGIN_2CM = 57;
const COLOR_BORDER_DARK: [number, number, number] = [71, 85, 105];

export async function downloadSimpananPdf(
  input: SimpananPdfInput,
  filename: string,
): Promise<void> {
  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  await registerSatoshiFont(doc);
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = MARGIN_2CM;

  function drawPageFooter(pageNumber: number, pageCount: number) {
    doc.setFont(FONT, "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...COLOR_MUTED);
    doc.text("Bank Mini NUSA – Simpanan Pokok & Wajib", marginX, pageHeight - 28);
    doc.text(`Halaman ${pageNumber} dari ${pageCount}`, pageWidth - marginX, pageHeight - 28, {
      align: "right",
    });
  }

  doc.setFont(FONT, "bold");
  doc.setTextColor(...COLOR_INK);
  doc.setFontSize(14);
  doc.text("DAFTAR SIMPANAN POKOK DAN SIMPANAN WAJIB ANGGOTA", pageWidth / 2, marginX, {
    align: "center",
  });
  doc.setFontSize(12);
  doc.setTextColor(...COLOR_PRIMARY);
  doc.text(NAMA_BANK, pageWidth / 2, marginX + 19, { align: "center" });
  doc.setTextColor(...COLOR_INK);
  doc.text(NAMA_SEKOLAH, pageWidth / 2, marginX + 37, { align: "center" });
  doc.setFont(FONT, "normal");
  doc.setFontSize(10.5);
  doc.setTextColor(...COLOR_MUTED);
  doc.text(`Per. ${input.perTanggalLabel}`, pageWidth / 2, marginX + 54, { align: "center" });

  doc.setDrawColor(...COLOR_PRIMARY);
  doc.setLineWidth(1.25);
  doc.line(marginX, marginX + 66, pageWidth - marginX, marginX + 66);

  const totalPokok = input.rows.reduce((sum, r) => sum + r.simpananPokok, 0);
  const totalWajib = input.rows.reduce((sum, r) => sum + r.simpananWajib, 0);
  const totalJumlah = input.rows.reduce((sum, r) => sum + r.jumlah, 0);

  const body =
    input.rows.length > 0
      ? input.rows.map((r, i) => [
          String(i + 1),
          sanitizeForPdf(r.nama),
          formatRupiah(r.simpananPokok),
          formatRupiah(r.simpananWajib),
          formatRupiah(r.jumlah),
        ])
      : [["-", "Belum ada anggota terdaftar", "-", "-", "-"]];

  autoTable(doc, {
    startY: marginX + 82,
    head: [
      [
        { content: "NO", rowSpan: 2 },
        { content: "NAMA ANGGOTA", rowSpan: 2 },
        { content: `TAHUN ${input.tahun}`, colSpan: 2 },
        { content: "JUMLAH", rowSpan: 2 },
      ],
      [{ content: "SIMPANAN POKOK" }, { content: "SIMPANAN WAJIB" }],
    ],
    body: [
      ...body,
      [
        { content: "JUMLAH KESELURUHAN", colSpan: 2, styles: { fontStyle: "bold" } },
        { content: formatRupiah(totalPokok), styles: { fontStyle: "bold" } },
        { content: formatRupiah(totalWajib), styles: { fontStyle: "bold" } },
        { content: formatRupiah(totalJumlah), styles: { fontStyle: "bold" } },
      ],
    ],
    theme: "grid",
    styles: {
      font: FONT,
      fontSize: 9.5,
      cellPadding: 6,
      valign: "middle",
      lineColor: COLOR_BORDER_DARK,
      lineWidth: 0.75,
      textColor: COLOR_INK,
    },
    headStyles: {
      fillColor: COLOR_PRIMARY,
      textColor: 255,
      fontStyle: "bold",
      halign: "center",
      lineColor: COLOR_BORDER_DARK,
      lineWidth: 0.75,
    },
    bodyStyles: { halign: "left" },
    alternateRowStyles: { fillColor: COLOR_PRIMARY_LIGHT },
    columnStyles: {
      0: { cellWidth: 30, halign: "center" },
      1: { cellWidth: 168 },
      2: { cellWidth: 95, halign: "right" },
      3: { cellWidth: 95, halign: "right" },
      4: { cellWidth: 93, halign: "right", fontStyle: "bold" },
    },
    margin: { left: marginX, right: marginX },
    didParseCell: (data) => {
      if (data.section === "body" && data.row.index === body.length) {
        data.cell.styles.fillColor = COLOR_PRIMARY_LIGHT;
        data.cell.styles.textColor = COLOR_PRIMARY;
      }
    },
  });

  const pageCount = doc.getNumberOfPages();
  for (let pageNumber = 1; pageNumber <= pageCount; pageNumber++) {
    doc.setPage(pageNumber);
    drawPageFooter(pageNumber, pageCount);
  }

  doc.save(filename);
}

export interface PiutangPdfRow {
  noLabel: string;
  nama: string;
  pinjamanKeLabel: string;
  jumlahPinjaman: number;
  totalAngsuran: number;
  jasaAnggotaTotal: number;
  provisiAdm: number;
  saldo: number;
}

export interface PiutangPdfInput {
  periodeLabel: string;
  dicetakLabel: string;
  rows: PiutangPdfRow[];
}

export async function downloadPiutangPdf(
  input: PiutangPdfInput,
  filename: string,
): Promise<void> {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  await registerSatoshiFont(doc);
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = MARGIN_2CM;

  function drawPageFooter(pageNumber: number, pageCount: number) {
    doc.setFont(FONT, "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...COLOR_MUTED);
    doc.text("Bank Mini NUSA – Piutang Anggota", marginX, pageHeight - 28);
    doc.text(`Halaman ${pageNumber} dari ${pageCount}`, pageWidth - marginX, pageHeight - 28, {
      align: "right",
    });
  }

  doc.setFont(FONT, "bold");
  doc.setTextColor(...COLOR_INK);
  doc.setFontSize(14);
  doc.text("DAFTAR PIUTANG / PINJAMAN ANGGOTA", pageWidth / 2, marginX, { align: "center" });
  doc.setFontSize(12);
  doc.setTextColor(...COLOR_PRIMARY);
  doc.text(NAMA_BANK, pageWidth / 2, marginX + 19, { align: "center" });
  doc.setTextColor(...COLOR_INK);
  doc.text(NAMA_SEKOLAH, pageWidth / 2, marginX + 37, { align: "center" });
  doc.setFont(FONT, "normal");
  doc.setFontSize(10.5);
  doc.setTextColor(...COLOR_MUTED);
  doc.text(
    `Periode: ${input.periodeLabel}  •  Dicetak: ${input.dicetakLabel}`,
    pageWidth / 2,
    marginX + 54,
    { align: "center" },
  );

  doc.setDrawColor(...COLOR_PRIMARY);
  doc.setLineWidth(1.25);
  doc.line(marginX, marginX + 66, pageWidth - marginX, marginX + 66);

  const totalJumlahPinjaman = input.rows.reduce((sum, r) => sum + r.jumlahPinjaman, 0);
  const totalAngsuran = input.rows.reduce((sum, r) => sum + r.totalAngsuran, 0);
  const totalJasaAnggota = input.rows.reduce((sum, r) => sum + r.jasaAnggotaTotal, 0);
  const totalProvisiAdm = input.rows.reduce((sum, r) => sum + r.provisiAdm, 0);
  const totalSaldo = input.rows.reduce((sum, r) => sum + r.saldo, 0);

  const body =
    input.rows.length > 0
      ? input.rows.map((r) => [
          r.noLabel,
          sanitizeForPdf(r.nama),
          sanitizeForPdf(r.pinjamanKeLabel),
          formatRupiah(r.jumlahPinjaman),
          formatRupiah(r.totalAngsuran),
          formatRupiah(r.jasaAnggotaTotal),
          formatRupiah(r.provisiAdm),
          formatRupiah(r.saldo),
        ])
      : [["-", "Belum ada data piutang", "-", "-", "-", "-", "-", "-"]];

  autoTable(doc, {
    startY: marginX + 82,
    head: [
      [
        "NO",
        "NAMA DEBITUR",
        "PINJAMAN KE",
        "JUMLAH PINJAMAN",
        "TOTAL ANGSURAN",
        "JASA ANGGOTA",
        "PROVISI/ADM",
        "SALDO",
      ],
    ],
    body: [
      ...body,
      [
        { content: "JUMLAH KESELURUHAN", colSpan: 3, styles: { fontStyle: "bold" } },
        { content: formatRupiah(totalJumlahPinjaman), styles: { fontStyle: "bold" } },
        { content: formatRupiah(totalAngsuran), styles: { fontStyle: "bold" } },
        { content: formatRupiah(totalJasaAnggota), styles: { fontStyle: "bold" } },
        { content: formatRupiah(totalProvisiAdm), styles: { fontStyle: "bold" } },
        { content: formatRupiah(totalSaldo), styles: { fontStyle: "bold" } },
      ],
    ],
    theme: "grid",
    styles: {
      font: FONT,
      fontSize: 8.5,
      cellPadding: 5,
      valign: "middle",
      lineColor: COLOR_BORDER_DARK,
      lineWidth: 0.75,
      textColor: COLOR_INK,
    },
    headStyles: {
      fillColor: COLOR_PRIMARY,
      textColor: 255,
      fontStyle: "bold",
      halign: "center",
      lineColor: COLOR_BORDER_DARK,
      lineWidth: 0.75,
    },
    bodyStyles: { halign: "left" },
    alternateRowStyles: { fillColor: COLOR_PRIMARY_LIGHT },
    columnStyles: {
      0: { cellWidth: 30, halign: "center" },
      1: { cellWidth: 140 },
      2: { cellWidth: 80, halign: "center" },
      3: { cellWidth: 110, halign: "right" },
      4: { cellWidth: 110, halign: "right" },
      5: { cellWidth: 90, halign: "right" },
      6: { cellWidth: 90, halign: "right" },
      7: { cellWidth: 78, halign: "right", fontStyle: "bold" },
    },
    margin: { left: marginX, right: marginX },
    didParseCell: (data) => {
      if (data.section === "body" && data.row.index === body.length) {
        data.cell.styles.fillColor = COLOR_PRIMARY_LIGHT;
        data.cell.styles.textColor = COLOR_PRIMARY;
      }
    },
  });

  const pageCount = doc.getNumberOfPages();
  for (let pageNumber = 1; pageNumber <= pageCount; pageNumber++) {
    doc.setPage(pageNumber);
    drawPageFooter(pageNumber, pageCount);
  }

  doc.save(filename);
}

export interface SimpananHariRayaPdfRow {
  nama: string;
  jumlahSetoran: number;
  target: number;
  totalTerkumpul: number;
  lastPencairanJumlah: number;
  lastPencairanTanggalLabel: string;
}

export interface SimpananHariRayaPdfInput {
  perTanggalLabel: string;
  rows: SimpananHariRayaPdfRow[];
}

export async function downloadSimpananHariRayaPdf(
  input: SimpananHariRayaPdfInput,
  filename: string,
): Promise<void> {
  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  await registerSatoshiFont(doc);
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = MARGIN_2CM;

  function drawPageFooter(pageNumber: number, pageCount: number) {
    doc.setFont(FONT, "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...COLOR_MUTED);
    doc.text("Bank Mini NUSA – Simpanan Hari Raya", marginX, pageHeight - 28);
    doc.text(`Halaman ${pageNumber} dari ${pageCount}`, pageWidth - marginX, pageHeight - 28, {
      align: "right",
    });
  }

  doc.setFont(FONT, "bold");
  doc.setTextColor(...COLOR_INK);
  doc.setFontSize(14);
  doc.text("DAFTAR SIMPANAN HARI RAYA ANGGOTA", pageWidth / 2, marginX, { align: "center" });
  doc.setFontSize(12);
  doc.setTextColor(...COLOR_PRIMARY);
  doc.text(NAMA_BANK, pageWidth / 2, marginX + 19, { align: "center" });
  doc.setTextColor(...COLOR_INK);
  doc.text(NAMA_SEKOLAH, pageWidth / 2, marginX + 37, { align: "center" });
  doc.setFont(FONT, "normal");
  doc.setFontSize(10.5);
  doc.setTextColor(...COLOR_MUTED);
  doc.text(`Per. ${input.perTanggalLabel}`, pageWidth / 2, marginX + 54, { align: "center" });

  doc.setDrawColor(...COLOR_PRIMARY);
  doc.setLineWidth(1.25);
  doc.line(marginX, marginX + 66, pageWidth - marginX, marginX + 66);

  const totalTerkumpul = input.rows.reduce((sum, r) => sum + r.totalTerkumpul, 0);
  const totalSetoran = input.rows.reduce((sum, r) => sum + r.jumlahSetoran, 0);

  const body =
    input.rows.length > 0
      ? input.rows.map((r, i) => [
          String(i + 1),
          sanitizeForPdf(r.nama),
          `${r.jumlahSetoran}/${r.target} bulan`,
          formatRupiah(r.totalTerkumpul),
          r.lastPencairanJumlah > 0
            ? `${formatRupiah(r.lastPencairanJumlah)} (${r.lastPencairanTanggalLabel})`
            : "Belum pernah",
        ])
      : [["-", "Belum ada anggota terdaftar", "-", "-", "-"]];

  autoTable(doc, {
    startY: marginX + 82,
    head: [
      ["NO", "NAMA ANGGOTA", "JUMLAH SETORAN", "TOTAL TERKUMPUL", "PENCAIRAN TERAKHIR"],
    ],
    body: [
      ...body,
      [
        { content: "JUMLAH KESELURUHAN", colSpan: 2, styles: { fontStyle: "bold" } },
        {
          content: `${totalSetoran} setoran`,
          styles: { fontStyle: "bold", halign: "center" },
        },
        { content: formatRupiah(totalTerkumpul), styles: { fontStyle: "bold" } },
        { content: "-", styles: { fontStyle: "bold" } },
      ],
    ],
    theme: "grid",
    styles: {
      font: FONT,
      fontSize: 9.5,
      cellPadding: 6,
      valign: "middle",
      lineColor: COLOR_BORDER_DARK,
      lineWidth: 0.75,
      textColor: COLOR_INK,
    },
    headStyles: {
      fillColor: COLOR_PRIMARY,
      textColor: 255,
      fontStyle: "bold",
      halign: "center",
      lineColor: COLOR_BORDER_DARK,
      lineWidth: 0.75,
    },
    bodyStyles: { halign: "left" },
    alternateRowStyles: { fillColor: COLOR_PRIMARY_LIGHT },
    columnStyles: {
      0: { cellWidth: 28, halign: "center" },
      1: { cellWidth: 148 },
      2: { cellWidth: 90, halign: "center" },
      3: { cellWidth: 110, halign: "right" },
      4: { cellWidth: 105, halign: "left" },
    },
    margin: { left: marginX, right: marginX },
    didParseCell: (data) => {
      if (data.section === "body" && data.row.index === body.length) {
        data.cell.styles.fillColor = COLOR_PRIMARY_LIGHT;
        data.cell.styles.textColor = COLOR_PRIMARY;
      }
    },
  });

  const pageCount = doc.getNumberOfPages();
  for (let pageNumber = 1; pageNumber <= pageCount; pageNumber++) {
    doc.setPage(pageNumber);
    drawPageFooter(pageNumber, pageCount);
  }

  doc.save(filename);
}
