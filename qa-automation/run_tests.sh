#!/usr/bin/env sh
# macOS / Linux helper:  ./run_tests.sh          -> all ready tests
#                        ./run_tests.sh Smoke    -> only Smoke
export BASE_URL="${BASE_URL:-http://localhost:8080}"
if [ -n "$1" ]; then
  robot --outputdir results --exclude wip --include "$1" tests
else
  robot --outputdir results --exclude wip tests
fi
