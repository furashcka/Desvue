<template>
  <main
    class="fixed inset-0"
    @dragenter.prevent="isDragging = true"
    @dragover.prevent
    @dragleave.prevent="isDragging = false"
    @drop.prevent="dropFile"
  >
    <input
      ref="fileInput"
      type="file"
      accept=".psd,.psb"
      hidden
      @change="chooseFile"
    />

    <section
      v-if="!psd"
      class="welcome-backdrop grid size-full place-items-center text-welcome-foreground"
    >
      <button
        class="flex min-h-[310px] w-[min(560px,calc(100vw-42px))] cursor-pointer flex-col items-center justify-center gap-2.5 rounded-xl border-2 border-dashed border-drop-border bg-drop-surface p-[50px] shadow-[0_28px_70px_var(--color-shadow-drop)] transition-[border-color,background-color] duration-150 ease-out hover:border-drop-border-hover hover:bg-control-surface focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent max-[760px]:min-h-[270px] max-[760px]:px-[25px] max-[760px]:py-[35px]"
        :class="isDragging ? 'border-drop-border-hover bg-control-surface' : ''"
        type="button"
        @click="fileInput?.click()"
      >
        <span class="mb-3 grid size-[68px] place-items-center rounded-[9px] border border-file-border bg-file-surface font-mono text-[15px] font-extrabold text-file-foreground">PSD</span>
        <strong class="text-[22px] leading-tight">{{ loading ? loadingText : "Open a PSD or PSB" }}</strong>
        <small class="text-[13px] text-muted">Drop a file here or click to choose</small>
      </button>

      <p v-if="error" class="absolute bottom-[58px] text-xs text-danger">{{ error }}</p>
    </section>

    <section v-else class="absolute inset-0 overflow-hidden bg-viewer">
      <div class="absolute inset-0 overflow-hidden">
        <div
          ref="canvasArea"
          class="canvas-checker absolute inset-0 touch-none overflow-hidden"
          :class="canvasCursorClass"
          @wheel.prevent="zoomWithWheel"
          @pointerdown="startCanvasAction"
          @pointermove="moveCanvas"
          @pointerup="stopCanvasAction"
          @pointercancel="stopCanvasAction"
          @pointerleave="leaveCanvas"
        >
          <canvas ref="canvas" class="absolute inset-0 block"></canvas>

          <div
            v-if="activeTool === 'eyedropper' && eyedropperVisible"
            class="pointer-events-none absolute z-[8] w-[104px] overflow-hidden rounded-md border border-loupe-border bg-welcome-base shadow-[0_6px_18px_var(--color-shadow-panel)]"
            :style="{ left: `${eyedropperX}px`, top: `${eyedropperY}px` }"
          >
            <canvas ref="colorLoupe" class="m-2 block size-[88px] rounded-sm" width="88" height="88"></canvas>
            <span class="block overflow-hidden border-t border-divider px-2 py-1.5 text-center font-mono text-[10px] text-text-strong text-ellipsis whitespace-nowrap">{{ colorCopied ? "Copied · " : "" }}{{ sampledColor }}</span>
          </div>
        </div>

        <nav
          class="absolute bottom-3 left-1/2 z-[5] flex -translate-x-1/2 items-center gap-[3px] rounded-md border border-chrome-border bg-chrome-surface p-[5px] shadow-[0_7px_24px_var(--color-shadow-toolbar)]"
          aria-label="Canvas tools"
        >
          <button
            class="group relative grid size-9 cursor-pointer place-items-center rounded border border-control-border bg-toolbar-button p-0 text-toolbar-foreground hover:border-control-border-hover hover:bg-control-hover hover:text-control-hover-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent aria-pressed:border-control-active-border aria-pressed:bg-control-active aria-pressed:text-white aria-pressed:shadow-[inset_0_1px_var(--color-shadow-highlight),0_2px_5px_var(--color-shadow-toast)]"
            type="button"
            title="Move and select (V)"
            :aria-pressed="activeTool === 'move'"
            @click="selectTool('move')"
          >
            <i class="fa-solid fa-arrow-pointer text-[15px]"></i><kbd class="absolute right-[3px] bottom-0.5 font-mono text-[8px] text-toolbar-key group-aria-pressed:text-control-active-key">V</kbd>
          </button>
          <button
            class="group relative grid size-9 cursor-pointer place-items-center rounded border border-control-border bg-toolbar-button p-0 text-toolbar-foreground hover:border-control-border-hover hover:bg-control-hover hover:text-control-hover-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent aria-pressed:border-control-active-border aria-pressed:bg-control-active aria-pressed:text-white aria-pressed:shadow-[inset_0_1px_var(--color-shadow-highlight),0_2px_5px_var(--color-shadow-toast)]"
            type="button"
            title="Move canvas (H or Space)"
            :aria-pressed="activeTool === 'hand'"
            @click="selectTool('hand')"
          >
            <i class="fa-solid fa-hand text-[15px]"></i><kbd class="absolute right-[3px] bottom-0.5 font-mono text-[8px] text-toolbar-key group-aria-pressed:text-control-active-key">H</kbd>
          </button>
          <button
            class="group relative grid size-9 cursor-pointer place-items-center rounded border border-control-border bg-toolbar-button p-0 text-toolbar-foreground hover:border-control-border-hover hover:bg-control-hover hover:text-control-hover-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent aria-pressed:border-control-active-border aria-pressed:bg-control-active aria-pressed:text-white aria-pressed:shadow-[inset_0_1px_var(--color-shadow-highlight),0_2px_5px_var(--color-shadow-toast)]"
            type="button"
            title="Eyedropper (I)"
            :aria-pressed="activeTool === 'eyedropper'"
            @click="selectTool('eyedropper')"
          >
            <i class="fa-solid fa-eye-dropper text-[15px]"></i><kbd class="absolute right-[3px] bottom-0.5 font-mono text-[8px] text-toolbar-key group-aria-pressed:text-control-active-key">I</kbd>
          </button>
          <button
            class="group relative grid size-9 cursor-pointer place-items-center rounded border border-control-border bg-toolbar-button p-0 text-toolbar-foreground hover:border-control-border-hover hover:bg-control-hover hover:text-control-hover-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent aria-pressed:border-control-active-border aria-pressed:bg-control-active aria-pressed:text-white aria-pressed:shadow-[inset_0_1px_var(--color-shadow-highlight),0_2px_5px_var(--color-shadow-toast)]"
            type="button"
            title="Measure area (M)"
            :aria-pressed="activeTool === 'measure'"
            @click="selectTool('measure')"
          >
            <i class="fa-solid fa-ruler-combined text-[15px]"></i><kbd class="absolute right-[3px] bottom-0.5 font-mono text-[8px] text-toolbar-key group-aria-pressed:text-control-active-key">M</kbd>
          </button>

          <span class="mx-0.5 h-[26px] w-px bg-toolbar-divider"></span>

          <div class="flex items-center gap-[3px]">
            <button class="relative grid size-9 cursor-pointer place-items-center rounded border border-control-border bg-toolbar-button p-0 text-toolbar-foreground hover:border-control-border-hover hover:bg-control-hover hover:text-control-hover-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent" type="button" title="Zoom out" @click="zoomOut">
              <i class="fa-solid fa-magnifying-glass-minus text-[15px]"></i>
            </button>
            <button class="relative grid size-9 cursor-pointer place-items-center rounded border border-control-border bg-toolbar-button p-0 text-toolbar-foreground hover:border-control-border-hover hover:bg-control-hover hover:text-control-hover-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent" type="button" title="Zoom in" @click="zoomIn">
              <i class="fa-solid fa-magnifying-glass-plus text-[15px]"></i>
            </button>
          </div>
        </nav>

        <button
          v-if="!showPanel"
          class="absolute top-3 left-3 z-[5] flex h-9 max-w-[250px] cursor-pointer items-center gap-2.5 rounded border border-chrome-border bg-chrome-surface px-2.5 text-control-foreground shadow-[0_4px_16px_var(--color-shadow-toast)] hover:border-control-border-hover hover:bg-control-surface hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          type="button"
          title="Show layers"
          @click="togglePanel"
        >
          <span class="max-w-[190px] overflow-hidden text-xs text-show-panel-foreground text-ellipsis whitespace-nowrap" :title="fileName">{{ fileName }}</span>
          <i class="fa-solid fa-table-columns shrink-0"></i>
        </button>

        <div v-if="loading" class="absolute right-[15px] bottom-[15px] z-20 flex max-w-[390px] items-center gap-2 rounded-[5px] border border-toast-border bg-toast-surface px-[11px] py-[9px] text-[11px] text-toast-foreground shadow-[0_8px_30px_var(--color-shadow-toast)]">
          <i class="size-3 animate-[spin-fast_750ms_linear_infinite] rounded-full border-[1.5px] border-spinner-border border-t-accent"></i>{{ loadingText }}
        </div>
        <div v-if="error" class="absolute right-[15px] bottom-[55px] z-20 flex max-w-[390px] items-center gap-2 rounded-[5px] border border-error-border bg-error-surface px-[11px] py-[9px] text-[11px] text-error-foreground shadow-[0_8px_30px_var(--color-shadow-toast)]">
          <span>{{ error }}</span>
          <button class="cursor-pointer border-0 bg-transparent p-0 text-error-action hover:text-error-foreground focus-visible:outline-2 focus-visible:outline-accent" type="button" @click="error = ''">✕</button>
        </div>
      </div>

      <aside v-if="showPanel" class="absolute top-2 left-2 z-10 flex max-h-[calc(100vh-16px)] min-h-40 w-[290px] flex-col overflow-hidden rounded-lg border border-panel-border bg-panel-surface text-white shadow-[0_4px_20px_var(--color-shadow-panel)] backdrop-blur-[10px] max-[760px]:w-[min(290px,calc(100vw-16px))]">
        <header class="flex h-11 shrink-0 items-center justify-between border-b border-panel-border bg-panel-header px-3.5">
          <div class="min-w-0">
            <strong class="block text-sm text-text-strong">Layers</strong>
          </div>
          <div class="flex shrink-0 items-center gap-0.5">
            <button class="size-7 cursor-pointer rounded border-0 bg-transparent p-0 text-panel-action hover:bg-panel-action-hover hover:text-white focus-visible:outline-2 focus-visible:outline-accent" type="button" title="Choose another file" @click="returnToStart">
              <i class="fa-solid fa-arrow-left"></i>
            </button>
            <button class="size-7 cursor-pointer rounded border-0 bg-transparent p-0 text-panel-action hover:bg-panel-action-hover hover:text-white focus-visible:outline-2 focus-visible:outline-accent" type="button" title="Hide panel" @click="togglePanel">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
        </header>

        <div class="min-h-[98px] max-h-[calc(100vh-62px)] flex-1 overflow-auto py-[7px] [scrollbar-color:var(--color-drop-border)_var(--color-list-track)] [scrollbar-width:thin]" role="tree" aria-label="PSD layers">
          <div
            class="flex h-[34px] w-full cursor-default items-center gap-[7px] overflow-hidden border-b border-row-divider bg-transparent px-[7px] text-left text-xs text-row-foreground hover:bg-row-hover"
            :class="documentSelected ? 'bg-control-surface text-white shadow-[inset_0_0_0_1px_var(--color-control-border)]' : ''"
            role="treeitem"
            :aria-expanded="documentExpanded"
            @click="selectDocument"
          >
            <button
              class="grid h-6 w-[18px] shrink-0 cursor-pointer place-items-center border-0 bg-transparent p-0 text-[11px] text-disclosure focus-visible:outline-2 focus-visible:outline-accent"
              type="button"
              :aria-label="documentExpanded ? 'Collapse document' : 'Expand document'"
              @click.stop="toggleDocumentGroup"
            >
              <i
                class="fa-solid fa-caret-right"
                :class="documentExpanded ? 'rotate-90' : ''"
              ></i>
            </button>
            <span class="flex h-5 w-7 shrink-0 items-center justify-center rounded-sm border border-document-border pt-px font-sans text-[7px] leading-2 font-bold text-document-foreground">{{ documentFormat }}</span>
            <span class="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap" :title="fileName">{{ fileName }}</span>
          </div>

          <div v-if="documentExpanded" role="group">
            <LayerRow
              v-for="layer in psd.layers"
              :key="layer.id"
              :layer="layer"
              :selected="selectedLayer"
              :visibility="visibility"
              :expanded="expanded"
              :busy-id="busyLayerId"
              :depth="1"
              @select="selectLayer"
              @toggle="toggleLayer"
              @expand="toggleGroup"
            />
          </div>
        </div>

      </aside>

      <aside v-if="selectedLayer || documentSelected" class="absolute top-2 right-2 z-10 max-h-[calc(100vh-16px)] w-[310px] overflow-hidden rounded-lg border border-panel-border bg-panel-surface text-white shadow-[0_4px_20px_var(--color-shadow-panel)] backdrop-blur-[10px] max-[760px]:w-[min(310px,calc(100vw-16px))]">
        <DocumentInspector
          v-if="documentSelected"
          :name="fileName"
          :width="psd.width"
          :height="psd.height"
          :layer-count="allLayers.length"
          :fonts="documentFonts"
          :colors="documentColors"
          :fonts-loading="documentFontsLoading"
          :preview-url="documentPreviewUrl"
          @export="exportDocument"
        />

        <LayerInspector
          v-else
          :layer="selectedLayer"
          :inspection="inspection"
          :generated-css="generatedCss"
          :preview-url="previewUrl"
          @export="exportLayer"
        />

      </aside>
    </section>
  </main>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import DocumentInspector from "@/components/DocumentInspector.vue";
