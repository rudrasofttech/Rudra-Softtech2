# HTML Page Builder — Product & Implementation Plan

**Project:** Ply — HTML Page Builder Feature  
**Date:** April 20, 2026  
**Status:** Planning Complete, Ready for Development

---

## 1. Product Vision

A tool that allows users to create single-page HTML websites using a WYSIWYG editor and an HTML editor — both available simultaneously. Users pick from pre-built templates, fill in their content, and publish their page. Designers and end users use the same app — any page can be published as a template for others to use.

---

## 2. Core Concepts

### 2.1 Single Role — One App

Every user is the same. Any user can create a page and set its **Publish Status** to either **public** or **private**.

| Publish Status | Effect |
|---|---|
| **Private** | Only the creator can see and use this page |
| **Public** | Visible to all users; appears in the template gallery for anyone to use |

> There are no designer or end-user roles. Any public page is automatically a template.

### 2.2 Website Types

The **type** is chosen once at page creation and never changes. It locks the content schema.

| Enum | Value | Best for | Key Sections |
|---|---|---|---|
| `VCard` | 1 | Professionals, consultants | profile, contact, social_links, about |
| `LinkList` | 2 | Influencers, bios-in-link | profile, links, social_links |
| `Article` | 3 | Blog posts, news, announcements | hero, body, author, tags, related |
| `Portfolio` | 4 | Designers, developers, freelancers | hero, about, skills, services, gallery, testimonials, contact |
| `ECommerce` | 5 | Small shops, product showcases | hero, products, features, pricing, contact |
| `Educational` | 6 | Courses, tutorials, workshops | hero, curriculum, instructor, faq, enroll |
| `LandingPage` | 7 | Product launches, campaigns | hero, features, social_proof, cta, faq |
| `Resume` | 8 | Job seekers | profile, summary, experience, education, skills, contact |

The integer value is what is sent to the API as `WSType`. The schema for each type is defined in `src/data/websiteTypes.js` and keyed by this enum value.

### 2.3 Templates

- Templates belong to a specific website type
- Multiple templates per type — all share the same schema
- Template switching is allowed **only within the same type** — all content carries over, always
- Cross-type switching is not allowed

### 2.4 Template Sources

```
Template Gallery
├── Official       ← public pages created by the platform team
├── My Pages       ← all pages owned by this user (public + private)
└── Community      ← public pages published by any other user
```

---

## 3. Data Architecture

### 3.1 Template Schema (per website type — defined once by platform)

```json
{
  "type": "portfolio",
  "sections": [
    {
      "id": "hero",
      "label": "Hero Banner",
      "fields": [
        { "key": "name",     "label": "Your Name",       "type": "text",    "required": true },
        { "key": "tagline",  "label": "Tagline",          "type": "text"                      },
        { "key": "photo",    "label": "Your Photo",       "type": "image"                     },
        { "key": "show_cta", "label": "Show hire button", "type": "boolean"                   }
      ]
    },
    {
      "id": "services",
      "label": "Services",
      "repeatable": true,
      "fields": [
        { "key": "title",       "label": "Service Name",  "type": "text"     },
        { "key": "description", "label": "Description",   "type": "richtext" },
        { "key": "icon",        "label": "Icon Image",    "type": "image"    }
      ]
    },
    {
      "id": "contact",
      "label": "Contact",
      "fields": [
        { "key": "email",         "label": "Email",         "type": "text"       },
        { "key": "phone_numbers", "label": "Phone Numbers", "type": "list<text>" },
        { "key": "social_links",  "label": "Social Links",  "type": "list<link>" }
      ]
    }
  ]
}
```

### 3.2 Field Types

| Type | Example use | Stored as |
|---|---|---|
| `text` | Name, title, phone, city | `"string"` |
| `richtext` | Bio, description | `"string"` (HTML) |
| `image` | Photo, logo, icon | `"url string"` |
| `link` | Social media, CTA button | `{ "label": "", "url": "" }` |
| `boolean` | Show/hide section | `true / false` |
| `list<text>` | Phone numbers, bullet points | `["val1", "val2"]` |
| `list<image>` | Gallery photos | `["url1", "url2"]` |
| `list<link>` | Social icons, nav items | `[{ "label": "", "url": "" }]` |
| `list<card>` | Services, team, menu items | `[{ field1, field2 }]` |

