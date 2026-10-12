*** Settings ***
Documentation     API tests for order-service (US-05 cart & order, US-06 order history).
Resource          ../../resources/api_keywords.robot
Suite Setup       Create Gateway Session

*** Test Cases ***
# TODO (Pound): TC-ORD-001 .. TC-ORD-005 — see docs/TEST_SPEC.md
Placeholder Until Order API Is Ready
    [Tags]    wip
    Log    Write TC-ORD-001..005 here
