import { defineConfig } from '@vite-pwa/assets-generator/config';

// Brand navy sampled from the logo artwork edges. Mobile launchers mask the
// square icon with their own shape (circle, squircle, rounded square), so any
// padding or transparency reads as a ring around the logo. Every generated
// size is therefore full-bleed and opaque, and the icon master already keeps
// the artwork inside the 80% maskable safe circle.
const ICON_BACKGROUND = '#050f1e';

export default defineConfig({
  preset: {
    transparent: {
      sizes: [64, 192, 512],
      favicons: [[48, 'favicon.ico']],
      padding: 0,
      resizeOptions: { fit: 'contain', background: ICON_BACKGROUND },
    },
    maskable: {
      sizes: [512],
      padding: 0,
      resizeOptions: { fit: 'contain', background: ICON_BACKGROUND },
    },
    apple: {
      sizes: [180],
      padding: 0,
      resizeOptions: { fit: 'contain', background: ICON_BACKGROUND },
    },
  },
  images: [
    'public/assets/images/new-logo/icon-master.png',
  ],
});
