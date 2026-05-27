#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LAMBDA_DIR="$ROOT_DIR/lambdas"
CONFIG_FILE="$ROOT_DIR/lambda-deploy.config.json"

if ! command -v aws >/dev/null 2>&1; then
  echo "aws CLI is required but was not found in PATH." >&2
  exit 1
fi

if ! command -v zip >/dev/null 2>&1; then
  echo "zip is required but was not found in PATH." >&2
  exit 1
fi

functions_to_deploy=()
temp_dirs=()

cleanup() {
  if [[ ${#temp_dirs[@]} -gt 0 ]]; then
    rm -rf "${temp_dirs[@]}"
  fi
}

trap cleanup EXIT

resolve_function_name() {
  local folder_name="$1"

  if [[ -f "$CONFIG_FILE" ]]; then
    node -e '
      const fs = require("node:fs");
      const configPath = process.argv[1];
      const folderName = process.argv[2];

      const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
      const mappedName = config[folderName];

      process.stdout.write(
        typeof mappedName === "string" && mappedName.trim()
          ? mappedName.trim()
          : folderName
      );
    ' "$CONFIG_FILE" "$folder_name"
  else
    printf '%s' "$folder_name"
  fi
}

if [[ $# -gt 0 ]]; then
  functions_to_deploy=("$@")
else
  for function_path in "$LAMBDA_DIR"/*; do
    [[ -d "$function_path" ]] || continue
    functions_to_deploy+=("$(basename "$function_path")")
  done
fi

if [[ ${#functions_to_deploy[@]} -eq 0 ]]; then
  echo "No lambda folders found under $LAMBDA_DIR." >&2
  exit 1
fi

for function_name in "${functions_to_deploy[@]}"; do
  lambda_folder_name="$function_name"
  aws_function_name="$(resolve_function_name "$lambda_folder_name")"
  function_dir="$LAMBDA_DIR/$lambda_folder_name"

  if [[ ! -d "$function_dir" ]]; then
    echo "Skipping $lambda_folder_name: directory not found at $function_dir" >&2
    continue
  fi

  if [[ ! -f "$function_dir/package.json" ]]; then
    echo "Skipping $lambda_folder_name: package.json not found in $function_dir" >&2
    continue
  fi

  temp_dir="$(mktemp -d)"
  temp_dirs+=("$temp_dir")

  build_dir="$temp_dir/build"
  mkdir -p "$build_dir"

  cp "$function_dir/package.json" "$build_dir/package.json"
  if [[ -f "$function_dir/package-lock.json" ]]; then
    cp "$function_dir/package-lock.json" "$build_dir/package-lock.json"
  fi

  cp "$function_dir"/*.mjs "$build_dir"/

  echo "Packaging $lambda_folder_name as $aws_function_name..."
  pushd "$build_dir" >/dev/null
  npm ci --omit=dev >/dev/null
  zip_file="$temp_dir/$lambda_folder_name.zip"
  zip -qr "$zip_file" .
  popd >/dev/null

  echo "Deploying $aws_function_name to AWS Lambda..."
  aws lambda update-function-code \
    --function-name "$aws_function_name" \
    --zip-file "fileb://$zip_file" >/dev/null

  echo "Deployed $lambda_folder_name as $aws_function_name"
done