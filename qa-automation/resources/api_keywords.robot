*** Settings ***
Documentation     Reusable keywords for API tests (RequestsLibrary). All calls go through the nginx gateway.
Library           RequestsLibrary
Library           Collections
Resource          variables.robot

*** Keywords ***
Create Gateway Session
    [Documentation]    One HTTP session named "gw" pointing at the gateway.
    Create Session    gw    ${BASE_URL}    verify=${False}

Login And Get Token
    [Arguments]    ${email}    ${password}
    ${body}=    Create Dictionary    email=${email}    password=${password}
    ${resp}=    POST On Session    gw    /api/auth/login    json=${body}    expected_status=200
    RETURN    ${resp.json()}[token]

Auth Headers
    [Arguments]    ${token}
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}
    RETURN    ${headers}

Unique Email
    [Documentation]    Returns a new email every run so register tests never collide.
    ${ts}=    Evaluate    int(__import__('time').time() * 1000)
    RETURN    qa_${ts}@campusmart.local

Cancel Order
    [Arguments]    ${order_id}    ${headers}    ${expected_status}=200
    [Documentation]    Cancels an order so a test puts the stock back and leaves the data as it found it.
    ...                Returns the cancelled order. Used by the API tests and by the UI checkout test.
    ${resp}=    PATCH On Session    gw    /api/orders/${order_id}/cancel    headers=${headers}    expected_status=${expected_status}
    RETURN    ${resp.json()}
