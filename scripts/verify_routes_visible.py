import json
import re
import os
import subprocess
from typing import TypeAlias

# relative to repo root
# FIMXE: names identical so this can be auto-generated?
OPENAPI_AND_MARKDOWN = {
    'iridium': ('generated/core/ir_api_30.json', 'rest-iridium-api.md'),
    'mendelev': ('generated/core/md_api_30.json', 'rest-mendelev-api.md'),
    'osmium': ('generated/core/os_api_30.json', 'rest-osmium-api.md'),
}

# path -> methods, e.g.
# {
#   '/users/info': {'get'},
#   '/users/subaccount/{subaccount_id}': {'get', 'patch'},
# }
RouteMap: TypeAlias = dict[str, set[str]]

def get_routes_from_openapi(oapi_file_path: str) -> RouteMap:
    with open(oapi_file_path, 'r') as f:
        openapi_json = json.loads(f.read())
    openapi_paths = [{path: openapi_json['paths'][path]} for path in openapi_json['paths']]

    openapi_routes: dict[str, set[str]] = {}
    for endpoint in openapi_paths:
        for path, contents in endpoint.items():
            for method in contents.keys():
                openapi_routes.setdefault(path, set()).add(method)

    return openapi_routes


def get_routes_from_markdown(md_file_path: str) -> RouteMap:
    md_routes: dict[str, set[str]] = {}
    with open(md_file_path, 'r') as f:
        for line in f:
            match = re.search(r'swagger.+path="(.+?)".+method="(.+?)"', line)
            if match:
                md_routes.setdefault(match.group(1), set()).add(match.group(2))

    return md_routes


def verify_routes_match(oapi: RouteMap, md: RouteMap) -> bool:
    does_match = True
    # Do it twice because it's easier to code that way
    all_paths = oapi.keys() | md.keys()

    for path in all_paths:
        # must be in at least one of them;
        # mutually exclusive, hence "continue"
        oapi_methods = oapi.get(path)
        md_methods = md.get(path)
        if not md_methods:
            print(f'Warning: "{path}" found in OpenAPI but not in Markdown')
            does_match = False
            continue
        if not oapi_methods:
            print(f'Warning: "{path}" found in Markdown but not in OpenAPI')
            does_match = False
            continue

        oapi_only = oapi_methods - md_methods
        md_only = md_methods - oapi_methods
        if oapi_only:
            print(f'Warning: "{path}" has method(s) {oapi_only} in OpenAPI but not in Markdown')
            does_match = False
            continue
        if md_only:
            print(f'Warning: "{path}" has method(s) {md_only} in Markdown but not in OpenAPI')
            does_match = False
            continue

    return does_match


def check_all_routes_visible() -> None:
    for service, (openapi, markdown) in OPENAPI_AND_MARKDOWN.items():
        oapi_routes = get_routes_from_openapi(openapi)
        md_routes = get_routes_from_markdown(markdown)

        print(f'Checking {service} routes...')
        if not verify_routes_match(oapi_routes, md_routes):
            print(f'Warning: {service} routes in OpenAPI do not match Markdown')

if __name__ == '__main__':
    repo_root = subprocess.check_output(["git", "rev-parse", "--show-toplevel"]).strip().decode("utf-8")
    print(f'Changing directory to repo root at: {repo_root}')
    os.chdir(repo_root)

    check_all_routes_visible()
