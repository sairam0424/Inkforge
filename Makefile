# =============================================================================
# Inkforge — AI Article Generation Monorepo
# =============================================================================
# Usage: make <target> [VAR=value ...]
# Run "make" or "make help" to see all available targets.
# =============================================================================

.DEFAULT_GOAL := help

# Load .env silently (no error if absent), then export every var to recipe shells.
# This means the CLI picks up DEVTO_API_KEY, ANTHROPIC_API_KEY, etc. automatically
# without needing "dotenv -e .env" prefixed on every command.
-include .env
export

# -----------------------------------------------------------------------------
# Configuration
# -----------------------------------------------------------------------------
CLI_BIN  := node packages/cli/dist/index.js
PNPM     := pnpm

# Article generation defaults — override on CLI: make generate TONE=senior
TONE     ?= intermediate
FORMAT   ?= explainer
LENGTH   ?= medium
CATEGORY ?= general
TAGS     ?=

# Required env vars checked by env-check
REQUIRED_VARS := LLM_PROVIDER BEDROCK_ACCESS_KEY_ID BEDROCK_SECRET_ACCESS_KEY \
                 BEDROCK_REGION INKFORGE_CONTENT_DIR INKFORGE_CANONICAL_BASE \
                 DEVTO_API_KEY HASHNODE_API_KEY

