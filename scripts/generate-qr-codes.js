/**
 * CampusNav - Location QR Code Generator
 * Generates print-ready high-contrast PNGs, printable A4 PDF sheet, and manifest.
 */

const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');
const { Resvg } = require('@resvg/resvg-js');
const PDFDocument = require('pdfkit');

const BASE_URL = 'https://campusnav-ac0t.onrender.com/navigate.html';
const OUTPUT_DIR = path.join(__dirname, '..', 'qr-codes');

// Configurable list of selected campus landmarks (from window.CAMPUS_LOCATIONS)
const SELECTED_LOCATIONS = [
  {
    id: 'entrance',
    name: 'Main Entrance',
    category: 'Entrance / Campus Gateway',
    filename: 'entrance.png',
    description: 'Main campus entry gate connecting to Bhavan\'s College, SPIT, and SPCE.'
  },
  {
    id: 'spit',
    name: "Bhavan's Sardar Patel Institute of Technology (SPIT)",
    category: 'Academic Institute',
    filename: 'spit.png',
    description: 'Premier engineering institute with interactive multi-floor indoor navigation.'
  },
  {
    id: 'spce',
    name: 'SPCE',
    category: 'Academic College',
    filename: 'spce.png',
    description: 'Sardar Patel College of Engineering campus building.'
  },
  {
    id: 'library',
    name: 'Library',
    category: 'Academic Facility',
    filename: 'library.png',
    description: 'Central campus library and study centre.'
  },
  {
    id: 'canteen',
    name: 'Canteen',
    category: 'Student Facility / Dining',
    filename: 'canteen.png',
    description: 'Central campus cafeteria and food hub.'
  },
  {
    id: 'bhavans-college',
    name: "Bhavan's College",
    category: 'Academic College',
    filename: 'bhavans-college.png',
    description: 'Arts, Science and Commerce college building.'
  },
  {
    id: 'medical',
    name: 'Medical Centre',
    category: 'Emergency & Health',
    filename: 'medical.png',
    description: 'Campus medical first-aid clinic and health care centre.'
  }
];

function escapeXml(unsafe) {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
    }
  });
}

/**
 * Builds a print-ready standalone SVG card for a location QR code.
 */
async function buildSvgCard(loc, targetUrl) {
  // Generate high-resolution, high-error-correction QR code SVG
  const qrRawSvg = await QRCode.toString(targetUrl, {
    type: 'svg',
    margin: 2,
    errorCorrectionLevel: 'H',
    color: {
      dark: '#000000',
      light: '#ffffff'
    }
  });

  // Extract path and inner contents
  const innerQr = qrRawSvg
    .replace(/<\?xml[\s\S]*?\?>/, '')
    .replace(/<svg[^>]*>/, '')
    .replace(/<\/svg>/, '');

  const escapedName = escapeXml(loc.name);
  const nameFontSize = loc.name.length > 35 ? 24 : loc.name.length > 20 ? 28 : 34;
  
  // Multi-line wrap if needed
  let nameSvg = '';
  if (loc.name.length > 35) {
    const parts = loc.name.split(' (');
    if (parts.length === 2) {
      nameSvg = `
        <text x="400" y="775" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, sans-serif" font-size="25" font-weight="800" fill="#0f172a">${escapeXml(parts[0])}</text>
        <text x="400" y="805" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="700" fill="#475569">(${escapeXml(parts[1])}</text>
      `;
    } else {
      nameSvg = `<text x="400" y="790" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, sans-serif" font-size="${nameFontSize}" font-weight="800" fill="#0f172a">${escapedName}</text>`;
    }
  } else {
    nameSvg = `<text x="400" y="790" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, sans-serif" font-size="${nameFontSize}" font-weight="800" fill="#0f172a">${escapedName}</text>`;
  }

  const svg = `
<svg width="800" height="960" viewBox="0 0 800 960" xmlns="http://www.w3.org/2000/svg">
  <!-- Crisp high-contrast background -->
  <rect width="100%" height="100%" fill="#ffffff" />
  
  <!-- Subtle aesthetic outer frame -->
  <rect x="20" y="20" width="760" height="920" rx="28" fill="#ffffff" stroke="#e2e8f0" stroke-width="3" />
  
  <!-- Header Bar -->
  <g transform="translate(0, 52)">
    <rect x="310" y="0" width="180" height="32" rx="16" fill="#eff6ff" stroke="#bfdbfe" stroke-width="1.5" />
    <text x="400" y="21" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="800" letter-spacing="2.5" fill="#2563eb">CAMPUSNAV</text>
  </g>
  
  <!-- Top Location Label -->
  <text x="400" y="130" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, sans-serif" font-size="28" font-weight="800" fill="#0f172a">${escapedName}</text>
  <text x="400" y="156" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="600" fill="#64748b">STARTING LOCATION • SCAN FOR INSTANT ROUTE</text>

  <!-- QR Code Container Box -->
  <rect x="120" y="180" width="560" height="560" rx="24" fill="#ffffff" stroke="#cbd5e1" stroke-width="2" />
  <g transform="translate(140, 200)">
    <svg width="520" height="520" viewBox="0 0 520 520">
      ${innerQr}
    </svg>
  </g>
  
  <!-- Location Name Underneath QR -->
  ${nameSvg}
  
  <!-- Scan Call to Action -->
  <text x="400" y="855" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="700" fill="#4338ca">Scan to open CampusNav</text>
  <text x="400" y="888" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="600" fill="#94a3b8">navigate.html?start=${escapeXml(loc.id)}</text>
</svg>
  `.trim();

  return svg;
}

