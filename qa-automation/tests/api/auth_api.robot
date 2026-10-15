*** Settings ***
Documentation     API tests for auth-service (US-01 register, US-02 login).
...               Tag "wip" = feature not merged yet -> excluded in CI. Remove "wip" when the feature lands.
Resource          ../../resources/api_keywords.robot
Suite Setup       Create Gateway Session

*** Test Cases ***
TC-AUTH-001 Register With Valid Data
    [Tags]    API    Positive    US-01
    ${email}=    Unique Email
    ${body}=    Create Dictionary    name=Test User    email=${email}    password=secret123
    ${resp}=    POST On Session    gw    /api/auth/register    json=${body}    expected_status=201
    Should Be Equal    ${resp.json()}[user][email]    ${email}
    Should Be Equal    ${resp.json()}[user][name]     Test User
    Should Be Equal    ${resp.json()}[user][role]     user
    Dictionary Should Contain Key      ${resp.json()}[user]    id
    Dictionary Should Not Contain Key  ${resp.json()}[user]    password

TC-AUTH-002 Register Duplicate Email
    [Tags]    API    Negative    US-01
    ${email}=    Unique Email
    ${body}=    Create Dictionary    name=First    email=${email}    password=secret123
    POST On Session    gw    /api/auth/register    json=${body}    expected_status=201
    # same email again
    ${body2}=    Create Dictionary    name=Second    email=${email}    password=secret123
    ${resp}=    POST On Session    gw    /api/auth/register    json=${body2}    expected_status=409
    Dictionary Should Contain Key    ${resp.json()}    message

TC-AUTH-003 Register With Invalid Input
    [Tags]    API    Negative    US-01
    # bad email + short password
    ${body}=    Create Dictionary    name=X    email=abc    password=123
    ${resp}=    POST On Session    gw    /api/auth/register    json=${body}    expected_status=400
    Dictionary Should Contain Key    ${resp.json()}    message

TC-LOGIN-001 Login With Valid Credentials Returns Token
    [Tags]    API    Smoke    Critical    Positive    US-02
    ${body}=    Create Dictionary    email=${DEMO_EMAIL}    password=${DEMO_PASSWORD}
    ${resp}=    POST On Session    gw    /api/auth/login    json=${body}    expected_status=200
    Dictionary Should Contain Key    ${resp.json()}    token
    Should Be Equal    ${resp.json()}[user][email]    ${DEMO_EMAIL}
    Dictionary Should Not Contain Key    ${resp.json()}[user]    password

TC-LOGIN-002 Login With Wrong Password Returns 401
    [Tags]    API    Negative    US-02
    ${body}=    Create Dictionary    email=${DEMO_EMAIL}    password=wrong-password
    ${resp}=    POST On Session    gw    /api/auth/login    json=${body}    expected_status=401
    Dictionary Should Contain Key    ${resp.json()}    message

TC-LOGIN-003 Protected Endpoint Without Token Returns 401
    [Tags]    API    Security    US-02
    # no auth header at all
    ${resp}=    GET On Session    gw    /api/auth/me    expected_status=401
    Dictionary Should Contain Key    ${resp.json()}    message
    # with a bogus token
    ${headers}=    Create Dictionary    Authorization=Bearer abc.def.ghi
    ${resp2}=    GET On Session    gw    /api/auth/me    headers=${headers}    expected_status=401
    Dictionary Should Contain Key    ${resp2.json()}    message

TC-SEC-001 NoSQL Injection On Login Is Rejected
    [Tags]    API    Security    US-02
    # try the classic NoSQL injection payload -> must NOT return 200 (expect 400)
    ${evil_email}=    Evaluate    {"$ne": None}
    ${evil_pass}=     Evaluate    {"$ne": None}
    ${body}=    Create Dictionary    email=${evil_email}    password=${evil_pass}
    ${resp}=    POST On Session    gw    /api/auth/login    json=${body}    expected_status=any
    Should Not Be Equal As Integers    ${resp.status_code}    200
    Should Be Equal As Integers        ${resp.status_code}    400
