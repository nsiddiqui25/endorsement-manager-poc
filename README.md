# EndorsementManager

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.1.3.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

## Implementation Steps Completed

The following steps document the work completed so far, in the order performed:

1. **Scaffolded the Angular application (standalone SPA).**
	- Created a new Angular app using the latest LTS CLI with SCSS and no routing/tests.
	- Result: baseline project structure under endorsement-manager, ready for iterative UI work.

2. **Replaced the default Angular template with the Endorsement Manager layout skeleton.**
	- Built the main page structure: filter panel, grouping rail, master list, selected list, details panel, and action panel.
	- Added an explicit, recognizable layout that mirrors the WinForms control hierarchy.
	- Files: endorsement-manager/src/app/app.html, endorsement-manager/src/app/app.scss.

3. **Added mock data models and rendered the UI from data.**
	- Defined endorsement, selected endorsement, and package models with 30 mock endorsements and 4 packages.
	- Implemented grouping by series and wired grid rendering to the mock data.
	- Files: endorsement-manager/src/app/app.ts, endorsement-manager/src/app/app.html.

4. **Implemented search/filter behavior with WinForms parity.**
	- Endorsement Number: substring match.
	- Description/Text: word search or quoted phrase search, punctuation-aware.
	- Typing in one field clears the other two fields.
	- Files: endorsement-manager/src/app/app.ts, endorsement-manager/src/app/app.html.

5. **Implemented grouping toggle and expand/collapse behavior.**
	- Group by Endorsement Number vs Endorsement Type.
	- Expand All, Collapse All, and Expand Selected actions.
	- Clickable group headers with +/- indicators.
	- Files: endorsement-manager/src/app/app.ts, endorsement-manager/src/app/app.html, endorsement-manager/src/app/app.scss.

6. **Implemented selection interactions (checkboxes, add/remove, clear list).**
	- Master list checkboxes add/remove endorsements and update active detail display.
	- Selected list optional flag can be toggled.
	- Clear List empties the selection and disables when empty.
	- Files: endorsement-manager/src/app/app.ts, endorsement-manager/src/app/app.html, endorsement-manager/src/app/app.scss.

7. **Implemented Package “Add Package” behavior.**
	- Added mock package mappings to endorsement IDs.
	- Selecting a package and clicking Add Package activates those endorsements.
	- Files: endorsement-manager/src/app/app.ts, endorsement-manager/src/app/app.html.

8. **Implemented context menu actions (add duplicate, remove/activate).**
	- Right-click on master list: Add Duplicate creates a new instance of the endorsement.
	- Right-click on selected list: Remove or Activate based on status.
	- Added a custom context menu overlay with styling.
	- Files: endorsement-manager/src/app/app.ts, endorsement-manager/src/app/app.html, endorsement-manager/src/app/app.scss.

9. **Fixed duplicate-support template tracking error.**
	- Updated list tracking to use instanceId after refactoring the selected model.
	- File: endorsement-manager/src/app/app.html.

10. **Implemented Show All / Show Midterm filters for selected list.**
	- Added filter toggles that mirror UW2 behavior (mutual exclusivity).
	- Default view hides removed items unless Show All is checked.
	- Midterm view filters the selected list to items flagged as midterm in mock data.
	- Files: endorsement-manager/src/app/app.ts, endorsement-manager/src/app/app.html.

11. **Implemented Mandatory Endorsements button state + behavior.**
	- Added a mock mandatory list and computed missing count.
	- Button turns alert red and shows Missing count when any mandatory items are not active.
	- Clicking the button adds or re-activates mandatory endorsements.
	- Files: endorsement-manager/src/app/app.ts, endorsement-manager/src/app/app.html, endorsement-manager/src/app/app.scss.

12. **Added visual counters for list sizes.**
	- Master list shows filtered count vs total count.
	- Selected list shows filtered count vs total count.
	- Files: endorsement-manager/src/app/app.ts, endorsement-manager/src/app/app.html, endorsement-manager/src/app/app.scss.

13. **Implemented View Text / Fill Blanks placeholder modals.**
	- Added modal state and handlers for opening/closing placeholder dialogs.
	- View Text and Fill Blanks buttons now open a modal explaining future integration.
	- Files: endorsement-manager/src/app/app.ts, endorsement-manager/src/app/app.html, endorsement-manager/src/app/app.scss.

14. **Implemented policy-sold behavior for Clear List.**
	- Added a policy-sold flag and blocked Clear List when the policy is sold.
	- Clear List button is disabled when policy-sold is true.
	- Files: endorsement-manager/src/app/app.ts, endorsement-manager/src/app/app.html.

15. **Implemented keyboard navigation for master and selected lists.**
	- Arrow Up/Down moves through visible rows; Space toggles selection (master) or optional flag (selected).
	- Active row is tracked and highlighted for both lists.
	- Keyboard handling skips text inputs and respects modal state.
	- Files: endorsement-manager/src/app/app.ts, endorsement-manager/src/app/app.html, endorsement-manager/src/app/app.scss.

