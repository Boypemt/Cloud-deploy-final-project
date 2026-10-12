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
