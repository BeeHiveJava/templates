#!/usr/bin/env bash

# Enable xtrace if the DEBUG environment variable is set
if [[ ${DEBUG-} =~ ^1|yes|true$ ]]; then
    set -o xtrace       # Trace the execution of the script (debug)
fi

# Only enable these shell behaviours if we're not being sourced
# Approach via: https://stackoverflow.com/a/28776166/8787985
if ! (return 0 2> /dev/null); then
    # A better class of script...
    set -o errexit      # Exit on most errors (see the manual)
    set -o nounset      # Disallow expansion of unset variables
    set -o pipefail     # Use last non-zero exit code in a pipeline
fi

# Enable errtrace or the error trap handler will not work as expected
set -o errtrace         # Ensure the error trap handler is inherited

# Repository root paths that belong to this repository only
readonly ROOT_EXCLUDES=(.git .github .devcontainer/devcontainer-lock.json stacks init.sh README.md)

# DESC: Exit script with the given message
# ARGS: $1 (required): Message to print on exit
#       $2 (optional): Exit code (defaults to 0)
# OUTS: None
# RETS: None
function script_exit() {
    if [[ $# -eq 1 ]]; then
        printf '%s\n' "$1"
        exit 0
    fi

    if [[ ${2-} =~ ^[0-9]+$ ]]; then
        printf '%b\n' "$1" >&2
        exit "$2"
    fi

    script_exit 'Missing required argument to script_exit()!' 2
}

# DESC: Usage help
# ARGS: None
# OUTS: None
# RETS: None
function script_usage() {
    cat << EOF
Usage: init.sh [options] [stack...]

Scaffolds the current directory. Without stacks, prompts for them.

Options:
     -h|--help                  Displays this help
     -y|--yes                   Don't prompt (base only)

Environment:
    TEMPLATE                    Local template directory (default: download from GitHub)
    DEBUG                       Set to 1 to trace execution
EOF
}

# DESC: Parameter parser
# ARGS: $@ (optional): Arguments provided to the script
# OUTS: $stacks: Chosen stacks
#       $interactive: Whether to prompt for stacks
# RETS: None
function parse_params() {
    local param
    stacks=()
    interactive=true
    while [[ $# -gt 0 ]]; do
        param="$1"
        shift
        case $param in
            -h | --help)
                script_usage
                exit 0
                ;;
            -y | --yes)
                interactive=false
                ;;
            -*)
                script_exit "Invalid parameter was provided: $param" 1
                ;;
            *)
                stacks+=("$param")
                interactive=false
                ;;
        esac
    done
}

# DESC: Create a temporary working directory, removed on exit
# ARGS: None
# OUTS: $work: Path to the working directory
# RETS: None
function work_init() {
    work="$(mktemp -d)"
    trap 'rm -rf "$work"' EXIT
}

# DESC: Locate the template, downloading it if needed
# ARGS: None
# OUTS: $template: Path to the template
# RETS: None
function template_init() {
    template="$work/template"
    mkdir "$template"

    if [[ -n ${TEMPLATE-} ]]; then
        # Same files as the download would have, plus uncommitted changes
        # (tracked files deleted from the working tree are still listed, so skip them)
        git -C "$TEMPLATE" ls-files -z --cached --others --exclude-standard \
            | while IFS= read -r -d '' file; do
                if [[ -e $TEMPLATE/$file ]]; then printf '%s\0' "$file"; fi
            done \
            | tar -C "$TEMPLATE" --null -T - -cf - | tar -xf - -C "$template"
        return
    fi

    curl -fsSL https://codeload.github.com/beehivejava/templates/tar.gz/HEAD \
        | tar -xz --strip-components=1 -C "$template"
}

# DESC: Ensure mikefarah/yq is available, downloading it if needed
# ARGS: None
# OUTS: None
# RETS: None
function yq_init() {
    local os arch
    if yq --version 2> /dev/null | grep -q mikefarah; then
        return
    fi

    os="$(uname -s | tr '[:upper:]' '[:lower:]')"
    arch="$(uname -m | sed 's/x86_64/amd64/; s/aarch64/arm64/')"
    mkdir "$work/bin"
    curl -fsSL -o "$work/bin/yq" "https://github.com/mikefarah/yq/releases/latest/download/yq_${os}_${arch}"
    chmod +x "$work/bin/yq"
    PATH="$work/bin:$PATH"
}

