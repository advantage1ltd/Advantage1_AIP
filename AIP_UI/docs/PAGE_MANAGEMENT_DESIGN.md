# Page Management Design - Seamless Process

## 📋 Current Architecture Overview

### Data Flow
```
┌─────────────────┐
│  sidebar.ts     │  ← Single source of truth for UI navigation
│  (Frontend)     │
└────────┬────────┘
         │
         ├─────────────────────────────────┐
         │                                 │
         ▼                                 ▼
┌─────────────────┐              ┌─────────────────┐
│ Sidebar         │              │ Routes          │
│ Navigation      │              │ (routes.tsx)    │
│ (UI Display)    │              │                 │
└─────────────────┘              └─────────────────┘
         │                                 │
         │                                 │
         ▼                                 ▼
┌─────────────────────────────────────────────┐
│         PageAccessContext                   │
│  (Fetches from Backend API)                 │
└───────────────┬─────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────┐
│         Backend Database                     │
│  - PageAccesses (all pages)                 │
│  - RolePageAccesses (role permissions)       │
│  - CustomerPageAccesses (customer pages)     │
└─────────────────────────────────────────────┘
         │
         ├─────────────────────────────────┐
         │                                 │
         ▼                                 ▼
┌─────────────────┐              ┌─────────────────┐
│ Settings Page   │              │ Customer Page   │
│ (Role Access)   │              │ Settings        │
│                 │              │ (Customer Pages)│
└─────────────────┘              └─────────────────┘
```

## 🔍 Current Issues & Gaps

### Issue 1: Disconnected Sources of Truth
- **Frontend**: `sidebar.ts` defines navigation structure
- **Backend**: `PageAccessService.cs` has hardcoded page list
- **Problem**: Adding a page to `sidebar.ts` doesn't automatically add it to the database
- **Impact**: New pages won't appear in Customer Page Settings or Settings page until manually added

### Issue 2: Manual Database Seeding Required
- **Current**: Pages must be manually seeded via `InitializeDefaultPageAccessAsync`
- **Problem**: Requires backend changes and database seeding for every new page
- **Impact**: Slows development, creates sync issues

### Issue 3: Customer Page Settings Dependency
- **Current**: Customer Page Settings only shows pages from database
- **Problem**: If a page isn't in DB, it can't be assigned to customers
- **Impact**: New pages can't be assigned until they're in the database

### Issue 4: Settings Page Categorization
- **Current**: Uses hardcoded `subcategoryMap` for page categorization
- **Problem**: New pages won't appear in correct category
- **Impact**: Pages might be uncategorized or missing from Settings

## ✅ Proposed Seamless Process

### Principle: Single Source of Truth with Auto-Sync

**`sidebar.ts` is the single source of truth for:**
- Page paths
- Page labels
- Page icons
- Navigation structure
- Section organization

**Database is the source of truth for:**
- Page access control (roles)
- Customer page assignments
- Page metadata (descriptions, categories, sort order)

### Process Flow

```
1. Developer adds page to sidebar.ts
   ↓
2. Backend automatically detects new pages on startup/API call
   ↓
3. Missing pages are auto-created in database
   ↓
4. Pages appear in:
   - Sidebar Navigation (from sidebar.ts)
   - Settings Page (from database)
   - Customer Page Settings (from database)
```

## 🛠️ Implementation Plan

### Phase 1: Enhance Backend Auto-Detection

**Goal**: Backend automatically syncs pages from a canonical list

