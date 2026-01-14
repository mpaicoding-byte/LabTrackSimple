# Extraction Research (Phase 4b)

## Context (from implementation plan + current architecture)
- Current pipeline uses `extract_report` (Supabase Edge Function) to read `lab_artifacts` from Supabase Storage and write `lab_results_staging` rows.
- Typical input is one report per run (PDF or images), usually 1-10 pages; rare max 15-20 pages.
- Goal for Phase 4b: choose a provider/approach and implement an extraction adapter with deterministic parsing and eval fixtures.

## LLMs vs OCR: what is actually different now
- Multimodal LLMs can read PDF/image inputs directly and produce structured JSON, which reduces the amount of layout/OCR code you write.
- They are not fully deterministic: you still need JSON schema validation, numeric parsing, and error handling to avoid hallucinated fields.
- OCR (traditional or managed) is still stronger at pure text fidelity, especially for low-quality scans; LLMs are stronger at mapping messy text to a structured schema.
- Best practical outcomes for lab reports usually come from a hybrid: extract text (PDF text layer or OCR), then use an LLM to map to schema.

## Option landscape

### Option A: LLM-first (multimodal) direct extraction
**How it works**
- Send PDF/images directly to an LLM model with a strict JSON schema for staging fields.
- Use structured outputs to force deterministic JSON.

**Notes from OpenAI docs (Context7)**
- PDF input can be sent to the Responses API with `input_file` and base64 data.
- Image input can be sent via `input_image` with a base64 data URL.
- Structured outputs support JSON schema with `strict: true` to enforce a fixed shape.

**Pros**
- Fast to build and iterate (one provider call).
- Strong at reasoning across inconsistent lab report formats.

**Cons**
- Higher per-request cost vs OCR-only.
- Output can still be wrong if the prompt or schema is weak.

**Fit with Supabase**
- Works inside `extract_report` using a simple HTTP call to the provider.
- For longer PDFs, consider async processing to avoid Edge Function timeouts.

### Option B: Managed Document AI / OCR
Examples: AWS Textract, Google Document AI, Azure Document Intelligence.

**Pros**
- More deterministic text extraction and table/key-value output.
- Often provides bounding boxes and confidence scores.

**Cons**
- Still needs mapping logic into `lab_results_staging`.
- Pricing is per page and can add up if you retry.

**Fit with Supabase**
- Best as an external worker (serverless or container) due to heavier SDKs.
- Edge Function can enqueue and poll results.

### Option C: OCR + LLM hybrid (recommended for budget/accuracy balance)
**How it works**
- If PDF has a text layer, extract text directly (no OCR).
- If image/scan, run OCR (open-source or managed).
- Feed the extracted text into an LLM with a strict schema.

**Pros**
- Cheaper than full multimodal LLM for long docs.
- More reliable text fidelity than LLM-only.

**Cons**
- Two-step pipeline and more moving parts.

**Fit with Supabase**
- OCR step likely needs a worker service (binaries not suited to Edge).
- LLM call can be done in Edge or the worker.

### Option D: Open-source DocAI / heuristic parsing
Examples: Tesseract, PaddleOCR, DocTR, Unstructured, LayoutLMv3/Donut.

**Pros**
- Lowest marginal cost once hosted.
- Full control over data flow and tuning.

**Cons**
- Highest engineering effort and ops.
- Accuracy can vary unless tuned with domain data.

**Fit with Supabase**
- Requires a separate service (container/VM). Edge Functions are not a great fit for OCR binaries or heavy ML runtimes.

## Hosting and architecture options (current stack alignment)

### 1) All-in Edge Function (simplest)
**Flow**
- `extract_report` fetches artifact, calls LLM provider, validates schema, inserts staging rows.

**When it works**
- Short PDFs or 1-5 images, low latency, low concurrency.

**Risks**
- Timeouts on larger PDFs, limited memory/CPU for OCR.

### 2) Edge Function + external worker (recommended)
**Flow**
- `extract_report` creates a job record and triggers a worker (HTTP or queue).
- Worker handles OCR/LLM, writes staging rows, updates status.

**When it works**
- Larger docs, OCR-heavy inputs, higher concurrency.

**Benefits**
- Lets you scale independently and use OCR binaries or GPU if needed.

### 3) Managed provider + minimal glue
**Flow**
- Edge Function only handles orchestration; provider handles OCR/structure.

**When it works**
- If you want fastest time-to-ship with acceptable cost.

## Pricing and budget analysis (model-agnostic)

### Cost drivers
- Pages and image resolution (drives OCR or vision token usage).
- Input/output tokens for LLM-based extraction.
- Retries and re-extraction frequency.
- Managed Doc AI per-page fees.

### Relative cost comparison (per 10-page report)
| Approach | Typical billing unit | Relative cost | Setup/ops effort | Notes |
| --- | --- | --- | --- | --- |
| LLM-first (multimodal) | tokens + image/pdf processing | Medium-High | Low | Fastest to build, cost scales with pages |
| Managed Doc AI | per page | Medium | Medium | Strong OCR fidelity, still needs mapping |
| OCR + LLM hybrid | OCR per page + LLM tokens | Low-Medium | Medium | Best cost/accuracy balance |
| Open-source OCR/DocAI | infra only | Lowest | High | Highest engineering + ops effort |

### Budget sensitivity matrix
**Low budget**
- Prefer PDF text extraction + small LLM for structuring.
- Use open-source OCR only for scans.
- Keep provider calls minimal; cache OCR text.

**Balanced**
- OCR + LLM hybrid with a reliable provider for the LLM step.
- Use strict JSON schema validation and reject uncertain rows.

**Accuracy-first**
- Managed Doc AI for text/structure plus LLM post-processing.
- Additional validation passes and human review.

## Reliability and quality guardrails
- Use JSON schema with `strict: true` to force deterministic output shape.
- Parse and validate numeric fields (`value_num`) separately from raw text.
- Reject or flag low-confidence rows for manual review.
- Keep raw text and OCR/LLM traces for evaluation.

## Suggested phased approach for LabTrackSimple
1) Detect PDF text layer; if present, extract text and use LLM to map to schema.
2) For scanned PDFs/images, run OCR first; then LLM structuring.
3) Add a fallback to multimodal LLM direct extraction for difficult layouts.
4) Build an eval set of 10-20 representative reports and measure accuracy per field.

## Sources consulted (Context7)
- OpenAI structured outputs with JSON schema and `strict: true` (Responses/Chat Completions).
- OpenAI PDF and image input formats for the Responses API (base64 input_file/input_image).

## Open items
- Pricing is vendor-specific and changes frequently; verify current rates on official pricing pages before final selection.
- Decide whether extraction should be synchronous in `extract_report` or offloaded to a worker.
