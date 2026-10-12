*** Variables ***
# Values come from environment variables when set (CI / Docker), otherwise the defaults below.
${BASE_URL}          %{BASE_URL=http://localhost:8080}
${HEADLESS}          %{HEADLESS=True}
${CHROME_BIN}        %{CHROME_BIN=}
${CHROMEDRIVER}      %{CHROMEDRIVER_PATH=}

# Seeded accounts (see docs/API_CONTRACT.md -> auth-service seed data)
${ADMIN_EMAIL}       %{ADMIN_EMAIL=admin@campusmart.local}
${ADMIN_PASSWORD}    %{ADMIN_PASSWORD=Admin@1234}
${DEMO_EMAIL}        %{DEMO_EMAIL=demo@campusmart.local}
${DEMO_PASSWORD}     %{DEMO_PASSWORD=Demo@1234}
