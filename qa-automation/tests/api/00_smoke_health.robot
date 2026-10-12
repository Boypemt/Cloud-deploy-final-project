*** Settings ***
Documentation     Smoke tests — is every service up behind the gateway?
...               Runs on every push (CI) and after every release (post-deployment verification).
Resource          ../../resources/api_keywords.robot
Suite Setup       Create Gateway Session

*** Test Cases ***
TC-HEALTH-001 Gateway Is Up
    [Tags]    Smoke    API    US-07
    ${resp}=    GET On Session    gw    /health    expected_status=200
    Should Be Equal    ${resp.json()}[status]    ok

TC-HEALTH-002 Auth Service Is Healthy
    [Tags]    Smoke    API    US-07
    ${resp}=    GET On Session    gw    /health/auth    expected_status=200
    Should Be Equal    ${resp.json()}[service]    auth-service
    Should Be Equal    ${resp.json()}[db]         up

TC-HEALTH-003 Product Service Is Healthy
    [Tags]    Smoke    API    US-07
    ${resp}=    GET On Session    gw    /health/product    expected_status=200
    Should Be Equal    ${resp.json()}[service]    product-service
    Should Be Equal    ${resp.json()}[db]         up

TC-HEALTH-004 Order Service Is Healthy
    [Tags]    Smoke    API    US-07
    ${resp}=    GET On Session    gw    /health/order    expected_status=200
    Should Be Equal    ${resp.json()}[service]    order-service
    Should Be Equal    ${resp.json()}[db]         up