16. **Added selection summary counts (optional, removed).**
	- Selected list shows a summary row with optional and removed counts.
	- Counts respond to filters (Show All / Show Midterm).
	- Files: endorsement-manager/src/app/app.ts, endorsement-manager/src/app/app.html, endorsement-manager/src/app/app.scss.

17. **Added policy-sold indicator in the UI.**
	- Header now displays a “Policy Sold” badge when policy-sold mode is enabled.
	- Files: endorsement-manager/src/app/app.html, endorsement-manager/src/app/app.scss.

18. **Implemented midterm visibility rule for the master list.**
	- Added midterm flags to endorsement data and filtered the master list when Show Midterm is enabled.
	- Grouping collapses are reset when midterm filtering is toggled.
	- Files: endorsement-manager/src/app/app.ts.

19. **Added a simple toast for add/remove/activate actions.**
	- Toast messages appear when endorsements are added, removed, or activated (including package/mandatory add actions).
	- Added a lightweight toast UI with color cues for add/remove/activate.
	- Files: endorsement-manager/src/app/app.ts, endorsement-manager/src/app/app.html, endorsement-manager/src/app/app.scss.

20. **Aligned search/reset and keyboard behavior with WinForms flow.**
	- Begin Search and Clear Filter now reset group expansion and expand selected groups.
	- Added the Alt+X shortcut to expand all groups as hinted in the UI.
	- Selected midterm filtering now derives from the endorsement data to avoid drift.
	- Files: endorsement-manager/src/app/app.ts.

21. **Temporarily hid charge/type columns in Available Endorsements.**
	- Removed the dollar (charge/credit) and type columns from the master grid until confirmed.
	- Adjusted the master grid layout to match the reduced columns.
	- Files: endorsement-manager/src/app/app.html, endorsement-manager/src/app/app.scss.

22. **Removed Group By selection in the sidebar.**
	- Available Endorsements now stay grouped by Endorsement Number by default.
	- Removed the Group By radio selection UI.
	- Files: endorsement-manager/src/app/app.html.

23. **Merged External Endorsement Name into Selected Endorsements.**
	- Selected rows now show "FNO - External Name" inline.
	- Endorsement Description appears as a hover tooltip on selected rows.
	- Removed the standalone External Endorsement Name/Description section.
	- Files: endorsement-manager/src/app/app.html.

24. **Removed the Alt+X expand note and shortcut.**
	- Dropped the sidebar note card referencing Alt+X.
	- Removed the Alt+X keyboard shortcut logic.
	- Files: endorsement-manager/src/app/app.html, endorsement-manager/src/app/app.ts.

25. **Switched add/remove UX between Available and Selected lists.**
	- Available Endorsements now use a + button to add, and selected items are hidden from the available list.
	- Selected Endorsements now use a trash icon to remove items and return them to Available.
	- Removed context menus and duplicate-add behavior.
	- Removed the Removed counter from Selected Endorsements.
	- Files: endorsement-manager/src/app/app.html, endorsement-manager/src/app/app.ts, endorsement-manager/src/app/app.scss.

26. **Removed midterm toggle and View Text action.**
	- Deleted the Show Midterm checkbox and its midterm-only filtering logic/state.
	- Dropped the View Text action and its placeholder modal content.
	- Fill Blanks modal remains as the only modal flow.
	- Files: endorsement-manager/src/app/app.html, endorsement-manager/src/app/app.ts.

27. **Reworked the layout for the Expand Sections and actions area.**
	- Placed the expand buttons as a standalone section above the master list.
	- Split the actions controls and custom package form into side-by-side cards with responsive stacking.
	- Reworked the grid so Expand Sections and the actions row share the same row height.
	- Adjusted grid placement for the master, selected, and legend cards with responsive fallbacks.
	- Files: endorsement-manager/src/app/app.html, endorsement-manager/src/app/app.scss.

28. **Added a Create Custom Package modal flow.**
	- Launches from the Endorsement Package area with required name and package type.
	- Includes a scrollable Available Endorsements list with multi-select validation.
	- Save is enabled only when name, type, and at least one endorsement are selected.
	- Files: endorsement-manager/src/app/app.html, endorsement-manager/src/app/app.ts, endorsement-manager/src/app/app.scss.

29. **Persisted custom packages into the package dropdown.**
	- Save now adds the custom package to the package list and selection map.
	- Newly created packages are selected automatically.
	- Files: endorsement-manager/src/app/app.ts.

30. **Switched Available Endorsements to versioned groups.**
	- Available Endorsements now show endorsement numbers with expandable version lists.
	- Version rows use checkboxes to add/remove selections and display as "NUMBER .VERSION - NAME".
	- Create Custom Package modal mirrors the same grouped version layout.
	- Files: endorsement-manager/src/app/app.html, endorsement-manager/src/app/app.ts, endorsement-manager/src/app/app.scss.

