*** Settings ***
Documentation     End-to-end browser tests (SeleniumLibrary). Element ids come from docs/API_CONTRACT.md.
Resource          ../../resources/ui_keywords.robot
Resource          ../../resources/api_keywords.robot
Test Teardown     Run Keywords    Run Keyword If Test Failed    Capture Page Screenshot    AND    Close Browser

*** Test Cases ***
TC-UI-HOME-001 Web App Loads
    [Tags]    UI    Smoke    US-07
    Open CampusMart    /login
    Title Should Be    CampusMart

TC-UI-LOGIN-001 Login Through UI Shows Products Page
    [Tags]    UI    Smoke    Critical    Positive    US-02    wip
    Open CampusMart    /login
    Login Through UI    ${DEMO_EMAIL}    ${DEMO_PASSWORD}
    Wait Until Location Contains    /products    timeout=8s
    Wait Until Page Contains Element    id=product-list    timeout=8s
    Element Should Contain    id=nav-user    Demo

TC-UI-LOGIN-002 Wrong Password Shows Error
    [Tags]    UI    Negative    US-02    wip
    Open CampusMart    /login
    Login Through UI    ${DEMO_EMAIL}    wrong-password
    Wait Until Page Contains Element    id=login-error    timeout=5s
    Location Should Contain    /login

TC-UI-CART-001 Add To Cart And Checkout
    [Tags]    UI    Critical    Positive    US-05    wip
    Open CampusMart    /login
    Login Through UI    ${DEMO_EMAIL}    ${DEMO_PASSWORD}
    Wait Until Location Contains    /products    timeout=8s
    Wait Until Page Contains Element    id=product-list    timeout=8s
    # find a product card and click its add-to-cart button
    Wait Until Page Contains Element    css=.product-card .add-to-cart    timeout=8s
    Click Element    css=.product-card .add-to-cart
    # go to cart
    Go To    ${BASE_URL}/cart
    Wait Until Page Contains Element    id=cart-items    timeout=5s
    # apply discount code
    Input Text    id=discount-code    WELCOME10
    Click Button    id=apply-discount
    Wait Until Page Contains Element    id=cart-total    timeout=3s
    # checkout
    Click Button    id=checkout-button
    Wait Until Page Contains Element    id=order-success    timeout=8s
    # verify order shows in order history
    Go To    ${BASE_URL}/orders
    Wait Until Page Contains Element    id=order-list    timeout=5s

TC-UI-LOGOUT-001 Logout Redirects To Login
    [Tags]    UI    Positive    US-02    wip
    Open CampusMart    /login
    Login Through UI    ${DEMO_EMAIL}    ${DEMO_PASSWORD}
    Wait Until Location Contains    /products    timeout=8s
    Click Element    id=nav-logout
    Wait Until Location Contains    /login    timeout=5s
    # trying to go to products should bounce back to login
    Go To    ${BASE_URL}/products
    Wait Until Location Contains    /login    timeout=5s
