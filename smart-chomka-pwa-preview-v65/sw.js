const CACHE_NAME = "smart-chomka-pwa-v117";

const APP_ASSETS = [
  "./customer-account.js?v=117",
  "./assets/market-farmer-hero.png",
  "./market-refresh.css?v=117",
  "./commerce-shop.js?v=117",
  "./supplier-market.js?v=117",
  "./supplier-catalog.js?v=117",
  "./market.js?v=117",
  "./market.css?v=117",
  "./",
  "./index.html",
  "./index.html?v=117",
  "./reset.html",
  "./pdf-viewer.html",
  "./pdf-viewer.html?v=117",
  "./styles.css",
  "./styles.css?v=117",
  "./pdf-viewer.css",
  "./pdf-viewer.css?v=117",
  "./app.js",
  "./app.js?v=117",
  "./realtime-config.js",
  "./realtime-config.js?v=117",
  "./pdf-viewer.js",
  "./pdf-viewer.js?v=117",
  "./manifest.webmanifest",
  "./manifest.webmanifest?v=117",
  "./assets/smart_chomka_logo.png",
  "./assets/farmer_ai_irrigation.svg",
  "./assets/farmer_remote_iot_ai.png",
  "./assets/fonts/noto-sans-khmer-khmer.woff2",
  "./assets/fonts/noto-sans-khmer-latin.woff2",
  "./assets/pesticide_safety_farmer.jpg",
  "./assets/disease_samples/algal_leaf_spot.jpg",
  "./assets/disease_samples/allocaridara_attack.jpg",
  "./assets/disease_samples/anthracnose.jpg",
  "./assets/disease_samples/canker_disease.jpg",
  "./assets/disease_user/durian_fruit_rot_user.png",
  "./assets/disease_samples/healthy_leaf.jpg",
  "./assets/disease_samples/leaf_blight.jpg",
  "./assets/disease_samples/mealybug_infestation.jpg",
  "./assets/disease_samples/phomopsis_leaf_spot.jpg",
  "./assets/disease_samples/pink_disease.jpg",
  "./assets/disease_guides_real/phytophthora_root_foot_rot.jpg",
  "./assets/disease_guides_real/sooty_mold_mealybug_risk.jpg",
  "./assets/disease_guides_real/stem_borer_damage.jpg",
  "./assets/disease_guides_real/fruit_borer_damage.jpg",
  "./assets/disease_guides_real/thrips_mite_damage.jpg",
  "./assets/disease_guides_real/leaf_blight_fungal_reference.jpg",
  "./assets/disease_guides_real/colletotrichum_leaf_spot.jpg",
  "./assets/disease_examples/algal_leaf_spot/ALGAL_LEAF_SPOT_test_1.jpg",
  "./assets/disease_examples/algal_leaf_spot/ALGAL_LEAF_SPOT_test_2.jpg",
  "./assets/disease_examples/algal_leaf_spot/ALGAL_LEAF_SPOT_test_3.jpg",
  "./assets/disease_examples/allocaridara_attack/ALLOCARIDARA_ATTACK_test_1.jpg",
  "./assets/disease_examples/allocaridara_attack/ALLOCARIDARA_ATTACK_test_2.jpg",
  "./assets/disease_examples/allocaridara_attack/ALLOCARIDARA_ATTACK_test_3.jpg",
  "./assets/disease_examples/anthracnose/ANTHRACNOSE_test_1.jpg",
  "./assets/disease_examples/anthracnose/ANTHRACNOSE_test_2.jpg",
  "./assets/disease_examples/anthracnose/ANTHRACNOSE_test_3.jpg",
  "./assets/disease_examples/canker_disease/CANKER_DISEASE_test_1.jpg",
  "./assets/disease_examples/canker_disease/CANKER_DISEASE_test_2.jpg",
  "./assets/disease_examples/canker_disease/CANKER_DISEASE_test_3.jpg",
  "./assets/disease_examples/fruit_rot/FRUIT_ROT_test_1.jpg",
  "./assets/disease_examples/fruit_rot/FRUIT_ROT_test_2.jpg",
  "./assets/disease_examples/fruit_rot/FRUIT_ROT_test_3.jpg",
  "./assets/disease_examples/healthy_leaf/HEALTHY_LEAF_test_1.jpg",
  "./assets/disease_examples/healthy_leaf/HEALTHY_LEAF_test_2.jpg",
  "./assets/disease_examples/healthy_leaf/HEALTHY_LEAF_test_3.jpg",
  "./assets/disease_examples/leaf_blight/LEAF_BLIGHT_test_1.jpg",
  "./assets/disease_examples/leaf_blight/LEAF_BLIGHT_test_2.jpg",
  "./assets/disease_examples/leaf_blight/LEAF_BLIGHT_test_3.jpg",
  "./assets/disease_examples/mealybug_infestation/MEALYBUG_INFESTATION_test_1.jpg",
  "./assets/disease_examples/mealybug_infestation/MEALYBUG_INFESTATION_test_2.jpg",
  "./assets/disease_examples/mealybug_infestation/MEALYBUG_INFESTATION_test_3.jpg",
  "./assets/disease_examples/phomopsis_leaf_spot/PHOMOPSIS_LEAF_SPOT_test_1.jpg",
  "./assets/disease_examples/phomopsis_leaf_spot/PHOMOPSIS_LEAF_SPOT_test_2.jpg",
  "./assets/disease_examples/phomopsis_leaf_spot/PHOMOPSIS_LEAF_SPOT_test_3.jpg",
  "./assets/disease_examples/pink_disease/PINK_DISEASE_test_1.jpg",
  "./assets/disease_examples/pink_disease/PINK_DISEASE_test_2.jpg",
  "./assets/disease_examples/pink_disease/PINK_DISEASE_test_3.jpg",
  "./assets/references/maff_durian_pest_management.pdf",
  "./assets/references/durian_avocado_pest_guide_kh.pdf",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
  "./assets/products/no_copper_front.webp",
  "./assets/products/no_copper_back.webp",
  "./assets/products/ut_insecticide.webp",
  "./assets/products/ag_perfect_72wp.webp",
  "./assets/products/ag_revus_opti.webp",
  "./assets/products/ag_folu.webp",
  "./assets/products/ag_anumanco.webp",
  "./assets/products/ag_tilt_super.webp",
  "./assets/products/ag_kon_neak6_front.webp",
  "./assets/products/ag_kon_neak6_back.webp",
  "./assets/products/ag_srakar_neak.webp",
  "./assets/products/ag_buta.webp",
  "./model/durianguard.onnx?v=88",
  "./model/model_metadata.json?v=88",
  "./vendor/onnxruntime-web/ort.wasm.min.js",
  "./vendor/onnxruntime-web/ort-wasm-simd-threaded.mjs",
  "./vendor/onnxruntime-web/ort-wasm-simd-threaded.wasm",
  "./vendor/pdfjs/pdf.min.mjs",
  "./vendor/pdfjs/pdf.worker.min.mjs",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
  );
  self.clients.claim();
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        const appClient = clientList.find((client) => client.url.includes("index.html"));
        if (appClient) {
          return appClient.focus();
        }
        return clients.openWindow("./index.html?v=117#home");
      })
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  const requestUrl = new URL(event.request.url);
  if (requestUrl.pathname.startsWith("/commerce-api/") || requestUrl.pathname.startsWith("/admin")) return;
  if (requestUrl.hostname === "api.open-meteo.com") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) {
        return cached;
      }

      return fetch(event.request).then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      });
    })
  );
});








