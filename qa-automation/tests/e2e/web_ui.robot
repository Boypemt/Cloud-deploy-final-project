*** Settings ***
Documentation     End-to-end browser tests (SeleniumLibrary). Element ids come from docs/API_CONTRACT.md.
...               Every test opens its own incognito Chrome, so localStorage (token + cart) starts empty
...               and the tests can run in any order, as often as we like.
Resource          ../../resources/ui_keywords.robot
Resource          ../../resources/api_keywords.robot
Suite Setup       Create Gateway Session
Test Teardown     Run Keywords    Run Keyword If Test Failed    Capture Page Screenshot    AND    Close Browser

*** Test Cases ***
TC-UI-HOME-001 Web App Loads
    [Tags]    UI    Smoke    US-07
    Open CampusMart    /login
    Title Should Be    CampusMart

TC-UI-LOGIN-001 Login Through UI Shows Products Page
    [Tags]    UI    Smoke    Critical    Positive    US-02
    Open CampusMart    /login
    Login Through UI And Wait For Products    ${DEMO_EMAIL}    ${DEMO_PASSWORD}
    Location Should Contain    /products
    Element Should Be Visible    id=product-list
    Wait Until Element Contains    id=nav-user    Demo    timeout=10s

TC-UI-LOGIN-002 Wrong Password Shows Error
    [Tags]    UI    Negative    US-02
    Open CampusMart    /login
    Login Through UI    ${DEMO_EMAIL}    wrong-password
    Wait Until Element Is Visible    id=login-error    timeout=10s
    Location Should Contain    /login

TC-UI-CART-001 Add To Cart And Checkout
    [Tags]    UI    Critical    Positive    US-05
    Open CampusMart    /login
    Login Through UI And Wait For Products    ${DEMO_EMAIL}    ${DEMO_PASSWORD}
    # add one "Blue Gel Pen (3-pack)" (35) to the cart
    Add Product To Cart    Blue Gel Pen (3-pack)
    # go to the cart and apply WELCOME10 (10% off -> discount 3.50)
    Go To    ${BASE_URL}/cart
    Wait Until Element Is Visible    id=cart-items    timeout=10s
    Wait Until Element Is Visible    css=#cart-items .cart-item    timeout=10s
    Input Text    id=discount-code    WELCOME10
    Click Element When Still    id=apply-discount
    Wait Until Cart Discount Is Not Zero
    # checkout
    Wait Until Element Is Enabled    id=checkout-button    timeout=10s
    Click Element When Still    id=checkout-button
    Wait Until Element Is Visible    id=order-success    timeout=15s
    # the new order must show up in the order history
    Go To    ${BASE_URL}/orders
    Wait Until Element Is Visible    id=order-list    timeout=10s
    Wait Until Element Is Visible    css=#order-list .order-row    timeout=10s
    ${order_id}=    Get Element Attribute    css=#order-list .order-row    data-order-id
    Should Not Be Empty    ${order_id}
    # clean up through the API so the pen stock is the same as before the test
    ${token}=      Login And Get Token    ${DEMO_EMAIL}    ${DEMO_PASSWORD}
    ${headers}=    Auth Headers    ${token}
    ${cancelled}=    Cancel Order    ${order_id}    ${headers}
    Should Be Equal    ${cancelled}[status]    CANCELLED

TC-UI-LOGOUT-001 Logout Redirects To Login
    [Tags]    UI    Positive    US-02
    Open CampusMart    /login
    Login Through UI And Wait For Products    ${DEMO_EMAIL}    ${DEMO_PASSWORD}
    Click Button    id=nav-logout
    Wait Until Location Contains    /login    timeout=10s
    # trying to go to products should bounce back to login
    Go To    ${BASE_URL}/products
    Wait Until Location Contains    /login    timeout=10s
    Element Should Be Visible    id=login-submit
