*** Settings ***
Documentation     API tests for order-service (US-05 cart & order, US-06 order history).
...               Every test places the orders it needs itself and cancels them again, so the
...               tests are independent and the suite can run twice in a row with the same result.
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

Place Order
    [Arguments]    ${product_id}    ${quantity}    ${discount_code}=${NONE}    ${expected_status}=201
    [Documentation]    POST /api/orders as the demo user with one order line.
    ...                discountCode is left out of the body when no code is given (${NONE}); pass
    ...                ${EMPTY} to send a blank code on purpose. Returns the response.
    ${item}=     Create Dictionary    productId=${product_id}    quantity=${quantity}
    ${items}=    Create List    ${item}
    IF    $discount_code is None
        ${body}=    Create Dictionary    items=${items}
    ELSE
        ${body}=    Create Dictionary    items=${items}    discountCode=${discount_code}
    END
    ${resp}=    POST On Session    gw    /api/orders    json=${body}    headers=${DEMO_HEADERS}    expected_status=${expected_status}
    RETURN    ${resp}

*** Test Cases ***
TC-ORD-001 Order With WELCOME10 Discount
    [Tags]    API    Critical    Positive    US-05
    # find a known product
    ${notebook_id}=    Find Product Id By Name    CMU Notebook A5
    ${stock_before}=    Get Product Stock    ${notebook_id}
    # place order: 2 x notebook (price 45), WELCOME10 = 10% off
    ${resp}=    Place Order    ${notebook_id}    ${2}    WELCOME10
    # verify pricing
    Should Be Equal As Numbers    ${resp.json()}[subtotal]    90
    Should Be Equal As Numbers    ${resp.json()}[discount]    9
    Should Be Equal As Numbers    ${resp.json()}[total]       81
    Should Be Equal    ${resp.json()}[status]    PLACED
    # verify stock went down
    ${stock_after}=    Get Product Stock    ${notebook_id}
    Should Be Equal As Integers    ${stock_after}    ${${stock_before} - 2}
    # clean up: cancel the order so the stock is back where it started
    Cancel Order    ${resp.json()}[id]    ${DEMO_HEADERS}

TC-ORD-002 Invalid Discount Code
    [Tags]    API    Negative    US-05
    ${notebook_id}=    Find Product Id By Name    CMU Notebook A5
    ${resp}=    Place Order    ${notebook_id}    ${1}    FAKE    expected_status=400
    Should Contain    ${resp.json()}[message]    Invalid discount code

TC-ORD-003 Insufficient Stock Returns 409
    [Tags]    API    Negative    US-05
    ${mug_id}=    Find Product Id By Name    Limited Edition Mug
    ${resp}=    Place Order    ${mug_id}    ${5}    expected_status=409
    Dictionary Should Contain Key    ${resp.json()}    message

TC-ORD-004 Cancel Order Restores Stock
    [Tags]    API    Positive    US-06
    # this test places its own order, so it does not depend on TC-ORD-001
    ${notebook_id}=    Find Product Id By Name    CMU Notebook A5
    ${order}=    Place Order    ${notebook_id}    ${2}
    ${stock_before}=    Get Product Stock    ${notebook_id}
    ${cancelled}=    Cancel Order    ${order.json()}[id]    ${DEMO_HEADERS}
    Should Be Equal    ${cancelled}[status]    CANCELLED
    # stock should go back up by 2
    ${stock_after}=    Get Product Stock    ${notebook_id}
    Should Be Equal As Integers    ${stock_after}    ${${stock_before} + 2}

TC-ORD-005 Cannot Read Another Users Order
    [Tags]    API    Security    US-06
    # register a brand new user
    ${email}=    Unique Email
    ${reg_body}=    Create Dictionary    name=Other Guy    email=${email}    password=secret123
    POST On Session    gw    /api/auth/register    json=${reg_body}    expected_status=201
    ${other_token}=    Login And Get Token    ${email}    secret123
    ${other_headers}=    Auth Headers    ${other_token}
    # first create an order as demo user so we have a valid order id
    ${notebook_id}=    Find Product Id By Name    CMU Notebook A5
    ${order}=    Place Order    ${notebook_id}    ${1}
    ${order_id}=    Set Variable    ${order.json()}[id]
    # try to read demo's order as the other user -> 404
    GET On Session    gw    /api/orders/${order_id}    headers=${other_headers}    expected_status=404
    # clean up: cancel the order so the stock is back where it started
    Cancel Order    ${order_id}    ${DEMO_HEADERS}

TC-ORD-006 Blank Discount Code Means No Discount
    [Tags]    API    Positive    Regression    US-05
    [Documentation]    A blank discountCode must be treated as "no code", not as an invalid one.
    ${pen_id}=    Find Product Id By Name    Blue Gel Pen (3-pack)
    ${resp}=    Place Order    ${pen_id}    ${1}    ${EMPTY}
    Should Be Equal As Numbers    ${resp.json()}[discount]    0
    Should Be Equal    ${resp.json()}[discountCode]    ${NONE}
    Should Be Equal As Numbers    ${resp.json()}[total]    ${resp.json()}[subtotal]
    # clean up: cancel the order so the stock is back where it started
    Cancel Order    ${resp.json()}[id]    ${DEMO_HEADERS}