A section with `"repeatable": true` maps to `list<card>`.

### 3.3 User Page Record — API Payload (UpdateUserWebsiteDTO)

The server receives a flat DTO on every save. The content schema, theme, and node tree are all serialised into a single `JsonData` string field.

```json
{
  "Id":           "page-abc123",
  "Name":         "John Doe - Portfolio",
  "WSType":       "portfolio",
  "TemplateHtml": "<html><!-- raw template with data-slot attributes --></html>",
  "HTML":         "<html><!-- rendered output of fillSlots() --></html>",
  "Tag":          "developer freelancer",
  "Description":  "Full stack developer based in London",
  "PublishStatus": "Public",
  "JsonData": "{\"theme\":{\"primaryColor\":\"#e63946\",\"secondaryColor\":\"#457b9d\",\"headingFont\":\"Playfair Display\",\"bodyFont\":\"Inter\",\"borderRadius\":\"8px\"},\"sections\":{\"hero\":{\"name\":\"John Doe\",\"tagline\":\"Full Stack Developer\",\"photo\":\"https://...\",\"show_cta\":true}},\"nodeTree\":{},\"thumbnail\":\"data:image/png;base64,iVBOR...\"}"
}
```

**Field mapping:**

| DTO field | Source | Notes |
|---|---|---|
| `Id` | page record | Required; sent in body, not in URL |
| `Name` | `meta.pageTitle` | Max 50 chars, min 3, domain-safe |
| `WSType` | `websiteType` | Integer enum (1–8); sent as number; locked at creation, never changes |
| `TemplateHtml` | active template HTML | Raw template string with `data-slot` attributes |
| `HTML` | `fillSlots()` output | Fully rendered page HTML — ready to serve |
| `Tag` | user-editable | Max 200 chars; space-separated keywords |
| `Description` | user-editable | Max 1000 chars |
| `PublishStatus` | toggle in TopBar | `Public` or `Private`; default is `Public` |
| `JsonData` | serialised JSON string | Contains `theme`, `sections` (contentMap), `nodeTree`, `thumbnail` |

**JsonData shape (before serialisation):**

```json
{
  "theme": {
    "primaryColor":   "#e63946",
    "secondaryColor": "#457b9d",
    "headingFont":    "Playfair Display",
    "bodyFont":       "Inter",
    "borderRadius":   "8px"
  },
  "sections": {
    "hero": {
      "name":     "John Doe",
      "tagline":  "Full Stack Developer & Designer",
      "photo":    "https://storage.example.com/u/42/photo.jpg",
      "show_cta": true
    },
    "services": [
      { "title": "Web Development", "description": "Fast modern websites", "icon": "https://..." },
      { "title": "UI Design",       "description": "Clean, minimal design", "icon": "https://..." }
    ],
    "contact": {
      "email":         "john@example.com",
      "phone_numbers": ["+44 7911 123456", "+44 7900 000001"],
      "social_links":  [
        { "label": "LinkedIn", "url": "https://linkedin.com/in/johndoe" },
        { "label": "GitHub",   "url": "https://github.com/johndoe"     }
      ]
    }
  },
  "nodeTree": { },
  "thumbnail": "data:image/png;base64,iVBORw0KGgo..."
}
```

### 3.4 Publish Status

`PublishStatus` is part of every save payload (the `UpdateUserWebsiteDTO`). It is either `"Public"` (default) or `"Private"`. Any page set to `"Public"` automatically appears in the Community template gallery.

`thumbnail` is a **base64-encoded PNG string** stored inside `JsonData`. It is generated on the client by capturing a full-page snapshot of the canvas iframe using `html2canvas` and included in every autosave — no separate image upload or separate API call required.

### 3.5 Free (Generic) Elements

In addition to slot-bound content, users can place **free elements** anywhere on the page. These are not tied to any `data-slot` or schema field — they are arbitrary additions:

