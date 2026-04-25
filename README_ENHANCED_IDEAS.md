# Ideation: Evolving DocCraft into a Full Writer & Editor Experience

To truly emulate a standard writer and not just a "reader with markups", here are some enhanced functionalities for the next phase of development, addressing everything but inline text editing and OCR (which is handled out-of-scope for the moment).

## 1. Text Reflow / Overlay Summarization
- **Feature**: Add an "Overlay" reading mode that parses text from the PDF and creates a clean, responsive HTML reading view overlaid on the PDF canvas.
- **Why**: Allows users to read large multi-column PDFs easily on smaller screens or in a distraction-free view, bridging the gap between fixed-layout PDFs and typical word processor reading views.

## 2. Advanced Interactive Forms (AcroForms / XFA generation)
- **Feature**: Add a "Form Builder" toolbar. Allow users to place interactive Text Fields, Checkboxes, Dropdowns, and Radio Buttons that actually get embedded into the final PDF output as functional AcroForm fields via `pdf-lib`.
- **Why**: Goes beyond flat annotations to creating document templates that other users can actually interact with and submit.

## 3. Intelligent Table of Contents (TOC) Builder
- **Feature**: A sidebar panel that analyzes PDF headings (via text sizes/styles or existing outlines) and auto-generates a TOC. The user can drag and drop TOC entries to reorder pages and sections automatically.
- **Why**: Emulates a word processor's outline pane, turning a flat PDF into a highly structured, navigable document.

## 4. Advanced "Smart" Content Extraction & Deep Linking
- **Feature**: Select a region of the document and "Copy Deep Link" or "Extract to Markdown". A deep link would point to a specific scroll position, zoom level, and highlighted region.
- **Why**: High value for researchers, lawyers, and teams collaborating on specific clauses in large documents.

## 5. Master Pages / Advanced Templating
- **Feature**: A Macro GUI specifically for defining "Master Pages" (Headers, Footers, Watermarks, Backgrounds). Applying a Master Page visually wraps every subsequent page in the document.
- **Why**: Writers often work with document templates. This makes DocCraft feel like a proper document authoring tool for branded materials.

## 6. Version History and Visual Diffing
- **Feature**: In addition to Undo/Redo, a "Version History" sidebar that saves document snapshots over time. Includes a "Compare" tool that highlights visual differences between the current state and a previous snapshot.
- **Why**: Standard in Google Docs/Word, critical for collaborative or long-lived workflows.
