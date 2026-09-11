<template>
  <section class="thin-scrollbar max-h-[calc(100vh-16px)] w-full overflow-auto bg-inspector text-xs">
    <header class="sticky top-0 z-[2] flex h-11 items-center justify-between gap-3 border-b border-inspector-border bg-control-surface px-[13px]">
      <div class="min-w-0">
        <strong class="block font-mono text-[11px] font-bold tracking-[.12em] text-inspector-title">INSPECT</strong>
        <small class="mt-[3px] block max-w-[210px] overflow-hidden text-[11px] text-inspector-subtitle text-ellipsis whitespace-nowrap" :title="layer.name">{{ layer.name || "Untitled layer" }}</small>
      </div>
      <span class="font-mono text-[10px] text-inspector-type">{{ layer.type }}</span>
    </header>

    <div class="px-[13px] pb-[15px]">
      <section class="border-b border-section-divider py-3.5">
        <div class="mb-[9px] flex items-center justify-between gap-3">
          <h3 class="m-0 text-xs tracking-[.06em] text-heading uppercase">CSS</h3>
          <button class="h-7 min-w-[50px] cursor-pointer rounded border border-control-border bg-control-surface px-[9px] text-[11px] text-input-foreground hover:border-control-border-hover hover:text-white focus-visible:border-control-border-hover focus-visible:text-white focus-visible:outline-0 disabled:cursor-default disabled:opacity-40" type="button" :disabled="!generatedCss" @click="copyCss">
            {{ copied === "css" ? "Copied" : "Copy" }}
          </button>
        </div>
        <pre
          v-if="generatedCss"
          class="m-0 max-h-[235px] cursor-text overflow-auto rounded bg-code-surface p-2.5 font-mono text-xs leading-[1.6] text-code-foreground whitespace-pre-wrap break-words"
          data-copy-source="css"
          @mouseup="copySelection"
        ><code class="language-css" v-html="highlightedCss"></code></pre>
        <div v-else class="grid min-h-[42px] place-items-center rounded bg-welcome-base text-xs text-empty-foreground">Reading layer properties…</div>

        <ul v-if="generatedCss?.warnings.length" class="mt-[9px] grid list-none gap-1.5 p-0">
          <li class="border-l-2 border-warning bg-warning-surface px-2 py-[7px] text-[11px] leading-[1.4] text-warning-foreground" v-for="warning in generatedCss.warnings" :key="`${warning.code}:${warning.path}`">
            <strong class="block font-mono text-[10px] text-warning">{{ warning.code }}</strong>
            <span class="mt-0.5 block">{{ warning.message }}</span>
          </li>
        </ul>
      </section>

      <section v-if="textContent" class="border-b border-section-divider py-3.5">
        <div class="mb-[9px] flex items-center justify-between gap-3">
          <h3 class="m-0 text-xs tracking-[.06em] text-heading uppercase">Text</h3>
          <button class="h-7 min-w-[50px] cursor-pointer rounded border border-control-border bg-control-surface px-[9px] text-[11px] text-input-foreground hover:border-control-border-hover hover:text-white focus-visible:border-control-border-hover focus-visible:text-white focus-visible:outline-0" type="button" @click="copyText">
            {{ copied === "text" ? "Copied" : "Copy" }}
          </button>
        </div>
        <pre
          class="m-0 max-h-[90px] cursor-text overflow-auto rounded bg-code-surface p-2.5 font-mono text-xs leading-[1.6] text-code-foreground whitespace-pre-wrap break-words"
          data-copy-source="text"
          @mouseup="copySelection"
        >{{ textContent }}</pre>
      </section>

      <section class="border-b border-section-divider py-3.5">
        <h3 class="mb-[9px] text-xs tracking-[.06em] text-heading uppercase">Export</h3>
        <div class="preview-checker overflow-hidden">
          <img
            v-if="previewUrl"
            class="relative z-[1] block max-h-[115px] w-full bg-transparent object-contain"
            :src="previewUrl"
            :alt="layer.name"
          />
          <div v-else class="relative z-[1] grid h-[70px] w-full place-items-center rounded bg-welcome-base text-xs text-empty-foreground">Preparing preview…</div>
        </div>

        <label class="mt-2 block">
          <span class="sr-only">Name</span>
          <input
            class="h-7 w-full rounded border border-control-border bg-control-surface px-[9px] text-xs text-input-foreground placeholder:text-inspector-type hover:border-control-border-hover focus:border-control-border-hover focus:outline-0"
            v-model="exportName"
            type="text"
            :placeholder="layer.name || 'Untitled layer'"
            @keydown.enter="exportLayer"
          />
        </label>

        <div class="mt-2 grid grid-cols-[90px_1fr] gap-[7px]">
          <label class="min-w-0">
            <span class="sr-only">Scale</span>
            <select class="h-7 w-full cursor-pointer rounded border border-control-border bg-control-surface pr-[25px] pl-[9px] text-xs text-input-foreground hover:border-control-border-hover focus:border-control-border-hover focus:outline-0 disabled:cursor-default disabled:opacity-[.45]" v-model.number="exportScale" :disabled="exportFormat === 'svg'">
              <option :value="1">1x</option>
              <option :value="2">2x</option>
              <option :value="3">3x</option>
              <option :value="4">4x</option>
            </select>
          </label>

          <label class="min-w-0">
            <span class="sr-only">Format</span>
            <select class="h-7 w-full cursor-pointer rounded border border-control-border bg-control-surface pr-[25px] pl-[9px] text-xs text-input-foreground hover:border-control-border-hover focus:border-control-border-hover focus:outline-0" v-model="exportFormat">
              <option value="png">PNG</option>
              <option value="jpeg">JPG</option>
              <option value="webp">WebP</option>
              <option value="svg">SVG</option>
            </select>
          </label>
        </div>

        <button class="mt-[7px] h-[30px] w-full cursor-pointer overflow-hidden rounded border border-control-border bg-control-surface px-[9px] text-xs text-input-foreground text-ellipsis whitespace-nowrap hover:border-control-border-hover hover:text-white focus-visible:border-control-border-hover focus-visible:text-white focus-visible:outline-0" type="button" @click="exportLayer">
          Export {{ exportName.trim() || layer.name || "Untitled layer" }}
        </button>
      </section>

      <details v-if="isDevelopment" class="pt-[13px]">
        <summary class="cursor-pointer text-xs text-inspector-type">Raw inspection</summary>
        <pre class="mt-2 max-h-[235px] cursor-text overflow-auto rounded bg-code-surface p-2.5 font-mono text-xs leading-[1.6] text-code-foreground whitespace-pre-wrap break-words">{{ JSON.stringify(inspection, null, 2) }}</pre>
      </details>
    </div>
  </section>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import Prism from "prismjs";
