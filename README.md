# Air Mochi – live AQI version

This build keeps the retro pet device UI, but adds live AQI provider support.

## Recommended provider
Use **WAQI** for this project because the app generates Bangkok zones from station points.

## Setup
1. Copy `.env.example` to `.env`
2. Add your token
3. Run:

```bash
npm install
npm run dev
```

## Providers
- `VITE_AIR_PROVIDER=waqi` → fetch Bangkok stations inside the Bangkok bounds and rebuild Voronoi segments
- `VITE_AIR_PROVIDER=iqair` → update the seeded Bangkok points using IQAir nearest-city lookups

## Notes
- If no valid token is provided, the app falls back to seeded Bangkok demo data.
- Sanctuary polygons are still local override zones for gameplay.


## Mock Bangkok AQI dataset

This build uses the full user-provided Bangkok location dataset (446 seeded points) as the default station seed list. Live WAQI sync is still available through `.env` + the **SYNC** button.
