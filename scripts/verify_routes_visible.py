import json
import re
import os
import subprocess

# relative to repo root
# FIMXE: names identical so this can be auto-generated?
OPENAPI_AND_MARKDOWN = {
    'iridium': ('generated/core/ir_api_30.json', 'rest-iridium-api.md'),
    'mendelev': ('generated/core/md_api_30.json', 'rest-mendelev-api.md'),
    'osmium': ('generated/core/os_api_30.json', 'rest-osmium-api.md'),
}


def get_routes_from_openapi(oapi_file_path: str) -> set[str]:
    with open(oapi_file_path, 'r') as f:
        openapi_json = json.loads(f.read())
    openapi_paths = [{path: openapi_json['paths'][path]} for path in openapi_json['paths']]
    openapi_path_names = {next(iter((path.keys()))) for path in openapi_paths}
    return openapi_path_names


def get_routes_from_markdown(md_file_path: str) -> set[str]:
    md_routes = set()
    with open(md_file_path, 'r') as f:
        for line in f:
            match = re.search(r'swagger.+path="(.+?)"', line)
            if match:
                md_routes.add(match.group(1))
    return md_routes


def get_oapi_routes_not_in_md(oapi_file_path: str, md_file_path: str) -> set[str]:
    oapi_routes = get_routes_from_openapi(oapi_file_path)
    md_routes = get_routes_from_markdown(md_file_path)
    return oapi_routes - md_routes


def are_all_routes_visible() -> bool:
    all_visible = True
    for service, (openapi, markdown) in OPENAPI_AND_MARKDOWN.items():
        diff = get_oapi_routes_not_in_md(openapi, markdown)
        if diff:
            print(f'Warning: {service} routes not represented in markdown : {diff}')
            all_visible = False
    return all_visible

if __name__ == '__main__':
    repo_root = subprocess.check_output(["git", "rev-parse", "--show-toplevel"]).strip().decode("utf-8")
    print(f'Changing directory to repo root at: {repo_root}')
    os.chdir(repo_root)

    if are_all_routes_visible():
        print("Success: found no missing routes in markdown files")
    else:
        exit(-1)