import LayerInspector from "@/components/LayerInspector.vue";
import LayerRow from "@/components/LayerRow.vue";

const fileInput = ref(null);
const canvasArea = ref(null);
const canvas = ref(null);
const colorLoupe = ref(null);

const psd = ref(null);
const engine = ref(null);
const selectedLayer = ref(null);
const documentSelected = ref(false);
const documentExpanded = ref(true);
const hoveredLayer = ref(null);
const inspection = ref(null);
const generatedCss = ref(null);

const fileName = ref("");
const previewUrl = ref("");
const documentPreviewUrl = ref("");
const error = ref("");
const loadingText = ref("");
const loading = ref(false);
const isDragging = ref(false);
const showPanel = ref(true);
const busyLayerId = ref(null);
const documentFonts = ref([]);
const documentColors = ref([]);
const documentFontsLoading = ref(false);
const eyedropperVisible = ref(false);
const eyedropperX = ref(0);
const eyedropperY = ref(0);
const sampledColor = ref("");
const colorCopied = ref(false);
const measureRect = ref(null);
const measureHovering = ref(false);
const measureAction = ref("");
const measureEdge = ref("");

const visibility = ref(new Map());
const expanded = ref(new Set());
const tool = ref("move");
const spacePressed = ref(false);
const activeTool = computed(() => spacePressed.value ? "hand" : tool.value);
const canvasCursorClass = computed(() => {
  if (activeTool.value === "hand") return "cursor-grab active:cursor-grabbing";
  if (activeTool.value === "eyedropper") return "cursor-crosshair";
  if (activeTool.value !== "measure") return "cursor-default";
  if (measureAction.value === "move") return "cursor-grabbing";
  if (measureEdge.value === "left" || measureEdge.value === "right") {
    return "cursor-ew-resize";
  }
  if (measureEdge.value === "top" || measureEdge.value === "bottom") {
    return "cursor-ns-resize";
  }
  return measureHovering.value ? "cursor-grab" : "cursor-crosshair";
});
const documentFormat = computed(() => {
  return fileName.value.toLowerCase().endsWith(".psb") ? "PSB" : "PSD";
});
const zoom = ref(1);
const panX = ref(0);
const panY = ref(0);

