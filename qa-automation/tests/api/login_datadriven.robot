*** Settings ***
Documentation     Data-driven login tests: each CSV row in data/login_cases.csv becomes one test case.
Library           DataDriver    file=../../data/login_cases.csv    encoding=utf-8
Resource          ../../resources/api_keywords.robot
Suite Setup       Create Gateway Session
Test Template     Login Should Return Status
Test Tags         API    Regression    US-02    wip

*** Test Cases ***
Login With ${email} Expect ${expected_status}    default@x.com    x    200

*** Keywords ***
Login Should Return Status
    [Arguments]    ${email}    ${password}    ${expected_status}
    ${body}=    Create Dictionary    email=${email}    password=${password}
    POST On Session    gw    /api/auth/login    json=${body}    expected_status=${expected_status}