**Changes Needed**:
1. Create a shared page definition structure (JSON or C# enum)
2. Enhance `InitializeDefaultPageAccessAsync` to:
   - Compare against canonical list
   - Auto-create missing pages
   - Update existing pages if paths/labels change
   - Never delete pages (mark inactive instead)

**File**: `AIP_Backend/Services/PageAccessService.cs`

### Phase 2: Frontend-Backend Page Definition Sync

**Goal**: Frontend `sidebar.ts` drives backend page creation

**Options**:
- **Option A**: Export page definitions from `sidebar.ts` as JSON, backend reads it
- **Option B**: Backend API endpoint accepts page definitions, frontend sends on startup
- **Option C**: Shared TypeScript/C# code generation

**Recommended**: Option A (simplest, maintains separation)

### Phase 3: Settings Page Auto-Categorization

**Goal**: Settings page automatically categorizes pages based on path/category

**Changes Needed**:
1. Remove hardcoded `subcategoryMap`
2. Use page `category` from database
3. Fallback to path-based categorization if category missing

**File**: `AIP_UI/src/pages/Settings.tsx`

### Phase 4: Customer Page Settings Enhancement

**Goal**: Customer Page Settings shows all assignable pages

**Changes Needed**:
1. Ensure Customer Page Settings only shows pages with `Category = "Customer"`
2. Add filter/search for better UX
3. Show page descriptions from database

**File**: `AIP_UI/src/pages/administration/CustomerPageSettings.tsx`

## 📝 Detailed Implementation

### Step 1: Create Page Definition Export

**File**: `AIP_UI/src/config/navigation/pageDefinitions.ts`

```typescript
// Export page definitions from sidebar.ts for backend sync
export interface PageDefinition {
  pageId: string;        // Unique identifier (kebab-case)
  title: string;         // Display name
  path: string;          // Route path
  category: string;      // Category (Administration, Customer, etc.)
  description?: string;  // Optional description
  sortOrder?: number;    // Optional sort order
}

// Extract all pages from sidebar config
export const PAGE_DEFINITIONS: PageDefinition[] = [
  // Administration
  {
    pageId: 'user-setup',
    title: 'User Setup',
    path: '/administration/user-setup',
    category: 'Administration',
    description: 'User management and setup',
    sortOrder: 10
  },
  {
    pageId: 'customer-page-settings',
    title: 'Customer Page Settings',
    path: '/administration/customer-page-settings',
    category: 'Administration',
    description: 'Configure which pages are available to customers',
    sortOrder: 13
  },
  // ... all other pages
];
```

### Step 2: Backend API Endpoint for Page Sync

**File**: `AIP_Backend/Controllers/PageAccessController.cs`

```csharp
[HttpPost("sync-pages")]
public async Task<IActionResult> SyncPagesFromDefinitions(
    [FromBody] List<PageDefinitionDto> pageDefinitions,
    [FromServices] IPageAccessService pageAccessService)
{
    var result = await pageAccessService.SyncPagesFromDefinitionsAsync(
        pageDefinitions, 
        User.FindFirstValue(ClaimTypes.NameIdentifier)
    );
    return Ok(result);
}
```

### Step 3: Enhanced Sync Method

**File**: `AIP_Backend/Services/PageAccessService.cs`

```csharp
public async Task<SyncResultDto> SyncPagesFromDefinitionsAsync(
    List<PageDefinitionDto> definitions, 
    string currentUserId)
{
    var existingPages = await _context.PageAccesses
        .ToDictionaryAsync(p => p.PageId, p => p);
    
    var created = 0;
    var updated = 0;
    
    foreach (var def in definitions)
    {
        if (existingPages.TryGetValue(def.PageId, out var existing))
        {
            // Update if path or title changed
            if (existing.Path != def.Path || existing.Title != def.Title)
            {
                existing.Path = def.Path;
                existing.Title = def.Title;
                existing.Category = def.Category ?? existing.Category;
                existing.Description = def.Description ?? existing.Description;
                existing.UpdatedAt = DateTime.UtcNow;
                existing.UpdatedBy = currentUserId;
                updated++;
            }
        }
        else
        {
            // Create new page
            _context.PageAccesses.Add(new PageAccess
            {
                PageId = def.PageId,
                Title = def.Title,
                Path = def.Path,
                Category = def.Category ?? "Uncategorized",
                Description = def.Description,
                IsActive = true,
                SortOrder = def.SortOrder ?? 0,
                CreatedAt = DateTime.UtcNow,
                CreatedBy = currentUserId
            });
            created++;
        }
    }
    
    await _context.SaveChangesAsync();
    
    return new SyncResultDto
    {
        Created = created,
        Updated = updated,
        Total = definitions.Count
    };
}
```

### Step 4: Frontend Sync on Startup

**File**: `AIP_UI/src/contexts/PageAccessContext.tsx`

```typescript
// Add sync method
const syncPagesFromDefinitions = async () => {
  try {
    const definitions = PAGE_DEFINITIONS;
    await pageAccessApi.syncPages(definitions);
    console.log('✅ Pages synced from definitions');
  } catch (error) {
    console.error('Failed to sync pages:', error);
  }
};

// Call on initialization (only for admins)
useEffect(() => {
  if (currentRole === 'Administrator' && hasInitialized) {
    syncPagesFromDefinitions();
  }
}, [currentRole, hasInitialized]);
```

### Step 5: Settings Page Auto-Categorization

**File**: `AIP_UI/src/pages/Settings.tsx`

```typescript
// Replace hardcoded subcategoryMap with dynamic categorization
const getPageSubcategory = (page: Page): string => {
  // Use category from database if available
  if (page.category) {
    return page.category;
  }
  
  // Fallback to path-based categorization
  const pathParts = page.path.split('/').filter(Boolean);
  if (pathParts.length > 0) {
    return pathParts[0].charAt(0).toUpperCase() + pathParts[0].slice(1);
  }
  
  return 'Other';
};

// Group pages by category
const pagesBySubcategory = filteredPages.reduce((acc, page) => {
  const subcategory = getPageSubcategory(page);
  if (!acc[subcategory]) {
    acc[subcategory] = [];
  }
  acc[subcategory].push(page);
  return acc;
}, {} as Record<string, Page[]>);
```

## 🎯 Benefits of This Approach

1. **Single Source of Truth**: `sidebar.ts` drives everything
2. **Automatic Sync**: New pages automatically appear in database
3. **No Manual Seeding**: Developers just add to `sidebar.ts`
4. **Consistent**: Settings and Customer Page Settings always in sync
5. **Maintainable**: One place to update page definitions

## 📋 Migration Checklist

- [ ] Create `pageDefinitions.ts` with all pages from `sidebar.ts`
- [ ] Add backend sync endpoint
- [ ] Enhance `SyncPagesFromDefinitionsAsync` method
- [ ] Update Settings page to use dynamic categorization
- [ ] Test page creation flow
- [ ] Test Customer Page Settings assignment
- [ ] Test Settings page role management
- [ ] Document process for developers

## 🔄 Workflow for Adding New Pages

### Developer Workflow (After Implementation)

1. **Add page to `sidebar.ts`**:
   ```typescript
   {
     path: '/new-section/new-page',
     label: 'New Page',
     icon: NewIcon,
   }
   ```

2. **Add page definition to `pageDefinitions.ts`**:
   ```typescript
   {
     pageId: 'new-page',
     title: 'New Page',
     path: '/new-section/new-page',
     category: 'NewSection',
     description: 'Description of new page',
     sortOrder: 100
   }
   ```

3. **Add route to `routes.tsx`**:
   ```typescript
   {
     path: 'new-section/new-page',
     element: <ProtectedRoute><NewPage /></ProtectedRoute>
   }
   ```

4. **Create page component**:
   ```typescript
   // AIP_UI/src/pages/new-section/NewPage.tsx
   ```

5. **That's it!** Pages auto-sync on next app load

## 🚀 Next Steps

1. Review and approve this design
2. Implement Phase 1 (Backend auto-detection)
3. Implement Phase 2 (Frontend-Backend sync)
4. Implement Phase 3 (Settings auto-categorization)
5. Implement Phase 4 (Customer Page Settings enhancement)
6. Test end-to-end workflow
7. Document for team