# DESC: Prompt for stacks via the terminal, as stdin is this script when piped
# ARGS: None
# OUTS: $stacks: Chosen stacks
# RETS: None
function pick_stacks() {
    local available
    available="$(cd "$template/stacks" && ls -d -- */ | tr -d / | grep -vx base | tr '\n' ' ')"
    printf 'Available stacks: %s\n' "$available"
    read -r -p 'Stacks (space-separated, empty for none): ' -a stacks < /dev/tty
}

# DESC: Apply a layer to the current directory. Files are copied, except
#       <file>.append (appended to <file>) and <name>.merge.<json|yaml|yml>
#       (deep-merged into <name>.<ext> with yq).
# ARGS: $1 (required): Layer directory
#       $@ (optional): Paths within the layer to skip
# OUTS: $written: Appends the files written
# RETS: None
function apply_layer() {
    local src="$1" file target format merged
    local -a prune=()
    shift
    for file in "$@"; do
        prune+=(-path "./$file" -prune -o)
    done

    while IFS= read -r file; do
        file="${file#./}"
        case $file in
            *.append) target="${file%.append}" ;;
            *.merge.json | *.merge.yaml | *.merge.yml) target="${file/.merge./.}" ;;
            *) target="$file" ;;
        esac
        mkdir -p "$(dirname "$target")"

        if [[ $file == "$target" || ! -e $target ]]; then
            cp -p "$src/$file" "$target"
        elif [[ $file == *.append ]]; then
            { echo; cat "$src/$file"; } >> "$target"
        else
            format="${target##*.}"
            format="${format/yml/yaml}"
            if [[ $format == yaml ]]; then
                # yq drops blank lines, so carry them through as comments
                merged="$(yq eval-all 'select(fi == 0) * select(fi == 1)' \
                    <(sed 's/^$/#BLANK_LINE/' "$target") <(sed 's/^$/#BLANK_LINE/' "$src/$file") \
                    | sed 's/^ *#BLANK_LINE$//')"
            else
                merged="$(yq -p "$format" -o "$format" eval-all 'select(fi == 0) * select(fi == 1)' "$target" "$src/$file")"
            fi
            printf '%s\n' "$merged" > "$target"
            # yq's JSON layout differs from biome's; otherwise pre-commit fixes it on first commit
            if [[ $format == json ]] && command -v biome > /dev/null 2>&1; then
                biome format --write "$target" > /dev/null
            fi
        fi
        written+=("$target")
    done < <(cd "$src" && find . ${prune[@]+"${prune[@]}"} -type f -print)
}

# DESC: Replace {{project_name}} with the directory name in the written files
# ARGS: None
# OUTS: None
# RETS: None
function fill_placeholders() {
    local file content name
    name="$(basename "$PWD")"
    for file in "${written[@]}"; do
        if grep -qF '{{project_name}}' "$file"; then
            content="$(sed "s|{{project_name}}|$name|g" "$file")"
            printf '%s\n' "$content" > "$file"
        fi
    done
}

# DESC: Main control flow
# ARGS: $@ (optional): Arguments provided to the script
# OUTS: None
# RETS: None
function main() {
    local stack
    parse_params "$@"
    work_init
    template_init
    yq_init
    if [[ $interactive == true ]]; then
        pick_stacks
    fi
    for stack in ${stacks[@]+"${stacks[@]}"}; do
        [[ -d $template/stacks/$stack ]] || script_exit "Unknown stack: $stack" 1
    done

    written=()
    apply_layer "$template" "${ROOT_EXCLUDES[@]}"
    apply_layer "$template/stacks/base"
    for stack in ${stacks[@]+"${stacks[@]}"}; do
        apply_layer "$template/stacks/$stack"
    done
    fill_placeholders
}

# Invoke main with args if not sourced
# Approach via: https://stackoverflow.com/a/28776166/8787985
if ! (return 0 2> /dev/null); then
    main "$@"
fi