| Element | Example use |
|---|---|
| Text block | Extra paragraph, caption, custom heading |
| Image | Decorative photo, banner, logo |
| Video | Embedded YouTube / direct video file |
| Divider | Visual separator between sections |
| Spacer | Vertical whitespace |
| Raw HTML | Custom embed codes, iframes |

Free elements are added via the **HTML Editor mode** (Element Library). They are stored in `nodeTree` only — not in `contentMap` — and are therefore **not preserved on a template switch** (the node tree is replaced). This is expected and by design.

### 3.6 What Survives a Template Switch

| Change | Stored in | Survives template switch |
|---|---|---|
| All text content | contentMap | ✓ always |
| All images and links | contentMap | ✓ always |
| Primary / secondary color | theme | ✓ always |
| Heading and body fonts | theme | ✓ always |
| Free elements (text, image, video, etc.) | nodeTree | ✗ by design |
| Element-level style tweaks (HTML editor) | nodeTree | ✗ by design |

---

## 4. Template HTML Convention

Templates are authored as standard HTML files with `data-slot` attributes. These map directly to schema field keys.

```html
<section data-section="hero">
  <h1  data-slot="hero.name">Your Name Here</h1>
  <p   data-slot="hero.tagline">Your tagline here</p>
  <img data-slot="hero.photo" src="placeholder.jpg" alt="" />
  <a   data-slot="hero.show_cta" href="#contact" class="btn btn-primary">Hire Me</a>
</section>

<!-- Repeatable section: one item element = template for all items -->
<section data-section="services">
  <div data-slot-list="services" data-slot-item>
    <img data-slot="services.icon"        src="icon.png" />
    <h3  data-slot="services.title">      Service Name</h3>
    <p   data-slot="services.description">Description here</p>
  </div>
</section>

<!-- list<text>: one element = template for each list item -->
<section data-section="contact">
  <ul data-slot-list="contact.phone_numbers">
    <li data-slot-item>+1 234 567 890</li>
  </ul>
</section>
```

### Slot Rendering Rules

| Field type | HTML target | What changes |
|---|---|---|
| `text` | any element | `textContent` |
| `richtext` | any element | `innerHTML` |
| `image` | `<img>` | `src` attribute |
| `image` | block element | `background-image` CSS |
| `link` | `<a>` | `href` + `textContent` |
| `boolean` | any element | `style.display` (none / original) |
| `list<text>` | parent + `data-slot-item` | clone per value, set `textContent` |
| `list<image>` | parent + `data-slot-item` | clone per value, set `src` |
| `list<link>` | parent + `data-slot-item` | clone per value, set `href` + text |
| `list<card>` | parent + `data-slot-item` | clone per value, fill each sub-slot |

### Theme Variables

```css
:root {
  --primary:      {{ theme.primaryColor }};
  --secondary:    {{ theme.secondaryColor }};
  --heading-font: {{ theme.headingFont }};
  --body-font:    {{ theme.bodyFont }};
  --radius:       {{ theme.borderRadius }};
}
```

Injected into every template at render time. Ensures color and font changes carry over on template switch.

---

## 5. Two Core Functions

The entire slot system is driven by two functions:

| Function | Direction | When called |
|---|---|---|
| `fillSlots(templateHtml, contentMap, theme)` | Template → rendered HTML | On load, on template switch |
| `extractSlots(nodeTree)` | Node tree → contentMap | After every edit in HTML editor |

Round-trip:
```
Template HTML  ──fillSlots()──▶  Rendered iframe
                    ▲                   │
             contentMap JSON    User edits (WYSIWYG or HTML)
                    ▲                   │
                    └──extractSlots()───┘
```

---

## 6. Editor Design

### 6.0 UI Stack (Editor Shell)

The editor UI itself is built with **Bootstrap 5** and **react-bootstrap** — the same stack already used across the rest of the app. Custom CSS is limited to layout-specific rules (panel sizing, canvas overflow, splitter) that Bootstrap utilities alone cannot cover.

