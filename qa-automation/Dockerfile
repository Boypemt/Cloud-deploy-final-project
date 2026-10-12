# Test-runner image: runs the whole Robot Framework suite against any CampusMart deployment.
#   docker run --rm -e BASE_URL=http://host.docker.internal:8080 -v %cd%/results:/qa/results <image>
FROM python:3.12-slim
RUN apt-get update \
 && apt-get install -y --no-install-recommends chromium chromium-driver \
 && rm -rf /var/lib/apt/lists/*
WORKDIR /qa
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY resources ./resources
COPY tests ./tests
COPY data ./data
ARG APP_VERSION=dev
ENV APP_VERSION=$APP_VERSION \
    BASE_URL=http://web-frontend \
    HEADLESS=True \
    CHROME_BIN=/usr/bin/chromium \
    CHROMEDRIVER_PATH=/usr/bin/chromedriver
ENTRYPOINT ["robot", "--outputdir", "/qa/results", "--exclude", "wip"]
CMD ["tests"]
