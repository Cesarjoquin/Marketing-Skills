#!/bin/bash

# Validation script using official skills-ref library
# https://github.com/agentskills/agentskills/tree/main/skills-ref

SKILLS_DIR="skills"
SKILLS_REF_DIR="/tmp/agentskills/skills-ref"
ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "🔍 Validating Skills Using Official skills-ref Library"
echo "========================================================"
echo "Reference: https://github.com/agentskills/agentskills"
echo ""

# Check if skills-ref is already installed
if [ ! -d "$SKILLS_REF_DIR/.venv" ]; then
    echo "📦 Installing skills-ref library..."
    echo ""

    if [ ! -d "$SKILLS_REF_DIR" ]; then
        cd /tmp
        git clone https://github.com/agentskills/agentskills.git
    fi

    cd "$SKILLS_REF_DIR"

    if command -v uv &> /dev/null; then
        echo "Using uv to install..."
        uv sync
    else
        echo "Using pip to install..."
        python3 -m venv .venv
        source .venv/bin/activate
        pip install -e .
    fi
    echo ""
fi

# Activate the virtual environment
source "$SKILLS_REF_DIR/.venv/bin/activate"

# Return to the repository root
cd "$ROOT"

# Track results
PASSED=0
FAILED=0
FAILED_SKILLS=()

echo "Running validation..."
echo ""

# Validate each skill
for skill_dir in "$SKILLS_DIR"/*/; do
    skill_name=$(basename "$skill_dir")
    printf "  %-30s" "$skill_name"

    output=$(skills-ref validate "$skill_dir" 2>&1)
    if echo "$output" | grep -q "Valid skill"; then
        echo "✓"
        ((PASSED++))
    else
        echo "✗"
        ((FAILED++))
        FAILED_SKILLS+=("$skill_name")
        echo "$output" | sed 's/^/    /'
    fi
done

echo ""
echo "========================================================"
echo "Summary:"
echo "  ✓ Passed: $PASSED"
echo "  ✗ Failed: $FAILED"
echo ""

if [ $FAILED -eq 0 ]; then
    echo "✅ All skills are valid!"
    exit 0
else
    echo "❌ Failed skills:"
    for skill in "${FAILED_SKILLS[@]}"; do
        echo "  - $skill"
    done
    exit 1
fi
