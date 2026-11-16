#!/usr/bin/env python3
"""Upload NavStreet site and retire only previously inventoried generated SEO pages.

The first deployment establishes a remote manifest; it does not delete legacy files.
Subsequent deployments remove stale generated listing HTML and pagination HTML.
"""
import json
import os
import pathlib
import posixpath
import re
import stat
import tempfile

import paramiko

ROOT = pathlib.Path('dist/template/browser')
REMOTE = '/public'
MANIFEST_PATH = '/public/.navstreet-seo-deploy-manifest.json'
ID_RE = re.compile(r'^[A-Za-z0-9_-]{1,150}$')


def validate_ids(ids):
    if not isinstance(ids, list) or not ids or len(ids) != len(set(ids)):
        raise RuntimeError('Invalid, empty, or duplicate listing IDs in manifest')
    if any(not isinstance(item, str) or not ID_RE.fullmatch(item) for item in ids):
        raise RuntimeError('Unsafe listing ID in manifest')
    return set(ids)


def load_previous(sftp):
    try:
        with sftp.open(MANIFEST_PATH, 'r') as stream:
            manifest = json.loads(stream.read().decode('utf-8'))
    except FileNotFoundError:
        return None
    if manifest.get('version') != 1:
        raise RuntimeError('Unknown remote manifest version; refusing to reconcile')
    ids = validate_ids(manifest.get('listingIds'))
    pages = manifest.get('paginationPages')
    if not isinstance(pages, int) or isinstance(pages, bool) or pages < 1:
        raise RuntimeError('Invalid previous pagination count')
    return ids, pages


def is_regular(sftp, path):
    try:
        return stat.S_ISREG(sftp.stat(path).st_mode)
    except FileNotFoundError:
        return False


def main():
    if not (ROOT / 'index.html').is_file() or not (ROOT / 'sitemap.xml').is_file():
        raise RuntimeError('Build output missing index.html or sitemap.xml')
    snapshot = json.loads(pathlib.Path('.navstreet-public-listings-snapshot.json').read_text())
    current = json.loads(pathlib.Path('.navstreet-property-deploy-manifest.json').read_text())
    ids = validate_ids(current.get('listingIds'))
    snapshot_ids = validate_ids([item['id'] for item in snapshot['listings']])
    if ids != snapshot_ids or snapshot.get('count') != len(ids):
        raise RuntimeError('Property HTML manifest does not match build snapshot')
    pages = (len(ids) + 11) // 12
    for number in range(1, pages + 1):
        relative = 'homes/index.html' if number == 1 else f'homes/page/{number}/index.html'
        if not (ROOT / relative).is_file():
            raise RuntimeError(f'Missing prerendered page: {relative}')
    sitemap = (ROOT / 'sitemap.xml').read_text()
    if any(f'https://navstreet.com/listings/{item}</loc>' not in sitemap for item in ids):
        raise RuntimeError('Sitemap missing one or more public listings')
    if any(f'https://navstreet.com/homes/page/{number}/</loc>' not in sitemap for number in range(2, pages + 1)):
        raise RuntimeError('Sitemap missing pagination pages')
    host, user, password = (os.environ.get(key) for key in ('SFTP_HOST', 'SFTP_USER', 'SFTP_PASSWORD'))
    if not all((host, user, password)):
        raise RuntimeError('Missing SFTP credentials')
    client = paramiko.SSHClient()
    client.load_host_keys(os.path.expanduser('~/.ssh/known_hosts'))
    client.set_missing_host_key_policy(paramiko.RejectPolicy())
    client.connect(hostname=host, port=22, username=user, password=password,
                   look_for_keys=False, allow_agent=False, timeout=30)
    try:
        sftp = client.open_sftp()
        if not stat.S_ISDIR(sftp.stat(REMOTE).st_mode):
            raise RuntimeError('IONOS /public directory is missing')
        previous = load_previous(sftp)
        if previous:
            previous_ids, previous_pages = previous
            removed = previous_ids - ids
            if len(ids) < len(previous_ids) * 0.75:
                raise RuntimeError('Inventory dropped by more than 25%; aborting deployment for review')
            print(f'Previous inventory: {len(previous_ids)}; current: {len(ids)}; retiring: {len(removed)}')
        else:
            print('No remote inventory manifest: initial baseline; no remote files will be deleted')
        created = {REMOTE}
        uploaded = 0
        for path in sorted(ROOT.rglob('*')):
            if not path.is_file():
                continue
            relative = path.relative_to(ROOT).as_posix()
            remote = posixpath.join(REMOTE, relative)
            parent = posixpath.dirname(remote)
            pending = []
            while parent not in created and parent != '/':
                pending.append(parent)
                parent = posixpath.dirname(parent)
            for directory in reversed(pending):
                try:
                    sftp.mkdir(directory)
                except OSError:
                    if not stat.S_ISDIR(sftp.stat(directory).st_mode):
                        raise
                created.add(directory)
            sftp.put(str(path), remote)
            uploaded += 1
        print(f'Uploaded {uploaded} files')
        # Delete only exact HTML files from the previously published inventory.
        # Never recursively delete directories, assets, or unknown legacy pages.
        if previous:
            previous_ids, previous_pages = previous
            stale = [f'{REMOTE}/listings/{item}/index.html' for item in sorted(previous_ids - ids)]
            stale += [f'{REMOTE}/homes/page/{page}/index.html'
                      for page in range(pages + 1, previous_pages + 1)]
            for path in stale:
                if is_regular(sftp, path):
                    sftp.remove(path)
                    print('Retired generated HTML:', path)
        # Publish the manifest last so a failed upload cannot advance the inventory baseline.
        manifest = json.dumps({'version': 1, 'listingIds': sorted(ids), 'paginationPages': pages}, indent=2) + '\n'
        with tempfile.NamedTemporaryFile(mode='w', encoding='utf-8', delete=False) as tmp:
            tmp.write(manifest)
            local_manifest = tmp.name
        try:
           temporary_manifest = MANIFEST_PATH + '.tmp'

sftp.put(local_manifest, temporary_manifest)

try:
    sftp.posix_rename(temporary_manifest, MANIFEST_PATH)
except OSError:
    # Do not delete or overwrite the existing manifest if
    # the server does not support atomic replacement.
    try:
        sftp.remove(temporary_manifest)
    except OSError:
        pass
    raise RuntimeError(
        'IONOS SFTP does not support atomic manifest replacement; '
        'deployment stopped for review'
    )
        finally:
            pathlib.Path(local_manifest).unlink(missing_ok=True)
        print(f'Published SEO inventory manifest: {len(ids)} listings, {pages} pages')
    finally:
        client.close()


if __name__ == '__main__':
    main()
