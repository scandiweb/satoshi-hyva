# Satoshi theme for Hyva

## Installation

1. `git clone git@github.com:satoshiux/hyva.git`
2. `cd hyva`
3. Copy `auth.json` content from slack.
4. `npm install`
5. `npm run start`

## Work guide and tips

- Disable magento cache for full_page and block_html.
  - `npm run cli` then `m cache:disable full_page block_html`
- Run Vite to watch your changes in alpine & scss files.
  - `cd app/design/frontend/Satoshi/Hyva/web/satoshi`
  - `npm install`
  - `npm run dev`

## Tips

We try to reduce the cases where we need to work with layout xml files, so we've introduced some utilities that will help stay away of them.

- `$template`: This variable is shared across all `.phtml` templates, it generates a block instance where you can use to import another template.
  Usage:

```php
$template
  ->setData([]) // If needs to pass data
  ->render('Magento_Theme:path/to/template.phtml');
```

- `$resizable`: In Satoshi we have reusable components, one of them is resizables, ie: menu, cart, and search resizables on desktop. we introduced a utility to be used directly from any template.
  Usage:

```php
$resizable
  ->setData([
    'id' => 'menu-desktop',
    'initialWidth' => 100,
    'initialHeight' => 56,
    'cssClass' => 'resizable--menu md:pointer-events-auto',
  ])
  ->setChildTemplate('Magento_Theme::html/header/menu/menu-button.phtml')
  ->render()
```

- `$popup`: Popups are the alternatives for resizables on mobile.
  Usage:

```php
$popup
  ->setData([
    'id' => 'menu',
    'isFocused' => true,
    'isFullScreen' => true,
    'desktopTarget' => 'menu-desktop',
  ])
  ->setChildTemplate('Magento_Theme::html/header/menu/menu.phtml')
  ->render()
```

## TODO

- Implement logic in the product listing page to automatically switch between list and grid view modes based on predefined conditions.