| Layer | Library | Used for |
|---|---|---|
| Layout & grid | Bootstrap 5 (utility classes) | Panels, toolbar rows, modal dialogs |
| Components | react-bootstrap | `Button`, `Modal`, `Tabs`, `Form`, `Dropdown`, `Badge`, `Spinner` |
| Icons | bootstrap-icons / react-bootstrap-icons | Toolbar, action bar, sidebar tree |
| Custom CSS | `htmleditor.css` (scoped) | Fixed panel heights, canvas scroll, splitter bar |

> Do **not** import a separate icon font or component library. Use only what is already installed.

### 6.1 Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  TopBar: [Ply Logo → Home] [Page Name ✎] [Saving… / ✓ Saved] [Export HTML] [Change Template]  │
├──────────────────┬───────────────────────────┬──────────────────┤
│   LEFT PANEL     │   CANVAS (iframe)          │   RIGHT PANEL    │
│                  │                            │                  │
│  WYSIWYG mode:   │   Live Bootstrap page      │  WYSIWYG mode:   │
│  (hidden)        │                            │  Properties      │
│                  │   ← Floating action bar    │  Panel           │
│  HTML mode:      │     appears on click       │                  │
│  Element Tree    │                            │  HTML mode:      │
│  + Library       │                            │  (hidden)        │
├──────────────────┴───────────────────────────┴──────────────────┤
│  Toolbar: [Undo] [Redo]   [◄ WYSIWYG │ HTML ► toggle]          │
└─────────────────────────────────────────────────────────────────┘
```

**TopBar behaviour — matches the design editor (`TopBar.js`) pattern:**

- **Ply logo** — click navigates to `/` (home), same as design editor
- **Page name button** — shows current `Name`; clicking opens a popup with three editable fields:
  - `Name` (maps to DTO `Name`, max 50 chars)
  - `Tag` (maps to DTO `Tag`, space-separated keywords)
  - `Description` (maps to DTO `Description`)
  - Popup has Cancel / Save buttons; Save dispatches to editor context and triggers an immediate autosave
- **Save status indicator** — same states as design editor: `Saving…` (spinner) / `✓ Saved` (green) / `⚠ Save failed — Retry` (red button)
- **Publish toggle** — `Make Public` / `Make Private` button at right end
- **Export HTML** — button at right end
- **Change Template** — button at right end

### 6.2 WYSIWYG Mode

- Click any element in the iframe → floating action bar appears
- Action bar buttons: **Duplicate**, **Move Up**, **Move Down**, **Delete**, **Edit**
- Double-click any text → inline editing via `contenteditable` injection
- Properties Panel (right side) shows context-aware controls per field type
- Theme Panel: color pickers and font selectors (writes to `contentMap.theme`)
- No "add element" in WYSIWYG — that's the HTML editor's job
- Free elements (text, image, video, etc.) added via HTML Editor mode are visible and editable in WYSIWYG just like any other element

**Floating Action Bar (per element):**
```
[ ⧉ Duplicate ] [ ↑ Move Up ] [ ↓ Move Down ] [ ✎ Edit ] [ ✕ Delete ]
```

### 6.3 HTML Editor Mode

- Left panel: Element Tree (existing `ElementTree.js`) + Element Library (existing `ElementLibrary.js`)
- Element Library provides free elements: **Text**, **Image**, **Video**, **Divider**, **Spacer**, **Raw HTML** — drag or click to insert anywhere in the tree
- Free elements are stored in `nodeTree` only; they are not slot-bound and will not survive a template switch
- Every tree mutation triggers `extractSlots()` to sync contentMap (slot-bound fields only)
- Full undo/redo stack

### 6.4 Properties Panel (WYSIWYG — right side)

| Field type | Control shown |
|---|---|
| `text` | Single-line text input |
| `richtext` | Small rich text editor |
| `image` | URL input + upload button |
| `link` | URL input + label input |
| `boolean` | Toggle switch |
| `list<text>` | Add / remove / reorder items |
| `list<card>` | Add / remove / reorder cards with sub-fields |

---

## 7. User Flows

### 7.1 Create New Page — Full Flow

**Step 1 — Entry point (Home)**
```
Home → "+ New Page" button
  → Opens the New Page Wizard (full-screen modal or dedicated route /create)
