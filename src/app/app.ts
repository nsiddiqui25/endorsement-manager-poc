import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ViewTextPreviewComponent } from './view-text-preview/view-text-preview.component';
import { EndorsementEditorComponent } from './endorsement-editor/endorsement-editor.component';
import {
  PackageManagerModalComponent,
  type PackageManagerCreateEvent,
  type PackageManagerUpdateEvent
} from './package-manager-modal/package-manager-modal.component';

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

type SelectedStatus = 'active' | 'removed' | 'invalid' | 'renewal';
type PolicyStage = 'quote' | 'bind' | 'issue' | 'midterm';

interface SelectedEndorsement {
  instanceId: number;
  versionId: number;
  statusByStage: Record<PolicyStage, SelectedStatus>;
}

interface PackageInfo {
  id: string;
  name: string;
  policyForm?: string;
  isCustom?: boolean;
}

type SelectedDisplayItem =
  SelectedEndorsement & { version?: EndorsementVersion; label: string; status: SelectedStatus; description: string };

type ModalType =
  | 'fill-blanks'
  | 'create-package'
  | 'confirm-remove'
  | 'confirm-clear'
  | 'confirm-mandatory'
  | 'view-text'
  | null;

type FilterField = 'number' | 'name' | 'description';

type ToastKind = 'add' | 'remove' | 'activate';