/**
 * Generate all individual PNG files.
 */
async function generatePngs() {
  console.log(`Generating ${SELECTED_LOCATIONS.length} individual QR code PNGs...`);
  
  for (const loc of SELECTED_LOCATIONS) {
    const targetUrl = `${BASE_URL}?start=${encodeURIComponent(loc.id)}`;
    const svg = await buildSvgCard(loc, targetUrl);
    
    const resvg = new Resvg(svg, {
      fitTo: { mode: 'width', value: 800 }
    });
    const pngData = resvg.render();
    const pngBuffer = pngData.asPng();
    
    const outputPath = path.join(OUTPUT_DIR, loc.filename);
    fs.writeFileSync(outputPath, pngBuffer);
    console.log(`✓ Generated ${loc.filename} (${pngBuffer.length} bytes) -> ${targetUrl}`);
  }
}

/**
 * Generate Printable A4 PDF sheet (2x2 grid per page).
 */
async function generatePdf() {
  console.log('\nGenerating printable A4 PDF sheet (campusnav-qr-sheet.pdf)...');
  const pdfPath = path.join(OUTPUT_DIR, 'campusnav-qr-sheet.pdf');
  
  const doc = new PDFDocument({
    size: 'A4',
    margin: 36
  });
  
  const stream = fs.createWriteStream(pdfPath);
  doc.pipe(stream);
  
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  
  // 2 columns x 2 rows = 4 per page
  const cols = 2;
  const rows = 2;
  const perPage = cols * rows;
  const totalPages = Math.ceil(SELECTED_LOCATIONS.length / perPage);
  
  for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
    if (pageIdx > 0) doc.addPage();
    
    // Header
    doc
      .fontSize(16)
      .font('Helvetica-Bold')
      .fillColor('#1e293b')
      .text('CampusNav — Physical Location QR Codes', 36, 36, { align: 'center', width: pageWidth - 72 });
    
    doc
      .fontSize(9)
      .font('Helvetica')
      .fillColor('#64748b')
      .text(`Printable Placards • Sheet ${pageIdx + 1} of ${totalPages} • Scan with phone camera to open live navigation`, 36, 56, { align: 'center', width: pageWidth - 72 });
    
    const pageItems = SELECTED_LOCATIONS.slice(pageIdx * perPage, (pageIdx + 1) * perPage);
    
    const cardWidth = 240;
    const cardHeight = 340;
    const startX = 46;
    const gapX = 24;
    const startY = 80;
    const gapY = 24;
    
    for (let i = 0; i < pageItems.length; i++) {
      const loc = pageItems[i];
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = startX + col * (cardWidth + gapX);
      const y = startY + row * (cardHeight + gapY);
      
      const targetUrl = `${BASE_URL}?start=${encodeURIComponent(loc.id)}`;
      const qrBuf = await QRCode.toBuffer(targetUrl, {
        margin: 1,
        width: 170,
        errorCorrectionLevel: 'H'
      });
      
      // Card border
      doc
        .roundedRect(x, y, cardWidth, cardHeight, 10)
        .lineWidth(1)
        .strokeColor('#cbd5e1')
        .fillColor('#ffffff')
        .fillAndStroke();
      
      // Header badge
      doc
        .fontSize(8)
        .font('Helvetica-Bold')
        .fillColor('#4338ca')
        .text('CAMPUSNAV START POINT', x, y + 14, { width: cardWidth, align: 'center' });
      
      // QR Code image
      doc.image(qrBuf, x + (cardWidth - 160) / 2, y + 36, { width: 160, height: 160 });
      
      // Location Name directly underneath
      doc
        .fontSize(11)
        .font('Helvetica-Bold')
        .fillColor('#0f172a')
        .text(loc.name, x + 8, y + 212, { width: cardWidth - 16, align: 'center' });
      
      // Caption
      doc
        .fontSize(9)
        .font('Helvetica-Bold')
        .fillColor('#2563eb')
        .text('Scan to open CampusNav', x + 8, y + 265, { width: cardWidth - 16, align: 'center' });
      
      doc
        .fontSize(7.5)
        .font('Helvetica')
        .fillColor('#64748b')
        .text(`ID: ${loc.id}`, x + 8, y + 282, { width: cardWidth - 16, align: 'center' });
      
      doc
        .fontSize(6.5)
        .font('Helvetica')
        .fillColor('#94a3b8')
        .text(targetUrl, x + 8, y + 298, { width: cardWidth - 16, align: 'center' });
    }
  }
  
  doc.end();
  
  await new Promise((resolve) => stream.on('finish', resolve));
  const stats = fs.statSync(pdfPath);
  console.log(`✓ Generated ${pdfPath} (${stats.size} bytes)`);
}