```

**Step 2 — Choose a page type**

Show 8 cards in a grid. Each card has:
- Icon or illustration
- Type name (human-readable)
- One-line description of who it's for
- Example use-case tag

```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  👤 VCard    │  │  🔗 Link List │  │  📝 Article  │  │  🎨 Portfolio│
│ Share your   │  │ All your links│  │ Publish a    │  │ Show your    │
│ contact info │  │ in one place  │  │ post or story│  │ work & skills│
└──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘
┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  🛒 eCommerce│  │  🎓 Education │  │  🚀 Landing  │  │  📄 Resume   │
│ Showcase &   │  │ Course, class │  │ Launch a     │  │ Your CV as a │
│ sell products│  │ or workshop   │  │ product/offer│  │ webpage      │
└──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘
```

User clicks a type → it highlights with a checkmark. A **"Next →"** button activates.

**Step 3 — Pick a starting point**

After type selection, show two options:

```
┌──────────────────────────────────┐   ┌──────────────────────────────────┐
│  ✦ Start from a Template         │   │  ☐ Start with a Blank Canvas     │
│                                  │   │                                  │
│  Browse pre-built designs and    │   │  Open the editor with a minimal  │
│  fill in your own content.       │   │  empty shell — build freely.     │
│  Fastest way to get started.     │   │  Best for custom designs.        │
│  [Recommended]                   │   │                                  │
└──────────────────────────────────┘   └──────────────────────────────────┘
```

**Step 3a — Template path**
```
  → Template gallery filtered to chosen type
     ├── Official templates (tab)
     ├── My Pages (tab)          ← user's own public/private pages as starting point
     └── Community (tab)         ← other users' public pages
  → User clicks a template → preview opens (full-width iframe preview)
  → "Use this template" button → proceed to Step 4
```

**Step 3b — Blank canvas path**
```
  → No template gallery shown
  → App uses a minimal blank scaffold for the chosen type
     (just the :root CSS variables + empty section wrappers with data-section attributes)
  → Proceed directly to Step 4
```

**Step 4 — Name your page**
```
  → Simple input: "Give your page a name"
     e.g. "John's Portfolio", "My Shop", "Raj Kiran Singh - Resume"
  → This becomes Name (editable later via the TopBar page name popup)
  → "Create Page" button
  → POST /userwebsite/create
     {
       "Name":        "My Portfolio",
       "WSType":      4,              ← integer enum value of chosen type
       "TemplateHtml": "<html>...",   ← selected template HTML, or blank scaffold if no template
       "PublishStatus": "Private",
       "JsonData":    "{\"theme\":{...},\"sections\":{},\"nodeTree\":{},\"thumbnail\":\"\"}"
     }
  → Server returns the new page record with its Id
  → Redirect to /htmleditor/:id
```

**Summary flow**
```
"+ New Page"
   └─ Step 2: Choose type  (8 type cards)
        └─ Step 3: Starting point
              ├─ Template → gallery → preview → "Use this" ─┐
              └─ Blank canvas ────────────────────────────────┤
                                                              ↓
                                                    Step 4: Name page
                                                         → POST → /htmleditor/:id
```

### 7.2 Edit Existing Page

```
Home → click page → /htmleditor/:id
  → GET /userwebsite/htmlpage/:id
  → fillSlots(templateHtml, contentMap, theme)
  → Editor opens with live iframe
```

### 7.3 Change Template

```
Editor → "Change Template" button
  → Template gallery (same type only, filtered)
  → User picks new template
  → Show confirmation dialog:
      ✓ All your content carries over
      ✓ Your color scheme carries over
      ✓ Your fonts carry over
      ⚠ Custom element-level HTML edits will reset
  → Confirm → fillSlots(newTemplateHtml, existingContentMap, existingTheme)
  → Editor reloads with new template + all content preserved
```

### 7.4 Set Publish Status

```
Editor → "Make Public" / "Make Private" toggle in TopBar
  → Toggle updates PublishStatus in editor state
  → Triggers an immediate save (same POST /userwebsite/update call as autosave)
      — PublishStatus: "Public" or "Private" is included in the full DTO
  → Public pages immediately appear in the Community template gallery
  → Private pages are only visible to the creator
