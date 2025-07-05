# 🔎 Search & Filtering Module

This document defines how users and tenants can explore entities using category filters, smart attribute scanning, and range-based queries. It supports deep filtering logic while staying lean and relational.

---

## 📁 Search API

GET /entities/search

Supports query parameters:

- `category=vehicle`
- `tenant=tenant_xyz`
- `year[min]=2015`
- `price[max]=30000`
- `color=red`
- `global=true` (optional for full access)

---

## 🧠 Smart Filters

Filters are auto-generated from attributes present across entities.

If 20% of entities in `category=vehicle` include `"brand"`, it becomes a filterable key.

Also supports:
- Boolean and enumerated filters
- Null-aware logic (e.g., hide `"NA"`)

---

## 📐 Range Filtering

Examples:

GET /entities/search?price[min]=10000&price[max]=25000  
GET /entities/search?year[min]=2020

Numeric, date, and timestamp fields support min/max constraints.

---

## 💬 Full-Text Search (optional)

Future enhancement:

GET /entities/search?q=“electric bike near Bogotá”  
Applies indexed lookup across attribute values

---

## 📦 Filter Metadata Response (Optional)

System may respond with filter metadata:

{
  "availableFilters": {
    "price": {
      "min": 3000,
      "max": 75000
    },
    "year": {
      "min": 2000,
      "max": 2023
    },
    "brand": ["Toyota", "Ford", "Tesla"]
  }
}

Used by frontend to generate UI filter widgets.

---

## 🧩 Context Awareness

Filters respect:

- `tenantContext` for scoped tenant portals
- Global mode (`global=true`) for unrestricted view
- RLS policies on Supabase for privacy and segmentation

---

## 🛑 Edge Cases

- Fields marked `"NA"` are ignored by filter engine
- Custom attributes are not searchable unless indexed or explicitly enabled

---

## 🧙 Universal CLI Notes

Universal CLI can help by:

- Generating dynamic filter resolution logic
- Drafting endpoint handlers for smart query translation
- Structuring frontend UX hints from backend schema