/**
 * Generate README manifest.
 */
function generateReadme() {
  console.log('\nGenerating manifest (qr-codes/README.md)...');
  const readmePath = path.join(OUTPUT_DIR, 'README.md');
  
  let md = `# CampusNav — Location QR Code Directory\n\n`;
  md += `This directory contains print-ready, high-contrast QR codes for key physical campus landmarks across the campus. Students can scan these physical QR placards using any standard smartphone camera to immediately launch CampusNav with their starting location automatically selected.\n\n`;
  
  md += `## Production Navigation Endpoint\n\n`;
  md += `* **Public Navigation URL**: [https://campusnav-ac0t.onrender.com/navigate.html](https://campusnav-ac0t.onrender.com/navigate.html)\n`;
  md += `* **Parameter Format**: \`https://campusnav-ac0t.onrender.com/navigate.html?start=<REAL_LOCATION_ID>\`\n`;
  md += `* **Authentication Requirement**: **None** (public entry point for all students & campus visitors)\n\n`;
  
  md += `## Selected Landmark Locations\n\n`;
  md += `| Display Name | Internal Location ID | Target Production URL | PNG Asset | Graph Supported |\n`;
  md += `| :--- | :--- | :--- | :--- | :---: |\n`;
  
  SELECTED_LOCATIONS.forEach((loc) => {
    const url = `${BASE_URL}?start=${loc.id}`;
    md += `| **${loc.name}** | \`${loc.id}\` | [\`${url}\`](${url}) | [\`${loc.filename}\`](./${loc.filename}) | ✅ Yes |\n`;
  });
  
  md += `\n## Generated Deliverables\n\n`;
  md += `1. **Individual Print-Ready PNGs** (\`qr-codes/<location-id>.png\`):\n`;
  SELECTED_LOCATIONS.forEach((loc) => {
    md += `   * [\`${loc.filename}\`](./${loc.filename}): High-resolution 800×960px QR placard with exact location display name, high-contrast black modules on white, and scan caption.\n`;
  });
  md += `2. **Printable Multi-QR PDF Sheet** ([\`campusnav-qr-sheet.pdf\`](./campusnav-qr-sheet.pdf)):\n`;
  md += `   * Standard A4 multi-page printable layout (2×2 placard grid) ready for printing on sticker paper or signboards.\n`;
  md += `3. **Regeneration Script** ([\`scripts/generate-qr-codes.js\`](../scripts/generate-qr-codes.js)):\n`;
  md += `   * Single-command script to regenerate all assets locally: \`node scripts/generate-qr-codes.js\` (or \`npm run generate-qr\`).\n\n`;
  
  md += `## How to Modify Selected Locations\n\n`;
  md += `To add, remove, or modify locations:\n`;
  md += `1. Edit the \`SELECTED_LOCATIONS\` array in \`scripts/generate-qr-codes.js\`.\n`;
  md += `2. Ensure the chosen location ID exists in \`window.CAMPUS_LOCATIONS\` ([frontend/js/graph-data.js](../frontend/js/graph-data.js)).\n`;
  md += `3. Run:\n`;
  md += `   \`\`\`bash\n`;
  md += `   node scripts/generate-qr-codes.js\n`;
  md += `   \`\`\`\n`;
  md += `4. Verify generated PNGs and the updated PDF.\n`;
  
  fs.writeFileSync(readmePath, md);
  console.log(`✓ Generated ${readmePath}`);
}

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  
  await generatePngs();
  await generatePdf();
  generateReadme();
  
  console.log('\nAll QR code assets successfully generated!');
}

main().catch((err) => {
  console.error('QR code generation failed:', err);
  process.exit(1);
});
