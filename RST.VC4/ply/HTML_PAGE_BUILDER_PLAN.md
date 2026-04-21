# HTML Page Builder — Product & Implementation Plan

**Project:** Ply — HTML Page Builder Feature  
**Date:** April 20, 2026  
**Status:** Planning Complete, Ready for Development

---

## 1. Product Vision

A tool that allows users to create single-page HTML websites using a WYSIWYG editor and an HTML editor — both available simultaneously. Users pick from pre-built templates, fill in their content, and publish their page. Designers and end users use the same app — any page can be published as a template for others to use.

---

## 2. Core Concepts

### 2.1 Two Roles, One App

| Role | What they do |
|---|---|
| **Designer / Power User** | Creates pages, publishes them as templates for others |
| **End User** | Picks a template, fills in content, publishes their page |

There is no separate app. The only difference is one extra button: **"Publish as Template"**.

> Every page is potentially a template. Every template was once someone's page.

### 2.2 Website Types

The **type** is chosen once at page creation and never changes. It locks the content schema.

| Type | Schema Sections |
|---|---|
| `portfolio` | hero, about, skills, services, gallery, testimonials, contact |
| `restaurant` | hero, about, menu, opening_hours, location, gallery, contact |
| `business` | hero, about, services, team, faq, testimonials, contact |
| `flyer` | hero, event_details, description, contact |
| `vcard` | profile, contact, social_links, about |

### 2.3 Templates

- Templates belong to a specific website type
- Multiple templates per type — all share the same schema
- Template switching is allowed **only within the same type** — all content carries over, always
- Cross-type switching is not allowed

### 2.4 Template Sources

```
Template Gallery
├── Official       ← created by the platform team
├── My Templates   ← private templates saved by this user
└── Community      ← public templates published by any user
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

### 3.3 User Page Record (saved to API)

```json
{
  "id": "page-abc123",
  "ownerId": "user-42",
  "websiteType": "portfolio",
  "templateId": "portfolio-modern",
  "meta": {
    "pageTitle": "John Doe - Portfolio",
    "description": "Full stack developer based in London",
    "language": "en"
  },
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
  "isPublishedAsTemplate": false,
  "templateMeta": null
}
```

### 3.4 Published Template Record

Same record as a user page, with these fields added:

```json
{
  "isPublishedAsTemplate": true,
  "templateMeta": {
    "name":        "Clean Agency Portfolio",
    "description": "A modern portfolio for agencies and freelancers",
    "thumbnail":   "https://storage.example.com/templates/portfolio-modern.jpg",
    "visibility":  "public"
  }
}
```

### 3.5 What Survives a Template Switch

| Change | Stored in | Survives template switch |
|---|---|---|
| All text content | contentMap | ✓ always |
| All images and links | contentMap | ✓ always |
| Primary / secondary color | theme | ✓ always |
| Heading and body fonts | theme | ✓ always |
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

### 6.1 Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  TopBar: [Ply Logo] [Page Name] [Saved ✓] [Export HTML] [⋮]    │
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
│  Toolbar: [Undo] [Redo]   [◀ WYSIWYG │ HTML ▶ toggle]          │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 WYSIWYG Mode

- Click any element in the iframe → floating action bar appears
- Action bar buttons: **Duplicate**, **Move Up**, **Move Down**, **Delete**, **Edit**
- Double-click any text → inline editing via `contenteditable` injection
- Properties Panel (right side) shows context-aware controls per field type
- Theme Panel: color pickers and font selectors (writes to `contentMap.theme`)
- No "add element" in WYSIWYG — that's the HTML editor's job

**Floating Action Bar (per element):**
```
[ ⧉ Duplicate ] [ ↑ Move Up ] [ ↓ Move Down ] [ ✎ Edit ] [ ✕ Delete ]
```

### 6.3 HTML Editor Mode

- Left panel: Element Tree (existing `ElementTree.js`) + Element Library (existing `ElementLibrary.js`)
- Every tree mutation triggers `extractSlots()` to sync contentMap
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

### 7.1 Create New Page

```
Home → "New HTML Page"
  → Choose website type (portfolio / restaurant / business / flyer)
  → Template gallery (filtered to chosen type)
  → Pick template → POST /userwebsite/htmlpage (creates draft)
  → Redirect to /htmleditor/:id
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

### 7.4 Publish as Template

```
Editor → "Publish as Template" button
  → Dialog: name, description, visibility (public / private / unlisted)
  → Auto-generate thumbnail (html2canvas)
  → PUT /userwebsite/htmlpage/:id  { isPublishedAsTemplate: true, templateMeta: {...} }
  → Page now appears in template gallery
```

### 7.5 Export HTML

```
Editor → "Export HTML"
  → fillSlots(templateHtml, contentMap, theme)
  → nodeTreeToFullHtml() → single .html file with Bootstrap CDN
  → Download as page-name.html
```

---

## 8. API Endpoints Required

```
GET  /templates                         → list all templates (official + community)
GET  /templates/:id                     → get template HTML + meta
GET  /templates?type=portfolio          → filtered by website type

GET  /userwebsite/myhtmlpages           → list user's HTML pages
POST /userwebsite/htmlpage              → create new page (from template)
GET  /userwebsite/htmlpage/:id          → load page
PUT  /userwebsite/htmlpage/:id          → save page (auto-save + manual)
DELETE /userwebsite/htmlpage/:id        → delete page
```

---

## 9. Implementation Plan

### Phase 1 — Foundation (utilities + data)

| File | Action | Purpose |
|---|---|---|
| `src/utils/slotUtils.js` | Create | `fillSlots()` and `extractSlots()` |
| `src/utils/htmlParser.js` | Create | `htmlStringToNodeTree()` using DOMParser |
| `src/utils/themeUtils.js` | Create | `injectThemeVariables(html, theme)` |
| `src/data/websiteTypes.js` | Create | Schema definitions for all 5 website types |
| `src/components/htmleditor/HtmlEditorContext.js` | Extend | Add `DUPLICATE_NODE`, `MOVE_NODE_UP`, `MOVE_NODE_DOWN`, `LOAD_TEMPLATE`, `SET_THEME`, `SET_CONTENT_MAP` |
| `src/components/htmleditor/htmlUtils.js` | Extend | Add `htmlStringToNodeTree()` |
| `src/utils/config.js` | Extend | Add template + htmlpage API endpoints |

### Phase 2 — Template Picker Page

| File | Action | Purpose |
|---|---|---|
| `src/pages/templatepicker.js` | Create | Browse + pick template |
| `src/components/htmleditor/TemplateCard.js` | Create | Single template card (thumbnail, name) |
| `src/components/htmleditor/TemplateGallery.js` | Create | Grid + type filter tabs |

### Phase 3 — Editor Shell + TopBar

| File | Action | Purpose |
|---|---|---|
| `src/pages/htmleditorpage.js` | Create | Route shell, loads page, wraps provider |
| `src/components/htmleditor/HtmlEditorTopBar.js` | Create | Page name, save status, export, change template |
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
| Auto-save | Debounced 30s, PUT /userwebsite/htmlpage/:id |
| Manual save | TopBar save button |
| Export HTML | fillSlots + nodeTreeToFullHtml + download |
| Publish as Template | PUT with isPublishedAsTemplate + templateMeta |

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
| Any page can be published as template | Platform grows organically, same editor for designers and users |
| Two functions drive everything | `fillSlots()` and `extractSlots()` — simple, testable, predictable |