let api = null;
let sourceCanvas = null;
let allLayers = [];
let layersById = new Map();
let resizeObserver = null;
let selectionRequest = 0;
let documentRequest = 0;
let documentFontsLoaded = false;
let activePointerId = null;
let pointerX = 0;
let pointerY = 0;
let pointerPanX = 0;
let pointerPanY = 0;
let measureStartPoint = null;
let measureStartRect = null;
const themeColors = new Map();

onMounted(init);
onBeforeUnmount(destroy);

async function chooseFile(event) {
  const file = event.target.files?.[0];

  event.target.value = "";
  if (file) await openFile(file);
}

async function dropFile(event) {
  isDragging.value = false;

  const file = event.dataTransfer?.files?.[0];
  if (file) await openFile(file);
}

async function openFile(file) {
  if (!/\.(psd|psb)$/i.test(file.name)) {
    error.value = "Choose a PSD or PSB file.";
    return;
  }

  loading.value = true;
  loadingText.value = "Opening document…";
  error.value = "";

  try {
    await releaseDocument();

    const documentApi = await getApi();
    if (!engine.value) engine.value = await documentApi.createEngine();

    psd.value = await documentApi.parse(engine.value, await file.arrayBuffer(), {
      onProgress: showProgress,
    });
    fileName.value = file.name;

    readLayers(psd.value.layers);
    await renderDocument();
    await nextTick();
    fitCanvas();
    selectDocument();
  } catch (cause) {
    error.value = getErrorMessage(cause, "Could not open this document.");
    await releaseDocument();
  } finally {
    loading.value = false;
  }
}

async function selectLayer(layer) {
  documentRequest += 1;
  documentSelected.value = false;
  selectedLayer.value = layer;
  hoveredLayer.value = null;
  inspection.value = null;
  generatedCss.value = null;
  clearPreview();
  revealLayer(layer);
  drawCanvas();

  const request = ++selectionRequest;

  try {
    const documentApi = await getApi();
    const details = await documentApi.inspect(psd.value, layer);
    if (request !== selectionRequest) return;

    inspection.value = details;
    generatedCss.value = documentApi.generateCss(details, { selector: false });

    await createPreview(layer, request);
  } catch (cause) {
    if (request === selectionRequest) {
      error.value = getErrorMessage(cause, `Could not inspect ${layer.name}.`);
    }
  }
}

async function selectDocument() {
  selectionRequest += 1;
  documentSelected.value = true;
  selectedLayer.value = null;
  hoveredLayer.value = null;
  inspection.value = null;
  generatedCss.value = null;
  clearPreview();
  drawCanvas();

  if (documentFontsLoaded) return;

  const request = ++documentRequest;
  const fonts = new Map();
  const colors = new Map();

  documentFontsLoading.value = true;
  documentFonts.value = [];
  documentColors.value = [];

  try {
    const documentApi = await getApi();

    for (const layer of allLayers) {
      let details;

      try {
        details = await documentApi.inspect(psd.value, layer);
      } catch {
        continue;
      }

      if (request !== documentRequest || !documentSelected.value) return;

      addFontUsage(fonts, details.text);
      addColors(colors, details);
    }

    documentFonts.value = formatFontUsage(fonts);
    documentColors.value = [...colors]
      .map(([value, count]) => ({ value, count }))
      .sort((left, right) => right.count - left.count);
    documentFontsLoaded = true;
  } catch (cause) {
    if (request === documentRequest) {
      error.value = getErrorMessage(cause, "Could not read document fonts.");
    }
  } finally {
    if (request === documentRequest) documentFontsLoading.value = false;
  }
}

async function toggleLayer(layer) {
  if (busyLayerId.value) return;

  const previous = isLayerVisible(layer);
  const next = !previous;

  busyLayerId.value = layer.id;
  setLayerVisibility(layer.id, next);

  try {
    const documentApi = await getApi();
    await documentApi.setLayer(psd.value, layer, { visible: next });
    await renderDocument();
  } catch (cause) {
    setLayerVisibility(layer.id, previous);
    error.value = getErrorMessage(cause, `Could not update ${layer.name}.`);
  } finally {
    busyLayerId.value = null;
  }
}

function toggleGroup(layer) {
  const next = new Set(expanded.value);

  if (next.has(layer.id)) next.delete(layer.id);
  else next.add(layer.id);

  expanded.value = next;
}

function togglePanel() {
  showPanel.value = !showPanel.value;
  nextTick(drawCanvas);
}

function selectTool(name) {
  if (window.document.activeElement instanceof HTMLButtonElement) {
    window.document.activeElement.blur();
  }

  tool.value = name;
  spacePressed.value = false;
  eyedropperVisible.value = false;
  colorCopied.value = false;
  measureHovering.value = false;
  measureEdge.value = "";
  hoveredLayer.value = null;
  drawCanvas();
}

function toggleDocumentGroup() {
  documentExpanded.value = !documentExpanded.value;
}

async function returnToStart() {
  error.value = "";
  fileName.value = "";
  await releaseDocument();
}

function zoomIn() {
  setZoom(zoom.value * 1.2);
}

function zoomOut() {
  setZoom(zoom.value / 1.2);
}

