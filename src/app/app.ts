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
  policyForm?: string;
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
  formCode?: string;
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
  readonly accountPolicyForm = 'D26';
  modalInitialVersionIds: number[] = [];
  modalInitialPolicyForm = '';
  modalLockPolicyForm = false;
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
      policyForm: 'D26',
      versions: [
        { id: 2009, groupNumber: 'D26053', code: 'D26053 .000', name: 'Disclosure Form - Claims-Made Policy', description: 'Discloses claims-made reporting requirements and coverage trigger details. Explains notice windows and retroactive date implications.' }
      ]
    },
    {
      number: 'D26055',
      title: 'Important Notice to Our Indiana Policyholders',
      policyForm: 'D26',
      versions: [
        { id: 3004, groupNumber: 'D26055', code: 'D26055 .000', name: 'Important Notice to Our Indiana Policyholders', description: 'Required statutory notice for Indiana policyholders outlining their rights and insurer obligations under state law. Includes complaint procedures and Indiana Department of Insurance contact information.' }
      ]
    },
    {
      number: 'D26057',
      title: 'Policyholder Notice New Mexico',
      policyForm: 'D26',
      versions: [
        { id: 3005, groupNumber: 'D26057', code: 'D26057 .000', name: 'Policyholder Notice New Mexico', description: 'Required regulatory notice for New Mexico policyholders describing their rights and insurer obligations under state law. Includes surplus lines disclosure and complaint process information.' }
      ]
    },
    {
      number: 'D26100',
      title: 'Nonprofit Policy Form COA/HOA',
      policyForm: 'D26',
      versions: [
        { id: 3006, groupNumber: 'D26100', code: 'D26100-A .001', name: 'Nonprofit Policy Form COA/HOA', description: 'Base policy form providing directors and officers liability coverage for condominium and homeowner associations. Covers board decisions, governance disputes, and member relations.' },
        { id: 3007, groupNumber: 'D26100', code: 'D26100-F .001', name: 'Nonprofit Policy Form COA/HOA - FTZ', description: 'Free-trade zone variant of the nonprofit COA/HOA policy form. Extends or modifies coverage for associations operating within designated free-trade zones.' },
        { id: 3008, groupNumber: 'D26100', code: 'D26100-G .001', name: 'Nonprofit Policy Form COA/HOA EPP', description: 'Enhanced protection package variant of the nonprofit COA/HOA policy form. Adds supplemental coverage for employment practices and privacy exposures.' },
        { id: 3009, groupNumber: 'D26100', code: 'D27100-A .001', name: 'Think Risk Policy THP', description: 'Think Risk program policy form providing tailored coverage for specialty nonprofit and habitational risks. Offers flexible structure for unique or non-standard exposures.' }
      ]
    },
    {
      number: 'D26102',
      title: 'Non-Profit Dec Page',
      policyForm: 'D26',
      versions: [
        { id: 3010, groupNumber: 'D26102', code: 'D26102 .001', name: 'Non-Profit Dec Page', description: 'Declarations page for the nonprofit D&O policy. Records insured name, policy period, limits, retentions, and the endorsement schedule.' },
        { id: 3011, groupNumber: 'D26102', code: 'D26102-F .001', name: 'Non-Profit Dec Page', description: 'Declarations page for the nonprofit free-trade zone policy variant. Documents insured details and coverage parameters specific to FTZ-program policies.' },
        { id: 3012, groupNumber: 'D26102', code: 'D26102MT .001', name: 'Non-Profit Dec Page', description: 'Montana-specific declarations page for the nonprofit D&O policy. Incorporates state-required disclosures and coverage terms applicable in Montana.' },
        { id: 3013, groupNumber: 'D26102', code: 'D26102NH .001', name: 'Non-Profit Dec Page', description: 'New Hampshire-specific declarations page for the nonprofit D&O policy. Reflects state-specific regulatory requirements and required coverage disclosures.' },
        { id: 3014, groupNumber: 'D26102', code: 'D26102PA .001', name: 'Non-Profit Dec Page', description: 'Pennsylvania-specific declarations page for the nonprofit D&O policy. Addresses state filing requirements and Pennsylvania-mandated coverage provisions.' }
      ]
    },
    {
      number: 'D26200',
      title: 'Nonprofit Proposal Form',
      policyForm: 'D26',
      versions: [
        { id: 3015, groupNumber: 'D26200', code: 'D26200 .001', name: 'Nonprofit Proposal Form', description: 'Initial application form for nonprofit directors and officers liability coverage. Collects organizational details, governance information, and risk characteristics for underwriting.' }
      ]
    },
    {
      number: 'D26201',
      title: 'Nonprofit Renewal Proposal Form',
      policyForm: 'D26',
      versions: [
        { id: 3016, groupNumber: 'D26201', code: 'D26201 .001', name: 'Nonprofit Renewal Proposal Form', description: 'Renewal application for nonprofit D&O liability coverage. Captures changes in board composition, financial condition, and claims history from the prior policy period.' }
      ]
    },
    {
      number: 'D26301',
      title: 'Arizona Amendatory Endorsement',
      policyForm: 'D26',
      versions: [
        { id: 3017, groupNumber: 'D26301', code: 'D26301 .000', name: 'Arizona Amendatory Endorsement', description: 'Applies Arizona-specific statutory modifications required for compliance with state insurance regulations. Adjusts policy terms including cancellation notice periods, nonrenewal procedures, and policyholder rights.' }
      ]
    },
    {
      number: 'D26303',
      title: 'Illinois Amendatory Endorsement',
      policyForm: 'D26',
      versions: [
        { id: 2010, groupNumber: 'D26303', code: 'D26303 .000', name: 'Illinois Amendatory Endorsement', description: 'Applies Illinois amendatory provisions required by statute. Updates policy wording to maintain state compliance.' }
      ]
    },
    {
      number: 'D26304',
      title: 'Nevada Amendatory',
      policyForm: 'D26',
      versions: [
        { id: 3018, groupNumber: 'D26304', code: 'D26304 .000', name: 'Nevada Amendatory', description: 'Modifies policy language to satisfy Nevada Division of Insurance regulatory requirements. Includes state-mandated provisions for cancellation notice, surplus lines disclosure, and policyholders\' rights.' }
      ]
    },
    {
      number: 'D26305',
      title: 'New York Amendatory Endorsement',
      policyForm: 'D26',
      versions: [
        { id: 3019, groupNumber: 'D26305', code: 'D26305 .000', name: 'New York Amendatory Endorsement', description: 'Incorporates New York Department of Financial Services mandated amendatory language. Addresses surplus lines requirements, cancellation procedures, and consumer protection provisions required by New York law.' }
      ]
    },
    {
      number: 'D26306',
      title: 'Tennessee Amendatory Endorsement',
      policyForm: 'D26',
      versions: [
        { id: 3020, groupNumber: 'D26306', code: 'D26306 .000', name: 'Tennessee Amendatory Endorsement', description: 'Applies Tennessee-specific statutory requirements to the policy. Adjusts cancellation and nonrenewal terms to comply with Tennessee Department of Commerce and Insurance regulations.' }
      ]
    },
    {
      number: 'D26308',
      title: 'New Hampshire Amendatory Endorsement',
      policyForm: 'D26',
      versions: [
        { id: 3021, groupNumber: 'D26308', code: 'D26308 .000', name: 'New Hampshire Amendatory Endorsement', description: 'Modifies policy language to meet New Hampshire Insurance Department regulatory requirements. Addresses state-specific cancellation, notice, and coverage obligation provisions.' }
      ]
    },
    {
      number: 'D26309',
      title: 'Ohio Amendatory Endorsement',
      policyForm: 'D26',
      versions: [
        { id: 3022, groupNumber: 'D26309', code: 'D26309 .000', name: 'Ohio Amendatory Endorsement', description: 'Applies Ohio Department of Insurance required amendments to the policy. Adjusts terms related to cancellation, nonrenewal, and consumer rights under Ohio law.' }
      ]
    },
    {
      number: 'D2631',
      title: 'Elite Coverage',
      policyForm: 'D26',
      versions: [
        { id: 3023, groupNumber: 'D2631', code: 'D02631 .000', name: 'Elite Coverage', description: 'Provides enhanced directors and officers liability coverage under the Elite Coverage program. Broadens base policy terms with additional insuring agreements and expanded definitions.' },
        { id: 3024, groupNumber: 'D2631', code: 'D02631 .003', name: 'Elite Coverage', description: 'Third edition of the Elite Coverage endorsement with updated coverage terms. Reflects revised insuring agreements and conditions applicable to the current program year.' },
        { id: 3025, groupNumber: 'D2631', code: 'D02631 .004', name: 'Elite Coverage', description: 'Fourth edition of the Elite Coverage endorsement with current program enhancements. Incorporates updated definitions, extensions, and any applicable exclusion modifications.' },
        { id: 3026, groupNumber: 'D2631', code: 'D02631 .005', name: 'Elite Coverage', description: 'Fifth edition of the Elite Coverage endorsement. Reflects the latest program-level coverage terms and any updates to Elite Coverage insuring clauses or conditions.' },
        { id: 3027, groupNumber: 'D2631', code: 'D02631 .200', name: 'Elite Coverage', description: 'Surplus lines variant of the Elite Coverage endorsement. Provides the same enhanced D&O coverage structure for policies placed in the surplus lines market.' },
        { id: 3028, groupNumber: 'D2631', code: 'D02631-03 .000', name: 'Elite Coverage', description: 'Third program revision of the Elite Coverage endorsement base edition. Applies updated coverage enhancements and corrected terms from the prior edition.' },
        { id: 3029, groupNumber: 'D2631', code: 'D02631-3IL .000', name: 'Elite Coverage', description: 'Illinois-specific third revision of the Elite Coverage endorsement. Incorporates state-required modifications alongside the standard Elite Coverage enhancements.' },
        { id: 3030, groupNumber: 'D2631', code: 'D02631IL .000', name: 'Elite Coverage', description: 'Illinois edition of the Elite Coverage endorsement. Combines Elite Coverage enhancements with Illinois amendatory provisions required by state regulation.' },
        { id: 3031, groupNumber: 'D2631', code: 'D02631ME .000', name: 'Elite Coverage', description: 'Maine edition of the Elite Coverage endorsement. Combines Elite Coverage enhancements with Maine Bureau of Insurance required statutory modifications.' },
        { id: 3032, groupNumber: 'D2631', code: 'D02631TX .000', name: 'Elite Coverage', description: 'Texas edition of the Elite Coverage endorsement. Combines Elite Coverage enhancements with Texas Department of Insurance required policy modifications.' }
      ]
    },
    {
      number: 'D26311',
      title: 'Oregon Amendatory Endorsement',
      policyForm: 'D26',
      versions: [
        { id: 3033, groupNumber: 'D26311', code: 'D26311 .000', name: 'Oregon Amendatory Endorsement', description: 'Incorporates Oregon Insurance Division mandated policy modifications. Addresses cancellation procedures, insured rights, and coverage adjustments required by Oregon law.' }
      ]
    },
    {
      number: 'D26312',
      title: 'Pennsylvania Amendatory Endorsement',
      policyForm: 'D26',
      versions: [
        { id: 3034, groupNumber: 'D26312', code: 'D26312 .000', name: 'Pennsylvania Amendatory Endorsement', description: 'Applies Pennsylvania Insurance Department required modifications to the policy. Addresses cancellation notice periods, surplus lines disclosures, and consumer protections mandated by Pennsylvania law.' }
      ]
    },
    {
      number: 'D26314',
      title: 'Florida Amendatory',
      policyForm: 'D26',
      versions: [
        { id: 3035, groupNumber: 'D26314', code: 'D26314 .000', name: 'Florida Amendatory', description: 'Modifies policy language to comply with Florida Office of Insurance Regulation requirements. Addresses cancellation, nonrenewal, and surplus lines provisions mandated by Florida law.' }
      ]
    },
    {
      number: 'D26315',
      title: 'South Dakota Amendatory',
      policyForm: 'D26',
      versions: [
        { id: 3036, groupNumber: 'D26315', code: 'D26315 .000', name: 'South Dakota Amendatory', description: 'Applies South Dakota Division of Insurance required statutory modifications. Adjusts policy terms for cancellation, coverage disputes, and regulatory compliance under South Dakota law.' }
      ]
    },
    {
      number: 'D26316',
      title: 'Kentucky Amendatory',
      policyForm: 'D26',
      versions: [
        { id: 3037, groupNumber: 'D26316', code: 'D26316 .000', name: 'Kentucky Amendatory', description: 'Incorporates Kentucky Department of Insurance mandated amendatory provisions. Adjusts cancellation procedures and insured notification requirements per Kentucky state regulation.' }
      ]
    },
    {
      number: 'D26317',
      title: 'Washington Amendatory Endorsement',
      policyForm: 'D26',
      versions: [
        { id: 3038, groupNumber: 'D26317', code: 'D26317 .000', name: 'Washington Amendatory Endorsement', description: 'Applies Washington Office of the Insurance Commissioner required policy modifications. Addresses cancellation, notice, and claims handling provisions under Washington law.' }
      ]
    },
    {
      number: 'D26318',
      title: 'Required Disclosure Statement (Massachusetts)',
      policyForm: 'D26',
      versions: [
        { id: 3039, groupNumber: 'D26318', code: 'D26318 .000', name: 'Required Disclosure Statement (Massachusetts)', description: 'Required statutory disclosure for Massachusetts policyholders detailing insurer contact information, complaint procedures, and Division of Insurance resources. Mandated by Massachusetts law.' }
      ]
    },
    {
      number: 'D26319',
      title: 'West Virginia Amendatory',
      policyForm: 'D26',
      versions: [
        { id: 3040, groupNumber: 'D26319', code: 'D26319 .000', name: 'West Virginia Amendatory', description: 'Applies West Virginia Offices of the Insurance Commissioner mandated modifications. Adjusts cancellation, nonrenewal, and policyholder rights provisions as required by West Virginia law.' }
      ]
    },
    {
      number: 'D26320',
      title: 'Massachusetts Amendatory Endorsement',
      policyForm: 'D26',
      versions: [
        { id: 3041, groupNumber: 'D26320', code: 'D26320 .000', name: 'Massachusetts Amendatory Endorsement', description: 'Modifies policy terms to satisfy Massachusetts Division of Insurance regulatory requirements. Addresses cancellation procedures, surplus lines standards, and required consumer disclosures.' }
      ]
    },
    {
      number: 'D26321',
      title: 'Minnesota Amendatory Endorsement',
      policyForm: 'D26',
      versions: [
        { id: 3042, groupNumber: 'D26321', code: 'D26321 .000', name: 'Minnesota Amendatory Endorsement', description: 'Incorporates Minnesota Commerce Department mandated statutory modifications. Adjusts cancellation, nonrenewal, and insured notification provisions as required by Minnesota law.' }
      ]
    },
    {
      number: 'D26322',
      title: 'Vermont Amendatory',
      policyForm: 'D26',
      versions: [
        { id: 3043, groupNumber: 'D26322', code: 'D26322 .000', name: 'Vermont Amendatory', description: 'Applies Vermont Department of Financial Regulation required policy amendments. Addresses state-specific cancellation notice requirements and coverage adjustment provisions under Vermont law.' }
      ]
    },
    {
      number: 'D26324',
      title: 'FIGA Assessment Policy Changes',
      policyForm: 'D26',
      versions: [
        { id: 3044, groupNumber: 'D26324', code: 'D26324 .000', name: 'FIGA Assessment Policy Changes', description: 'Reflects Florida Insurance Guaranty Association assessment charges required by Florida law. Discloses FIGA surcharge amounts and their application to the insured\'s policy.' }
      ]
    },
    {
      number: 'D26325',
      title: 'Action Against Insurer Clause (Iowa)',
      policyForm: 'D26',
      versions: [
        { id: 3045, groupNumber: 'D26325', code: 'D26325 .000', name: 'Action Against Insurer Clause (Iowa)', description: 'Incorporates Iowa-required action against insurer provisions. Defines conditions under which judgment creditors may proceed directly against the insurer under Iowa law.' }
      ]
    },
    {
      number: 'D26326',
      title: 'Colorado Amendatory Endorsement',
      policyForm: 'D26',
      versions: [
        { id: 3046, groupNumber: 'D26326', code: 'D26326 .000', name: 'Colorado Amendatory Endorsement', description: 'Applies Colorado Division of Insurance mandated statutory modifications. Adjusts cancellation notice requirements, surplus lines disclosures, and policyholder rights under Colorado law.' }
      ]
    },
    {
      number: 'D26327',
      title: 'Oklahoma Amendatory Endorsement',
      policyForm: 'D26',
      versions: [
        { id: 3047, groupNumber: 'D26327', code: 'D26327 .000', name: 'Oklahoma Amendatory Endorsement', description: 'Incorporates Oklahoma Insurance Department required amendatory provisions. Addresses cancellation, nonrenewal, and claims handling obligations under Oklahoma law.' }
      ]
    },
    {
      number: 'D26328',
      title: 'Missouri Amendatory Endorsement',
      policyForm: 'D26',
      versions: [
        { id: 3048, groupNumber: 'D26328', code: 'D26328 .000', name: 'Missouri Amendatory Endorsement', description: 'Applies Missouri Department of Insurance required modifications to the policy. Adjusts cancellation procedures and regulatory disclosures as mandated by Missouri law.' }
      ]
    },
    {
      number: 'D26329',
      title: 'Wisconsin Amendatory Endorsement',
      policyForm: 'D26',
      versions: [
        { id: 3049, groupNumber: 'D26329', code: 'D26329 .000', name: 'Wisconsin Amendatory Endorsement', description: 'Incorporates Wisconsin Office of the Commissioner of Insurance required statutory modifications. Addresses cancellation, notice, and consumer rights provisions under Wisconsin law.' }
      ]
    },
    {
      number: 'D26331',
      title: 'Kansas Amendatory Endorsement',
      policyForm: 'D26',
      versions: [
        { id: 3050, groupNumber: 'D26331', code: 'D26331 .000', name: 'Kansas Amendatory Endorsement', description: 'Applies Kansas Insurance Department required amendments. Adjusts cancellation notice periods, surplus lines requirements, and insured rights under Kansas law.' }
      ]
    },
    {
      number: 'D26334',
      title: 'North Carolina Amendatory',
      policyForm: 'D26',
      versions: [
        { id: 3051, groupNumber: 'D26334', code: 'D26334 .000', name: 'North Carolina Amendatory', description: 'Incorporates North Carolina Department of Insurance mandated modifications. Addresses cancellation, nonrenewal, and coverage adjustment provisions required by North Carolina law.' }
      ]
    },
    {
      number: 'D26335',
      title: 'Maine Amendatory',
      policyForm: 'D26',
      versions: [
        { id: 3052, groupNumber: 'D26335', code: 'D26335 .000', name: 'Maine Amendatory', description: 'Applies Maine Bureau of Insurance required statutory modifications to the policy. Adjusts cancellation procedures and policyholder notification requirements under Maine law.' }
      ]
    },
    {
      number: 'D26336',
      title: 'Nebraska Amendatory Endorsement',
      policyForm: 'D26',
      versions: [
        { id: 3053, groupNumber: 'D26336', code: 'D26336 .000', name: 'Nebraska Amendatory Endorsement', description: 'Incorporates Nebraska Department of Insurance required amendatory language. Adjusts cancellation notice periods and consumer disclosure provisions as required by Nebraska law.' }
      ]
    },
    {
      number: 'D26337',
      title: 'Washington Amendatory Endorsement',
      policyForm: 'D26',
      versions: [
        { id: 3054, groupNumber: 'D26337', code: 'D26337 .000', name: 'Washington Amendatory Endorsement', description: 'Applies updated Washington Office of the Insurance Commissioner required modifications. Addresses revised cancellation, notice, and claims handling provisions under current Washington law.' }
      ]
    },
    {
      number: 'D26338',
      title: 'Texas Amendatory',
      policyForm: 'D26',
      versions: [
        { id: 3055, groupNumber: 'D26338', code: 'D26338 .000', name: 'Texas Amendatory', description: 'Modifies policy language to comply with Texas Department of Insurance requirements. Addresses surplus lines provisions, cancellation procedures, and state-specific coverage terms.' }
      ]
    },
    {
      number: 'D26340',
      title: 'New Mexico Amendatory Endorsement',
      policyForm: 'D26',
      versions: [
        { id: 3056, groupNumber: 'D26340', code: 'D26340 .000', name: 'New Mexico Amendatory Endorsement', description: 'Applies New Mexico Office of Superintendent of Insurance required modifications. Adjusts cancellation, nonrenewal, and consumer rights provisions as mandated by New Mexico law.' }
      ]
    },
    {
      number: 'D26341',
      title: 'Notice to Georgia Policyholders',
      policyForm: 'D26',
      versions: [
        { id: 3057, groupNumber: 'D26341', code: 'D26341 .000', name: 'Notice to Georgia Policyholders', description: 'Required statutory notice for Georgia policyholders describing insurer obligations, complaint procedures, and Georgia Office of Insurance Regulation resources.' }
      ]
    },
    {
      number: 'D26342',
      title: 'Louisiana Amendatory',
      policyForm: 'D26',
      versions: [
        { id: 3058, groupNumber: 'D26342', code: 'D26342 .000', name: 'Louisiana Amendatory', description: 'Incorporates Louisiana Department of Insurance mandated amendatory provisions. Addresses cancellation procedures, surplus lines requirements, and policyholder rights under Louisiana law.' }
      ]
    },
    {
      number: 'D26347',
      title: 'Connecticut Amendatory Endorsement',
      policyForm: 'D26',
      versions: [
        { id: 3059, groupNumber: 'D26347', code: 'D26347 .000', name: 'Connecticut Amendatory Endorsement', description: 'Applies Connecticut Insurance Department required statutory modifications. Adjusts cancellation notice periods and consumer protections as mandated by Connecticut law.' }
      ]
    },
    {
      number: 'D26402',
      title: 'Discovery Period',
      policyForm: 'D26',
      versions: [
        { id: 2011, groupNumber: 'D26402', code: 'D26402 .000', name: 'Discovery Period', description: 'Defines discovery period options and extended reporting terms. Clarifies election deadlines and applicable premium charges.' }
      ]
    },
    {
      number: 'D26403',
      title: 'Discovery Period - Reinstated Limits',
      policyForm: 'D26',
      versions: [
        { id: 2012, groupNumber: 'D26403', code: 'D26403 .000', name: 'Discovery Period - Reinstated Limits', description: 'Reinstates limits during the discovery period under stated conditions. Specifies triggers, limits, and endorsement prerequisites clearly.' }
      ]
    },
    {
      number: 'D26500',
      title: 'General Limitation of Coverage',
      policyForm: 'D26',
      versions: [
        { id: 2013, groupNumber: 'D26500', code: 'D26500 .000', name: 'General Limitation of Coverage', description: 'Limits coverage for specified claims as outlined in the endorsement. Identifies restricted scenarios and resulting claim impacts.' },
        { id: 2014, groupNumber: 'D26500', code: 'D26500 .200', name: 'General Limitation of Coverage', description: 'Limits coverage for specified claims as outlined in the endorsement. Identifies restricted scenarios and resulting claim impacts.' }
      ]
    },
    {
      number: 'D26501',
      title: 'Rate-Making Exclusion',
      policyForm: 'D26',
      versions: [
        { id: 2015, groupNumber: 'D26501', code: 'D26501 .000', name: 'Rate-Making Exclusion', description: 'Excludes losses arising from rate-making activities. Narrows exposure for pricing-related professional allegations.' }
      ]
    },
    {
      number: 'D26504',
      title: 'Limited Partnership Exclusion',
      policyForm: 'D26',
      versions: [
        { id: 2016, groupNumber: 'D26504', code: 'D26504 .000', name: 'Limited Partnership Exclusion', description: 'Excludes liability tied to limited partnership activities. Defines scope for ownership and management involvement.' }
      ]
    },
    {
      number: 'D26506',
      title: 'Failure to Effect and Maintain Insurance',
      policyForm: 'D26',
      versions: [
        { id: 2017, groupNumber: 'D26506', code: 'D26506 .000', name: 'Failure to Effect and Maintain Insurance', description: 'Excludes claims tied to failure to maintain required insurance. Reinforces contractual insurance procurement responsibilities.' },
        { id: 3060, groupNumber: 'D26506', code: 'D26506 .001', name: 'Failure to Effect and Maintain Insurance Exclusion', description: 'Alternative version excluding claims arising from failure to procure or maintain required insurance coverage. Specifies triggering conditions and applicable coverage carveouts.' }
      ]
    },
    {
      number: 'D26507',
      title: 'Discrimination Exclusion',
      policyForm: 'D26',
      versions: [
        { id: 2018, groupNumber: 'D26507', code: 'D26507 .000', name: 'Discrimination Exclusion', description: 'Excludes discrimination-related claims under the policy. Clarifies boundaries for employment and service allegations.' }
      ]
    },
    {
      number: 'D26509',
      title: 'Membership Exclusion',
      policyForm: 'D26',
      versions: [
        { id: 2019, groupNumber: 'D26509', code: 'D26509 .000', name: 'Membership Exclusion', description: 'Excludes claims tied to membership-related activities. Applies to disputes involving member status decisions.' }
      ]
    },
    {
      number: 'D26513',
      title: 'Specified Professional Services Exclusion',
      policyForm: 'D26',
      versions: [
        { id: 2020, groupNumber: 'D26513', code: 'D26513 .000', name: 'Specified Professional Services Exclusion', description: 'Excludes claims from specified professional services. Lists targeted services and associated liability carveouts.' }
      ]
    },
    {
      number: 'D26515',
      title: 'Specific Entity Exclusion',
      policyForm: 'D26',
      versions: [
        { id: 2021, groupNumber: 'D26515', code: 'D26515 .000', name: 'Specific Entity Exclusion', description: 'Excludes claims involving the specified entity. Applies regardless of direct or indirect involvement.' }
      ]
    },
    {
      number: 'D26518',
      title: 'Interested Party Exclusion',
      policyForm: 'D26',
      versions: [
        { id: 2022, groupNumber: 'D26518', code: 'D26518 .000', name: 'Interested Party Exclusion', description: 'Excludes claims involving interested parties as defined. Clarifies related-party relationships and conflict scenarios.' }
      ]
    },
    {
      number: 'D26519',
      title: 'Response to Proposal Form Exclusion',
      policyForm: 'D26',
      versions: [
        { id: 3061, groupNumber: 'D26519', code: 'D26519 .000', name: 'Response to Proposal Form Exclusion', description: 'Excludes claims arising from inaccurate or incomplete responses to the proposal form. Reinforces the materiality of underwriting representations made at policy inception.' }
      ]
    },
    {
      number: 'D26527',
      title: 'General Professional Errors and Omissions Exclusion',
      policyForm: 'D26',
      versions: [
        { id: 3062, groupNumber: 'D26527', code: 'D26527 .000', name: 'General Professional Errors and Omissions Exclusion', description: 'Excludes claims alleging professional errors and omissions in the rendering of professional services. Designed to coordinate coverage with a separate miscellaneous professional liability policy.' }
      ]
    },
    {
      number: 'D26530',
      title: 'Past Acts Exclusion',
      policyForm: 'D26',
      versions: [
        { id: 3063, groupNumber: 'D26530', code: 'D26530 .000', name: 'Past Acts Exclusion', description: 'Excludes coverage for wrongful acts committed prior to the specified retroactive date. Limits exposure to events occurring within the approved coverage period.' }
      ]
    },
    {
      number: 'D26541',
      title: 'Prior and Pending Litigation Exclusion',
      policyForm: 'D26',
      versions: [
        { id: 3064, groupNumber: 'D26541', code: 'D26541 .000', name: 'Prior and Pending Litigation Exclusion', description: 'Excludes claims related to litigation that was filed or pending before the prior and pending litigation date. Prevents coverage for known or anticipated claims at policy inception.' }
      ]
    },
    {
      number: 'D26542',
      title: 'Prior and Pending Litigation Exclusion on Excess Limits',
      policyForm: 'D26',
      versions: [
        { id: 3065, groupNumber: 'D26542', code: 'D26542 .000', name: 'Prior and Pending Litigation Exclusion on Excess Limits', description: 'Applies the prior and pending litigation exclusion specifically to excess limit coverages. Prevents the excess layer from responding to pre-existing or known litigation.' },
        { id: 3066, groupNumber: 'D26542', code: 'D26542 .200', name: 'Prior and Pending Litigation Exclusion on Excess Limits', description: 'Surplus lines variant applying the prior and pending litigation exclusion to excess limits. Ensures consistency between base and excess coverage for pre-known litigation on surplus lines policies.' }
      ]
    },
    {
      number: 'D26543',
      title: 'Prior and Pending Litigation Exclusion on Excess Limits for Fiduciary',
      policyForm: 'D26',
      versions: [
        { id: 3067, groupNumber: 'D26543', code: 'D26543 .000', name: 'Prior and Pending Litigation Exclusion on Excess Limits for Fiduciary', description: 'Applies the prior and pending litigation exclusion to excess limits within the fiduciary liability coverage section. Ensures consistent treatment of pre-known litigation across base and excess fiduciary coverages.' }
      ]
    },
    {
      number: 'D26700',
      title: 'Amendment to Section ____',
      policyForm: 'D26',
      versions: [
        { id: 3068, groupNumber: 'D26700', code: 'D26700 .000', name: 'Amendment to Section ____', description: 'General-purpose endorsement used to amend a specified policy section. Documents specifically negotiated modifications to policy terms, conditions, or coverage provisions.' }
      ]
    },
    {
      number: 'D26701',
      title: 'Territory',
      policyForm: 'D26',
      versions: [
        { id: 3069, groupNumber: 'D26701', code: 'D26701 .000', name: 'Territory', description: 'Amends the territorial scope of coverage under the policy. Specifies the geographic boundaries within which covered claims and incidents must arise to trigger coverage.' }
      ]
    },
    {
      number: 'D26702',
      title: 'Deletion of Insured Person',
      policyForm: 'D26',
      versions: [
        { id: 3070, groupNumber: 'D26702', code: 'D26702 .000', name: 'Deletion of Insured Person', description: 'Removes a named individual from the definition of insured person under the policy. Coverage for the deleted individual ceases for wrongful acts occurring after the specified deletion date.' }
      ]
    },
    {
      number: 'D26703',
      title: 'Deletion of Subsidiary',
      policyForm: 'D26',
      versions: [
        { id: 3071, groupNumber: 'D26703', code: 'D26703 .000', name: 'Deletion of Subsidiary', description: 'Removes a named subsidiary from insured entity status under the policy. Effective for wrongful acts occurring on or after the specified deletion date.' }
      ]
    },
    {
      number: 'D26705',
      title: 'Addition of Subsidiary',
      policyForm: 'D26',
      versions: [
        { id: 3072, groupNumber: 'D26705', code: 'D26705 .000', name: 'Addition of Subsidiary', description: 'Adds a new or acquired subsidiary to the insured entity schedule. Specifies any additional premium, coverage conditions, or limitations applicable to the added subsidiary.' }
      ]
    },
    {
      number: 'D26707',
      title: 'Costs of Defense Subject to Retention',
      policyForm: 'D26',
      versions: [
        { id: 3073, groupNumber: 'D26707', code: 'D26707 .000', name: 'Costs of Defense Subject to Retention', description: 'Applies the insured\'s retention to defense costs in addition to indemnity payments. Reduces the net limit available for indemnity by amounts spent on defense.' },
        { id: 3074, groupNumber: 'D26707', code: 'D26707 .002', name: 'Costs of Defense Subject to Retention', description: 'Updated version applying the insured\'s retention to defense costs alongside indemnity. Reflects revised retention mechanics and current program terms.' },
        { id: 3075, groupNumber: 'D26707', code: 'D26707 .003', name: 'Retention for Priority Lien Claims Endorsement with Defense Costs Inside Limits', description: 'Establishes a separate retention for priority lien claims with defense costs counted inside the limit. Coordinates retention and limit mechanics specifically for lien-related covered claims.' },
        { id: 3076, groupNumber: 'D26707', code: 'D26707-01 .000', name: 'Costs of Defense Subject to Retention', description: 'Alternate edition applying the insured\'s retention to defense costs in addition to indemnity. Adjusts limit mechanics to account for defense expenditures within the retention.' }
      ]
    },
    {
      number: 'D26708',
      title: 'Deletion of Employment Practices Liability and Third Party Coverage',
      policyForm: 'D26',
      versions: [
        { id: 3077, groupNumber: 'D26708', code: 'D26708 .000', name: 'Deletion of Employment Practices Liability and Third Party Coverage', description: 'Removes employment practices liability and third-party coverage from the policy. Returns the policy scope to management liability coverages only.' }
      ]
    },
    {
      number: 'D26709',
      title: 'Addition of Insured Person',
      policyForm: 'D26',
      versions: [
        { id: 3078, groupNumber: 'D26709', code: 'D26709 .000', name: 'Addition of Insured Person', description: 'Adds a specifically named individual to the insured person definition. Extends coverage to the added party for qualifying wrongful acts during the policy period.' }
      ]
    },
    {
      number: 'D26711',
      title: 'Amendment to Section I',
      policyForm: 'D26',
      versions: [
        { id: 3079, groupNumber: 'D26711', code: 'D26711 .000', name: 'Amendment to Section I', description: 'Modifies the insuring agreements in Section I of the policy. Documents specifically negotiated changes to covered claims, insuring clauses, or the scope of covered persons.' }
      ]
    },
    {
      number: 'D26712',
      title: 'Amendment to Section II',
      policyForm: 'D26',
      versions: [
        { id: 3080, groupNumber: 'D26712', code: 'D26712 .000', name: 'Amendment to Section II', description: 'Amends the exclusions in Section II of the policy. Adds, deletes, or modifies listed exclusions per the specifically negotiated terms of this endorsement.' },
        { id: 3081, groupNumber: 'D26712', code: 'D26712 .004', name: 'Additional Limit of Liability for Costs of Defense Incurred by Insurer Endorsement', description: 'Provides an additional limit of liability specifically for defense costs incurred by the insurer. Ensures that primary coverage limits are not eroded by insurer-assigned defense expenses.' },
        { id: 3082, groupNumber: 'D26712', code: 'D26712 .017', name: 'Sublimit for Housing Discrimination Claims Coverage', description: 'Establishes a sublimit of liability applicable to housing discrimination claims under the policy. Defines the sublimit amount and its relationship to the overall aggregate limit.' }
      ]
    },
    {
      number: 'D26713',
      title: 'Amendment to Section III',
      policyForm: 'D26',
      versions: [
        { id: 3083, groupNumber: 'D26713', code: 'D26713 .000', name: 'Amendment to Section III', description: 'Modifies definitions or conditions in Section III of the policy. Addresses specifically negotiated changes to defined terms or general coverage conditions.' }
      ]
    },
    {
      number: 'D26714',
      title: 'Amendment to Section IV',
      policyForm: 'D26',
      versions: [
        { id: 3084, groupNumber: 'D26714', code: 'D26714 .000', name: 'Amendment to Section IV', description: 'Amends Section IV of the policy, which governs exclusions and conditions. Notes specifically negotiated modifications to coverage scope or applicability.' },
        { id: 3085, groupNumber: 'D26714', code: 'D26714 .002', name: 'Deletion of Noise Exclusion', description: 'Removes the noise exclusion from Section IV of the policy. Broadens coverage to include claims that would otherwise be excluded on noise-related grounds.' }
      ]
    },
    {
      number: 'D26715',
      title: 'Amendment to Section V',
      policyForm: 'D26',
      versions: [
        { id: 3086, groupNumber: 'D26715', code: 'D26715 .000', name: 'Amendment to Section V', description: 'Modifies Section V provisions governing policy limits and retentions. Documents specific changes to how limits are structured, shared, or applied across coverage parts.' }
      ]
    },
    {
      number: 'D26716',
      title: 'Amendment to Section VI',
      policyForm: 'D26',
      versions: [
        { id: 3087, groupNumber: 'D26716', code: 'D26716 .000', name: 'Amendment to Section VI', description: 'Amends claim reporting and notice provisions in Section VI of the policy. Adjusts reporting requirements, notice timing, or cooperative obligation provisions.' }
      ]
    },
    {
      number: 'D26717',
      title: 'Amendment to Section VII',
      policyForm: 'D26',
      versions: [
        { id: 3088, groupNumber: 'D26717', code: 'D26717 .000', name: 'Amendment to Section VII', description: 'Modifies general conditions contained in Section VII of the policy. Documents negotiated changes to insured obligations, cooperation requirements, or insurer rights.' }
      ]
    },
    {
      number: 'D26718',
      title: 'Amendment to Section VIII',
      policyForm: 'D26',
      versions: [
        { id: 3089, groupNumber: 'D26718', code: 'D26718 .000', name: 'Amendment to Section VIII', description: 'Amends Section VIII, which governs declarations and coverage parameters. Documents specifically negotiated changes to insured entities, limits, or retention amounts.' },
        { id: 3090, groupNumber: 'D26718', code: 'D26718 .001', name: 'Amendment to Section VIII - Coverage Extension Former Directors and Officers', description: 'Extends Section VIII coverage to former directors and officers following their departure. Provides run-off protection for individuals who left board or officer roles during or after the policy period.' },
        { id: 3091, groupNumber: 'D26718', code: 'D26718-01 .000', name: 'Amendment to Section VIII - Coverage Extension Former Directors and Officers', description: 'Alternate edition extending Section VIII coverage to former directors and officers. Provides tail coverage for past board or officer service under the applicable policy edition.' }
      ]
    },
    {
      number: 'D26719',
      title: 'Amendment to Section IX',
      policyForm: 'D26',
      versions: [
        { id: 3092, groupNumber: 'D26719', code: 'D26719 .000', name: 'Amendment to Section IX', description: 'Modifies general conditions or dispute resolution provisions in Section IX of the policy. Addresses negotiated changes to arbitration, choice of law, or related policy mechanics.' }
      ]
    },
    {
      number: 'D26720',
      title: 'Amendment to Section IV - Subsidence',
      policyForm: 'D26',
      versions: [
        { id: 3093, groupNumber: 'D26720', code: 'D26720 .000', name: 'Amendment to Section IV - Subsidence', description: 'Adds or removes exclusionary language specific to subsidence claims in Section IV. Clarifies coverage applicability for land movement, soil settlement, and related structural loss allegations.' }
      ]
    },
    {
      number: 'D26721',
      title: 'Amendment to Section VIII - ADA Specific Retention',
      policyForm: 'D26',
      versions: [
        { id: 3094, groupNumber: 'D26721', code: 'D26721 .000', name: 'Amendment to Section VIII - ADA Specific Retention', description: 'Applies a separate retention amount to Americans with Disabilities Act claims under Section VIII. Coordinates ADA-related exposure with its designated retention structure independent of the general retention.' }
      ]
    },
    {
      number: 'D26723',
      title: 'Costs of Defense Subject to the Limit of Liability and Retention',
      policyForm: 'D26',
      versions: [
        { id: 3095, groupNumber: 'D26723', code: 'D26723 .000', name: 'Costs of Defense Subject to the Limit of Liability and Retention', description: 'Subjects defense costs to both the limit of liability and the applicable retention. Ensures that defense expenditures erode the limit and are counted against the insured\'s retention.' }
      ]
    },
    {
      number: 'D26740',
      title: 'Privacy and Security Coverage',
      policyForm: 'D26',
      versions: [
        { id: 3096, groupNumber: 'D26740', code: 'D26740 .000', name: 'Data Security Wrongful Acts and Privacy Wrongful Acts Coverage Endorsement', description: 'Adds coverage for data security wrongful acts and privacy wrongful acts to the base policy. Responds to breaches, unauthorized data access, and privacy regulation violations.' },
        { id: 3097, groupNumber: 'D26740', code: 'D26740 .001', name: 'Data Security Wrongful Acts and Privacy Wrongful Acts Coverage Endorsement', description: 'Updated version adding data security and privacy wrongful acts coverage. Reflects revised definitions and coverage terms for evolving cyber and privacy exposures.' }
      ]
    },
    {
      number: 'D26800',
      title: 'Amendment to Declarations Page',
      policyForm: 'D26',
      versions: [
        { id: 3098, groupNumber: 'D26800', code: 'D26800 .000', name: 'Amendment to Declarations Page', description: 'General-purpose amendment to the declarations page for policy-level changes. Records modifications not addressed by a more specific declarations endorsement.' }
      ]
    },
    {
      number: 'D26801',
      title: 'Amendment to Declarations Page (Name/Address)',
      policyForm: 'D26',
      versions: [
        { id: 3099, groupNumber: 'D26801', code: 'D26801 .000', name: 'Amendment to Declarations Page (Name/Address)', description: 'Updates the insured name or mailing address shown on the declarations page. Ensures policy records reflect the current legal entity name and correct mailing address.' },
        { id: 3100, groupNumber: 'D26801', code: 'D26801 .001', name: 'Addition of Mailing Address', description: 'Adds a secondary mailing address to the declarations page. Used when policy notices or correspondence must also be directed to an additional location.' },
        { id: 3101, groupNumber: 'D26801', code: 'D26801 .002', name: "Addition of Property Manager's Mailing Address", description: 'Records the property manager\'s mailing address on the declarations page. Ensures policy notices are directed to the managing agent as contractually required.' },
        { id: 3102, groupNumber: 'D26801', code: 'D26801 .200', name: 'Amendment to Declarations Page (Name/Address)', description: 'Alternate edition updating the insured name or mailing address on the declarations page. Applied to surplus lines or alternate policy form editions.' },
        { id: 3103, groupNumber: 'D26801', code: 'D26801 .201', name: 'Addition of Mailing Address', description: 'Surplus lines variant adding a secondary mailing address to the declarations page. Ensures correct notice routing for the alternate policy edition.' },
        { id: 3104, groupNumber: 'D26801', code: 'D26801 .202', name: "Addition of Property Manager's Mailing Address", description: 'Surplus lines variant adding the property manager\'s mailing address to the declarations page. Routes notices to the managing agent for alternate policy form editions.' },
        { id: 3105, groupNumber: 'D26801', code: 'D26801 .400', name: 'Amendment to Declarations Page (Name/Address)', description: 'Fourth-edition variant updating the insured name or address on the declarations page. Reflects binding or midterm corrections to insured entity or contact information.' },
        { id: 3106, groupNumber: 'D26801', code: 'D26801 .402', name: "Addition of Property Manager's Mailing Address", description: 'Fourth-edition variant adding the property manager\'s mailing address to the declarations page. Routes notices to the managing agent for this policy edition.' },
        { id: 3107, groupNumber: 'D26801', code: 'D26801 .600', name: 'Amendment to Declarations Page (Name/Address)', description: 'Sixth-edition variant correcting or updating the insured name and address details. Applied to the applicable policy edition at binding or midterm.' },
        { id: 3108, groupNumber: 'D26801', code: 'D26801 .800', name: 'Amendment to Declarations Page (Name/Address)', description: 'Eighth-edition variant updating the insured name or address on the declarations page. Used for the eighth edition of the applicable policy form.' }
      ]
    },
    {
      number: 'D26802',
      title: 'Amendment to Declarations Page (Policy Period)',
      policyForm: 'D26',
      versions: [
        { id: 3109, groupNumber: 'D26802', code: 'D26802 .000', name: 'Amendment to Declarations Page (Policy Period)', description: 'Updates the policy period shown on the declarations page. Used for midterm corrections, policy extensions, or short-rate transactions.' },
        { id: 3110, groupNumber: 'D26802', code: 'D26802 .200', name: 'Amendment to Declarations Page (Policy Period)', description: 'Alternate edition updating the policy period on the declarations page. Applied to surplus lines or alternate policy form versions for period adjustments.' }
      ]
    },
    {
      number: 'D26803',
      title: 'Amendment to Declarations Page (Limit of Liability)',
      policyForm: 'D26',
      versions: [
        { id: 3111, groupNumber: 'D26803', code: 'D26803 .000', name: 'Amendment to Declarations Page (Limit of Liability)', description: 'Updates the limit of liability shown on the declarations page. Reflects agreed aggregate, per-claim, or sublimit changes made at binding or midterm.' },
        { id: 3112, groupNumber: 'D26803', code: 'D26803 .001', name: 'Separate Limits of Liability', description: 'Establishes separate limits of liability for distinct coverage sections of the policy. Documents per-claim and aggregate limits applicable to each named coverage part.' }
      ]
    },
    {
      number: 'D26804',
      title: 'Amendment to Declarations Page (Retention)',
      policyForm: 'D26',
      versions: [
        { id: 3113, groupNumber: 'D26804', code: 'D26804 .000', name: 'Amendment to Declarations Page (Retention)', description: 'Updates the retention shown on the declarations page. Reflects the insured\'s agreed self-insured retention or deductible for the current policy term.' }
      ]
    },
    {
      number: 'D26805',
      title: 'Amendment to Declarations Page (Premium)',
      policyForm: 'D26',
      versions: [
        { id: 3114, groupNumber: 'D26805', code: 'D26805 .000', name: 'Amendment to Declarations Page (Premium)', description: 'Documents a change in the policy premium on the declarations page. Records additional or return premium due following a coverage modification or audit.' },
        { id: 3115, groupNumber: 'D26805', code: 'D26805 .200', name: 'Amendment to Declarations Page (Premium)', description: 'Alternate-edition declarations page premium amendment. Applied to surplus lines or alternate policy form versions to record premium adjustments.' }
      ]
    },
    {
      number: 'D26806',
      title: 'Amendment to Declarations Page (Endorsement Deletion)',
      policyForm: 'D26',
      versions: [
        { id: 3116, groupNumber: 'D26806', code: 'D26806 .000', name: 'Amendment to Declarations Page (Endorsement Deletion)', description: 'Records the deletion of one or more endorsements from the declarations schedule. Reflects the agreed removal of coverage modifications previously attached to the policy.' }
      ]
    },
    {
      number: 'D26807',
      title: 'Amendment to Declarations Page (Prior and Pending Litigation Date)',
      policyForm: 'D26',
      versions: [
        { id: 3117, groupNumber: 'D26807', code: 'D26807 .000', name: 'Amendment to Declarations Page (Prior and Pending Litigation Date)', description: 'Updates the prior and pending litigation date shown on the declarations page. Adjusts the cutoff date that determines which pre-existing claims are excluded from coverage.' }
      ]
    },
    {
      number: 'D26808',
      title: 'Amendment to Declarations Page (Sublimit)',
      policyForm: 'D26',
      versions: [
        { id: 3118, groupNumber: 'D26808', code: 'D26808 .000', name: 'Amendment to Declarations Page (Sublimit)', description: 'Records a sublimit of liability on the declarations page for a specified coverage category. Limits insurer exposure for the identified coverage within the overall aggregate limit.' }
      ]
    },
    {
      number: 'D26809',
      title: 'Joint Contract Clarification',
      policyForm: 'D26',
      versions: [
        { id: 3119, groupNumber: 'D26809', code: 'D26809 .000', name: 'Joint Contract Clarification', description: 'Clarifies coverage application under jointly executed management contracts. Addresses how jointly issued policies respond to shared-liability and split-insured scenarios.' }
      ]
    },
    {
      number: 'D26813',
      title: 'Amendment to Declarations Page (Retention)',
      policyForm: 'D26',
      versions: [
        { id: 3120, groupNumber: 'D26813', code: 'D26813 .000', name: 'Amendment to Declarations Page (Retention)', description: 'Alternative retention amendment to the declarations page. Used to document a revised retention structure distinct from the standard D26804 endorsement form.' }
      ]
    },
    {
      number: 'D26814',
      title: 'Amendment to Declarations Page',
      policyForm: 'D26',
      versions: [
        { id: 3121, groupNumber: 'D26814', code: 'D26814 .000', name: 'Amendment to Declarations Page', description: 'General amendment to the declarations page for coverage or schedule adjustments. Captures miscellaneous changes not addressed by more targeted declarations endorsements.' },
        { id: 3122, groupNumber: 'D26814', code: 'D26814-01 .000', name: 'Amendment to Declarations Page', description: 'Alternate edition general amendment to the declarations page. Records schedule or coverage changes for the applicable policy edition.' }
      ]
    },
    {
      number: 'D26815',
      title: 'Amendment to Declarations Page (Separate EPL Retention)',
      policyForm: 'D26',
      versions: [
        { id: 3123, groupNumber: 'D26815', code: 'D26815 .000', name: 'Amendment to Declarations Page (Separate EPL Retention)', description: 'Establishes a separate retention specifically applicable to employment practices liability claims. Provides distinct retention treatment for EPL exposures independent of the general D&O retention.' }
      ]
    },
    {
      number: 'D26816',
      title: 'Additional Subsidiaries',
      policyForm: 'D26',
      versions: [
        { id: 3124, groupNumber: 'D26816', code: 'D26816 .000', name: 'Additional Subsidiaries', description: 'Adds additional subsidiaries to the insured entity schedule. Specifies any coverage conditions, limitations, or premium adjustments applicable to each added subsidiary.' }
      ]
    },
    {
      number: 'D11046',
      title: 'NP-EPL Flyer',
      policyForm: 'D11',
      versions: [
        { id: 4001, groupNumber: 'D11046', code: 'D11046 .001', name: 'NP-EPL Flyer', description: 'Policyholder flyer summarizing employment practices liability coverage for nonprofit organizations. Outlines key coverage features and claim reporting contacts.' },
        { id: 4002, groupNumber: 'D11046', code: 'D11046TX .000', name: 'Texas Policyholder Notice', description: 'This notice is required by the state of Texas. The notice provides the contact information for the insurance company and the Texas Department of Insurance in case you need information or have a complaint.' }
      ]
    },
    {
      number: 'D11047',
      title: 'HOA Flyer',
      policyForm: 'D11',
      versions: [
        { id: 4003, groupNumber: 'D11047', code: 'D11047 .001', name: 'HOA Flyer', description: 'Form 5769. Policyholder flyer summarizing directors and officers liability coverage for homeowner associations. Provides an overview of key coverage features and contacts.' }
      ]
    },
    {
      number: 'D11100',
      title: 'EPL Policy Form',
      policyForm: 'D11',
      versions: [
        { id: 4004, groupNumber: 'D11100', code: 'D11100-A .001', name: 'EPL Policy Form', description: 'Base employment practices liability policy form for nonprofit and community association policyholders. Covers wrongful termination, harassment, and discrimination claims.' },
        { id: 4005, groupNumber: 'D11100', code: 'D11100-A .002', name: 'EPL Policy Form', description: 'Second edition of the EPL policy form with updated insuring agreements and definitions. Reflects revised coverage terms for the current program year.' }
      ]
    },
    {
      number: 'D32047',
      title: 'Texas Amendatory Endorsement',
      policyForm: 'D32',
      versions: [
        { id: 4101, groupNumber: 'D32047', code: 'D32047TX .000', name: 'Texas Amendatory Endorsement', description: 'Applies Texas Department of Insurance required modifications to the fiduciary liability policy. Addresses state-specific cancellation procedures and surplus lines provisions.' }
      ]
    },
    {
      number: 'D32053',
      title: 'Disclosure Form - Claims-Made Policy',
      policyForm: 'D32',
      versions: [
        { id: 4102, groupNumber: 'D32053', code: 'D32053 .000', name: 'Disclosure Form - Claims-Made Policy', description: 'Discloses claims-made trigger, reporting requirements, and retroactive date implications for fiduciary liability coverage. Explains notice periods and extended reporting options.' },
        { id: 4103, groupNumber: 'D32053', code: 'D32053MD .000', name: 'Disclosure Form - Claims-Made Policy (Maryland)', description: 'Maryland-specific claims-made disclosure for fiduciary liability policies. Incorporates Maryland regulatory requirements alongside standard claims-made reporting disclosures.' }
      ]
    },
    {
      number: 'D32055',
      title: 'Policyholder Notice - Indiana',
      policyForm: 'D32',
      versions: [
        { id: 4104, groupNumber: 'D32055', code: 'D32055 .000', name: 'Policyholder Notice - Indiana', description: 'Required statutory notice for Indiana fiduciary liability policyholders. Outlines insurer obligations and Indiana Department of Insurance contact and complaint procedures.' }
      ]
    },
    {
      number: 'D32056',
      title: 'Policyholder Notice - Virginia',
      policyForm: 'D32',
      versions: [
        { id: 4105, groupNumber: 'D32056', code: 'D32056 .000', name: 'Policyholder Notice - Virginia', description: 'Required statutory notice for Virginia fiduciary liability policyholders. Describes insurer obligations and Virginia Bureau of Insurance contact and complaint information.' }
      ]
    },
    {
      number: 'D55100',
      title: 'Management Liability Solutions Form',
      policyForm: 'D55',
      versions: [
        { id: 4201, groupNumber: 'D55100', code: 'D55100-A .001', name: 'Management Liability Solutions Form', description: 'Base policy form for the Management Liability Solutions program. Provides directors and officers, employment practices, and fiduciary liability coverage for nonprofit organizations.' },
        { id: 4202, groupNumber: 'D55100', code: 'D55100-F .001', name: 'Management Liability Solutions Form - FTZ', description: 'Free-trade zone variant of the Management Liability Solutions policy form. Extends coverage for organizations operating within designated free-trade zones.' },
        { id: 4203, groupNumber: 'D55100', code: 'D55100-G .001', name: 'Management Liability Solutions Form', description: 'Enhanced protection package variant of the Management Liability Solutions policy form. Adds supplemental coverage for employment practices and privacy liability.' },
        { id: 4204, groupNumber: 'D55100', code: 'D55100-KY .001', name: 'Management Liability Solutions Form - Kentucky', description: 'Kentucky edition of the Management Liability Solutions policy form. Combines core MLS coverage with Kentucky Department of Insurance required regulatory modifications.' },
        { id: 4205, groupNumber: 'D55100', code: 'D55100-MA .001', name: 'Management Liability Solutions Form - Massachusetts', description: 'Massachusetts edition of the Management Liability Solutions policy form. Incorporates Massachusetts Division of Insurance required modifications alongside standard MLS coverage.' }
      ]
    },
    {
      number: 'D56100',
      title: 'Management Liability Solutions 2.0 Form',
      policyForm: 'D56',
      versions: [
        { id: 4301, groupNumber: 'D56100', code: 'D56100-A .001', name: 'Management Liability Solutions 2.0 Form', description: 'Base policy form for the Management Liability Solutions 2.0 program. Provides updated directors and officers, employment practices, and fiduciary liability coverage under the redesigned MLS 2.0 structure.' },
        { id: 4302, groupNumber: 'D56100', code: 'D56100-AK .001', name: 'Management Liability Solutions 2.0 Form', description: 'Alaska edition of the Management Liability Solutions 2.0 policy form. Incorporates Alaska-specific regulatory requirements alongside the MLS 2.0 coverage structure.' },
        { id: 4303, groupNumber: 'D56100', code: 'D56100-AKA .001', name: 'MLS 2.0 Coverage Part A', description: 'Coverage Part A of the Management Liability Solutions 2.0 policy form. Provides directors and officers liability coverage under the modular MLS 2.0 program structure.' },
        { id: 4304, groupNumber: 'D56100', code: 'D56100-AKB .001', name: 'MLS 2.0 Coverage Part B', description: 'Coverage Part B of the Management Liability Solutions 2.0 policy form. Provides employment practices liability coverage under the modular MLS 2.0 program structure.' },
        { id: 4305, groupNumber: 'D56100', code: 'D56100-AKC .001', name: 'MLS 2.0 Coverage Part C', description: 'Coverage Part C of the Management Liability Solutions 2.0 policy form. Provides fiduciary liability coverage under the modular MLS 2.0 program structure.' }
      ]
    },
    {
      number: 'D71100',
      title: 'EPL Policy Form',
      policyForm: 'D71',
      versions: [
        { id: 4401, groupNumber: 'D71100', code: 'D71100-A .001', name: 'EPL Policy Form', description: 'Base employment practices liability policy form for the D71 program. Covers wrongful termination, harassment, discrimination, and related employment allegations.' }
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
    { id: 'H11', name: 'EPL Package', policyForm: 'D71' },
    { id: 'H12', name: 'Fiduciary Package', policyForm: 'D32', formCode: 'D32000' },
    { id: 'H13', name: 'COA/HOA Package', policyForm: 'D26' },
    { id: 'H21', name: 'Combo Package', policyForm: 'D56' }
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
    this.modalInitialVersionIds = [];
    this.modalInitialPolicyForm = '';
    this.modalLockPolicyForm = false;
    this.activeModal = 'create-package';
  }

  openCreatePackageFromSelectedModal(): void {
    this.modalInitialVersionIds = [...this.selectedActiveVersionIds];
    this.modalInitialPolicyForm = this.accountPolicyForm;
    this.modalLockPolicyForm = true;
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
      return `${pkg.formCode ?? pkg.policyForm + '100'} - ${pkg.name}`;
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