```

> No separate API call for publish status — it rides along in the standard save payload.

### 7.5 Export HTML

```
Editor → "Export HTML"
  → fillSlots(templateHtml, contentMap, theme)
  → nodeTreeToFullHtml() → single .html file with Bootstrap CDN
  → Download as page-name.html
```

---

## 8. API Endpoints Required

| Method | URL | Purpose | Key fields |
|---|---|---|---|
| `GET` | `/userwebsite/templates?p=1&ws={type}&k={keywords}` | List templates (official + community) | — |
| `GET` | `/userwebsite/{id}` | Load a page or template by id | — |
| `POST` | `/userwebsite/create` | Create new page | `Name`, `WSType`, `TemplateHtml` (or null for blank) |
| `POST` | `/userwebsite/update` | Save page (autosave + manual + publish toggle) | Full `UpdateUserWebsiteDTO` (see §3.3) |
| `DELETE` | `/userwebsite/delete/{id}` | Delete a page | — |

**Save payload — `UpdateUserWebsiteDTO`:**
```json
{
  "Id":            "<guid>",
  "Name":          "<page name>",
  "WSType":        "<websiteType>",
  "TemplateHtml":  "<raw template HTML string>",
  "HTML":          "<rendered page HTML from fillSlots()>",
  "Tag":           "<space-separated keywords>",
  "Description":   "<page description>",
  "PublishStatus": "Public | Private",
  "JsonData":      "{\"theme\":{...},\"sections\":{...},\"nodeTree\":{...},\"thumbnail\":\"data:image/png;base64,...\"}"
}
```

> `Id` is always in the request body — never in the URL path.

---

## 9. Implementation Plan

### Phase 1 — Foundation (utilities + data)

| File | Action | Purpose |
|---|---|---|
| `src/utils/slotUtils.js` | Create | `fillSlots()` and `extractSlots()` |
| `src/utils/htmlParser.js` | Create | `htmlStringToNodeTree()` using DOMParser |
| `src/utils/themeUtils.js` | Create | `injectThemeVariables(html, theme)` |
| `src/data/websiteTypes.js` | Create | Schema definitions for all 8 website types keyed by enum value (1=VCard, 2=LinkList, 3=Article, 4=Portfolio, 5=ECommerce, 6=Educational, 7=LandingPage, 8=Resume); also exports blank scaffold HTML per type |
| `src/components/htmleditor/HtmlEditorContext.js` | Extend | Add `DUPLICATE_NODE`, `MOVE_NODE_UP`, `MOVE_NODE_DOWN`, `LOAD_TEMPLATE`, `SET_THEME`, `SET_CONTENT_MAP` |
| `src/components/htmleditor/htmlUtils.js` | Extend | Add `htmlStringToNodeTree()` |
| `src/utils/config.js` | Extend | Add template + htmlpage API endpoints |

### Phase 2 — New Page Wizard + Template Gallery

| File | Action | Purpose |
|---|---|---|
| `src/pages/newpage.js` | Create | 4-step wizard: type picker → starting point → template gallery → name page |
| `src/components/htmleditor/TypePickerGrid.js` | Create | 8-card type selection grid (Step 2) |
| `src/components/htmleditor/StartingPointPicker.js` | Create | Template vs Blank Canvas choice (Step 3) |
| `src/components/htmleditor/TemplateGallery.js` | Create | Filterable grid of templates with iframe preview (Step 3a) |
| `src/components/htmleditor/TemplateCard.js` | Create | Single template card (thumbnail, name, type badge) |

### Phase 3 — Editor Shell + TopBar

| File | Action | Purpose |
|---|---|---|
| `src/pages/htmleditorpage.js` | Create | Route shell, loads page, wraps provider |
| `src/components/htmleditor/HtmlEditorTopBar.js` | Create | Matches design editor `TopBar.js` pattern: logo → home link, editable page name button (opens Name/Tag/Description popup), save status indicator (Saving… / ✓ Saved / Retry), Publish toggle, Export HTML, Change Template |
| `src/components/htmleditor/HtmlEditorToolbar.js` | Create | Undo, redo, mode toggle |
| `src/components/htmleditor/TemplateSwitchModal.js` | Create | Confirmation dialog with carry-over summary |

### Phase 4 — WYSIWYG Mode

| File | Action | Purpose |
|---|---|---|
| `src/components/htmleditor/WysiwygActionBar.js` | Create | Floating duplicate/move/delete bar |
| `src/components/htmleditor/PropertiesPanel.js` | Create | Context-aware right panel per field type |
| `src/components/htmleditor/ThemePanel.js` | Create | Color pickers + font selectors |
| `src/components/htmleditor/HtmlCanvas.js` | Enhance | Inline editing, action bar trigger, selection overlay |

### Phase 5 — HTML Editor Mode

| File | Action | Purpose |
|---|---|---|
| `src/components/htmleditor/ElementLibrary.js` | Reuse as-is | — |
| `src/components/htmleditor/ElementTree.js` | Reuse as-is | — |
| `src/components/htmleditor/HtmlEditorContext.js` | Extend | extractSlots() sync after every tree mutation |

### Phase 6 — Save, Export, Theme

| Feature | Details |
|---|---|
| Auto-save | Debounced on every change; `POST /userwebsite/update` with full `UpdateUserWebsiteDTO` |
| Thumbnail generation | `html2canvas` captures canvas iframe on every save → `canvas.toDataURL("image/png")` → stored as `thumbnail` inside `JsonData` |
| Manual save | TopBar save button — same call as autosave, immediate (no debounce) |
| Publish toggle | Updates `PublishStatus` in state → triggers immediate save (same DTO, no extra endpoint) |
| Export HTML | `fillSlots()` + `nodeTreeToFullHtml()` → download as `<page-name>.html` with Bootstrap CDN |

**JsonData serialisation (before every POST):**
```js
const jsonData = JSON.stringify({
  theme,
  sections,   // contentMap from extractSlots()
  nodeTree,
  thumbnail,  // base64 PNG from html2canvas
});
```

### Phase 7 — Route Wiring + Home Integration

| File | Action | Purpose |
|---|---|---|
| `src/App.js` | Extend | Add `/create-page`, `/htmleditor`, `/htmleditor/:id` |
| `src/pages/home.js` | Extend | Show HTML pages, add "New HTML Page" button |

---

## 10. Build Order

```
Phase 1  →  Phase 2  →  Phase 3  →  Phase 4  ──┐
                                                 ├──  Phase 6  →  Phase 7
                                    Phase 5  ───┘
