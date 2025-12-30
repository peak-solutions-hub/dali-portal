-- ============================================================================
-- Migration: Seed Legislative Documents
-- Description: Add mock data for documents and legislative documents
--              covering all 28 classification types
-- Created: 2024-12-30
-- Environment: Supabase (PostgreSQL with RLS)
-- ============================================================================

-- IMPORTANT PRECAUTIONS FOR SUPABASE:
-- 1. UUIDs must be valid format (use gen_random_uuid() or explicit valid UUIDs)
-- 2. Enum values must match EXACTLY (case-sensitive) with defined types
-- 3. Timestamps should use 'timestamptz' format with timezone
-- 4. Arrays use ARRAY[] syntax (PostgreSQL standard)
-- 5. Documents must be inserted BEFORE legislative_documents (FK constraint)
-- 6. Use ON CONFLICT to handle re-runs safely
-- 7. BigInt/Serial IDs will auto-increment, don't specify unless needed

-- ============================================================================
-- STEP 1: Insert base documents (parent table)
-- ============================================================================
-- Using explicit UUIDs for referential integrity with legislative_documents

INSERT INTO "document" (
  "id",
  "code_number",
  "title",
  "type",
  "purpose",
  "source",
  "status",
  "classification",
  "remarks",
  "received_at"
) VALUES
  -- 1. APPROPRIATIONS
  (
    'a0000001-0001-4000-8000-000000000001',
    'ORD-2024-001',
    'Annual Budget Appropriation for Fiscal Year 2025',
    'proposed_ordinance',
    'for_agenda',
    'city_treasurers_office',
    'published',
    'appropriations',
    'Approved annual budget for the city.',
    '2024-01-15 08:00:00+08'
  ),
  -- 2. BARANGAY AFFAIRS AND COMMUNITY DEVELOPMENT
  (
    'a0000001-0001-4000-8000-000000000002',
    'RES-2024-001',
    'Resolution Supporting Barangay Development Programs',
    'proposed_resolution',
    'for_agenda',
    'city_councilors_office',
    'published',
    'barangay_affairs_and_community_development',
    'Community development initiative.',
    '2024-01-20 09:00:00+08'
  ),
  -- 3. COMMUNICATION AND PUBLIC INFORMATION
  (
    'a0000001-0001-4000-8000-000000000003',
    'RES-2024-002',
    'Resolution on Public Information Dissemination Guidelines',
    'proposed_resolution',
    'for_agenda',
    'administrators_office',
    'published',
    'communication_and_public_information',
    NULL,
    '2024-02-01 10:00:00+08'
  ),
  -- 4. COOPERATIVE AND LIVELIHOOD
  (
    'a0000001-0001-4000-8000-000000000004',
    'ORD-2024-002',
    'Cooperative Development and Livelihood Enhancement Act',
    'proposed_ordinance',
    'for_agenda',
    'city_councilors_office',
    'published',
    'cooperative_and_livelihood',
    'Promotes cooperative business models.',
    '2024-02-10 08:30:00+08'
  ),
  -- 5. DISASTER RELIEF
  (
    'a0000001-0001-4000-8000-000000000005',
    'ORD-2024-003',
    'Disaster Risk Reduction and Management Fund Allocation',
    'proposed_ordinance',
    'for_agenda',
    'mdrrmo',
    'published',
    'disaster_relief',
    'Emergency fund allocation for calamities.',
    '2024-02-15 11:00:00+08'
  ),
  -- 6. DOMESTIC AND INTERNATIONAL RELATIONS
  (
    'a0000001-0001-4000-8000-000000000006',
    'RES-2024-003',
    'Sister City Agreement with Osaka, Japan',
    'proposed_resolution',
    'for_agenda',
    'mayors_office',
    'published',
    'domestic_and_international_relations',
    'Cultural exchange program.',
    '2024-02-20 09:30:00+08'
  ),
  -- 7. EDUCATION, SCIENCE AND TECHNOLOGY
  (
    'a0000001-0001-4000-8000-000000000007',
    'ORD-2024-004',
    'Scholarship Program for Ilonggo Students',
    'proposed_ordinance',
    'for_agenda',
    'city_councilors_office',
    'published',
    'education_science_and_technology',
    'Educational assistance for deserving students.',
    '2024-03-01 08:00:00+08'
  ),
  -- 8. ELECTRIC, GAS AND UTILITIES
  (
    'a0000001-0001-4000-8000-000000000008',
    'RES-2024-004',
    'Resolution on Renewable Energy Adoption',
    'proposed_resolution',
    'for_agenda',
    'administrators_office',
    'published',
    'electric_gas_and_utilities',
    NULL,
    '2024-03-05 10:30:00+08'
  ),
  -- 9. ENGINEERING, CONSTRUCTION AND PUBLIC WORKS
  (
    'a0000001-0001-4000-8000-000000000009',
    'CR-2024-001',
    'Committee Report on Infrastructure Projects Review',
    'committee_report',
    'for_agenda',
    'city_councilors_office',
    'published',
    'engineering_construction_and_public_works',
    'Quarterly infrastructure review.',
    '2024-03-10 08:00:00+08'
  ),
  -- 10. ETHICS AND RULES OF PROFESSIONAL SPORTS
  (
    'a0000001-0001-4000-8000-000000000010',
    'RES-2024-005',
    'Resolution Adopting Code of Ethics for Local Athletes',
    'proposed_resolution',
    'for_agenda',
    'city_councilors_office',
    'published',
    'ethics_and_rules_of_professional_sports',
    'Sportsmanship and fair play guidelines.',
    '2024-03-15 09:00:00+08'
  ),
  -- 11. FIRE, SANITATION AND HOSPITAL SERVICES
  (
    'a0000001-0001-4000-8000-000000000011',
    'ORD-2024-005',
    'Fire Safety Code Implementation Guidelines',
    'proposed_ordinance',
    'for_agenda',
    'health_office',
    'published',
    'fire_sanitation_and_hospital_services',
    'Updated fire safety standards.',
    '2024-03-20 08:30:00+08'
  ),
  -- 12. INFORMATION TECHNOLOGY AND COMPUTERIZATION
  (
    'a0000001-0001-4000-8000-000000000012',
    'ORD-2024-006',
    'Digital Governance and E-Services Act',
    'proposed_ordinance',
    'for_agenda',
    'administrators_office',
    'published',
    'information_technology_and_computerization',
    'Modernization of government services.',
    '2024-04-01 10:00:00+08'
  ),
  -- 13. LABOR, EMPLOYMENT, MANPOWER DEVELOPMENT AND PERSONNEL
  (
    'a0000001-0001-4000-8000-000000000013',
    'RES-2024-006',
    'Resolution on Local Employment and Skills Training',
    'proposed_resolution',
    'for_agenda',
    'city_councilors_office',
    'published',
    'labor_employment_manpower_development_and_personnel',
    'Job creation initiatives.',
    '2024-04-05 09:30:00+08'
  ),
  -- 14. MARKET AND SLAUGHTERHOUSE
  (
    'a0000001-0001-4000-8000-000000000014',
    'CR-2024-002',
    'Committee Report on Public Market Modernization',
    'committee_report',
    'for_agenda',
    'city_councilors_office',
    'published',
    'market_and_slaughterhouse',
    'Market facilities upgrade proposal.',
    '2024-04-10 08:00:00+08'
  ),
  -- 15. PEACE AND ORDER
  (
    'a0000001-0001-4000-8000-000000000015',
    'ORD-2024-007',
    'Anti-Illegal Gambling Ordinance',
    'proposed_ordinance',
    'for_agenda',
    'philippine_national_police',
    'published',
    'peace_and_order',
    'Strengthening law enforcement.',
    '2024-04-15 11:00:00+08'
  ),
  -- 16. PUBLIC SAFETY, GOOD GOVERNMENT AND PUBLIC ACCOUNTABILITY
  (
    'a0000001-0001-4000-8000-000000000016',
    'RES-2024-007',
    'Resolution on Transparency and Accountability Measures',
    'proposed_resolution',
    'for_agenda',
    'vice_mayors_office',
    'published',
    'public_safety_good_government_and_public_accountability',
    NULL,
    '2024-04-20 09:00:00+08'
  ),
  -- 17. PUBLIC FIRE PENOLOGY PUBLIC SAFETY ORDER AND SECURITY
  (
    'a0000001-0001-4000-8000-000000000017',
    'ORD-2024-008',
    'Public Safety and Security Enhancement Act',
    'proposed_ordinance',
    'for_agenda',
    'philippine_national_police',
    'published',
    'public_fire_penology_public_safety_order_and_security',
    'Comprehensive security measures.',
    '2024-05-01 08:00:00+08'
  ),
  -- 18. PUBLIC SERVICES, ENVIRONMENTAL PROTECTION AND ECOLOGY
  (
    'a0000001-0001-4000-8000-000000000018',
    'ORD-2024-009',
    'Environmental Protection and Waste Management Code',
    'proposed_ordinance',
    'for_agenda',
    'city_councilors_office',
    'published',
    'public_services_environmental_protection_and_ecology',
    'Green city initiatives.',
    '2024-05-10 10:30:00+08'
  ),
  -- 19. PUBLIC UTILITIES, ENERGY STYLE JUSTICE AND LEGAL MATTERS
  (
    'a0000001-0001-4000-8000-000000000019',
    'CR-2024-003',
    'Committee Report on Public Utilities Rate Review',
    'committee_report',
    'for_agenda',
    'city_councilors_office',
    'published',
    'public_utilities_energy_style_justice_and_legal_matters',
    'Utility rate assessment.',
    '2024-05-15 08:30:00+08'
  ),
  -- 20. REAL ESTATE
  (
    'a0000001-0001-4000-8000-000000000020',
    'RES-2024-008',
    'Resolution on City Land Use and Zoning Updates',
    'proposed_resolution',
    'for_agenda',
    'administrators_office',
    'published',
    'real_estate',
    'Land use planning updates.',
    '2024-05-20 09:00:00+08'
  ),
  -- 21. SOCIAL WELFARE AND HISTORICAL AFFAIRS
  (
    'a0000001-0001-4000-8000-000000000021',
    'ORD-2024-010',
    'Social Welfare Programs Enhancement Act',
    'proposed_ordinance',
    'for_agenda',
    'city_councilors_office',
    'published',
    'social_welfare_and_historical_affairs',
    'Support for marginalized sectors.',
    '2024-06-01 08:00:00+08'
  ),
  -- 22. TOURISM, CULTURE AND INDUSTRY
  (
    'a0000001-0001-4000-8000-000000000022',
    'ORD-2024-011',
    'Dinagyang Festival Promotion and Support Act',
    'proposed_ordinance',
    'for_agenda',
    'city_councilors_office',
    'published',
    'tourism_culture_and_industry',
    'Cultural heritage preservation.',
    '2024-06-10 10:00:00+08'
  ),
  -- 23. TRADE, COMMERCE AND INDUSTRY
  (
    'a0000001-0001-4000-8000-000000000023',
    'RES-2024-009',
    'Resolution Supporting Local Business Development',
    'proposed_resolution',
    'for_agenda',
    'city_councilors_office',
    'published',
    'trade_commerce_and_industry',
    'MSME support initiatives.',
    '2024-06-15 09:30:00+08'
  ),
  -- 24. TRANSPORTATION, HOUSING AND LAND DEVELOPMENT ZONING
  (
    'a0000001-0001-4000-8000-000000000024',
    'ORD-2024-012',
    'Public Transportation Modernization Ordinance',
    'proposed_ordinance',
    'for_agenda',
    'administrators_office',
    'published',
    'transportation_housing_and_land_development_zoning',
    'Modern PUV transition program.',
    '2024-07-01 08:00:00+08'
  ),
  -- 25. URBAN POOR, HUMAN RIGHTS AND MINORITY GROUPS
  (
    'a0000001-0001-4000-8000-000000000025',
    'ORD-2024-013',
    'Urban Poor Housing Assistance Program',
    'proposed_ordinance',
    'for_agenda',
    'city_councilors_office',
    'published',
    'urban_poor_human_rights_and_minority_groups',
    'Affordable housing for informal settlers.',
    '2024-07-10 10:30:00+08'
  ),
  -- 26. VETERANS, RETIREES, ELDERLY AND DISABLED PERSON
  (
    'a0000001-0001-4000-8000-000000000026',
    'RES-2024-010',
    'Resolution on Senior Citizen and PWD Benefits Enhancement',
    'proposed_resolution',
    'for_agenda',
    'city_councilors_office',
    'published',
    'veterans_retirees_elderly_and_disabled_person',
    'Expanded benefits for elderly and PWDs.',
    '2024-07-15 09:00:00+08'
  ),
  -- 27. WOMEN AND FAMILY RELATIONS
  (
    'a0000001-0001-4000-8000-000000000027',
    'ORD-2024-014',
    'Women and Children Protection Ordinance',
    'proposed_ordinance',
    'for_agenda',
    'city_councilors_office',
    'published',
    'women_and_family_relations',
    'Gender-responsive governance.',
    '2024-08-01 08:00:00+08'
  ),
  -- 28. YOUTH AND SPORTS DEVELOPMENT
  (
    'a0000001-0001-4000-8000-000000000028',
    'ORD-2024-015',
    'Youth Development and Sports Excellence Act',
    'proposed_ordinance',
    'for_agenda',
    'city_councilors_office',
    'published',
    'youth_and_sports_development',
    'Youth empowerment programs.',
    '2024-08-10 10:00:00+08'
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STEP 2: Insert legislative documents (child table with FK to document)
-- ============================================================================
-- Note: id is BigInt SERIAL (auto-increment), so we don't specify it
-- series_year is Decimal type in Prisma, but just year number works
-- date_enacted is DATE type (not TIMESTAMPTZ)
-- sponsor_names and author_names are String[] arrays

INSERT INTO "legislative_document" (
  "document_id",
  "official_number",
  "series_year",
  "type",
  "date_enacted",
  "sponsor_names",
  "author_names"
) VALUES
  -- Ordinances (15 total)
  (
    'a0000001-0001-4000-8000-000000000001',
    'Ordinance No. 2024-001',
    2024,
    'proposed_ordinance',
    '2024-01-30',
    ARRAY['Hon. Juan dela Cruz', 'Hon. Maria Santos'],
    ARRAY['Hon. Juan dela Cruz']
  ),
  (
    'a0000001-0001-4000-8000-000000000004',
    'Ordinance No. 2024-002',
    2024,
    'proposed_ordinance',
    '2024-02-28',
    ARRAY['Hon. Pedro Garcia'],
    ARRAY['Hon. Pedro Garcia']
  ),
  (
    'a0000001-0001-4000-8000-000000000005',
    'Ordinance No. 2024-003',
    2024,
    'proposed_ordinance',
    '2024-03-15',
    ARRAY['Hon. Ana Bautista', 'Hon. Jose Reyes'],
    ARRAY['Hon. Ana Bautista']
  ),
  (
    'a0000001-0001-4000-8000-000000000007',
    'Ordinance No. 2024-004',
    2024,
    'proposed_ordinance',
    '2024-03-30',
    ARRAY['Hon. Maria Santos'],
    ARRAY['Hon. Maria Santos', 'Hon. Juan dela Cruz']
  ),
  (
    'a0000001-0001-4000-8000-000000000011',
    'Ordinance No. 2024-005',
    2024,
    'proposed_ordinance',
    '2024-04-15',
    ARRAY['Hon. Jose Reyes'],
    ARRAY['Hon. Jose Reyes']
  ),
  (
    'a0000001-0001-4000-8000-000000000012',
    'Ordinance No. 2024-006',
    2024,
    'proposed_ordinance',
    '2024-04-30',
    ARRAY['Hon. Juan dela Cruz'],
    ARRAY['Hon. Juan dela Cruz']
  ),
  (
    'a0000001-0001-4000-8000-000000000015',
    'Ordinance No. 2024-007',
    2024,
    'proposed_ordinance',
    '2024-05-15',
    ARRAY['Hon. Pedro Garcia', 'Hon. Ana Bautista'],
    ARRAY['Hon. Pedro Garcia']
  ),
  (
    'a0000001-0001-4000-8000-000000000017',
    'Ordinance No. 2024-008',
    2024,
    'proposed_ordinance',
    '2024-05-30',
    ARRAY['Hon. Maria Santos'],
    ARRAY['Hon. Maria Santos']
  ),
  (
    'a0000001-0001-4000-8000-000000000018',
    'Ordinance No. 2024-009',
    2024,
    'proposed_ordinance',
    '2024-06-15',
    ARRAY['Hon. Jose Reyes', 'Hon. Juan dela Cruz'],
    ARRAY['Hon. Jose Reyes']
  ),
  (
    'a0000001-0001-4000-8000-000000000021',
    'Ordinance No. 2024-010',
    2024,
    'proposed_ordinance',
    '2024-06-30',
    ARRAY['Hon. Ana Bautista'],
    ARRAY['Hon. Ana Bautista']
  ),
  (
    'a0000001-0001-4000-8000-000000000022',
    'Ordinance No. 2024-011',
    2024,
    'proposed_ordinance',
    '2024-07-15',
    ARRAY['Hon. Pedro Garcia'],
    ARRAY['Hon. Pedro Garcia', 'Hon. Maria Santos']
  ),
  (
    'a0000001-0001-4000-8000-000000000024',
    'Ordinance No. 2024-012',
    2024,
    'proposed_ordinance',
    '2024-07-30',
    ARRAY['Hon. Juan dela Cruz', 'Hon. Jose Reyes'],
    ARRAY['Hon. Juan dela Cruz']
  ),
  (
    'a0000001-0001-4000-8000-000000000025',
    'Ordinance No. 2024-013',
    2024,
    'proposed_ordinance',
    '2024-08-15',
    ARRAY['Hon. Maria Santos'],
    ARRAY['Hon. Maria Santos']
  ),
  (
    'a0000001-0001-4000-8000-000000000027',
    'Ordinance No. 2024-014',
    2024,
    'proposed_ordinance',
    '2024-08-30',
    ARRAY['Hon. Ana Bautista', 'Hon. Pedro Garcia'],
    ARRAY['Hon. Ana Bautista']
  ),
  (
    'a0000001-0001-4000-8000-000000000028',
    'Ordinance No. 2024-015',
    2024,
    'proposed_ordinance',
    '2024-09-15',
    ARRAY['Hon. Jose Reyes'],
    ARRAY['Hon. Jose Reyes', 'Hon. Juan dela Cruz']
  ),

  -- Resolutions (10 total)
  (
    'a0000001-0001-4000-8000-000000000002',
    'Resolution No. 2024-001',
    2024,
    'proposed_resolution',
    '2024-02-15',
    ARRAY['Hon. Juan dela Cruz'],
    ARRAY['Hon. Juan dela Cruz']
  ),
  (
    'a0000001-0001-4000-8000-000000000003',
    'Resolution No. 2024-002',
    2024,
    'proposed_resolution',
    '2024-02-28',
    ARRAY['Hon. Maria Santos', 'Hon. Pedro Garcia'],
    ARRAY['Hon. Maria Santos']
  ),
  (
    'a0000001-0001-4000-8000-000000000006',
    'Resolution No. 2024-003',
    2024,
    'proposed_resolution',
    '2024-03-15',
    ARRAY['Hon. Ana Bautista'],
    ARRAY['Hon. Ana Bautista']
  ),
  (
    'a0000001-0001-4000-8000-000000000008',
    'Resolution No. 2024-004',
    2024,
    'proposed_resolution',
    '2024-03-30',
    ARRAY['Hon. Jose Reyes'],
    ARRAY['Hon. Jose Reyes', 'Hon. Pedro Garcia']
  ),
  (
    'a0000001-0001-4000-8000-000000000010',
    'Resolution No. 2024-005',
    2024,
    'proposed_resolution',
    '2024-04-15',
    ARRAY['Hon. Juan dela Cruz', 'Hon. Maria Santos'],
    ARRAY['Hon. Juan dela Cruz']
  ),
  (
    'a0000001-0001-4000-8000-000000000013',
    'Resolution No. 2024-006',
    2024,
    'proposed_resolution',
    '2024-04-30',
    ARRAY['Hon. Pedro Garcia'],
    ARRAY['Hon. Pedro Garcia']
  ),
  (
    'a0000001-0001-4000-8000-000000000016',
    'Resolution No. 2024-007',
    2024,
    'proposed_resolution',
    '2024-05-15',
    ARRAY['Hon. Ana Bautista', 'Hon. Jose Reyes'],
    ARRAY['Hon. Ana Bautista']
  ),
  (
    'a0000001-0001-4000-8000-000000000020',
    'Resolution No. 2024-008',
    2024,
    'proposed_resolution',
    '2024-06-15',
    ARRAY['Hon. Maria Santos'],
    ARRAY['Hon. Maria Santos']
  ),
  (
    'a0000001-0001-4000-8000-000000000023',
    'Resolution No. 2024-009',
    2024,
    'proposed_resolution',
    '2024-07-15',
    ARRAY['Hon. Juan dela Cruz'],
    ARRAY['Hon. Juan dela Cruz', 'Hon. Ana Bautista']
  ),
  (
    'a0000001-0001-4000-8000-000000000026',
    'Resolution No. 2024-010',
    2024,
    'proposed_resolution',
    '2024-08-15',
    ARRAY['Hon. Jose Reyes', 'Hon. Pedro Garcia'],
    ARRAY['Hon. Jose Reyes']
  ),

  -- Committee Reports (3 total)
  (
    'a0000001-0001-4000-8000-000000000009',
    'Committee Report No. 2024-001',
    2024,
    'committee_report',
    '2024-04-01',
    ARRAY['Hon. Pedro Garcia'],
    ARRAY['Hon. Pedro Garcia', 'Hon. Maria Santos']
  ),
  (
    'a0000001-0001-4000-8000-000000000014',
    'Committee Report No. 2024-002',
    2024,
    'committee_report',
    '2024-05-01',
    ARRAY['Hon. Ana Bautista', 'Hon. Juan dela Cruz'],
    ARRAY['Hon. Ana Bautista']
  ),
  (
    'a0000001-0001-4000-8000-000000000019',
    'Committee Report No. 2024-003',
    2024,
    'committee_report',
    '2024-06-01',
    ARRAY['Hon. Jose Reyes'],
    ARRAY['Hon. Jose Reyes']
  )
ON CONFLICT DO NOTHING;

-- ============================================================================
-- VERIFICATION QUERY (optional - run to check data)
-- ============================================================================
-- SELECT 
--   ld.id,
--   ld.official_number,
--   ld.type AS leg_type,
--   d.classification,
--   d.title,
--   ld.date_enacted
-- FROM legislative_document ld
-- JOIN document d ON ld.document_id = d.id
-- ORDER BY ld.date_enacted DESC;