function fitCanvas() {
  if (!canvasArea.value || !psd.value) return;

  const width = canvasArea.value.clientWidth - 100;
  const height = canvasArea.value.clientHeight - 100;

  zoom.value = Math.min(width / psd.value.width, height / psd.value.height, 1);
  panX.value = 0;
  panY.value = 0;
  drawCanvas();
}

function zoomWithWheel(event) {
  if (!canvasArea.value || !psd.value) return;

  const rect = canvasArea.value.getBoundingClientRect();
  const cursorX = event.clientX - rect.left;
  const cursorY = event.clientY - rect.top;
  const point = getDocumentPoint(event);
  const nextZoom = Math.min(
    16,
    Math.max(0.025, zoom.value * (event.deltaY < 0 ? 1.1 : 0.9)),
  );

  panX.value = cursorX
    - rect.width / 2
    - nextZoom * (point.x - psd.value.width / 2);
  panY.value = cursorY
    - rect.height / 2
    - nextZoom * (point.y - psd.value.height / 2);
  zoom.value = nextZoom;
  drawCanvas();
}

function startCanvasAction(event) {
  if (event.button !== 0) return;

  if (activeTool.value === "move") {
    selectLayerAt(event);
    return;
  }

  if (activeTool.value === "eyedropper") {
    copyColorAt(event);
    return;
  }

  if (activeTool.value === "measure") {
    startMeasurement(event);
    return;
  }

  if (activeTool.value !== "hand") return;

  activePointerId = event.pointerId;
  measureAction.value = "pan";
  pointerX = event.clientX;
  pointerY = event.clientY;
  pointerPanX = panX.value;
  pointerPanY = panY.value;
  event.currentTarget.setPointerCapture(event.pointerId);
}

function moveCanvas(event) {
  if (event.pointerId === activePointerId) {
    if (
      measureAction.value === "draw"
      || measureAction.value === "move"
      || measureAction.value === "resize"
    ) {
      updateMeasurement(event);
      return;
    }

    panX.value = pointerPanX + event.clientX - pointerX;
    panY.value = pointerPanY + event.clientY - pointerY;
    drawCanvas();
    return;
  }

  if (activeTool.value === "eyedropper") {
    updateEyedropper(event);
    return;
  }

  if (activeTool.value === "measure") {
    updateMeasureHover(event);
    return;
  }

  if (activeTool.value === "move" && selectedLayer.value) hoverLayerAt(event);
}

function stopCanvasAction(event) {
  if (event.pointerId !== activePointerId) return;

  const wasMeasuring = measureAction.value === "draw"
    || measureAction.value === "move"
    || measureAction.value === "resize";
  if (wasMeasuring) updateMeasurement(event);
  if (
    measureAction.value === "draw"
    && measureRect.value
    && (measureRect.value.right === measureRect.value.left
      || measureRect.value.bottom === measureRect.value.top)
  ) {
    measureRect.value = null;
  }

  if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
    event.currentTarget.releasePointerCapture(event.pointerId);
  }
  activePointerId = null;
  measureAction.value = "";
  measureEdge.value = "";
  measureStartPoint = null;
  measureStartRect = null;
  if (activeTool.value === "measure") updateMeasureHover(event);
  if (wasMeasuring) drawCanvas();
}

function leaveCanvas(event) {
  if (event.pointerId === activePointerId) stopCanvasAction(event);
  eyedropperVisible.value = false;
  measureHovering.value = false;
  measureEdge.value = "";
  if (!hoveredLayer.value) return;

  hoveredLayer.value = null;
  drawCanvas();
}

async function exportLayer(format, scale, exportName) {
  if (!selectedLayer.value) return;

  loading.value = true;
  loadingText.value = `Exporting ${selectedLayer.value.name}…`;

  try {
    const documentApi = await getApi();
    const options = format === "svg"
      ? { format, isolate: true }
      : { format, scales: [scale], isolate: true };
    const [file] = await documentApi.convert(psd.value, selectedLayer.value, options);

    if (file) downloadFile(file, exportName);
  } catch (cause) {
    error.value = getErrorMessage(cause, "Could not export this layer.");
  } finally {
    loading.value = false;
  }
}

async function exportDocument(format, scale, exportName) {
  if (!sourceCanvas) return;

  loading.value = true;
  loadingText.value = `Exporting ${fileName.value}…`;

  try {
    const output = window.document.createElement("canvas");
    output.width = sourceCanvas.width * scale;
    output.height = sourceCanvas.height * scale;
    output.getContext("2d").drawImage(sourceCanvas, 0, 0, output.width, output.height);

    const mimeTypes = {
      png: "image/png",
      jpeg: "image/jpeg",
      webp: "image/webp",
    };
    const mimeType = mimeTypes[format];
    const blob = await encodeCanvas(output, mimeType);
    const extension = format === "jpeg" ? "jpg" : format;
    const name = fileName.value.replace(/\.(psd|psb)$/i, "") || "document";
    const suffix = scale > 1 ? `@${scale}x` : "";

    downloadFile({
      data: new Uint8Array(await blob.arrayBuffer()),
      format,
      mimeType,
      name: `${name}${suffix}.${extension}`,
      scale,
    }, exportName);
  } catch (cause) {
    error.value = getErrorMessage(cause, "Could not export this document.");
  } finally {
    loading.value = false;
  }
}

async function renderDocument() {
  const documentApi = await getApi();
  const frame = await documentApi.render(psd.value, { onProgress: showProgress });
  const pixels = readFramePixels(frame);

  sourceCanvas = window.document.createElement("canvas");
  sourceCanvas.width = frame.width;
  sourceCanvas.height = frame.height;
  sourceCanvas.getContext("2d").putImageData(
    new ImageData(pixels, frame.width, frame.height),
    0,
    0,
  );

  createDocumentPreview();
  drawCanvas();
}

function createDocumentPreview() {
  if (!sourceCanvas) return;

  const scale = Math.min(
    1,
    560 / sourceCanvas.width,
    320 / sourceCanvas.height,
  );
  const preview = window.document.createElement("canvas");

  preview.width = Math.max(1, Math.round(sourceCanvas.width * scale));
  preview.height = Math.max(1, Math.round(sourceCanvas.height * scale));
  preview.getContext("2d").drawImage(
    sourceCanvas,
    0,
    0,
    preview.width,
    preview.height,
  );
  documentPreviewUrl.value = preview.toDataURL("image/png");
}

function drawCanvas() {
  if (!canvas.value || !canvasArea.value || !psd.value || !sourceCanvas) return;

  const width = canvasArea.value.clientWidth;
  const height = canvasArea.value.clientHeight;
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

  canvas.value.width = Math.round(width * pixelRatio);
  canvas.value.height = Math.round(height * pixelRatio);
  canvas.value.style.width = `${width}px`;
  canvas.value.style.height = `${height}px`;

  const context = canvas.value.getContext("2d");
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  context.clearRect(0, 0, width, height);
  context.save();
  context.translate(width / 2 + panX.value, height / 2 + panY.value);
  context.scale(zoom.value, zoom.value);
  context.translate(-psd.value.width / 2, -psd.value.height / 2);
  context.imageSmoothingEnabled = zoom.value < 1;
  context.drawImage(sourceCanvas, 0, 0);
  context.strokeStyle = getThemeColor("--color-canvas-outline");
  context.lineWidth = 1 / zoom.value;
  context.strokeRect(0, 0, psd.value.width, psd.value.height);

  const selectedBounds = selectedLayer.value
    ? getSelectionBounds(selectedLayer.value)
    : null;

  if (selectedBounds) {
    drawSelection(context, selectedBounds);
  }

  if (selectedBounds && hoveredLayer.value) {
    drawMeasurements(
      context,
      selectedBounds,
      getSelectionBounds(hoveredLayer.value),
    );
  }


  if (tool.value === "measure" && measureRect.value) {
    drawMeasureRect(context, measureRect.value);
  }

  context.restore();
}

