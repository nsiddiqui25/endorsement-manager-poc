import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
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
  versions: EndorsementVersion[];
}

export interface PackageManagerPackage {
  id: string;
  name: string;
  policyForm?: string;
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
  description: string;
}

const POLICY_FORM_OPTIONS: readonly PolicyFormOption[] = [
  { code: 'D11100', description: 'Primary Policy Form' },
  { code: 'D26100', description: 'COA/HOA Policy Form' },
  { code: 'D32100', description: 'Fiduciary Policy Form' },
  { code: 'D55100', description: 'Legacy Combo Policy Form' },
  { code: 'D56100', description: 'Combo Policy Form' },
  { code: 'D71100', description: 'EPL Policy Form' }
] as const;

@Component({
  selector: 'app-package-manager-modal',
  imports: [FormsModule],
  templateUrl: './package-manager-modal.component.html',
  styleUrl: './package-manager-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PackageManagerModalComponent {
  readonly endorsementGroups = input.required<EndorsementGroup[]>();
  readonly packages = input.required<PackageManagerPackage[]>();
  readonly packageSelections = input.required<Record<string, number[]>>();
  readonly initiallySelectedVersionIds = input<number[]>([]);

  readonly close = output<void>();
  readonly createPackage = output<PackageManagerCreateEvent>();
  readonly updatePackage = output<PackageManagerUpdateEvent>();

  readonly mode = signal<PackageMode>('new');
  readonly policyFormInput = signal('');
  readonly packagePickerInput = signal('');
  readonly packageNameInput = signal('');
  readonly availableSearch = signal('');
  readonly selectedSearch = signal('');

  private readonly selectedPolicyFormCode = signal('');
  private readonly selectedPackageId = signal('');
  private readonly selectedVersionIds = signal<Set<number>>(new Set<number>());

  readonly policyFormOptions = POLICY_FORM_OPTIONS;

  readonly allVersions = computed(() =>
    this.endorsementGroups()
      .flatMap((group) => group.versions)
      .sort((left, right) => left.code.localeCompare(right.code))
  );

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

  readonly availableVersions = computed(() => {
    const selected = this.selectedVersionIds();
    const query = this.availableSearch().trim().toLowerCase();
    return this.allVersions().filter((version) => {
      if (selected.has(version.id)) {
        return false;
      }
      return this.matchesSearch(version, query);
    });
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

  constructor() {
    this.resetForNewMode();
  }

  setMode(mode: PackageMode): void {
    this.mode.set(mode);

    if (mode === 'new') {
      this.resetForNewMode();
      return;
    }

    this.packagePickerInput.set('');
    this.selectedPackageId.set('');
    this.packageNameInput.set('');
    this.policyFormInput.set('');
    this.selectedPolicyFormCode.set('');
    this.selectedVersionIds.set(new Set<number>());
  }

  onPolicyFormInputChange(value: string): void {
    this.policyFormInput.set(value);
    this.selectedPolicyFormCode.set(this.resolvePolicyFormCode(value));
  }

  onPackagePickerInputChange(value: string): void {
    this.packagePickerInput.set(value);
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
    return `${option.code} - ${option.description}`;
  }

  getPackageDisplayLabel(pkg: PackageManagerPackage): string {
    if (pkg.policyForm) {
      return `${pkg.name} - ${pkg.policyForm}`;
    }
    return pkg.name;
  }

  private resetForNewMode(): void {
    const selected = new Set<number>(this.initiallySelectedVersionIds());
    this.selectedVersionIds.set(selected);
    this.packageNameInput.set('');
    this.packagePickerInput.set('');
    this.selectedPackageId.set('');
    this.policyFormInput.set('');
    this.selectedPolicyFormCode.set('');
    this.availableSearch.set('');
    this.selectedSearch.set('');
  }

  private loadExistingPackage(packageId: string): void {
    const pkg = this.packages().find((item) => item.id === packageId);
    if (!pkg) {
      return;
    }

    const policyFormCode = pkg.policyForm ?? '';
    this.selectedPackageId.set(pkg.id);
    this.packageNameInput.set(pkg.name);
    this.policyFormInput.set(policyFormCode);
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
