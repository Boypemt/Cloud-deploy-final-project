*** Settings ***
Documentation     API tests for order-service (US-05 cart & order, US-06 order history).
Resource          ../../resources/api_keywords.robot
Suite Setup       Setup Order Suite

*** Keywords ***
Setup Order Suite
    Create Gateway Session
    # get a demo user token
    ${token}=    Login And Get Token    ${DEMO_EMAIL}    ${DEMO_PASSWORD}
    Set Suite Variable    ${DEMO_TOKEN}    ${token}
    ${headers}=    Auth Headers    ${token}
    Set Suite Variable    ${DEMO_HEADERS}    ${headers}

Find Product Id By Name
    [Arguments]    ${name}
    [Documentation]    Search product by name and return the first matching id.
    ${resp}=    GET On Session    gw    /api/products    params=search=${name}    expected_status=200
    Should Be True    len($resp.json()['items']) >= 1    Product "${name}" not found in seed data
    RETURN    ${resp.json()}[items][0][id]

Get Product Stock
    [Arguments]    ${product_id}
    ${resp}=    GET On Session    gw    /api/products/${product_id}    expected_status=200
    RETURN    ${resp.json()}[stock]

*** Test Cases ***
TC-ORD-001 Order With WELCOME10 Discount
    [Tags]    API    Critical    Positive    US-05    wip
    # find a known product
    ${notebook_id}=    Find Product Id By Name    CMU Notebook A5
    ${stock_before}=    Get Product Stock    ${notebook_id}
    # place order: 2 x notebook (price 45), WELCOME10 = 10% off
    ${item}=    Create Dictionary    productId=${notebook_id}    quantity=${2}
    ${items}=    Create List    ${item}
    ${body}=    Create Dictionary    items=${items}    discountCode=WELCOME10
    ${resp}=    POST On Session    gw    /api/orders    json=${body}    headers=${DEMO_HEADERS}    expected_status=201
    # verify pricing
    Should Be Equal As Numbers    ${resp.json()}[subtotal]    90
    Should Be Equal As Numbers    ${resp.json()}[discount]    9
    Should Be Equal As Numbers    ${resp.json()}[total]       81
    Should Be Equal    ${resp.json()}[status]    PLACED
    # verify stock went down
    ${stock_after}=    Get Product Stock    ${notebook_id}
    Should Be Equal As Integers    ${stock_after}    ${${stock_before} - 2}
    # save order id for cancel test
    Set Suite Variable    ${ORDER_ID_FOR_CANCEL}    ${resp.json()}[id]
    Set Suite Variable    ${NOTEBOOK_ID}            ${notebook_id}

TC-ORD-002 Invalid Discount Code
    [Tags]    API    Negative    US-05    wip
    ${notebook_id}=    Find Product Id By Name    CMU Notebook A5
    ${item}=    Create Dictionary    productId=${notebook_id}    quantity=${1}
    ${items}=    Create List    ${item}
    ${body}=    Create Dictionary    items=${items}    discountCode=FAKE
    ${resp}=    POST On Session    gw    /api/orders    json=${body}    headers=${DEMO_HEADERS}    expected_status=400
    Should Contain    ${resp.json()}[message]    Invalid discount code

TC-ORD-003 Insufficient Stock Returns 409
    [Tags]    API    Negative    US-05    wip
    ${mug_id}=    Find Product Id By Name    Limited Edition Mug
    ${item}=    Create Dictionary    productId=${mug_id}    quantity=${5}
    ${items}=    Create List    ${item}
    ${body}=    Create Dictionary    items=${items}
    ${resp}=    POST On Session    gw    /api/orders    json=${body}    headers=${DEMO_HEADERS}    expected_status=409
    Dictionary Should Contain Key    ${resp.json()}    message

TC-ORD-004 Cancel Order Restores Stock
    [Tags]    API    Positive    US-06    wip
    ${stock_before}=    Get Product Stock    ${NOTEBOOK_ID}
    ${resp}=    PATCH On Session    gw    /api/orders/${ORDER_ID_FOR_CANCEL}/cancel    headers=${DEMO_HEADERS}    expected_status=200
    Should Be Equal    ${resp.json()}[status]    CANCELLED
    # stock should go back up by 2
    ${stock_after}=    Get Product Stock    ${NOTEBOOK_ID}
    Should Be Equal As Integers    ${stock_after}    ${${stock_before} + 2}

TC-ORD-005 Cannot Read Another Users Order
    [Tags]    API    Security    US-06    wip
    # register a brand new user
    ${email}=    Unique Email
    ${reg_body}=    Create Dictionary    name=Other Guy    email=${email}    password=secret123
    POST On Session    gw    /api/auth/register    json=${reg_body}    expected_status=201
    ${other_token}=    Login And Get Token    ${email}    secret123
    ${other_headers}=    Auth Headers    ${other_token}
    # first create an order as demo user so we have a valid order id
    ${notebook_id}=    Find Product Id By Name    CMU Notebook A5
    ${item}=    Create Dictionary    productId=${notebook_id}    quantity=${1}
    ${items}=    Create List    ${item}
    ${body}=    Create Dictionary    items=${items}
    ${order_resp}=    POST On Session    gw    /api/orders    json=${body}    headers=${DEMO_HEADERS}    expected_status=201
    ${order_id}=    Set Variable    ${order_resp.json()}[id]
    # try to read demo's order as the other user -> 404
    GET On Session    gw    /api/orders/${order_id}    headers=${other_headers}    expected_status=404
