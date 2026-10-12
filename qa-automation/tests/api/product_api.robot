*** Settings ***
Documentation     API tests for product-service (US-03 browse, US-04 admin manage).
Resource          ../../resources/api_keywords.robot
Suite Setup       Create Gateway Session

*** Test Cases ***
# TODO (Pound): TC-PROD-001 .. TC-PROD-005 — see docs/TEST_SPEC.md
Placeholder Until Product API Is Ready
    [Tags]    wip
    Log    Write TC-PROD-001..005 here