function drawMeasureRect(context, bounds) {
  const width = bounds.right - bounds.left;
  const height = bounds.bottom - bounds.top;
  if (width <= 0 || height <= 0) return;

  const documentWidth = psd.value.width;
  const documentHeight = psd.value.height;
  const lineWidth = 1 / zoom.value;

  context.save();
  context.fillStyle = getThemeColor("--color-measure-mask");
  context.fillRect(0, 0, documentWidth, bounds.top);
  context.fillRect(0, bounds.bottom, documentWidth, documentHeight - bounds.bottom);
  context.fillRect(0, bounds.top, bounds.left, height);
  context.fillRect(bounds.right, bounds.top, documentWidth - bounds.right, height);

  context.fillStyle = getThemeColor("--color-measure-fill");
  context.fillRect(bounds.left, bounds.top, width, height);

  context.strokeStyle = getThemeColor("--color-measure-guide");
  context.lineWidth = lineWidth;
  context.setLineDash([2 / zoom.value, 2 / zoom.value]);
  drawMeasureGuide(context, bounds.left, 0, bounds.left, documentHeight);
  drawMeasureGuide(context, bounds.right, 0, bounds.right, documentHeight);
  drawMeasureGuide(context, 0, bounds.top, documentWidth, bounds.top);
  drawMeasureGuide(context, 0, bounds.bottom, documentWidth, bounds.bottom);

  context.setLineDash([]);
  context.font = `600 ${12 / zoom.value}px ui-monospace, SFMono-Regular, monospace`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillStyle = getThemeColor("--color-measure-label");
  context.shadowColor = getThemeColor("--color-measure-label-shadow");
  context.shadowBlur = 3 / zoom.value;

  const labelOffset = 12 / zoom.value;
  const widthY = bounds.top > labelOffset * 2
    ? bounds.top - labelOffset
    : bounds.top + labelOffset;
  context.fillText(`${Math.round(width)}px`, (bounds.left + bounds.right) / 2, widthY);

  const heightX = bounds.left > labelOffset * 2
    ? bounds.left - labelOffset
    : bounds.left + labelOffset;
  context.save();
  context.translate(heightX, (bounds.top + bounds.bottom) / 2);
  context.rotate(-Math.PI / 2);
  context.fillText(`${Math.round(height)}px`, 0, 0);
  context.restore();
  context.restore();
}

function drawMeasureGuide(context, fromX, fromY, toX, toY) {
  context.beginPath();
  context.moveTo(fromX, fromY);
  context.lineTo(toX, toY);
  context.stroke();
}

function drawSelection(context, bounds) {
  const width = bounds.right - bounds.left;
  const height = bounds.bottom - bounds.top;
  if (width <= 0 || height <= 0) return;

  context.strokeStyle = getThemeColor("--color-accent");
  context.lineWidth = 2 / zoom.value;
  context.setLineDash([6 / zoom.value, 4 / zoom.value]);
  context.strokeRect(bounds.left, bounds.top, width, height);
}

function getSelectionBounds(layer) {
  const ownBounds = getValidBounds(layer.bounds);
  if (layer.type !== "group" || !layer.children.length) return ownBounds;

  const childBounds = layer.children
    .map(getSelectionBounds)
    .filter(Boolean);

  if (!childBounds.length) return ownBounds;

  return childBounds.reduce((result, bounds) => ({
    left: Math.min(result.left, bounds.left),
    top: Math.min(result.top, bounds.top),
    right: Math.max(result.right, bounds.right),
    bottom: Math.max(result.bottom, bounds.bottom),
  }));
}

function getValidBounds(bounds) {
  if (!bounds) return null;
  if (bounds.right <= bounds.left || bounds.bottom <= bounds.top) return null;

  return bounds;
}

function drawMeasurements(context, selected, hovered) {
  if (!hovered) return;

  const labelOffset = 9 / zoom.value;

  context.save();
  context.strokeStyle = getThemeColor("--color-measure-distance");
  context.fillStyle = getThemeColor("--color-measure-distance");
  context.lineWidth = 1 / zoom.value;
  context.font = `600 ${12 / zoom.value}px sans-serif`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.setLineDash([]);

  const horizontalY = Math.max(
    selected.top,
    Math.min((selected.top + selected.bottom) / 2, hovered.bottom),
  );

  if (selected.right < hovered.left) {
    drawHorizontalMeasure(context, selected.right, hovered.left, horizontalY, labelOffset);
  } else if (hovered.right < selected.left) {
    drawHorizontalMeasure(context, hovered.right, selected.left, horizontalY, labelOffset);
  } else {
    if (selected.left !== hovered.left) {
      drawHorizontalMeasure(
        context,
        Math.min(selected.left, hovered.left),
        Math.max(selected.left, hovered.left),
        horizontalY,
        labelOffset,
      );
    }
    if (selected.right !== hovered.right) {
      drawHorizontalMeasure(
        context,
        Math.min(selected.right, hovered.right),
        Math.max(selected.right, hovered.right),
        horizontalY,
        labelOffset,
      );
    }
  }

  const verticalX = Math.max(
    selected.left,
    Math.min((selected.left + selected.right) / 2, hovered.right),
  );

  if (selected.bottom < hovered.top) {
    drawVerticalMeasure(context, selected.bottom, hovered.top, verticalX, labelOffset);
  } else if (hovered.bottom < selected.top) {
    drawVerticalMeasure(context, hovered.bottom, selected.top, verticalX, labelOffset);
  } else {
    if (selected.top !== hovered.top) {
      drawVerticalMeasure(
        context,
        Math.min(selected.top, hovered.top),
        Math.max(selected.top, hovered.top),
        verticalX,
        labelOffset,
      );
    }
    if (selected.bottom !== hovered.bottom) {
      drawVerticalMeasure(
        context,
        Math.min(selected.bottom, hovered.bottom),
        Math.max(selected.bottom, hovered.bottom),
        verticalX,
        labelOffset,
      );
    }
  }

  context.setLineDash([4 / zoom.value, 4 / zoom.value]);
  context.strokeRect(
    hovered.left,
    hovered.top,
    hovered.right - hovered.left,
    hovered.bottom - hovered.top,
  );
  context.restore();
}

function drawHorizontalMeasure(context, from, to, y, labelOffset) {
  context.beginPath();
  context.moveTo(from, y);
  context.lineTo(to, y);
  context.stroke();
  context.fillText(`${Math.round(to - from)}px`, (from + to) / 2, y - labelOffset);
}

