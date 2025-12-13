# Implementation Plan — <Feature Name>

## 1 Overview

- **Problem**: <what pain this solves>
- **Context**: <where it fits: Public Portal vs IMS module>
- **Success looks like**: <observable outcomes>

## 2 Goals (source of truth)

List the goals that justify every requirement and edge case below.

- **G1**: <goal>
- **G2**: <goal>
- **G3**: <goal>

## 3 Non-goals

- <explicitly out of scope>

## 4 Users, roles, and permissions

- **Primary users**: <role(s)>
- **Secondary users**: <role(s)>
- **Access rules**:
  - <rule>

## 5 Requirements (strict; each backed by goals)

Create requirements that can be implemented and verified. Every item must cite one or more Goals.

### Functional requirements

- **FR-XX**: <requirement statement>
  - **Backed by**: G1, G2
  - **Acceptance criteria (EARS)**:
    - WHEN <event> THEN <system> SHALL <response>
    - IF <condition> THEN <system> SHALL <response>

### Non-functional requirements

- **NFR-XX**: <requirement statement>
  - **Backed by**: G1
  - **Acceptance criteria (EARS)**:
    - WHILE <state> THEN <system> SHALL <invariant>

### Constraints

- **CON-XX**: <constraint statement>
  - **Backed by**: G1

## 6 Edge cases (each backed by goals)

List edge cases that the implementation must handle; each must cite one or more Goals.

- **EC-1**: <edge case>
  - **Backed by**: G2
  - **Expected behavior**: <what happens>

## 7 Data model and interfaces (minimal)

- **Entities**: <tables/collections>
- **Key fields**: <ids, timestamps, status enums>
- **APIs / routes**: <route list>
- **UI surfaces**: <pages/components>

## 8 Milestones (incremental, wired)

Each milestone should produce integrated, usable increments.

- **M1**: <small vertical slice>
- **M2**: <extend/complete>
- **M3**: <polish + hardening>

## 9 Risks and mitigations

- **R1**: <risk>
  - **Mitigation**: <what to do>

## 10 Open questions

- <what must be clarified before implementation>
