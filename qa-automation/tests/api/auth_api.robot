*** Settings ***
Documentation     API tests for auth-service (US-01 register, US-02 login).
...               Tag "wip" = feature not merged yet -> excluded in CI. Remove "wip" when the feature lands.
Resource          ../../resources/api_keywords.robot
Suite Setup       Create Gateway Session

*** Test Cases ***
TC-LOGIN-001 Login With Valid Credentials Returns Token
    [Tags]    API    Smoke    Positive    US-02    wip
    ${body}=    Create Dictionary    email=${DEMO_EMAIL}    password=${DEMO_PASSWORD}
    ${resp}=    POST On Session    gw    /api/auth/login    json=${body}    expected_status=200
    Dictionary Should Contain Key    ${resp.json()}    token
    Should Be Equal    ${resp.json()}[user][email]    ${DEMO_EMAIL}
    Dictionary Should Not Contain Key    ${resp.json()}[user]    password

TC-LOGIN-002 Login With Wrong Password Returns 401
    [Tags]    API    Negative    US-02    wip
    ${body}=    Create Dictionary    email=${DEMO_EMAIL}    password=wrong-password
    ${resp}=    POST On Session    gw    /api/auth/login    json=${body}    expected_status=401
    Dictionary Should Contain Key    ${resp.json()}    message

# TODO (Pound): TC-AUTH-001, TC-AUTH-002, TC-AUTH-003, TC-LOGIN-003, TC-SEC-001 — see docs/TEST_SPEC.md