function drawVerticalMeasure(context, from, to, x, labelOffset) {
  context.beginPath();
  context.moveTo(x, from);
  context.lineTo(x, to);
  context.stroke();
  context.save();
  context.translate(x + labelOffset, (from + to) / 2);
  context.rotate(-Math.PI / 2);
  context.fillText(`${Math.round(to - from)}px`, 0, 0);
  context.restore();
}

function selectLayerAt(event) {
  const point = getDocumentPoint(event);
  const layer = findLayerAt(point);

  if (layer) selectLayer(layer);
  else clearSelection();
}

function hoverLayerAt(event) {
  const point = getDocumentPoint(event);
  const layer = findLayerAt(point, selectedLayer.value.id);
  if (layer?.id === hoveredLayer.value?.id) return;

  hoveredLayer.value = layer;
  drawCanvas();
}

function findLayerAt(point, ignoredId = null) {
  const candidates = allLayers.filter((layer) => {
    const bounds = layer.bounds;

    return layer.id !== ignoredId
      && layer.type !== "group"
      && isLayerEffectivelyVisible(layer)
      && point.x >= bounds.left
      && point.x <= bounds.right
      && point.y >= bounds.top
      && point.y <= bounds.bottom;
  });

  candidates.sort((left, right) => getLayerArea(left) - getLayerArea(right));
  return candidates[0] || null;
}

function getLayerArea(layer) {
  return (layer.bounds.right - layer.bounds.left)
    * (layer.bounds.bottom - layer.bounds.top);
}

function revealLayer(layer) {
  const next = new Set(expanded.value);
  let parent = layersById.get(layer.parentId);

  while (parent) {
    next.add(parent.id);
    parent = layersById.get(parent.parentId);
  }

  expanded.value = next;
  showPanel.value = true;
  nextTick(() => scrollToLayer(layer.id));
}