import "prismjs/components/prism-css";

const props = defineProps({
  layer: { type: Object, required: true },
  inspection: { type: Object, default: null },
  generatedCss: { type: Object, default: null },
  previewUrl: { type: String, default: "" },
});

const emit = defineEmits(["export"]);

const isDevelopment = import.meta.env.DEV;
const copied = ref("");
const exportName = ref("");
const exportScale = ref(1);
const exportFormat = ref("png");
const textContent = computed(() => props.inspection?.text?.content || "");
const highlightedCss = computed(() => {
  if (!props.generatedCss) return "";

  return Prism.highlight(
    props.generatedCss.css,
    Prism.languages.css,
    "css",
  );
});

watch(() => props.layer.id, () => {
  exportName.value = "";
});

function exportLayer() {
  emit(
    "export",
    exportFormat.value,
    exportScale.value,
    exportName.value.trim(),
  );
}

async function copyCss() {
  if (!props.generatedCss) return;

  await copyToClipboard(props.generatedCss.css, "css");
}

async function copyText() {
  await copyToClipboard(textContent.value, "text");
}

async function copySelection(event) {
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed || !selection.rangeCount) return;

  const range = selection.getRangeAt(0);
  if (!event.currentTarget.contains(range.commonAncestorContainer)) return;

  await copyToClipboard(
    selection.toString(),
    event.currentTarget.dataset.copySource,
  );
}

async function copyToClipboard(value, source) {
  if (!value) return;

  await navigator.clipboard.writeText(value);
  copied.value = source;
  window.setTimeout(() => {
    if (copied.value === source) copied.value = "";
  }, 1200);
}
</script>
