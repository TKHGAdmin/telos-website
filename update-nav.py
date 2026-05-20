#!/usr/bin/env python3
"""Move Resources and FAQ into the Tools dropdown on all pages."""
import glob

def process_file(path):
    with open(path, 'r') as f:
        lines = f.readlines()

    is_blog = '/blog/' in path or path.startswith('blog/')
    is_index = path.endswith('index.html') and not is_blog
    prefix = '../' if is_blog else ''
    faq_href = '#faq' if is_index else f'{prefix}index.html#faq'
    res_href = f'{prefix}resources'

    new_lines = []
    in_dropdown = False
    added_to_dropdown = False

    for line in lines:
        # Track when we enter a dropdown menu
        if 'dropdown-menu' in line and '<ul' in line.lower():
            in_dropdown = True
            new_lines.append(line)
            continue

        # When we see Hyrox Predictor inside dropdown, add Resources + FAQ after it
        if in_dropdown and 'Hyrox Predictor</a></li>' in line:
            new_lines.append(line)
            indent = line[:len(line) - len(line.lstrip())]
            new_lines.append(f'{indent}<li><a href="{res_href}">Resources</a></li>\n')
            new_lines.append(f'{indent}<li><a href="{faq_href}">FAQ</a></li>\n')
            continue

        # Track when we exit a dropdown menu
        if in_dropdown and '</ul>' in line:
            in_dropdown = False
            added_to_dropdown = True
            new_lines.append(line)
            continue

        # After we've modified a dropdown, skip standalone Resources lines
        if added_to_dropdown and '>Resources</a></li>' in line and 'dropdown-menu' not in line:
            continue

        # After we've modified a dropdown, skip standalone FAQ lines
        if added_to_dropdown and '>FAQ</a></li>' in line and 'dropdown-menu' not in line:
            continue

        new_lines.append(line)

    with open(path, 'w') as f:
        f.writelines(new_lines)
    print(f'  ✓ {path}')


def fix_resources_shop():
    """resources.html was missing Shop in desktop nav - add it."""
    path = 'resources.html'
    with open(path, 'r') as f:
        content = f.read()

    target = '        </li>\n        <li><a href="client-dashboard" class="nav-client-login">Client Login</a></li>'
    replacement = '        </li>\n        <li><a href="shop">Shop</a></li>\n        <li><a href="client-dashboard" class="nav-client-login">Client Login</a></li>'

    if 'href="shop"' not in content.split('mobile-menu')[0]:
        content = content.replace(target, replacement, 1)
        with open(path, 'w') as f:
            f.write(content)
        print('  ✓ resources.html (added missing Shop link)')


print('Moving Resources + FAQ into Tools dropdown...\n')

for f in ['index.html', 'chs.html', 'hyrox-predictor.html',
          'pricing.html', 'protein-calculator.html', 'resources.html', 'shop.html']:
    try:
        process_file(f)
    except Exception as e:
        print(f'  ✗ {f}: {e}')

for f in sorted(glob.glob('blog/*.html')):
    try:
        process_file(f)
    except Exception as e:
        print(f'  ✗ {f}: {e}')

# Fix resources.html missing Shop link
try:
    fix_resources_shop()
except Exception as e:
    print(f'  ✗ resources.html Shop fix: {e}')

print('\nDone!')
