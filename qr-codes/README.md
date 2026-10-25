# CampusNav — Location QR Code Directory

This directory contains print-ready, high-contrast QR codes for key physical campus landmarks across the campus. Students can scan these physical QR placards using any standard smartphone camera to immediately launch CampusNav with their starting location automatically selected.

## Production Navigation Endpoint

* **Public Navigation URL**: [https://campusnav-ac0t.onrender.com/navigate.html](https://campusnav-ac0t.onrender.com/navigate.html)
* **Parameter Format**: `https://campusnav-ac0t.onrender.com/navigate.html?start=<REAL_LOCATION_ID>`
* **Authentication Requirement**: **None** (public entry point for all students & campus visitors)

## Selected Landmark Locations

| Display Name | Internal Location ID | Target Production URL | PNG Asset | Graph Supported |
| :--- | :--- | :--- | :--- | :---: |
| **Main Entrance** | `entrance` | [`https://campusnav-ac0t.onrender.com/navigate.html?start=entrance`](https://campusnav-ac0t.onrender.com/navigate.html?start=entrance) | [`entrance.png`](./entrance.png) | ✅ Yes |
| **Bhavan's Sardar Patel Institute of Technology (SPIT)** | `spit` | [`https://campusnav-ac0t.onrender.com/navigate.html?start=spit`](https://campusnav-ac0t.onrender.com/navigate.html?start=spit) | [`spit.png`](./spit.png) | ✅ Yes |
| **SPCE** | `spce` | [`https://campusnav-ac0t.onrender.com/navigate.html?start=spce`](https://campusnav-ac0t.onrender.com/navigate.html?start=spce) | [`spce.png`](./spce.png) | ✅ Yes |
| **Library** | `library` | [`https://campusnav-ac0t.onrender.com/navigate.html?start=library`](https://campusnav-ac0t.onrender.com/navigate.html?start=library) | [`library.png`](./library.png) | ✅ Yes |
| **Canteen** | `canteen` | [`https://campusnav-ac0t.onrender.com/navigate.html?start=canteen`](https://campusnav-ac0t.onrender.com/navigate.html?start=canteen) | [`canteen.png`](./canteen.png) | ✅ Yes |
| **Bhavan's College** | `bhavans-college` | [`https://campusnav-ac0t.onrender.com/navigate.html?start=bhavans-college`](https://campusnav-ac0t.onrender.com/navigate.html?start=bhavans-college) | [`bhavans-college.png`](./bhavans-college.png) | ✅ Yes |
| **Medical Centre** | `medical` | [`https://campusnav-ac0t.onrender.com/navigate.html?start=medical`](https://campusnav-ac0t.onrender.com/navigate.html?start=medical) | [`medical.png`](./medical.png) | ✅ Yes |

## Generated Deliverables

1. **Individual Print-Ready PNGs** (`qr-codes/<location-id>.png`):
   * [`entrance.png`](./entrance.png): High-resolution 800×960px QR placard with exact location display name, high-contrast black modules on white, and scan caption.
   * [`spit.png`](./spit.png): High-resolution 800×960px QR placard with exact location display name, high-contrast black modules on white, and scan caption.
   * [`spce.png`](./spce.png): High-resolution 800×960px QR placard with exact location display name, high-contrast black modules on white, and scan caption.
   * [`library.png`](./library.png): High-resolution 800×960px QR placard with exact location display name, high-contrast black modules on white, and scan caption.
   * [`canteen.png`](./canteen.png): High-resolution 800×960px QR placard with exact location display name, high-contrast black modules on white, and scan caption.
   * [`bhavans-college.png`](./bhavans-college.png): High-resolution 800×960px QR placard with exact location display name, high-contrast black modules on white, and scan caption.
   * [`medical.png`](./medical.png): High-resolution 800×960px QR placard with exact location display name, high-contrast black modules on white, and scan caption.
2. **Printable Multi-QR PDF Sheet** ([`campusnav-qr-sheet.pdf`](./campusnav-qr-sheet.pdf)):
   * Standard A4 multi-page printable layout (2×2 placard grid) ready for printing on sticker paper or signboards.
3. **Regeneration Script** ([`scripts/generate-qr-codes.js`](../scripts/generate-qr-codes.js)):
   * Single-command script to regenerate all assets locally: `node scripts/generate-qr-codes.js` (or `npm run generate-qr`).

## How to Modify Selected Locations

To add, remove, or modify locations:
1. Edit the `SELECTED_LOCATIONS` array in `scripts/generate-qr-codes.js`.
2. Ensure the chosen location ID exists in `window.CAMPUS_LOCATIONS` ([frontend/js/graph-data.js](../frontend/js/graph-data.js)).
3. Run:
   ```bash
   node scripts/generate-qr-codes.js
   ```
4. Verify generated PNGs and the updated PDF.
