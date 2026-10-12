*** Settings ***
Documentation     End-to-end browser tests (SeleniumLibrary). Element ids come from docs/API_CONTRACT.md.
Resource          ../../resources/ui_keywords.robot
Test Teardown     Run Keywords    Run Keyword If Test Failed    Capture Page Screenshot    AND    Close Browser

*** Test Cases ***
TC-UI-HOME-001 Web App Loads
    [Tags]    UI    Smoke    US-07
    Open CampusMart    /login
    Title Should Be    CampusMart

TC-UI-LOGIN-001 Login Through UI Shows Products Page
    [Tags]    UI    Smoke    Positive    US-02    wip
    Open CampusMart    /login
    Login Through UI    ${DEMO_EMAIL}    ${DEMO_PASSWORD}
    Wait Until Location Contains    /products
    Wait Until Page Contains Element    id=product-list
    Element Should Contain    id=nav-user    Demo

# TODO (Pound): TC-UI-LOGIN-002, TC-UI-CART-001, TC-UI-LOGOUT-001 — see docs/TEST_SPEC.md