# ANSI color codes (empty-safe — no-op if terminal doesn't support them)
RED    := \033[0;31m
GREEN  := \033[0;32m
YELLOW := \033[0;33m
CYAN   := \033[0;36m
BOLD   := \033[1m
RESET  := \033[0m

# =============================================================================
# INTERNAL GUARDS (prefixed with _ — excluded from make help output)
# =============================================================================

.PHONY: _check-pnpm
_check-pnpm:
	@command -v $(PNPM) >/dev/null 2>&1 || { \
	  printf "$(RED)✗ pnpm not found.$(RESET) Install: npm i -g pnpm@9\n"; exit 1; }

.PHONY: _check-cli
_check-cli:
	@test -f packages/cli/dist/index.js || { \
	  printf "$(RED)✗ CLI not built.$(RESET) Run: $(BOLD)make build$(RESET)\n"; exit 1; }

# Guard macro — call as: $(call require-var,TOPIC)
# Prints a usage hint and exits if the variable is empty.
define require-var
@test -n "$($(1))" || { \
  printf "$(RED)✗ $(1) is required.$(RESET)\n  Usage: make $@ $(1)=\"...\"\n"; exit 1; }
endef

# =============================================================================
# 1. HELP
# =============================================================================

.PHONY: help
help: ## Show this help message
	@printf "\n$(BOLD)$(CYAN)Inkforge$(RESET) — AI article generation monorepo\n\n"
	@printf "$(BOLD)Usage:$(RESET) make $(CYAN)<target>$(RESET) $(YELLOW)[VAR=value]$(RESET)\n\n"
	@awk 'BEGIN {FS = ":.*##"} \
	  /^##@/ { printf "\n$(BOLD)%s$(RESET)\n", substr($$0,5) } \
	  /^[a-zA-Z_-]+:.*?##/ { printf "  $(CYAN)%-26s$(RESET) %s\n", $$1, $$2 }' \
	  $(MAKEFILE_LIST)
	@printf "\n$(YELLOW)Defaults:$(RESET) TONE=$(TONE)  FORMAT=$(FORMAT)  LENGTH=$(LENGTH)  CATEGORY=$(CATEGORY)\n"
	@printf "$(YELLOW)Override:$(RESET) make generate TOPIC=\"...\" TONE=senior FORMAT=tutorial LENGTH=comprehensive\n\n"

# =============================================================================
# 2. SETUP
# =============================================================================

##@ Setup

.PHONY: install
install: _check-pnpm ## Install all workspace dependencies
	@printf "$(CYAN)→ Installing dependencies...$(RESET)\n"
	$(PNPM) install
	@printf "$(GREEN)✓ Dependencies installed$(RESET)\n"

.PHONY: env-setup
env-setup: ## Copy .env.example → .env (skips if .env already exists)
	@if [ -f .env ]; then \
	  printf "$(YELLOW)⚠  .env already exists — skipping$(RESET)\n"; \
	else \
	  cp .env.example .env; \
	  printf "$(GREEN)✓ .env created from .env.example$(RESET)\n"; \
	  printf "$(YELLOW)→ Fill in your credentials before running make generate$(RESET)\n"; \
	fi

.PHONY: env-check
env-check: ## Verify all required environment variables are set
	@printf "\n$(BOLD)Environment Variable Status$(RESET)\n"
	@printf "%-42s %s\n" "Variable" "Status"
	@printf "%-42s %s\n" "--------" "------"
	@ok=1; for var in $(REQUIRED_VARS); do \
	  val=$$(printenv $$var 2>/dev/null); \
	  if [ -n "$$val" ]; then \
	    printf "$(GREEN)%-42s ✓ set$(RESET)\n" "$$var"; \
	  else \
	    printf "$(RED)%-42s ✗ missing$(RESET)\n" "$$var"; \
	    ok=0; \
	  fi; \
	done; \
	if [ "$$ok" = "1" ]; then \
	  printf "\n$(GREEN)✓ All required env vars are set$(RESET)\n\n"; \
	else \
	  printf "\n$(RED)✗ Some variables are missing. Run: $(BOLD)make env-setup$(RESET)$(RED) then edit .env$(RESET)\n\n"; \
	  exit 1; \
	fi

# =============================================================================
# 3. BUILD & DEV
# =============================================================================

##@ Build

.PHONY: build
build: _check-pnpm ## Build all packages (turbo run build)
	@printf "$(CYAN)→ Building all packages...$(RESET)\n"
	$(PNPM) build
	@printf "$(GREEN)✓ Build complete$(RESET)\n"

.PHONY: build-core
build-core: _check-pnpm ## Build @inkforge/core only
	@printf "$(CYAN)→ Building @inkforge/core...$(RESET)\n"
	$(PNPM) --filter @inkforge/core build
	@printf "$(GREEN)✓ core built$(RESET)\n"

.PHONY: build-cli
build-cli: _check-pnpm ## Build @inkforge/cli only (requires core)
	@printf "$(CYAN)→ Building @inkforge/cli...$(RESET)\n"
	$(PNPM) --filter @inkforge/cli build
	@printf "$(GREEN)✓ cli built$(RESET)\n"

.PHONY: build-web
build-web: _check-pnpm ## Build @inkforge/web (Next.js production build)
	@printf "$(CYAN)→ Building @inkforge/web...$(RESET)\n"
	$(PNPM) --filter @inkforge/web build
	@printf "$(GREEN)✓ web built$(RESET)\n"

.PHONY: dev
dev: _check-pnpm ## Start all dev watchers (turbo dev — all packages, persistent)
	$(PNPM) dev

.PHONY: dev-web
dev-web: _check-pnpm ## Start Next.js dev server on localhost:3000
	$(PNPM) --filter @inkforge/web dev

# =============================================================================
# 4. QUALITY
# =============================================================================

##@ Quality

.PHONY: test
test: _check-pnpm ## Run all tests (vitest)
	$(PNPM) --filter @inkforge/core test

.PHONY: test-watch
test-watch: _check-pnpm ## Vitest watch mode for @inkforge/core
	$(PNPM) --filter @inkforge/core run test:watch

.PHONY: typecheck
typecheck: _check-pnpm ## TypeScript typecheck across all packages
	$(PNPM) typecheck

.PHONY: lint
lint: _check-pnpm ## Lint all packages (turbo run lint)
	$(PNPM) lint

.PHONY: security-scan
security-scan: _check-pnpm ## Dependency audit + scan for hardcoded secrets
	@printf "$(CYAN)→ Auditing dependencies...$(RESET)\n"
	$(PNPM) audit --audit-level high || true
	@printf "$(CYAN)→ Scanning for hardcoded AWS credentials...$(RESET)\n"
	@if grep -r "AKIA[A-Z0-9]\{16\}" packages apps --include="*.ts" --include="*.tsx" 2>/dev/null; then \
	  printf "$(RED)✗ Hardcoded AWS credentials found in source$(RESET)\n"; exit 1; \
	else \
	  printf "$(GREEN)✓ No hardcoded credentials found$(RESET)\n"; \
	fi

.PHONY: ci
ci: install build test typecheck security-scan ## Full local CI simulation (mirrors GitHub Actions)
	@printf "$(GREEN)$(BOLD)✓ CI simulation passed$(RESET)\n"

# =============================================================================
# 5. ARTICLE GENERATION
# =============================================================================

##@ Generate

.PHONY: generate
generate: _check-cli ## Generate from topic  [TOPIC=required, TONE FORMAT LENGTH CATEGORY TAGS optional]
	$(call require-var,TOPIC)
	$(CLI_BIN) generate \
	  --topic "$(TOPIC)" \
	  --tone $(TONE) \
	  --format $(FORMAT) \
	  --length $(LENGTH) \
	  --category $(CATEGORY) \
	  $(if $(TAGS),--tags "$(TAGS)")

.PHONY: generate-from-notes
generate-from-notes: _check-cli ## Generate from a notes file  [INPUT=path, TONE FORMAT LENGTH CATEGORY optional]
	$(call require-var,INPUT)
	$(CLI_BIN) generate \
	  --input "$(INPUT)" \
	  --tone $(TONE) \
	  --format $(FORMAT) \
	  --length $(LENGTH) \
	  --category $(CATEGORY) \
	  $(if $(TAGS),--tags "$(TAGS)")

.PHONY: generate-watch
generate-watch: _check-cli ## Watch-mode generation — reruns pipeline on every file save  [INPUT=required]
	$(call require-var,INPUT)
	$(CLI_BIN) generate \
	  --input "$(INPUT)" \
	  --tone $(TONE) \
	  --format $(FORMAT) \
	  --length $(LENGTH) \
	  --category $(CATEGORY) \
	  $(if $(TAGS),--tags "$(TAGS)") \
	  --watch

.PHONY: list
list: _check-cli ## List all generated articles with word count and platform badges
	$(CLI_BIN) list

# =============================================================================
# 6. PUBLISHING
# =============================================================================

##@ Publish

.PHONY: publish-devto
publish-devto: _check-cli ## Publish to Dev.to as draft  [SLUG=required, CATEGORY optional]
	$(call require-var,SLUG)
	$(CLI_BIN) publish \
	  --slug $(SLUG) \
	  --platform devto \
	  $(if $(CATEGORY),--category $(CATEGORY))

.PHONY: publish-devto-live
publish-devto-live: _check-cli ## Publish to Dev.to as public post  [SLUG=required, CATEGORY optional]
	$(call require-var,SLUG)
	$(CLI_BIN) publish \
	  --slug $(SLUG) \
	  --platform devto \
	  --published \
	  $(if $(CATEGORY),--category $(CATEGORY))

.PHONY: publish-status
publish-status: ## Show published tracking records per platform
	@printf "\n$(BOLD)Published Articles$(RESET)\n\n"
	@found=0; \
	for platform in devto hashnode medium substack linkedin; do \
	  dir="content/published/$$platform"; \
	  if [ -d "$$dir" ]; then \
	    files=$$(find "$$dir" -name "*.md" ! -name "README.md" 2>/dev/null); \
	    if [ -n "$$files" ]; then \
	      count=$$(echo "$$files" | wc -l | tr -d ' '); \
	    else \
	      count=0; \
	    fi; \
	    if [ "$$count" -gt 0 ]; then \
	      found=1; \
	      printf "$(CYAN)%-14s$(RESET) %s article(s)\n" "$$platform" "$$count"; \
	      echo "$$files" | while read f; do \
	        slug=$$(basename "$$f" .md); \
	        url=$$(grep -m1 "^url:" "$$f" 2>/dev/null | sed 's/^url:[[:space:]]*//' | tr -d '"'); \
	        if [ -n "$$url" ]; then \
	          printf "               • $(YELLOW)%s$(RESET) → %s\n" "$$slug" "$$url"; \
	        else \
	          printf "               • $(YELLOW)%s$(RESET)\n" "$$slug"; \
	        fi; \
	      done; \
	    fi; \
	  fi; \
	done; \
	if [ "$$found" = "0" ]; then \
	  printf "$(YELLOW)No published articles found in content/published/$(RESET)\n"; \
	fi
	@printf "\n"

# =============================================================================
# 7. CONTENT MANAGEMENT
# =============================================================================

##@ Content

.PHONY: content-tree
content-tree: ## Show directory tree of content/articles/
	@if command -v tree >/dev/null 2>&1; then \
	  tree content/articles --dirsfirst -I "node_modules"; \
	else \
	  find content/articles -type f | sort; \
	fi

.PHONY: published-list
published-list: ## List all published tracking markdown files
	@find content/published -name "*.md" ! -name "README.md" 2>/dev/null | sort | while read f; do \
	  printf "$(CYAN)%s$(RESET)\n" "$$f"; \
	done

.PHONY: content-clean
content-clean: ## Remove content/articles/ and content/inputs/ — prompts for confirmation
	@printf "$(RED)$(BOLD)WARNING:$(RESET) This deletes all generated articles and inputs.\n"
	@printf "Directories: $(BOLD)content/articles/$(RESET)  $(BOLD)content/inputs/$(RESET)\n\n"
	@printf "Type $(BOLD)yes$(RESET) to confirm: "; read answer; \
	if [ "$$answer" = "yes" ]; then \
	  rm -rf content/articles content/inputs; \
	  mkdir -p content/articles content/inputs; \
	  printf "$(GREEN)✓ Cleared content/articles/ and content/inputs/$(RESET)\n"; \
	else \
	  printf "$(YELLOW)Aborted.$(RESET)\n"; \
	fi

# =============================================================================
# 8. CLEANUP
# =============================================================================

##@ Cleanup

.PHONY: clean
clean: _check-pnpm ## Remove dist/ dirs and .turbo cache
	$(PNPM) clean
	rm -rf .turbo
	@printf "$(GREEN)✓ dist/ and .turbo removed$(RESET)\n"

.PHONY: clean-all
clean-all: clean ## clean + remove all node_modules
	find . -name "node_modules" -type d -not -path "*/.git/*" | xargs rm -rf
	@printf "$(GREEN)✓ node_modules removed$(RESET)\n"

# =============================================================================
# 9. EXTRAS
# =============================================================================

##@ Extras

.PHONY: upgrade
upgrade: _check-pnpm ## Update all dependencies to latest (check diff with: git diff pnpm-lock.yaml)
	@printf "$(CYAN)→ Updating dependencies...$(RESET)\n"
	$(PNPM) update --recursive --latest
	@printf "$(GREEN)✓ Done. Review: $(BOLD)git diff pnpm-lock.yaml$(RESET)\n"

.PHONY: release-check
release-check: ## Verify CHANGELOG has [Unreleased] content and all tests pass
	@printf "$(CYAN)→ Checking CHANGELOG for [Unreleased] entries...$(RESET)\n"
	@unreleased=$$(awk '/## \[Unreleased\]/{found=1; next} found && /^## \[/{exit} found{print}' CHANGELOG.md | grep -v "^$$" | wc -l | tr -d ' '); \
	if [ "$$unreleased" -eq 0 ]; then \
	  printf "$(YELLOW)⚠  [Unreleased] section is empty — add entries to CHANGELOG.md first$(RESET)\n"; exit 1; \
	else \
	  printf "$(GREEN)✓ [Unreleased] has $$unreleased line(s)$(RESET)\n"; \
	fi
	@$(MAKE) test
	@printf "$(GREEN)$(BOLD)✓ Release check passed$(RESET)\n"

.PHONY: anvilry-sync
anvilry-sync: ## Mirror status: shows whether the Anvilry notes path is configured and reachable
	@printf "\n$(BOLD)Anvilry Mirror Status$(RESET)\n\n"
	@printf "Sync is automatic during generation — emit.ts writes to INKFORGE_ANVILRY_NOTES_DIR.\n\n"
	@if [ -n "$(INKFORGE_ANVILRY_NOTES_DIR)" ]; then \
	  printf "$(CYAN)Mirror path:$(RESET) $(INKFORGE_ANVILRY_NOTES_DIR)\n"; \
	  if [ -d "$(INKFORGE_ANVILRY_NOTES_DIR)" ]; then \
	    count=$$(find "$(INKFORGE_ANVILRY_NOTES_DIR)" -name "*.md" 2>/dev/null | wc -l | tr -d ' '); \
	    printf "$(GREEN)✓ Directory exists — $$count .md file(s) present$(RESET)\n\n"; \
	  else \
	    printf "$(RED)✗ Directory not found — check INKFORGE_ANVILRY_NOTES_DIR in .env$(RESET)\n\n"; \
	  fi; \
	else \
	  printf "$(YELLOW)⚠  INKFORGE_ANVILRY_NOTES_DIR is not set — Anvilry mirror is disabled$(RESET)\n\n"; \
	fi
	@printf "To commit the mirror after generating:\n"
	@printf "  cd $(INKFORGE_ANVILRY_NOTES_DIR)/../../.. && git add content/notes && git commit -m 'sync: inkforge articles'\n\n"