function scrollToLayer(id) {
  const rows = window.document.querySelectorAll("[data-layer-id]");
  const row = Array.from(rows).find((element) => element.dataset.layerId === id);

  row?.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function getDocumentPoint(event) {
  const rect = canvasArea.value.getBoundingClientRect();

  return {
    x: (event.clientX - rect.left - rect.width / 2 - panX.value) / zoom.value + psd.value.width / 2,
    y: (event.clientY - rect.top - rect.height / 2 - panY.value) / zoom.value + psd.value.height / 2,
  };
}

function getClampedDocumentPoint(event) {
  const point = getDocumentPoint(event);
  return {
    x: Math.round(Math.min(psd.value.width, Math.max(0, point.x))),
    y: Math.round(Math.min(psd.value.height, Math.max(0, point.y))),
  };
}

function startMeasurement(event) {
  const point = getClampedDocumentPoint(event);
  const current = measureRect.value;
  const edge = current ? getMeasureEdge(point, current) : "";
  const moving = current && !edge && isPointInsideBounds(point, current);

  activePointerId = event.pointerId;
  measureStartPoint = point;
  measureStartRect = edge || moving ? { ...current } : null;
  measureAction.value = edge ? "resize" : moving ? "move" : "draw";
  measureEdge.value = edge;
  measureHovering.value = moving;

  if (!edge && !moving) {
    measureRect.value = {
      left: point.x,
      top: point.y,
      right: point.x,
      bottom: point.y,
    };
  }

  event.currentTarget.setPointerCapture(event.pointerId);
  drawCanvas();
}

function updateMeasurement(event) {
  if (!measureStartPoint || !measureRect.value) return;
  const point = getClampedDocumentPoint(event);

  if (measureAction.value === "draw") {
    measureRect.value = {
      left: Math.min(measureStartPoint.x, point.x),
      top: Math.min(measureStartPoint.y, point.y),
      right: Math.max(measureStartPoint.x, point.x),
      bottom: Math.max(measureStartPoint.y, point.y),
    };
  } else if (measureAction.value === "move" && measureStartRect) {
    const width = measureStartRect.right - measureStartRect.left;
    const height = measureStartRect.bottom - measureStartRect.top;
    const left = Math.min(
      psd.value.width - width,
      Math.max(0, measureStartRect.left + point.x - measureStartPoint.x),
    );
    const top = Math.min(
      psd.value.height - height,
      Math.max(0, measureStartRect.top + point.y - measureStartPoint.y),
    );
    measureRect.value = {
      left,
      top,
      right: left + width,
      bottom: top + height,
    };
  } else if (measureAction.value === "resize" && measureStartRect) {
    const horizontalDelta = point.x - measureStartPoint.x;
    const verticalDelta = point.y - measureStartPoint.y;
    const next = { ...measureStartRect };

    if (measureEdge.value === "left") {
      next.left = Math.min(next.right - 1, Math.max(0, measureStartRect.left + horizontalDelta));
    } else if (measureEdge.value === "right") {
      next.right = Math.max(next.left + 1, Math.min(psd.value.width, measureStartRect.right + horizontalDelta));
    } else if (measureEdge.value === "top") {
      next.top = Math.min(next.bottom - 1, Math.max(0, measureStartRect.top + verticalDelta));
    } else if (measureEdge.value === "bottom") {
      next.bottom = Math.max(next.top + 1, Math.min(psd.value.height, measureStartRect.bottom + verticalDelta));
    }

    measureRect.value = next;
  }

  drawCanvas();
}

function updateMeasureHover(event) {
  const point = getDocumentPoint(event);
  const edge = measureRect.value ? getMeasureEdge(point, measureRect.value) : "";
  const hovering = Boolean(
    measureRect.value
    && !edge
    && isPointInsideBounds(point, measureRect.value),
  );
  measureEdge.value = edge;
  if (hovering !== measureHovering.value) measureHovering.value = hovering;
}

function getMeasureEdge(point, bounds) {
  const tolerance = 6 / zoom.value;
  const candidates = [
    ["left", Math.abs(point.x - bounds.left)],
    ["right", Math.abs(point.x - bounds.right)],
    ["top", Math.abs(point.y - bounds.top)],
    ["bottom", Math.abs(point.y - bounds.bottom)],
  ]
    .filter(([, distance]) => distance <= tolerance)
    .sort((left, right) => left[1] - right[1]);

  return candidates[0]?.[0] ?? "";
}

function isPointInsideBounds(point, bounds) {
  return point.x >= bounds.left
    && point.x <= bounds.right
    && point.y >= bounds.top
    && point.y <= bounds.bottom;
}

async function copyColorAt(event) {
  if (!updateEyedropper(event)) return;

  try {
    await navigator.clipboard.writeText(sampledColor.value);
    colorCopied.value = true;
    window.setTimeout(() => colorCopied.value = false, 1000);
  } catch (cause) {
    error.value = getErrorMessage(cause, "Could not copy this color.");
  }
}

function updateEyedropper(event) {
  if (!sourceCanvas || !canvasArea.value) return false;

  const point = getDocumentPoint(event);
  const pixelX = Math.floor(point.x);
  const pixelY = Math.floor(point.y);
  const isOutside = pixelX < 0
    || pixelY < 0
    || pixelX >= sourceCanvas.width
    || pixelY >= sourceCanvas.height;

  if (isOutside) {
    eyedropperVisible.value = false;
    return false;
  }

  const rect = canvasArea.value.getBoundingClientRect();
  const cursorX = event.clientX - rect.left;
  const cursorY = event.clientY - rect.top;
  const maxLeft = Math.max(8, rect.width - 112);
  const maxTop = Math.max(8, rect.height - 126);

  eyedropperX.value = Math.min(Math.max(8, cursorX + 18), maxLeft);
  eyedropperY.value = Math.min(Math.max(8, cursorY - 55), maxTop);
  sampledColor.value = readPixelColor(pixelX, pixelY);
  colorCopied.value = false;
  eyedropperVisible.value = true;

  nextTick(() => drawColorLoupe(pixelX, pixelY));
  return true;
}

function readPixelColor(x, y) {
  const [red, green, blue, alpha] = sourceCanvas
    .getContext("2d")
    .getImageData(x, y, 1, 1)
    .data;

  if (alpha < 255) {
    const opacity = Number((alpha / 255).toFixed(2));
    return `rgba(${red}, ${green}, ${blue}, ${opacity})`;
  }

  return `#${toHex(red)}${toHex(green)}${toHex(blue)}`;
}

function drawColorLoupe(x, y) {
  if (!colorLoupe.value || !sourceCanvas) return;

  const loupe = colorLoupe.value;
  const context = loupe.getContext("2d");
  const sampleSize = Math.min(11, sourceCanvas.width, sourceCanvas.height);
  const sourceX = Math.max(
    0,
    Math.min(sourceCanvas.width - sampleSize, x - Math.floor(sampleSize / 2)),
  );
  const sourceY = Math.max(
    0,
    Math.min(sourceCanvas.height - sampleSize, y - Math.floor(sampleSize / 2)),
  );
  const pixelSize = loupe.width / sampleSize;

  context.clearRect(0, 0, loupe.width, loupe.height);
  context.imageSmoothingEnabled = false;
  context.drawImage(
    sourceCanvas,
    sourceX,
    sourceY,
    sampleSize,
    sampleSize,
    0,
    0,
    loupe.width,
    loupe.height,
  );
  context.strokeStyle = getThemeColor("--color-loupe-selection");
  context.lineWidth = 1;
  context.strokeRect(
    (x - sourceX) * pixelSize,
    (y - sourceY) * pixelSize,
    pixelSize,
    pixelSize,
  );
}

function toHex(value) {
  return value.toString(16).padStart(2, "0");
}

function getThemeColor(name) {
  if (!themeColors.has(name)) {
    themeColors.set(
      name,
      getComputedStyle(document.documentElement).getPropertyValue(name).trim(),
    );
  }

  return themeColors.get(name);
}

async function createPreview(layer, request) {
  const documentApi = await getApi();
  const [file] = await documentApi.convert(psd.value, layer, {
    format: "png",
    scales: [1],
    isolate: true,
  });
  if (!file || request !== selectionRequest) return;

  previewUrl.value = URL.createObjectURL(
    new Blob([file.data], { type: file.mimeType }),
  );
}

function readLayers(layers) {
  allLayers = [];
  layersById = new Map();
  documentFonts.value = [];
  documentColors.value = [];
  documentFontsLoaded = false;

  const nextVisibility = new Map();
  const nextExpanded = new Set();

  walk(layers, 0);

  visibility.value = nextVisibility;
  expanded.value = nextExpanded;

  function walk(items, depth) {
    items.forEach((layer) => {
      allLayers.push(layer);
      layersById.set(layer.id, layer);
      nextVisibility.set(layer.id, layer.visible);
      if (layer.children.length && depth < 2) nextExpanded.add(layer.id);
      walk(layer.children, depth + 1);
    });
  }
}

function addFontUsage(fonts, text) {
  if (!text) return;

  const visited = new WeakSet();

  visit(text, "");

  function visit(value, inheritedFamily) {
    if (!value || typeof value !== "object") return;
    if (visited.has(value)) return;

    visited.add(value);

    const ownFamily = readFontFamily(value);
    const family = ownFamily || inheritedFamily;
    if (family && (ownFamily || hasFontDetails(value))) {
      recordFontUsage(fonts, family, value);
    }

    Object.values(value).forEach((child) => {
      visit(child, family);
    });
  }
}

function hasFontDetails(value) {
  return value.fontSize !== undefined
    || value.textSize !== undefined
    || value.fontWeight !== undefined
    || value.fontStyle !== undefined
    || value.styleName !== undefined
    || value.bold !== undefined
    || value.italic !== undefined;
}

function readFontFamily(value) {
  const candidates = [
    value.fontFamily,
    value.family,
    value.fontName,
    value.fontPostScriptName,
    value.postScriptName,
    value.typeface,
    typeof value.font === "string" ? value.font : null,
    value.font?.family,
    value.font?.name,
    value.font?.postScriptName,
  ];

  return candidates.find((name) => {
    return typeof name === "string" && name.trim();
  })?.trim() || "";
}

function recordFontUsage(fonts, family, value) {
  const style = readFontStyle(value);
  const size = Number(value.fontSize ?? value.textSize ?? value.size);
  const familyEntry = fonts.get(family) || new Map();
  const sizes = familyEntry.get(style) || new Set();

  if (Number.isFinite(size) && size > 0) sizes.add(Number(size.toFixed(2)));
  familyEntry.set(style, sizes);
  fonts.set(family, familyEntry);
}

function readFontStyle(value) {
  const namedStyle = value.fontStyle
    ?? value.styleName
    ?? (typeof value.style === "string" ? value.style : null)
    ?? value.font?.style;

  if (typeof namedStyle === "string" && namedStyle.trim()) {
    return namedStyle.trim();
  }

  const weight = Number(value.fontWeight ?? value.weight);
  const bold = value.bold === true || value.fauxBold === true || weight >= 600;
  const italic = value.italic === true || value.fauxItalic === true;

  if (bold && italic) return "Bold Italic";
  if (bold) return "Bold";
  if (italic) return "Italic";
  return "Regular";
}

function formatFontUsage(fonts) {
  return [...fonts]
    .map(([family, styles]) => {
      const formattedStyles = [...styles]
        .map(([name, sizes]) => ({
          name,
          sizes: [...sizes].sort((left, right) => left - right),
        }))
        .sort((left, right) => left.name.localeCompare(right.name));

      return {
        family,
        count: formattedStyles.reduce((total, style) => {
          return total + Math.max(1, style.sizes.length);
        }, 0),
        styles: formattedStyles,
      };
    })
    .sort((left, right) => left.family.localeCompare(right.family));
}

function addColors(colors, source) {
  const visited = new WeakSet();

  visit(source, "");

  function visit(value, key) {
    if (typeof value === "string") {
      if (isColorKey(key) && isCssColor(value)) recordColor(colors, value);
      return;
    }

    if (!value || typeof value !== "object") return;
    if (visited.has(value)) return;

    visited.add(value);

    const color = Array.isArray(value) && isColorKey(key)
      ? readStructuredColor({
        red: value[0],
        green: value[1],
        blue: value[2],
        alpha: value[3],
      })
      : readStructuredColor(value);
    if (color) recordColor(colors, color);

    Object.entries(value).forEach(([childKey, child]) => {
      visit(child, childKey);
    });
  }
}

function readStructuredColor(value) {
  const red = value.red ?? value.r;
  const green = value.green ?? value.g;
  const blue = value.blue ?? value.b;
  if (![red, green, blue].every(Number.isFinite)) return "";

  const maximum = Math.max(red, green, blue);
  const scale = maximum <= 1 ? 255 : 1;
  const channels = [red, green, blue].map((channel) => {
    return Math.round(Math.min(255, Math.max(0, channel * scale)));
  });
  const alpha = normalizeAlpha(value.alpha ?? value.a ?? value.opacity ?? 1);

  if (alpha < 1) {
    return `rgba(${channels.join(", ")}, ${Number(alpha.toFixed(2))})`;
  }

  return `#${channels.map(toHex).join("")}`;
}

function normalizeAlpha(value) {
  if (!Number.isFinite(value)) return 1;
  if (value <= 1) return Math.max(0, value);
  if (value <= 100) return value / 100;
  return Math.min(1, value / 255);
}

function isColorKey(key) {
  return /(color|fill|stroke|background)/i.test(key);
}

function isCssColor(value) {
  return /^(#|rgb\(|rgba\(|hsl\(|hsla\()/i.test(value.trim());
}

function recordColor(colors, value) {
  const normalized = value.toLowerCase();
  colors.set(normalized, (colors.get(normalized) || 0) + 1);
}

function isLayerVisible(layer) {
  return visibility.value.get(layer.id) ?? layer.visible;
}

function isLayerEffectivelyVisible(layer) {
  if (!isLayerVisible(layer)) return false;

  let parent = layersById.get(layer.parentId);
  while (parent) {
    if (!isLayerVisible(parent)) return false;
    parent = layersById.get(parent.parentId);
  }

  return true;
}

function setLayerVisibility(id, value) {
  const next = new Map(visibility.value);

  next.set(id, value);
  visibility.value = next;
}

function setZoom(value) {
  zoom.value = Math.min(16, Math.max(0.025, value));
  drawCanvas();
}

function readFramePixels(frame) {
  const rowSize = frame.width * 4;

  if (frame.stride === rowSize) {
    return new Uint8ClampedArray(
      frame.data.buffer,
      frame.data.byteOffset,
      frame.data.byteLength,
    );
  }

  const pixels = new Uint8ClampedArray(rowSize * frame.height);

  for (let row = 0; row < frame.height; row += 1) {
    const start = row * frame.stride;
    pixels.set(frame.data.subarray(start, start + rowSize), row * rowSize);
  }

  return pixels;
}

function encodeCanvas(canvas, mimeType) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("The browser could not encode this image."));
    }, mimeType, 1);
  });
}

