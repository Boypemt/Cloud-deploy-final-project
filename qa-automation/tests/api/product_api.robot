*** Settings ***
Documentation     API tests for product-service (US-03 browse, US-04 admin manage).
Resource          ../../resources/api_keywords.robot
Suite Setup       Setup Product Suite

*** Keywords ***
Setup Product Suite
    Create Gateway Session
    ${token}=    Login And Get Token    ${ADMIN_EMAIL}    ${ADMIN_PASSWORD}
    ${headers}=    Auth Headers    ${token}
    Set Suite Variable    ${ADMIN_HEADERS}    ${headers}
    # regular user token for the 403 test
    ${utoken}=    Login And Get Token    ${DEMO_EMAIL}    ${DEMO_PASSWORD}
    ${uheaders}=    Auth Headers    ${utoken}
    Set Suite Variable    ${USER_HEADERS}    ${uheaders}

*** Test Cases ***
TC-PROD-001 List Products Returns Seed Data
    [Tags]    API    Smoke    Positive    US-03
    ${resp}=    GET On Session    gw    /api/products    expected_status=200
    ${total}=    Set Variable    ${resp.json()}[total]
    Should Be True    ${total} >= 8    Expected at least 8 seeded products, got ${total}
    # check a known product name exists in the list
    ${names}=    Evaluate    [p['name'] for p in $resp.json()['items']]
    Should Contain    ${names}    CMU Notebook A5

TC-PROD-002 Search Filters By Name
    [Tags]    API    Positive    US-03
    ${resp}=    GET On Session    gw    /api/products    params=search=notebook    expected_status=200
    Should Be True    ${resp.json()}[total] >= 1
    FOR    ${item}    IN    @{resp.json()}[items]
        ${lower}=    Evaluate    $item['name'].lower()
        Should Contain    ${lower}    notebook
    END

TC-PROD-003 Unknown Product Id Returns 404
    [Tags]    API    Negative    US-03
    ${resp}=    GET On Session    gw    /api/products/000000000000000000000000    expected_status=404
    Dictionary Should Contain Key    ${resp.json()}    message

TC-PROD-004 Normal User Cannot Create Product
    [Tags]    API    Security    US-04
    ${body}=    Create Dictionary    name=Hack Product    price=${99}    stock=${10}    category=other
    ${resp}=    POST On Session    gw    /api/products    json=${body}    headers=${USER_HEADERS}    expected_status=403
    Dictionary Should Contain Key    ${resp.json()}    message

TC-PROD-005 Admin Creates And Deletes Product
    [Tags]    API    Positive    US-04
    ${body}=    Create Dictionary    name=Test Robot Product    price=${15}    stock=${5}    category=stationery    description=created by robot test
    ${resp}=    POST On Session    gw    /api/products    json=${body}    headers=${ADMIN_HEADERS}    expected_status=201
    Should Be Equal    ${resp.json()}[name]    Test Robot Product
    ${product_id}=    Set Variable    ${resp.json()}[id]
    # cleanup: delete it
    ${del}=    DELETE On Session    gw    /api/products/${product_id}    headers=${ADMIN_HEADERS}    expected_status=200
    # confirm gone
    GET On Session    gw    /api/products/${product_id}    expected_status=404