```

Phases 4 and 5 can be built in parallel — they are independent modes sharing the same context and canvas.

---

## 11. File Summary

| Category | New files | Modified files |
|---|---|---|
| Utilities | 4 | 2 |
| Data / schema | 1 | 0 |
| Pages | 2 | 2 |
| Components | 9 | 2 |
| **Total** | **16** | **6** |

---

## 12. Key Design Decisions (Summary)

| Decision | Rationale |
|---|---|
| Type locked at creation | Guarantees 100% content carry-over on template switch within type |
| No cross-type switching | Eliminates schema mismatch, data loss, and user confusion |
| Templates stored as raw HTML on API | Easy to author by designers, parsed to node tree on client |
| User pages stored as node tree JSON | Perfect round-trip, no re-parsing |
| contentMap separate from nodeTree | Content survives template switches; node tree is replaceable |
| Theme as CSS variables | Colors and fonts carry over on template switch |
| Element-level style tweaks do not survive switch | By design — node tree is replaced, semantics change |
| Any public page is a template | No separate roles — publish status alone controls template availability |
| Two functions drive everything | `fillSlots()` and `extractSlots()` — simple, testable, predictable |
| Free elements are first-class | Text, image, video, divider etc. can be added anywhere via HTML editor — not schema-bound, not preserved on template switch (nodeTree is replaced) |
| Editor UI uses Bootstrap 5 | react-bootstrap components and Bootstrap utility classes throughout the editor shell — consistent with the rest of the app, no additional UI library needed |