function showProgress(progress) {
  const labels = {
    parse: "Reading PSD",
    render: "Rendering document",
    encode: "Encoding asset",
  };

  loadingText.value = `${labels[progress.stage]} · ${progress.percent}%`;
}

function downloadFile(file, exportName = "") {
  const url = URL.createObjectURL(new Blob([file.data], { type: file.mimeType }));
  const link = window.document.createElement("a");

  link.href = url;
  link.download = getExportFileName(file, exportName);
  link.click();

  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function getExportFileName(file, exportName) {
  if (!exportName) return file.name;

  const extension = file.format === "jpeg" ? "jpg" : file.format;
  const name = exportName
    .replace(/\.(png|jpe?g|webp|svg)$/i, "")
    .replace(/[\\/:*?"<>|]/g, "-");
  const scale = file.scale > 1 ? `@${file.scale}x` : "";

  return `${name}${scale}.${extension}`;
}

function clearSelection() {
  selectionRequest += 1;
  documentRequest += 1;
  documentSelected.value = false;
  selectedLayer.value = null;
  hoveredLayer.value = null;
  inspection.value = null;
  generatedCss.value = null;
  clearPreview();
  drawCanvas();
}

function clearPreview() {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
  previewUrl.value = "";
}

async function releaseDocument() {
  clearSelection();
  sourceCanvas = null;
  allLayers = [];
  layersById.clear();
  documentFonts.value = [];
  documentColors.value = [];
  documentFontsLoading.value = false;
  documentFontsLoaded = false;
  documentExpanded.value = true;
  documentPreviewUrl.value = "";
  eyedropperVisible.value = false;
  measureRect.value = null;
  measureHovering.value = false;
  measureAction.value = "";
  measureEdge.value = "";
  visibility.value = new Map();
  expanded.value = new Set();

  const current = psd.value;
  psd.value = null;

  if (current && api) await api.dispose(current);
}

async function getApi() {
  if (!api) {
    // Vite adds ?import to relative dynamic URLs in dev, which prevents files
    // in public from being served. An absolute URL keeps this a static request.
    const runtimeUrl = new URL(`${import.meta.env.BASE_URL}runtime/index.js`, window.location.href).href;
    api = await import(
      /* @vite-ignore */ runtimeUrl
    );
  }

  return api;
}

function getErrorMessage(cause, fallback) {
  return cause instanceof Error ? cause.message : fallback;
}

function handleKeyDown(event) {
  if (isTextInput(event.target)) return;

  if (event.code === "Space") {
    if (tool.value === "hand") return;

    spacePressed.value = true;
    event.preventDefault();
    return;
  }

  if (event.code === "KeyV") selectTool("move");
  if (event.code === "KeyH") selectTool("hand");
  if (event.code === "KeyI") selectTool("eyedropper");
  if (event.code === "KeyM") selectTool("measure");
  if (event.code === "KeyL") togglePanel();
  if (event.code === "Equal" || event.code === "NumpadAdd") zoomIn();
  if (event.code === "Minus" || event.code === "NumpadSubtract") zoomOut();
  if (event.code === "Digit0" || event.code === "Numpad0") fitCanvas();
  if (event.key === "Escape" && measureRect.value) {
    measureRect.value = null;
    measureHovering.value = false;
    measureEdge.value = "";
    drawCanvas();
  } else if (event.key === "Escape") {
    clearSelection();
  }
}

function handleKeyUp(event) {
  if (event.code === "Space") spacePressed.value = false;
}

function isTextInput(target) {
  return target instanceof HTMLElement
    && target.matches("input, textarea, select, [contenteditable='true']");
}

function init() {
  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("keyup", handleKeyUp);

  resizeObserver = new ResizeObserver(drawCanvas);
  if (canvasArea.value) resizeObserver.observe(canvasArea.value);
}

async function destroy() {
  resizeObserver?.disconnect();
  window.removeEventListener("keydown", handleKeyDown);
  window.removeEventListener("keyup", handleKeyUp);

  await releaseDocument();
  if (engine.value && api) await api.dispose(engine.value);
}
</script>
