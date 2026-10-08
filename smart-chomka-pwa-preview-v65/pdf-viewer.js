import * as pdfjsLib from "./vendor/pdfjs/pdf.min.mjs";

pdfjsLib.GlobalWorkerOptions.workerSrc = "./vendor/pdfjs/pdf.worker.min.mjs";

const params = new URLSearchParams(window.location.search);
const fileUrl = params.get("file") || "./assets/references/maff_durian_pest_management.pdf";
const sourceUrl = params.get("source") || fileUrl;
const title = params.get("title") || "ឯកសារយោង";

const titleElement = document.querySelector("#viewerTitle");
const statusElement = document.querySelector("#viewerStatus");
const pagesElement = document.querySelector("#pdfPages");
const fallbackElement = document.querySelector("#pdfFallback");
const sourceLink = document.querySelector("#sourceLink");

titleElement.textContent = title;
sourceLink.href = sourceUrl;

renderPdf().catch((error) => {
  console.error(error);
  statusElement.textContent = "មិនអាចបើក PDF បាន។";
  fallbackElement.classList.remove("hidden");
});

async function renderPdf() {
  const loadingTask = pdfjsLib.getDocument({
    url: fileUrl,
    disableAutoFetch: false,
    disableStream: false,
  });
  const pdf = await loadingTask.promise;

  statusElement.textContent = `ឯកសារនេះមាន ${pdf.numPages} ទំព័រ។ កំពុងរៀបចំបង្ហាញ...`;

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    await renderPage(pdf, pageNumber);
    statusElement.textContent = `បានបង្ហាញ ${pageNumber}/${pdf.numPages} ទំព័រ`;
  }

  statusElement.textContent = "បើកឯកសាររួចរាល់។";
}

async function renderPage(pdf, pageNumber) {
  const page = await pdf.getPage(pageNumber);
  const containerWidth = Math.min(pagesElement.clientWidth || window.innerWidth - 24, 920);
  const viewport = page.getViewport({ scale: 1 });
  const scale = containerWidth / viewport.width;
  const scaledViewport = page.getViewport({ scale });
  const outputScale = Math.min(window.devicePixelRatio || 1, 2);

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { alpha: false });
  canvas.width = Math.floor(scaledViewport.width * outputScale);
  canvas.height = Math.floor(scaledViewport.height * outputScale);
  canvas.style.width = `${Math.floor(scaledViewport.width)}px`;
  canvas.style.height = `${Math.floor(scaledViewport.height)}px`;

  const wrapper = document.createElement("article");
  wrapper.className = "pdf-page";
  wrapper.append(canvas);

  const caption = document.createElement("small");
  caption.textContent = `ទំព័រ ${pageNumber}`;
  wrapper.append(caption);
  pagesElement.append(wrapper);

  await page.render({
    canvasContext: context,
    viewport: scaledViewport,
    transform: outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : null,
  }).promise;
}
