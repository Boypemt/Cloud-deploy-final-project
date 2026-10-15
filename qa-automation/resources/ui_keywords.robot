*** Settings ***
Documentation     Reusable keywords for browser (E2E) tests with SeleniumLibrary.
Library           SeleniumLibrary    timeout=10s
Resource          variables.robot

*** Keywords ***
Open CampusMart
    [Documentation]    Opens Chrome (headless in CI, incognito so no "save password" pop-up) at BASE_URL + path.
    [Arguments]    ${path}=/
    ${options}=    Evaluate    selenium.webdriver.ChromeOptions()    modules=selenium.webdriver
    IF    ${HEADLESS}
        Call Method    ${options}    add_argument    --headless\=new
    END
    Call Method    ${options}    add_argument    --no-sandbox
    Call Method    ${options}    add_argument    --disable-dev-shm-usage
    Call Method    ${options}    add_argument    --incognito
    Call Method    ${options}    add_argument    --window-size\=1280,900
    IF    $CHROME_BIN
        Evaluate    setattr($options, 'binary_location', $CHROME_BIN)
    END
    IF    $CHROMEDRIVER
        Open Browser    ${BASE_URL}${path}    chrome    options=${options}    service=executable_path='${CHROMEDRIVER}'
    ELSE
        Open Browser    ${BASE_URL}${path}    chrome    options=${options}
    END

Login Through UI
    [Arguments]    ${email}    ${password}
    Go To    ${BASE_URL}/login
    Input Text        id=login-email       ${email}
    Input Password    id=login-password    ${password}
    Click Button      id=login-submit

Login Through UI And Wait For Products
    [Documentation]    Logs in and waits until the product list of /products is really there.
    [Arguments]    ${email}    ${password}
    Login Through UI    ${email}    ${password}
    Wait Until Location Contains      /products       timeout=10s
    Wait Until Element Is Visible     id=product-list    timeout=10s

Product Card By Name
    [Documentation]    Locator of the .product-card whose .product-name is exactly ${name}.
    [Arguments]    ${name}
    RETURN    xpath=//*[contains(@class,'product-card')][.//*[contains(@class,'product-name')][normalize-space(.)='${name}']]

Scroll Into Middle Of View
    [Documentation]    The app uses "scroll-behavior: smooth", so a normal scrollIntoView animates and
    ...                Selenium clicks the old position. Scroll instantly instead, then wait until the
    ...                page really stopped moving.
    [Arguments]    ${locator}
    ${element}=    Get WebElement    ${locator}
    Execute JavaScript    arguments[0].scrollIntoView({block: 'center', behavior: 'instant'})    ARGUMENTS    ${element}
    Wait Until Keyword Succeeds    5s    200ms    Scroll Position Should Be Settled

Scroll Position Should Be Settled
    ${first}=     Execute JavaScript    return window.scrollY
    ${second}=    Execute JavaScript    return window.scrollY
    Should Be Equal As Numbers    ${first}    ${second}    Page is still scrolling

Click Element When Still
    [Documentation]    Clicks ${locator} after bringing it into view. Cards lift up on hover (CSS
    ...                transform, 0.25s), so the very first click can miss — retry until it lands.
    [Arguments]    ${locator}
    Wait Until Element Is Visible    ${locator}    timeout=10s
    Scroll Into Middle Of View       ${locator}
    Wait Until Keyword Succeeds    10s    250ms    Click Element    ${locator}

Add Product To Cart
    [Documentation]    Clicks .add-to-cart on the card of ${name} and waits until the navbar counts it.
    [Arguments]    ${name}    ${expected_count}=1
    ${card}=      Product Card By Name    ${name}
    Click Element When Still    ${card}//*[contains(@class,'add-to-cart')]
    Wait Until Element Contains    id=nav-cart-count    ${expected_count}    timeout=10s

Wait Until Cart Discount Is Not Zero
    [Documentation]    The cart totals come from POST /api/orders/quote, so they arrive a moment after
    ...                #apply-discount is clicked. Until then #cart-discount shows "-" or 0.00.
    Wait Until Keyword Succeeds    10s    200ms    Cart Discount Should Not Be Zero

Cart Discount Should Not Be Zero
    ${discount}=    Get Text    id=cart-discount
    Should Match Regexp    ${discount}    [1-9]    Discount cell still shows "${discount}"
