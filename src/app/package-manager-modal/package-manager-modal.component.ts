import { ChangeDetectionStrategy, Component, OnInit, computed, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface EndorsementVersion {
  id: number;
  groupNumber: string;
  code: string;
  name: string;
  description: string;
}

interface EndorsementGroup {
  number: string;
  title: string;
  policyForm?: string;
  versions: EndorsementVersion[];
}

export interface PackageManagerPackage {
  id: string;
  name: string;
  policyForm?: string;
  formCode?: string;
  isCustom?: boolean;
}

export interface PackageManagerCreateEvent {
  packageName: string;
  policyForm: string;
  endorsementIds: number[];
}

export interface PackageManagerUpdateEvent {
  packageId: string;
  packageName: string;
  policyForm: string;
  endorsementIds: number[];
}

type PackageMode = 'new' | 'update';

interface PolicyFormOption {
  code: string;
  displayCode: string;
  description: string;
}

const POLICY_FORM_OPTIONS: readonly PolicyFormOption[] = [
  { code: 'D11', displayCode: 'D11100', description: 'EPL Policy Form' },
  { code: 'D26', displayCode: 'D26100', description: 'COA/HOA Policy Form' },
  { code: 'D32', displayCode: 'D32000', description: 'Fiduciary Policy Form' },
  { code: 'D55', displayCode: 'D55100', description: 'Legacy Combo Policy Form' },
  { code: 'D56', displayCode: 'D56100', description: 'Combo Policy Form' },
  { code: 'D71', displayCode: 'D71100', description: 'EPL Policy Form' }
] as const;

@Component({
  selector: 'app-package-manager-modal',
  imports: [FormsModule],
  templateUrl: './package-manager-modal.component.html',
  styleUrl: './package-manager-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PackageManagerModalComponent implements OnInit {
  readonly endorsementGroups = input.required<EndorsementGroup[]>();
  readonly packages = input.required<PackageManagerPackage[]>();
  readonly packageSelections = input.required<Record<string, number[]>>();
  readonly initiallySelectedVersionIds = input<number[]>([]);
  readonly initialPolicyForm = input<string>('');
  readonly lockPolicyForm = input<boolean>(false);

  readonly close = output<void>();
  readonly createPackage = output<PackageManagerCreateEvent>();
  readonly updatePackage = output<PackageManagerUpdateEvent>();

  readonly mode = signal<PackageMode>('new');
  readonly policyFormInput = signal('');
  readonly policyFormFilterQuery = signal('');
  readonly packagePickerInput = signal('');
  readonly packagePickerFilterQuery = signal('');
  readonly packageNameInput = signal('');
  readonly availableSearch = signal('');
  readonly selectedSearch = signal('');

  protected readonly selectedPolicyFormCode = signal('');
  protected readonly selectedPackageId = signal('');

  // Combobox state – policy form
  readonly policyFormDropdownOpen = signal(false);
  readonly policyFormHighlightedIndex = signal(-1);

  // Combobox state – package picker
  readonly packagePickerDropdownOpen = signal(false);
  readonly packagePickerHighlightedIndex = signal(-1);
  private readonly selectedVersionIds = signal<Set<number>>(new Set<number>());
  readonly collapsedGroups = signal<Set<string>>(new Set<string>());

  readonly policyFormOptions = POLICY_FORM_OPTIONS;

  readonly isUpdatePolicyFormLocked = computed(() => this.mode() === 'update' && this.selectedPackageId() !== '');

  readonly allVersions = computed(() =>
    this.endorsementGroups()
      .flatMap((group) => group.versions)
      .sort((left, right) => left.code.localeCompare(right.code))
  );

  readonly versionPolicyFormMap = computed(() => {
    const map = new Map<number, string>();
    for (const group of this.endorsementGroups()) {
      if (group.policyForm) {
        for (const version of group.versions) {
          map.set(version.id, group.policyForm);
        }
      }
    }
    return map;
  });

  readonly selectedCount = computed(() => this.selectedVersionIds().size);

  readonly selectedVersions = computed(() => {
    const selected = this.selectedVersionIds();
    const query = this.selectedSearch().trim().toLowerCase();
    return this.allVersions().filter((version) => {
      if (!selected.has(version.id)) {
        return false;
      }
      return this.matchesSearch(version, query);
    });
  });

  readonly availableGroups = computed(() => {
    const policyFormCode = this.selectedPolicyFormCode();
    if (!policyFormCode) return [];
    const query = this.availableSearch().trim().toLowerCase();
    return this.endorsementGroups()
      .filter((group) => group.policyForm === policyFormCode)
      .map((group) => ({
        number: group.number,
        title: group.title,
        versions: group.versions
          .filter((v) => this.matchesSearch(v, query))
          .sort((a, b) => a.code.localeCompare(b.code)),
      }))
      .filter((group) => group.versions.length > 0);
  });

  readonly expandAllLabel = computed(() => {
    const groups = this.availableGroups();
    if (groups.length === 0) return 'Expand All';
    const collapsed = this.collapsedGroups();
    return groups.every((g) => collapsed.has(g.number)) ? 'Expand All' : 'Collapse All';
  });

  readonly canSubmit = computed(() => {
    const packageName = this.packageNameInput().trim();
    const hasPolicyForm = this.selectedPolicyFormCode().length > 0;
    const hasSelection = this.selectedVersionIds().size > 0;

    if (this.mode() === 'new') {
      return packageName.length > 0 && hasPolicyForm && hasSelection;
    }

    return this.selectedPackageId().length > 0 && packageName.length > 0 && hasPolicyForm && hasSelection;
  });

  readonly packagePickerOptions = computed(() =>
    this.packages().map((pkg) => ({
      id: pkg.id,
      label: this.getPackageDisplayLabel(pkg)
    }))
  );

  readonly filteredPolicyFormOptions = computed(() => {
    const q = this.policyFormFilterQuery().trim().toLowerCase();
    if (!q) return this.policyFormOptions as readonly PolicyFormOption[];
    return this.policyFormOptions.filter(
      (o) => o.code.toLowerCase().includes(q) || o.description.toLowerCase().includes(q)
    );
  });

  readonly filteredPackagePickerOptions = computed(() => {
    const q = this.packagePickerFilterQuery().trim().toLowerCase();
    const opts = this.packagePickerOptions();
    if (!q) return opts;
    return opts.filter((o) => o.label.toLowerCase().includes(q) || o.id.toLowerCase().includes(q));
  });

  constructor() {}

  ngOnInit(): void {
    this.resetForNewMode();
  }

  setMode(mode: PackageMode): void {
    this.mode.set(mode);
    this.policyFormDropdownOpen.set(false);
    this.packagePickerDropdownOpen.set(false);
    this.policyFormHighlightedIndex.set(-1);
    this.packagePickerHighlightedIndex.set(-1);

    if (mode === 'new') {
      this.resetForNewMode();
      return;
    }

    this.packagePickerInput.set('');
    this.packagePickerFilterQuery.set('');
    this.selectedPackageId.set('');
    this.packageNameInput.set('');
    this.policyFormInput.set('');
    this.policyFormFilterQuery.set('');
    this.selectedPolicyFormCode.set('');
    this.selectedVersionIds.set(new Set<number>());
    this.collapsedGroups.set(new Set<string>());
  }

  onPolicyFormInputChange(value: string): void {
    this.policyFormInput.set(value);
    this.policyFormFilterQuery.set(value);
    this.selectedPolicyFormCode.set(this.resolvePolicyFormCode(value));
    this.policyFormDropdownOpen.set(true);
    this.policyFormHighlightedIndex.set(-1);
  }

  openPolicyFormDropdown(): void {
    if (this.lockPolicyForm() || this.isUpdatePolicyFormLocked()) return;
    this.policyFormFilterQuery.set('');
    this.policyFormDropdownOpen.set(true);
    this.policyFormHighlightedIndex.set(-1);
  }

  blurPolicyFormDropdown(): void {
    setTimeout(() => this.policyFormDropdownOpen.set(false), 150);
  }

  selectPolicyFormOption(option: PolicyFormOption): void {
    this.policyFormInput.set(this.getPolicyFormOptionLabel(option));
    this.policyFormFilterQuery.set('');
    this.selectedPolicyFormCode.set(option.code);
    this.policyFormDropdownOpen.set(false);
    this.policyFormHighlightedIndex.set(-1);
  }

  onPolicyFormKeydown(event: KeyboardEvent): void {
    const options = this.filteredPolicyFormOptions();
    const current = this.policyFormHighlightedIndex();
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.policyFormDropdownOpen.set(true);
      this.policyFormHighlightedIndex.set(Math.min(current + 1, options.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.policyFormHighlightedIndex.set(Math.max(current - 1, 0));
    } else if (event.key === 'Enter') {
      const option = options[current];
      if (option) {
        event.preventDefault();
        this.selectPolicyFormOption(option);
      }
    } else if (event.key === 'Escape') {
      this.policyFormDropdownOpen.set(false);
      this.policyFormHighlightedIndex.set(-1);
    }
  }

  onPackagePickerInputChange(value: string): void {
    this.packagePickerInput.set(value);
    this.packagePickerFilterQuery.set(value);
    this.packagePickerDropdownOpen.set(true);
    this.packagePickerHighlightedIndex.set(-1);
    const normalized = value.trim().toLowerCase();
    if (!normalized) {
      this.selectedPackageId.set('');
      this.packageNameInput.set('');
      this.policyFormInput.set('');
      this.selectedPolicyFormCode.set('');
      this.selectedVersionIds.set(new Set<number>());
      return;
    }

    const matched = this.packagePickerOptions().find(
      (option) => option.label.toLowerCase() === normalized || option.id.toLowerCase() === normalized
    );

    if (!matched) {
      this.selectedPackageId.set('');
      return;
    }

    this.loadExistingPackage(matched.id);
  }

  openPackagePickerDropdown(): void {
    this.packagePickerFilterQuery.set('');
    this.packagePickerDropdownOpen.set(true);
    this.packagePickerHighlightedIndex.set(-1);
  }

  blurPackagePickerDropdown(): void {
    setTimeout(() => this.packagePickerDropdownOpen.set(false), 150);
  }

  selectPackagePickerOption(option: { id: string; label: string }): void {
    this.packagePickerInput.set(option.label);
    this.packagePickerFilterQuery.set('');
    this.onPackagePickerInputChange(option.label);
    this.packagePickerDropdownOpen.set(false);
    this.packagePickerHighlightedIndex.set(-1);
  }

  onPackagePickerKeydown(event: KeyboardEvent): void {
    const options = this.filteredPackagePickerOptions();
    const current = this.packagePickerHighlightedIndex();
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.packagePickerDropdownOpen.set(true);
      this.packagePickerHighlightedIndex.set(Math.min(current + 1, options.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.packagePickerHighlightedIndex.set(Math.max(current - 1, 0));
    } else if (event.key === 'Enter') {
      const option = options[current];
      if (option) {
        event.preventDefault();
        this.selectPackagePickerOption(option);
      }
    } else if (event.key === 'Escape') {
      this.packagePickerDropdownOpen.set(false);
      this.packagePickerHighlightedIndex.set(-1);
    }
  }

  moveToSelected(versionId: number): void {
    this.selectedVersionIds.update((current) => {
      const next = new Set(current);
      next.add(versionId);
      return next;
    });
  }

  moveToAvailable(versionId: number): void {
    this.selectedVersionIds.update((current) => {
      const next = new Set(current);
      next.delete(versionId);
      return next;
    });
  }

  submit(): void {
    if (!this.canSubmit()) {
      return;
    }

    const packageName = this.packageNameInput().trim();
    const policyForm = this.selectedPolicyFormCode();
    const endorsementIds = Array.from(this.selectedVersionIds()).sort((a, b) => a - b);

    if (this.mode() === 'new') {
      this.createPackage.emit({ packageName, policyForm, endorsementIds });
      return;
    }

    const packageId = this.selectedPackageId();
    if (!packageId) {
      return;
    }

    this.updatePackage.emit({ packageId, packageName, policyForm, endorsementIds });
  }

  closeModal(): void {
    this.close.emit();
  }

  getPolicyFormOptionLabel(option: PolicyFormOption): string {
    return `${option.displayCode} - ${option.description}`;
  }

  getPackageDisplayLabel(pkg: PackageManagerPackage): string {
    if (pkg.policyForm) {
      return `${pkg.formCode ?? pkg.policyForm + '100'} - ${pkg.name}`;
    }
    return pkg.name;
  }

  isVersionSelected(versionId: number): boolean {
    return this.selectedVersionIds().has(versionId);
  }

  onVersionCheckChange(versionId: number, checked: boolean): void {
    if (checked) {
      this.moveToSelected(versionId);
    } else {
      this.moveToAvailable(versionId);
    }
  }

  toggleExpandAllGroups(): void {
    const groups = this.availableGroups();
    const collapsed = this.collapsedGroups();
    const allCollapsed = groups.every((g) => collapsed.has(g.number));
    this.collapsedGroups.set(allCollapsed ? new Set() : new Set(groups.map((g) => g.number)));
  }

  expandSelectedGroups(): void {
    const selected = this.selectedVersionIds();
    const groupsWithSelected = this.availableGroups()
      .filter((g) => g.versions.some((v) => selected.has(v.id)))
      .map((g) => g.number);
    this.collapsedGroups.update((current) => {
      const next = new Set(current);
      for (const num of groupsWithSelected) {
        next.delete(num);
      }
      return next;
    });
  }

  toggleGroup(groupNumber: string): void {
    this.collapsedGroups.update((current) => {
      const next = new Set(current);
      if (next.has(groupNumber)) {
        next.delete(groupNumber);
      } else {
        next.add(groupNumber);
      }
      return next;
    });
  }

  isGroupCollapsed(groupNumber: string): boolean {
    return this.collapsedGroups().has(groupNumber);
  }

  private resetForNewMode(): void {
    const selected = new Set<number>(this.initiallySelectedVersionIds());
    this.selectedVersionIds.set(selected);
    this.collapsedGroups.set(new Set<string>());
    this.packageNameInput.set('');
    this.packagePickerInput.set('');
    this.packagePickerFilterQuery.set('');
    this.selectedPackageId.set('');
    this.availableSearch.set('');
    this.selectedSearch.set('');

    const policyForm = this.initialPolicyForm();
    if (policyForm) {
      const option = this.policyFormOptions.find((o) => o.code === policyForm);
      if (option) {
        this.policyFormInput.set(this.getPolicyFormOptionLabel(option));
      } else {
        this.policyFormInput.set(policyForm);
      }
      this.policyFormFilterQuery.set('');
      this.selectedPolicyFormCode.set(policyForm);
    } else {
      this.policyFormInput.set('');
      this.policyFormFilterQuery.set('');
      this.selectedPolicyFormCode.set('');
    }

    // If opened with pre-selected versions, collapse all groups except those containing selections
    if (selected.size > 0) {
      const toCollapse = this.availableGroups()
        .filter((g) => !g.versions.some((v) => selected.has(v.id)))
        .map((g) => g.number);
      this.collapsedGroups.set(new Set(toCollapse));
    }
  }

  private loadExistingPackage(packageId: string): void {
    const pkg = this.packages().find((item) => item.id === packageId);
    if (!pkg) {
      return;
    }

    const policyFormCode = pkg.policyForm ?? '';
    this.selectedPackageId.set(pkg.id);
    this.packageNameInput.set(pkg.name);

    const option = this.policyFormOptions.find((o) => o.code === policyFormCode);
    this.policyFormInput.set(option ? this.getPolicyFormOptionLabel(option) : policyFormCode);
    this.policyFormFilterQuery.set('');
    this.selectedPolicyFormCode.set(policyFormCode);

    const selections = this.packageSelections()[pkg.id] ?? [];
    this.selectedVersionIds.set(new Set<number>(selections));
  }

  private resolvePolicyFormCode(value: string): string {
    const normalized = value.trim().toUpperCase();
    if (!normalized) {
      return '';
    }

    const directMatch = this.policyFormOptions.find((option) => option.code === normalized);
    if (directMatch) {
      return directMatch.code;
    }

    const optionMatch = this.policyFormOptions.find((option) =>
      this.getPolicyFormOptionLabel(option).toUpperCase() === normalized
    );
    if (optionMatch) {
      return optionMatch.code;
    }

    const prefixMatch = this.policyFormOptions.find((option) => normalized.startsWith(option.code));
    if (prefixMatch) {
      return prefixMatch.code;
    }

    return '';
  }

  private matchesSearch(version: EndorsementVersion, query: string): boolean {
    if (!query) {
      return true;
    }

    const code = version.code.toLowerCase();
    const name = version.name.toLowerCase();
    const description = version.description.toLowerCase();
    return code.includes(query) || name.includes(query) || description.includes(query);
  }
}