31. **Added stage-aware active/removed status with header controls.**
	- Selected endorsements now track status by stage (Quote/Bind/Issue/Midterm).
	- Added stage radio dials in the header to drive the current stage.
	- Show All Active/Inactive now surfaces removed items for the selected stage.
	- Files: endorsement-manager/src/app/app.html, endorsement-manager/src/app/app.ts, endorsement-manager/src/app/app.scss.

32. **Improved removed endorsement UX and counters.**
	- Removed items show a + button to reinstate; optional checkbox is disabled when removed.
	- Restored the Removed counter next to Optional and aligned selected list layout.
	- Files: endorsement-manager/src/app/app.html, endorsement-manager/src/app/app.scss.

33. **Added confirmation dialogs for removal actions.**
	- Removing a single endorsement prompts for confirmation.
	- Clear List is now treated as removal and prompts before applying.
	- Files: endorsement-manager/src/app/app.html, endorsement-manager/src/app/app.ts.

34. **Displayed removed-stage detail when showing inactive items.**
	- When Show All Active/Inactive is enabled, removed items show the stages where they were removed.
	- Placed the removed-stage badge next to the endorsement name with compact styling.
	- Files: endorsement-manager/src/app/app.html, endorsement-manager/src/app/app.ts, endorsement-manager/src/app/app.scss.

35. **Refined filtering to single-field, focus-driven behavior.**
	- Only one filter field is active at a time; Begin Search removed.
	- Clear Filter clears all inputs, and filters remain active after blur if a value exists.
	- Files: endorsement-manager/src/app/app.html, endorsement-manager/src/app/app.ts.

36. **Moved expand controls into headers and refined list layout.**
	- Available Endorsements now has a dynamic Expand/Collapse control with Expand Selected in the header.
	- Version rows are indented; right column no longer stretches with the master list height.
	- Create Package modal includes a green Expand/Collapse control aligned with the package type radios.
	- Files: endorsement-manager/src/app/app.html, endorsement-manager/src/app/app.ts, endorsement-manager/src/app/app.scss.

37. **Enhanced endorsement details, visuals, and demo data.**
	- Added endorsement descriptions with info icons in Available/Selected lists and compact legend labels.
	- Seeded selected list with removed, renewal, invalid, and active examples; updated stage labels.
	- Adjusted removed/renewal styling and improved mobile/tablet scrolling behavior.
	- Files: endorsement-manager/src/app/app.html, endorsement-manager/src/app/app.ts, endorsement-manager/src/app/app.scss.

38. **Refined info tooltips and row behavior.**
	- Replaced native tooltips with a custom styled tooltip and consistent font.
	- Removed active-row keyboard navigation visuals and logic.
	- Files: endorsement-manager/src/app/app.html, endorsement-manager/src/app/app.ts, endorsement-manager/src/app/app.scss.

39. **Finalized selected sort and package-creation flow updates.**
	- Selected Endorsements now render in ascending endorsement-number order instead of insertion order.
	- Replaced Custom Package/Product Group Package radio dials with a required Select Product Group dropdown (Non-Profit, US Community Association, Canadian, EPL, Combo).
	- Save now requires product group + package name + at least one selected endorsement.
	- Saved package name format is now: `{productGroup} - {endorsementPackageName}`.
	- Newly created packages display name-only in the package dropdown to avoid duplicated prefixes (example: `Canadian - Ricky`).
	- Files: endorsement-manager/src/app/app.html, endorsement-manager/src/app/app.ts.

40. **Fixed duplicate selected-row keys blocking individual removal.**
	- Resolved Angular `NG0955` duplicate `track` key warnings in Selected Endorsements by ensuring every new `instanceId` is unique.
	- Added a unique-ID allocator for selected rows before pushing new entries.
	- This restores reliable trash-icon removal and confirmation modal behavior after adding many endorsements.
	- Files: endorsement-manager/src/app/app.ts.

41. **Removed summary row from Selected Endorsements.**
	- Removed the summary row showing Optional and Removed counts from the Selected Endorsements list.
	- Deleted the `selectedOptionalCount` and `selectedRemovedCount` getters from the component.
	- Removed the `.summary-row` CSS rule.
	- Files: src/app/app.html, src/app/app.ts, src/app/app.scss.

42. **Removed Optional column from Selected Endorsements.**
	- Removed the Optional header span and the optional checkbox from each selected row.
	- Removed the `optional` field from the `SelectedEndorsement` interface and all hardcoded data entries.
	- Deleted the `toggleOptional()` method.
	- Updated selected-card grid columns from `32px 1fr 80px` to `32px 1fr`.
	- Files: src/app/app.html, src/app/app.ts, src/app/app.scss.