@Component({
  selector: 'app-root',
  imports: [FormsModule, ViewTextPreviewComponent, EndorsementEditorComponent, PackageManagerModalComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  filterNumber = '';
  filterName = '';
  filterDescription = '';
  activeFilterField: FilterField | null = null;
  selectedPackageId = '';
  policyStage: PolicyStage = 'quote';
  showAllSelected = false;
  isPolicySold = false;
  private collapsedGroups = new Set<string>();
  private groupsInitialized = false;
  private nextInstanceId = 10_000;
  activeModal: ModalType = null;
  pendingRemoveInstanceId: number | null = null;
  pendingClearAll = false;
  toastMessage = '';
  toastKind: ToastKind = 'add';
  private toastTimeoutId: ReturnType<typeof setTimeout> | null = null;
  selectedContextMenuOpen = false;
  selectedContextMenuX = 0;
  selectedContextMenuY = 0;
  selectedContextMenuInstanceId: number | null = null;
  readonly viewTextDocUrl = '/D26309.000.pdf';
  readonly fillBlanksFormDisplayNumber = 'D26309';
  readonly stageOptions: Array<{ id: PolicyStage; label: string }> = [
    { id: 'quote', label: 'Quoted' },
    { id: 'bind', label: 'Bound' },
    { id: 'issue', label: 'Issued' },
    { id: 'midterm', label: 'Midterm' }
  ];
  readonly endorsementGroups: EndorsementGroup[] = [
    {
      number: 'D0072',
      title: 'Interpretation of Any Inconsistent Term, Condition, or Exclusion',
      versions: [
        {
          id: 2001,
          groupNumber: 'D0072',
          code: 'D0072 .000',
          name: 'Interpretation of Any Inconsistent Term, Condition, or Exclusion',
          description: 'Clarifies how to interpret conflicts between terms, conditions, or exclusions. Helps ensure consistent claim handling across policy language.'
        }
      ]
    },
    {
      number: 'D00816',
      title: 'Flat Cancel Endorsement',
      versions: [
        {
          id: 2002,
          groupNumber: 'D816',
          code: 'D00816 .000',
          name: 'Amendment to Declarations Page - Flat Cancellation',
          description: 'Updates declarations for flat cancellation with no earned premium. Confirms cancellation accounting treatment and timing requirements.'
        },
        {
          id: 2003,
          groupNumber: 'D816',
          code: 'D00816 .200',
          name: 'Amendment to Declarations Page - Flat Cancellation',
          description: 'Updates declarations for flat cancellation with no earned premium. Confirms cancellation accounting treatment and timing requirements.'
        },
        {
          id: 2004,
          groupNumber: 'D816',
          code: 'D00816 .400',
          name: 'Amendment to Declarations Page - Flat Cancellation',
          description: 'Updates declarations for flat cancellation with no earned premium. Confirms cancellation accounting treatment and timing requirements.'
        }
      ]
    },
    {
      number: 'D2400',
      title: 'Amendment to Declarations Page',
      versions: [
        {
          id: 2005,
          groupNumber: 'D2400',
          code: 'D02400 .005',
          name: 'Amendment to Declarations Page - Cancellation',
          description: 'Updates declarations to reflect cancellation details for the policy. Aligns effective dates, notices, and premium adjustments.'
        },
        {
          id: 2006,
          groupNumber: 'D2400',
          code: 'D02400 .205',
          name: 'Amendment to Declarations Page - Cancellation',
          description: 'Updates declarations to reflect cancellation details for the policy. Aligns effective dates, notices, and premium adjustments.'
        },
        {
          id: 2007,
          groupNumber: 'D2400',
          code: 'D02400 .405',
          name: 'Amendment to Declarations Page - Cancellation',
          description: 'Updates declarations to reflect cancellation details for the policy. Aligns effective dates, notices, and premium adjustments.'
        },
        {
          id: 2008,
          groupNumber: 'D2400',
          code: 'D02400 .605',
          name: 'Amendment to Declarations Page - Cancellation',
          description: 'Updates declarations to reflect cancellation details for the policy. Aligns effective dates, notices, and premium adjustments.'
        }
      ]
    },
    {
      number: 'D26053',
      title: 'Disclosure Form - Claims-Made Policy',
      versions: [
        {
          id: 2009,
          groupNumber: 'D26053',
          code: 'D26053 .000',
          name: 'Disclosure Form - Claims-Made Policy',
          description: 'Discloses claims-made reporting requirements and coverage trigger details. Explains notice windows and retroactive date implications.'
        }
      ]
    },
    {
      number: 'D26303',
      title: 'Illinois Amendatory Endorsement',
      versions: [
        {
          id: 2010,
          groupNumber: 'D26303',
          code: 'D26303 .000',
          name: 'Illinois Amendatory Endorsement',
          description: 'Applies Illinois amendatory provisions required by statute. Updates policy wording to maintain state compliance.'
        }
      ]
    },
    {
      number: 'D26402',
      title: 'Discovery Period',
      versions: [
        {
          id: 2011,
          groupNumber: 'D26402',
          code: 'D26402 .000',
          name: 'Discovery Period',
          description: 'Defines discovery period options and extended reporting terms. Clarifies election deadlines and applicable premium charges.'
        }
      ]
    },
    {
      number: 'D26403',
      title: 'Discovery Period - Reinstated Limits',
      versions: [
        {
          id: 2012,
          groupNumber: 'D26403',
          code: 'D26403 .000',
          name: 'Discovery Period - Reinstated Limits',
          description: 'Reinstates limits during the discovery period under stated conditions. Specifies triggers, limits, and endorsement prerequisites clearly.'
        }
      ]
    },
    {
      number: 'D26500',
      title: 'General Limitation of Coverage',
      versions: [
        {
          id: 2013,
          groupNumber: 'D26500',
          code: 'D26500 .000',
          name: 'General Limitation of Coverage',
          description: 'Limits coverage for specified claims as outlined in the endorsement. Identifies restricted scenarios and resulting claim impacts.'
        },
        {
          id: 2014,
          groupNumber: 'D26500',
          code: 'D26500 .200',
          name: 'General Limitation of Coverage',
          description: 'Limits coverage for specified claims as outlined in the endorsement. Identifies restricted scenarios and resulting claim impacts.'
        }
      ]
    },
    {
      number: 'D26501',
      title: 'Rate-Making Exclusion',
      versions: [
        {
          id: 2015,
          groupNumber: 'D26501',
          code: 'D26501 .000',
          name: 'Rate-Making Exclusion',
          description: 'Excludes losses arising from rate-making activities. Narrows exposure for pricing-related professional allegations.'
        }
      ]
    },
    {
      number: 'D26504',
      title: 'Limited Partnership Exclusion',
      versions: [
        {
          id: 2016,
          groupNumber: 'D26504',
          code: 'D26504 .000',
          name: 'Limited Partnership Exclusion',
          description: 'Excludes liability tied to limited partnership activities. Defines scope for ownership and management involvement.'
        }
      ]
    },
    {
      number: 'D26506',
      title: 'Failure to Effect and Maintain Insurance',
      versions: [
        {
          id: 2017,
          groupNumber: 'D26506',
          code: 'D26506 .000',
          name: 'Failure to Effect and Maintain Insurance',
          description: 'Excludes claims tied to failure to maintain required insurance. Reinforces contractual insurance procurement responsibilities.'
        }
      ]
    },
    {
      number: 'D26507',
      title: 'Discrimination Exclusion',
      versions: [
        {
          id: 2018,
          groupNumber: 'D26507',
          code: 'D26507 .000',
          name: 'Discrimination Exclusion',
          description: 'Excludes discrimination-related claims under the policy. Clarifies boundaries for employment and service allegations.'
        }
      ]
    },
    {
      number: 'D26509',
      title: 'Membership Exclusion',
      versions: [
        {
          id: 2019,
          groupNumber: 'D26509',
          code: 'D26509 .000',
          name: 'Membership Exclusion',
          description: 'Excludes claims tied to membership-related activities. Applies to disputes involving member status decisions.'
        }
      ]
    },
    {
      number: 'D26513',
      title: 'Specified Professional Services Exclusion',
      versions: [
        {
          id: 2020,
          groupNumber: 'D26513',
          code: 'D26513 .000',
          name: 'Specified Professional Services Exclusion',
          description: 'Excludes claims from specified professional services. Lists targeted services and associated liability carveouts.'
        }
      ]
    },
    {
      number: 'D26515',
      title: 'Specific Entity Exclusion',
      versions: [
        {
          id: 2021,
          groupNumber: 'D26515',
          code: 'D26515 .000',
          name: 'Specific Entity Exclusion',
          description: 'Excludes claims involving the specified entity. Applies regardless of direct or indirect involvement.'
        }
      ]
    },
    {
      number: 'D26518',
      title: 'Interested Party Exclusion',
      versions: [
        {
          id: 2022,
          groupNumber: 'D26518',
          code: 'D26518 .000',
          name: 'Interested Party Exclusion',
          description: 'Excludes claims involving interested parties as defined. Clarifies related-party relationships and conflict scenarios.'
        }
      ]
    }
  ];

  readonly selected: SelectedEndorsement[] = [
    {
      instanceId: 10001,
      versionId: 2001,
      statusByStage: { quote: 'active', bind: 'active', issue: 'active', midterm: 'active' }
    },
    {
      instanceId: 10002,
      versionId: 2006,
      statusByStage: { quote: 'removed', bind: 'removed', issue: 'removed', midterm: 'removed' }
    },
    {
      instanceId: 10003,
      versionId: 2013,
      statusByStage: { quote: 'renewal', bind: 'renewal', issue: 'renewal', midterm: 'renewal' }
    },
    {
      instanceId: 10004,
      versionId: 2015,
      statusByStage: { quote: 'removed', bind: 'removed', issue: 'removed', midterm: 'removed' }
    },
    {
      instanceId: 10005,
      versionId: 2017,
      statusByStage: { quote: 'active', bind: 'active', issue: 'active', midterm: 'active' }
    },
    {
      instanceId: 10006,
      versionId: 2019,
      statusByStage: { quote: 'active', bind: 'active', issue: 'active', midterm: 'active' }
    },
    {
      instanceId: 10007,
      versionId: 2018,
      statusByStage: { quote: 'invalid', bind: 'invalid', issue: 'invalid', midterm: 'invalid' }
    }
  ];

  packages: PackageInfo[] = [
    { id: 'H11', name: 'Standard Package', policyForm: 'D71100' },
    { id: 'H12', name: 'Large Risk Exemption', policyForm: 'D32100' },
    { id: 'H13', name: 'FTZ Package', policyForm: 'D26100' },
    { id: 'H21', name: 'Midterm Package', policyForm: 'D56100' }
  ];

  packageSelections: Record<string, number[]> = {
    H11: [2001, 2005, 2013],
    H12: [2002, 2003, 2004],
    H13: [2009, 2010, 2011],
    H21: [2017, 2018, 2019]
  };

  readonly mandatoryEndorsementIds: number[] = [2001, 2013, 2015, 2016, 2021];


  get selectedByVersionId(): Map<number, SelectedEndorsement[]> {
    const map = new Map<number, SelectedEndorsement[]>();
    for (const item of this.selected) {
      const bucket = map.get(item.versionId);
      if (bucket) {
        bucket.push(item);
      } else {
        map.set(item.versionId, [item]);
      }
    }
    return map;
  }

  get allVersions(): EndorsementVersion[] {
    return this.endorsementGroups.flatMap((group) => group.versions);
  }

  get filteredGroups(): EndorsementGroup[] {
    const number = this.filterNumber.trim();
    const name = this.filterName.trim();
    const description = this.filterDescription.trim();

    this.ensureGroupStateInitialized();

    if (!this.activeFilterField || (!number && !name && !description)) {
      return this.sortGroups(this.endorsementGroups);
    }

    if (this.activeFilterField === 'number' && number) {
      const query = number.toLowerCase();
      const groups = this.endorsementGroups
        .map((group) => {
          const groupMatch = group.number.toLowerCase().includes(query);
          const versions = groupMatch
            ? group.versions
            : group.versions.filter((version) => version.code.toLowerCase().includes(query));
          return { ...group, versions };
        })
        .filter((group) => group.versions.length > 0);
      return this.sortGroups(groups);
    }

    if (this.activeFilterField === 'name' && name) {
      return this.sortGroups(this.filterGroupsByName(name));
    }

    if (this.activeFilterField === 'description' && description) {
      return this.sortGroups(this.filterGroupsByDescription(description));
    }

    return this.sortGroups(this.endorsementGroups);
  }

  get masterVisibleIds(): number[] {
    const ids: number[] = [];
    for (const group of this.filteredGroups) {
      if (this.isGroupCollapsed(group.number)) {
        continue;
      }
      for (const version of group.versions) {
        ids.push(version.id);
      }
    }
    return ids;
  }

  get selectedDisplay(): SelectedDisplayItem[] {
    return this.selected
      .map((item) => {
        const version = this.getVersionById(item.versionId);
        const status = this.getStageStatus(item);
        return {
          ...item,
          version,
          status,
          label: version ? this.getVersionLabel(version) : 'Unknown',
          description: version?.description ?? ''
        };
      })
      .sort((a, b) => {
        const leftCode = a.version?.code ?? '';
        const rightCode = b.version?.code ?? '';
        const codeCompare = leftCode.localeCompare(rightCode);
        if (codeCompare !== 0) {
          return codeCompare;
        }
        return a.instanceId - b.instanceId;
      });
  }

  get availableGroups(): EndorsementGroup[] {
    return this.filteredGroups;
  }

  get availableEndorsementsTotal(): number {
    return this.allVersions.length;
  }

  get selectedActiveVersionIds(): number[] {
    const ids = new Set<number>();
    for (const item of this.selected) {
      if (this.getStageStatus(item) !== 'removed') {
        ids.add(item.versionId);
      }
    }
    return Array.from(ids);
  }

  get filteredSelectedDisplay(): SelectedDisplayItem[] {
    return this.selectedDisplay.filter((item) => this.showAllSelected || item.status !== 'removed');
  }

  get selectedVisibleInstanceIds(): number[] {
    return this.filteredSelectedDisplay.map((item) => item.instanceId);
  }

  get masterCountTotal(): number {
    return this.availableEndorsementsTotal;
  }

  get masterCountFiltered(): number {
    return this.filteredGroups.reduce((total, group) => total + group.versions.length, 0);
  }

  get selectedCountTotal(): number {
    return this.selected.length;
  }

  get selectedCountFiltered(): number {
    return this.filteredSelectedDisplay.length;
  }

  get mandatoryMissingCount(): number {
    return this.mandatoryEndorsementIds.filter((id) => !this.hasActiveSelection(id)).length;
  }

  get hasMandatoryGaps(): boolean {
    return this.mandatoryMissingCount > 0;
  }

  toggleVersionSelection(versionId: number, checked: boolean): void {
    if (checked) {
      const added = this.addIfNotSelected(versionId);
      if (added) {
        this.showToast(`Added ${this.getEndorsementLabel(versionId)}`, 'add');
      }
      return;
    }
    this.requestRemoveByVersionId(versionId);
  }

  isVersionSelected(versionId: number): boolean {
    return this.selected.some(
      (item) => item.versionId === versionId && this.getStageStatus(item) !== 'removed'
    );
  }

  removeSelected(instanceId: number): void {
    const selectedItem = this.selected.find((item) => item.instanceId === instanceId);
    if (!selectedItem) {
      return;
    }
    const currentStatus = this.getStageStatus(selectedItem);
    if (currentStatus === 'removed') {
      return;
    }
    this.setStageStatus(selectedItem, this.policyStage, 'removed');
    this.showToast(`Removed ${this.getEndorsementLabel(selectedItem.versionId)}`, 'remove');
  }

  requestRemoveSelected(instanceId: number): void {
    const selectedItem = this.selected.find((item) => item.instanceId === instanceId);
    if (!selectedItem || this.getStageStatus(selectedItem) === 'removed') {
      return;
    }
    this.pendingRemoveInstanceId = instanceId;
    this.activeModal = 'confirm-remove';
  }

  requestRemoveByVersionId(versionId: number): void {
    const selectedItem = this.selected.find(
      (item) => item.versionId === versionId && this.getStageStatus(item) !== 'removed'
    );
    if (!selectedItem) {
      return;
    }
    this.requestRemoveSelected(selectedItem.instanceId);
  }

  confirmRemoveSelected(): void {
    if (this.pendingRemoveInstanceId !== null) {
      this.removeSelected(this.pendingRemoveInstanceId);
    }
    this.closeConfirmRemove();
  }

  cancelRemoveSelected(): void {
    this.closeConfirmRemove();
  }

  reinstateSelected(instanceId: number): void {
    const selectedItem = this.selected.find((item) => item.instanceId === instanceId);
    if (!selectedItem) {
      return;
    }
    const currentStatus = this.getStageStatus(selectedItem);
    if (currentStatus !== 'removed') {
      return;
    }
    this.setStageStatus(selectedItem, this.policyStage, 'active');
    this.showToast(`Reactivated ${this.getEndorsementLabel(selectedItem.versionId)}`, 'activate');
  }

  onShowAllChange(): void {
    return;
  }

  addSelectedPackage(): void {
    if (!this.selectedPackageId) {
      return;
    }
    const selections = this.packageSelections[this.selectedPackageId] ?? [];
    let addedCount = 0;
    for (const id of selections) {
      const result = this.addIfNotSelected(id);
      if (result) {
        addedCount += 1;
      }
    }
    if (selections.length > 0 && addedCount > 0) {
      this.showToast(`Added package ${this.selectedPackageId} (${addedCount})`, 'add');
    }
  }

  clearSelected(): void {
    if (this.isPolicySold) {
      return;
    }
    for (const item of this.selected) {
      this.setStageStatus(item, this.policyStage, 'removed');
    }
  }

  requestClearSelected(): void {
    if (this.isPolicySold || this.selected.length === 0) {
      return;
    }
    this.pendingClearAll = true;
    this.activeModal = 'confirm-clear';
  }

  confirmClearSelected(): void {
    if (this.pendingClearAll) {
      this.clearSelected();
      this.showToast('Removed all selected endorsements', 'remove');
    }
    this.closeConfirmClear();
  }

  cancelClearSelected(): void {
    this.closeConfirmClear();
  }

  requestAddMandatoryEndorsements(): void {
    this.activeModal = 'confirm-mandatory';
  }

  confirmAddMandatoryEndorsements(): void {
    this.addMandatoryEndorsements();
    this.closeConfirmMandatory();
  }

  cancelAddMandatoryEndorsements(): void {
    this.closeConfirmMandatory();
  }

  addMandatoryEndorsements(): void {
    let addedCount = 0;
    for (const id of this.mandatoryEndorsementIds) {
      const result = this.addIfNotSelected(id);
      if (result) {
        addedCount += 1;
      }
    }
    if (this.mandatoryEndorsementIds.length > 0 && addedCount > 0) {
      this.showToast(`Added mandatory endorsements (${addedCount})`, 'add');
    }
  }

  openModal(type: Exclude<ModalType, null>): void {
    this.activeModal = type;
  }

  openCreatePackageModal(): void {
    this.activeModal = 'create-package';
  }

  openSelectedContextMenu(event: MouseEvent, item: SelectedDisplayItem): void {
    event.preventDefault();
    this.selectedContextMenuInstanceId = item.instanceId;
    const menuWidth = 190;
    const menuHeight = 46;
    const maxX = Math.max(0, window.innerWidth - menuWidth);
    const maxY = Math.max(0, window.innerHeight - menuHeight);
    this.selectedContextMenuX = Math.min(event.clientX, maxX);
    this.selectedContextMenuY = Math.min(event.clientY, maxY);
    this.selectedContextMenuOpen = true;
  }

  closeContextMenu(): void {
    this.selectedContextMenuOpen = false;
    this.selectedContextMenuInstanceId = null;
  }

  viewSelectedText(): void {
    if (!this.selectedContextMenuInstanceId) {
      return;
    }
    this.activeModal = 'view-text';
    this.closeContextMenu();
  }

  closeModal(): void {
    if (this.activeModal === 'confirm-remove') {
      this.closeConfirmRemove();
      return;
    }
    if (this.activeModal === 'confirm-clear') {
      this.closeConfirmClear();
      return;
    }
    if (this.activeModal === 'confirm-mandatory') {
      this.closeConfirmMandatory();
      return;
    }
    this.activeModal = null;
  }

  onCreatePackage(event: PackageManagerCreateEvent): void {
    const packageName = event.packageName.trim();
    if (!packageName || !event.policyForm || event.endorsementIds.length === 0) {
      return;
    }
    const id = this.generatePackageId(`${packageName}-${event.policyForm}`);
    const nextPackage: PackageInfo = {
      id,
      name: packageName,
      policyForm: event.policyForm,
      isCustom: true
    };
    this.packages = [...this.packages, nextPackage];
    this.packageSelections = {
      ...this.packageSelections,
      [id]: [...new Set(event.endorsementIds)]
    };
    this.selectedPackageId = id;
    this.showToast(`Created package ${packageName}`, 'add');
    this.closeModal();
  }

  onUpdatePackage(event: PackageManagerUpdateEvent): void {
    const packageName = event.packageName.trim();
    if (!event.packageId || !packageName || !event.policyForm || event.endorsementIds.length === 0) {
      return;
    }
    this.packages = this.packages.map((pkg) =>
      pkg.id === event.packageId
        ? {
            ...pkg,
            name: packageName,
            policyForm: event.policyForm,
            isCustom: true
          }
        : pkg
    );
    this.packageSelections = {
      ...this.packageSelections,
      [event.packageId]: [...new Set(event.endorsementIds)]
    };
    this.selectedPackageId = event.packageId;
    this.showToast(`Updated package ${packageName}`, 'add');
    this.closeModal();
  }

  getPackageOptionLabel(pkg: PackageInfo): string {
    if (pkg.policyForm) {
      return `${pkg.name} - ${pkg.policyForm}`;
    }
    return pkg.isCustom ? pkg.name : `${pkg.id} - ${pkg.name}`;
  }

  private closeConfirmRemove(): void {
    this.pendingRemoveInstanceId = null;
    this.activeModal = null;
  }

  private closeConfirmClear(): void {
    this.pendingClearAll = false;
    this.activeModal = null;
  }

  private closeConfirmMandatory(): void {
    this.activeModal = null;
  }

  private generatePackageId(name: string): string {
    const normalized = name
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '')
      .slice(0, 8);
    const base = normalized || `PKG${this.packages.length + 1}`;
    let candidate = base;
    let suffix = 1;
    const existing = new Set(this.packages.map((pkg) => pkg.id));
    while (existing.has(candidate)) {
      candidate = `${base}${suffix}`;
      suffix += 1;
    }
    return candidate;
  }

  isGroupCollapsed(label: string): boolean {
    return this.collapsedGroups.has(label);
  }

  toggleGroup(label: string): void {
    if (this.collapsedGroups.has(label)) {
      this.collapsedGroups.delete(label);
    } else {
      this.collapsedGroups.add(label);
    }
  }

  expandAllGroups(): void {
    this.collapsedGroups.clear();
  }

  collapseAllGroups(): void {
    this.collapsedGroups = new Set(this.endorsementGroups.map((group) => group.number));
  }

  expandSelectedGroups(): void {
    this.collapseAllGroups();
    for (const group of this.availableGroups) {
      if (group.versions.some((version) => this.hasActiveSelection(version.id))) {
        this.collapsedGroups.delete(group.number);
      }
    }
  }

  get isAllGroupsExpanded(): boolean {
    const groups = this.availableGroups;
    if (groups.length === 0) {
      return true;
    }
    return groups.every((group) => !this.isGroupCollapsed(group.number));
  }

  get expandAllLabel(): string {
    return this.isAllGroupsExpanded ? 'Collapse All' : 'Expand All';
  }

  toggleExpandAllGroups(): void {
    if (this.isAllGroupsExpanded) {
      this.collapseAllGroups();
    } else {
      this.expandAllGroups();
    }
  }

  onFilterInputChange(field: FilterField): void {
    const value = this.getFilterValue(field).trim();
    this.activeFilterField = field;
    this.clearOtherFilters(field);
    if (!value) {
      return;
    }
  }

  onFilterFocus(field: FilterField): void {
    this.activeFilterField = field;
    this.clearOtherFilters(field);
  }

  onFilterBlur(field: FilterField): void {
    if (this.activeFilterField !== field) {
      return;
    }
    if (!this.getFilterValue(field).trim()) {
      this.activeFilterField = null;
    }
  }

  onClearFilter(): void {
    this.filterNumber = '';
    this.filterName = '';
    this.filterDescription = '';
    this.activeFilterField = null;
  }

  private clearOtherFilters(activeField: FilterField): void {
    if (activeField !== 'number') {
      this.filterNumber = '';
    }
    if (activeField !== 'name') {
      this.filterName = '';
    }
    if (activeField !== 'description') {
      this.filterDescription = '';
    }
  }

  private filterGroupsByName(query: string): EndorsementGroup[] {
    return this.endorsementGroups
      .map((group) => {
        const groupMatch = this.matchesSearch(query, group.title);
        const versions = groupMatch
          ? group.versions
          : group.versions.filter((version) => this.matchesSearch(query, version.name));
        return { ...group, versions };
      })
      .filter((group) => group.versions.length > 0);
  }

  private filterGroupsByDescription(query: string): EndorsementGroup[] {
    return this.endorsementGroups
      .map((group) => ({
        ...group,
        versions: group.versions.filter((version) => this.matchesSearch(query, version.description))
      }))
      .filter((group) => group.versions.length > 0);
  }

  private ensureGroupStateInitialized(): void {
    if (this.groupsInitialized) {
      return;
    }
    this.collapsedGroups = new Set<string>();
    this.groupsInitialized = true;
  }

  private sortGroups(groups: EndorsementGroup[]): EndorsementGroup[] {
    return [...groups]
      .map((group) => ({
        ...group,
        versions: [...group.versions].sort((a, b) => a.code.localeCompare(b.code))
      }))
      .sort((a, b) => a.number.localeCompare(b.number));
  }

  private getFilterValue(field: FilterField): string {
    switch (field) {
      case 'number':
        return this.filterNumber;
      case 'name':
        return this.filterName;
      case 'description':
        return this.filterDescription;
      default:
        return '';
    }
  }

  private matchesSearch(query: string, text: string): boolean {
    const normalizedText = text.toLowerCase();
    const normalizedQuery = query.toLowerCase();

    if (normalizedQuery.startsWith('"')) {
      const phrases = this.extractQuotedPhrases(normalizedQuery);
      if (phrases.length === 0) {
        return false;
      }
      return phrases.every((phrase) => this.containsPhrase(normalizedText, phrase));
    }

    const words = normalizedQuery.split(' ').map((part) => part.trim()).filter(Boolean);
    if (words.length === 0) {
      return false;
    }
    return words.every((word) => this.containsWord(normalizedText, word));
  }

  private extractQuotedPhrases(query: string): string[] {
    const phrases: string[] = [];
    const regex = /"([^"]+)"/g;
    let match = regex.exec(query);
    while (match) {
      const phrase = match[1].trim();
      if (phrase) {
        phrases.push(phrase);
      }
      match = regex.exec(query);
    }
    return phrases;
  }

  private containsWord(text: string, word: string): boolean {
    if (!word) {
      return false;
    }
    if (text.includes(word)) {
      return true;
    }
    const escaped = this.escapeRegExp(word);
    const regex = new RegExp(`(^|[\\s"'()\\[\\]{}.,!?])${escaped}($|[\\s"'()\\[\\]{}.,!?])`, 'i');
    return regex.test(text);
  }

  private containsPhrase(text: string, phrase: string): boolean {
    if (!phrase) {
      return false;
    }
    const escaped = this.escapeRegExp(phrase);
    const regex = new RegExp(`(^|[\\s"'()\\[\\]{}.,!?])${escaped}($|[\\s"'()\\[\\]{}.,!?])`, 'i');
    return regex.test(text);
  }

  private escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private addIfNotSelected(id: number): boolean {
    const existing = this.selected.find((item) => item.versionId === id);
    if (existing) {
      if (this.getStageStatus(existing) === 'removed') {
        this.setStageStatus(existing, this.policyStage, 'active');
        return true;
      }
      return false;
    }
    this.selected.push({
      instanceId: this.getNextUniqueInstanceId(),
      versionId: id,
      statusByStage: { quote: 'active', bind: 'active', issue: 'active', midterm: 'active' }
    });
    return true;
  }

  private getNextUniqueInstanceId(): number {
    while (this.selected.some((item) => item.instanceId === this.nextInstanceId)) {
      this.nextInstanceId += 1;
    }
    const nextId = this.nextInstanceId;
    this.nextInstanceId += 1;
    return nextId;
  }

  private showToast(message: string, kind: ToastKind): void {
    this.toastMessage = message;
    this.toastKind = kind;
    if (this.toastTimeoutId) {
      clearTimeout(this.toastTimeoutId);
    }
    this.toastTimeoutId = setTimeout(() => {
      this.toastMessage = '';
      this.toastTimeoutId = null;
    }, 2500);
  }

  private getEndorsementLabel(id: number): string {
    const version = this.getVersionById(id);
    if (!version) {
      return 'endorsement';
    }
    return this.getVersionLabel(version);
  }

  private getVersionById(id: number): EndorsementVersion | undefined {
    return this.allVersions.find((version) => version.id === id);
  }

  private getVersionLabel(version: EndorsementVersion): string {
    return `${version.code} - ${version.name}`;
  }

  getPendingRemoveLabel(): string {
    if (this.pendingRemoveInstanceId === null) {
      return 'this endorsement';
    }
    const item = this.selected.find((entry) => entry.instanceId === this.pendingRemoveInstanceId);
    if (!item) {
      return 'this endorsement';
    }
    return this.getEndorsementLabel(item.versionId);
  }

  getRemovedStageLabel(item: SelectedEndorsement): string {
    const removedStage = this.stageOptions.find((stage) => item.statusByStage[stage.id] === 'removed');
    if (!removedStage) {
      return '';
    }
    return `Removed at ${removedStage.label} stage`;
  }

  private hasActiveSelection(id: number): boolean {
    const selectedItems = this.selectedByVersionId.get(id) ?? [];
    return selectedItems.some((item) => this.getStageStatus(item) !== 'removed');
  }

  private getStageStatus(item: SelectedEndorsement, stage: PolicyStage = this.policyStage): SelectedStatus {
    return item.statusByStage[stage] ?? 'active';
  }

  private setStageStatus(item: SelectedEndorsement, stage: PolicyStage, status: SelectedStatus): void {
    item.statusByStage = { ...item.statusByStage, [stage]: status };
  }
}
