/**
 * TypeScript types for Legislative Documents
 * Based on Supabase database schema
 */

// Enum types from database
export type LegislativeDocType =
  | "proposed_ordinance"
  | "proposed_resolution"
  | "committee_report";

export type DocumentType =
  | "proposed_ordinance"
  | "proposed_resolution"
  | "committee_report"
  | "letter"
  | "memo"
  | "payroll"
  | "contract_of_service"
  | "leave_application"
  | "endorsement"
  | "invitation";

export type PurposeType = "for_agenda" | "for_filing";

export type SourceType =
  | "administrators_office"
  | "city_councilors_office"
  | "city_treasurers_office"
  | "health_office"
  | "mayors_office"
  | "mdrrmo"
  | "others"
  | "philippine_national_police"
  | "vice_mayors_office";

export type StatusType =
  | "received"
  | "for_initial"
  | "for_signature"
  | "approved"
  | "calendared"
  | "published"
  | "returned"
  | "released";

export type ClassificationType =
  | "legislative_docs"
  | "administrative_docs"
  | "invitation";

export type DocumentClassification =
  | "Appropriation"
  | "Barangay Affairs"
  | "Charter Amendment"
  | "Civil Service"
  | "Commendation"
  | "Committee Investigation"
  | "Committee Report"
  | "Cultural Development"
  | "Declaration"
  | "Economic Development"
  | "Education"
  | "Environment"
  | "Good Governance"
  | "Health & Sanitation"
  | "Infrastructure"
  | "Labor & Employment"
  | "Laws & Ordinances"
  | "Public Safety"
  | "Public Works"
  | "Social Services"
  | "Tourism"
  | "Transportation"
  | "Urban Planning"
  | "Ways and Means"
  | "Women & Children"
  | "Youth Development";

// Main Document interface (from document table)
export interface Document {
  id: string;
  code_number: string;
  title: string;
  type: DocumentType;
  purpose: PurposeType;
  source: SourceType;
  status: StatusType;
  classification: ClassificationType;
  remarks?: string | null;
  received_at: string;
}

// Legislative Document interface (from legislative_document table)
export interface LegislativeDocument {
  id: number;
  document_id: string;
  official_number: string;
  series_year: number;
  type: LegislativeDocType;
  date_enacted: string;
  created_at: string;
  sponsor_names?: string[] | null;
  author_names?: string[] | null;
}

// Combined interface for frontend use (joins document + legislative_document)
export interface LegislativeDocumentWithDetails extends LegislativeDocument {
  document: Document;
  // Convenience fields for display
  displayTitle?: string;
  displayType?: string;
  displayClassification?: string;
  pdfUrl?: string;
  pdfFilename?: string;
}

// Filter options for UI
export interface DocumentFilters {
  searchTerm?: string;
  type?: LegislativeDocType | "all";
  year?: number | "all";
  classification?: DocumentClassification | "all";
  page?: number;
  limit?: number;
}

// Pagination info
export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// API response types
export interface LegislativeDocumentsResponse {
  documents: LegislativeDocumentWithDetails[];
  pagination: PaginationInfo;
}
