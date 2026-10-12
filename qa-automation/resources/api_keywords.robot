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
